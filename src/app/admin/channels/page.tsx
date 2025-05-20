'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ToastContainer, toast, type ToastPosition } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { SubmittedForms } from './submitted-forms'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

interface Channel {
  _id: string
  name: string
  subscribers: number
  contentCount: number
}

export default function ChannelList() {
    const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmittedFormsOpen, setIsSubmittedFormsOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

  const toastPosition: ToastPosition = 'top-right'

    useOnClickOutside(menuRef, () => setIsMenuOpen(false));

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/admin/channels')
        if (response.ok) {
          const data = await response.json()
          setChannels(data)
        } else {
          throw new Error('Failed to fetch channels')
        }
      } catch (error) {
        toast.error("An error occurred while fetching channels.", {
          position: toastPosition
        })
        console.error('Error fetching channels:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChannels()
  }, [])

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const response = await fetch(`/api/admin/channels/${channelId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setChannels(channels.filter((channel) => channel._id !== channelId))
        toast.success("Channel deleted successfully.", {
          position: toastPosition
        })
      } else {
        toast.error("Failed to delete channel.", {
          position: toastPosition
        })
        console.error('Failed to delete channel:', await response.json())
      }
    } catch (error) {
      toast.error("An unexpected error occurred while deleting channel.", {
        position: toastPosition
      })
      console.error('Error deleting channel:', error)
    } finally {
      setIsDeleteDialogOpen(false)
      setChannelToDelete(null)
    }
  }

  const openDeleteDialog = (channelId: string) => {
    setChannelToDelete(channelId)
    setIsDeleteDialogOpen(true)
  }

    const handleLogout = async () => {
        try {
           await signOut({ callbackUrl: "/admin/login"});
           toast.success("Logged out successfully.", {
            position: toastPosition,
           })
        } catch (error) {
            console.error("Error logging out", error);
            toast.error("Failed to log out.", {
              position: toastPosition,
            })
        }
    };

    const handleChangeEmail = () => {
        router.push("/admin/profile");
    }

    const handleChangePassword = () => {
      router.push("/admin/forgot-password");
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    
    <div className="container mx-auto p-4 space-y-6">
      <ToastContainer position={toastPosition} />
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Channel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this channel? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => channelToDelete && handleDeleteChannel(channelToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Channels</h1>
        <div className="flex gap-2 relative">
          <Button asChild>
            <Link href="/admin/channels/create">
              <Icons.plus className="mr-2 h-4 w-4" /> Create Channel
            </Link>
          </Button>
          <Button onClick={() => setIsSubmittedFormsOpen(true)}>
            <Icons.fileText className="mr-2 h-4 w-4" /> View Published Forms
          </Button>
             <Button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full h-10 w-10 flex items-center justify-center"
            >
                  <Icons.user className="h-5 w-5" />
             </Button>
             {isMenuOpen && (
                <div ref={menuRef} className="absolute right-0 top-12 z-50 bg-white border rounded shadow-md w-48">
                  <Button onClick={handleChangeEmail} variant="ghost" className="w-full justify-start py-2 rounded-none hover:bg-gray-100">
                    <Icons.settings className="mr-2 h-4 w-4" /> Change Email
                  </Button>
                  <Button onClick={handleChangePassword} variant="ghost" className="w-full justify-start py-2 rounded-none hover:bg-gray-100">
                    <Icons.settings className="mr-2 h-4 w-4" /> Change Password
                  </Button>
                     <Button onClick={handleLogout} variant="ghost" className="w-full justify-start py-2 rounded-none hover:bg-gray-100">
                    <Icons.logOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
            )}
        </div>
      </div>

      <Input
        type="search"
        placeholder="Search channels..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredChannels.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChannels.map((channel) => (
            <Card key={channel._id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {channel.name}
                  <Badge variant="secondary">{channel.subscribers} subscribers</Badge>
                </CardTitle>
                <CardDescription>
                  {channel.contentCount} pieces of content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-stretch">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/admin/dashboard/${channel._id}/edit`}>
                      <Icons.edit className="mr-2 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href={`/admin/dashboard/${channel._id}`}>
                      <Icons.barChart className="mr-2 h-4 w-4" /> View Dashboard
                    </Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => openDeleteDialog(channel._id)}
                    className="flex-1"
                  >
                    <Icons.trash className="h-4 w-4" /> 
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <Icons.inbox className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No channels found</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isSubmittedFormsOpen} onOpenChange={setIsSubmittedFormsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submitted Forms</DialogTitle>
          </DialogHeader>
          <SubmittedForms />
        </DialogContent>
      </Dialog>
    </div>
  )
}