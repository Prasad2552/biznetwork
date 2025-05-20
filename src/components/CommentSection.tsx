import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  _id: string;
  userId: string;
  username: string;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: string;
  replies: Comment[];
  likedBy?: string[];
  dislikedBy?: string[];
}

interface CommentSectionProps {
  commentCount?: number;
  comments: Comment[];
  videoId: string;
  setComments: Dispatch<SetStateAction<Comment[]>>;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments,  setComments }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [replyText, setReplyText] = useState('');
  const [replyInputVisible, setReplyInputVisible] = useState<{[key: string]: boolean}>({});
  const [repliesVisible, setRepliesVisible] = useState<{[key: string]: boolean}>({});
  const [localComments, setLocalComments] = useState<Comment[]>([]);
    // console.log("CommentSection - commentCount prop:", commentCount);
  useEffect(() => {
    setLocalComments(comments);
    //  console.log("CommentSection - comments prop:", comments);
  }, [comments]);

  const handleLike = async (commentId: string, commentIndex: number) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to like comments", { position: 'top-right' });
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error("Failed to like/unlike comment");
      }

      const data = await response.json();
       setComments(prevComments => {
        return prevComments.map((c, i) => {
          if (i === commentIndex) {
            return {
              ...c,
              likes: data.likes,
              dislikes: data.dislikes,
              likedBy: data.likedBy || [],
              dislikedBy: data.dislikedBy || []
            };
          }
          return c;
        });
      });
    } catch (error) {
      toast.error("An error occurred while liking/unliking the comment.", { position: 'top-right' });
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const isCommentLiked = (comment: Comment): boolean => 
    Boolean(session?.user?.id && comment?.likedBy?.includes(session.user.id));

  // const isCommentDisliked = (comment: Comment): boolean => 
  //   Boolean(session?.user?.id && comment?.dislikedBy?.includes(session.user.id));
  
    const toggleReplies = (commentId: string) => {
        setRepliesVisible(prev => ({
          ...prev,
          [commentId]: !prev[commentId],
        }));
    };

   const handleAddReply = async (commentId: string, commentIndex: number, e:React.FormEvent) => {
        e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Please sign in to reply to a comment", { position: 'top-right' });
      router.push('/signin');
      return;
    }
    if (!replyText.trim()) {
      toast.info("Please enter the text to reply", { position: 'top-right' });
      return;
    }
    try {
      const response = await fetch(`/api/comments/${commentId}/replies`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyText }),
      });
      if (!response.ok) throw new Error("Failed to add reply");
      const data = await response.json();
      setComments(prevComments => {
        return prevComments.map((comment, i) => {
          if (i === commentIndex) {
            return { ...comment, replies: [data, ...(comment.replies || [])] };
          }
          return comment;
        });
      });
       setReplyText('');
      setReplyInputVisible(prev => ({
           ...prev,
           [commentId]: false
       }));
    } catch (error) {
      toast.error("An error occurred while replying to the comment.", { position: 'top-right' });
    }
  };

  return (
    <div className="w-full max-w-4xl">
      {comments.map((comment, commentIndex) => (
        <div key={comment._id} className="flex gap-3 mb-4 group">
          <Avatar className="w-10 h-10 rounded-full">
            <AvatarImage src="/placeholder-user.jpg" alt={comment.username} />
            <AvatarFallback>{comment.username?.[0] || 'U'}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">@{comment.username}</span>
                <span className="text-[13px] text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt))} ago
                </span> 
               <div className="flex items-center ml-2">
                   <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 hover:bg-gray-100 rounded-full ml-8"
                       onClick={() => handleLike(comment._id, commentIndex)}
                      >
                    <ThumbsUp 
                      className={`w-5 h-5 ${isCommentLiked(comment) ? 'fill-blue-600 stroke-blue-600' : 'stroke-gray-600'}`}
                    />
                  </Button>
                  <span className="text-xs text-gray-600 ml-1">
                    {formatNumber(comment.likes)}
                  </span>
                  </div>
                    <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-gray-100 rounded-full"
                    >
                    <ThumbsDown className="w-5 h-5 stroke-gray-600" />
                   </Button>
              
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 hover:bg-gray-100 rounded-full text-[14px] font-medium ml-2"
                  onClick={() => {
                    if (!session?.user?.id) {
                      toast.info('Please sign in to reply to comment.', { position: 'top-right' });
                      router.push('/signin');
                    } else {
                      setReplyInputVisible(prevState => ({
                        ...prevState,
                        [comment._id]: !prevState[comment._id]
                      }));
                    }
                  }}
                >
                  Reply
                </Button>
             
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button
                        variant="ghost"
                        size="sm"
                         className="h-8 px-3 hover:bg-gray-100 rounded-full text-[14px] font-medium text-blue-600 inline-flex items-center ml-2"
                      >
                         <Image
                            src="/uploads/dropdown.png"
                            alt="Dropdown Icon"
                            width={18}
                            height={18}
                        />
                        {comment.replies?.length} replies
                      
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="left">
                    <DropdownMenuItem onClick={()=>toggleReplies(comment._id)}>
                       {repliesVisible[comment._id] ? 'Hide' : 'Show'} Replies
                    </DropdownMenuItem>
                     <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-[14px] mt-1 text-gray-900">
                {comment.content}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                 
              </div>
            </div>

            {repliesVisible[comment._id] && comment.replies && (
              <div className="mt-3 ml-8 space-y-4">
                {comment.replies.map((reply) => (
                  <div key={reply._id} className="flex gap-3">
                    <Avatar className="w-8 h-8 rounded-full">
                      <AvatarImage src="/placeholder-user.jpg" alt={reply.username} />
                      <AvatarFallback>{reply.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">@{reply.username}</span>
                        <span className="text-[13px] text-gray-500">
                          {formatDistanceToNow(new Date(reply.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-[14px] mt-1 text-gray-900">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {replyInputVisible[comment._id] && session?.user && (
              <div className="mt-3 ml-8 flex gap-3">
                <Avatar className="w-8 h-8 rounded-full">
                  <AvatarImage src={session.user.image || "/placeholder-user.jpg"} alt={session.user.name || ''} />
                  <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                <form onSubmit={(e) => handleAddReply(comment._id, commentIndex, e)} className="flex flex-col gap-2">
                  <Textarea
                    placeholder="Add a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[30px] resize-none text-[14px] border-b border-gray-300 rounded-lg px-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <div className="flex justify-end mt-2 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-4 hover:bg-gray-100 rounded-full text-[14px]"
                      onClick={() => {
                        setReplyText('');
                        setReplyInputVisible(prev => ({
                          ...prev,
                          [comment._id]: false
                        }));
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 px-4 bg-[#2A2FB8] hover:bg-blue-700 rounded-full text-[14px]"
                      disabled={!replyText.trim()}
                      type="submit"
                    >
                      Reply
                    </Button>
                  </div>
                </form>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      {localComments.length === 0 &&  (
                    <div className="flex justify-center items-center text-center text-gray-500 py-4">
                      No comments yet. Be the first to comment!
                   </div>
                 )}
    </div>
  );
};

export default CommentSection;
export { CommentSection };