interface ContentStatsProps {
    likedCount: number
    savedCount: number
    dislikedCount: number
    videoCount: number
    blogCount: number
    documentCount: number
  }
  
  export function ContentStats({
    likedCount,
    savedCount,
    dislikedCount,
    videoCount,
    blogCount,
    documentCount
  }: ContentStatsProps) {
    return (
      <div className="grid gap-4 md:grid-cols-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Liked</h3>
          <p className="text-2xl font-bold">{likedCount}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Saved</h3>
          <p className="text-2xl font-bold">{savedCount}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Disliked</h3>
          <p className="text-2xl font-bold">{dislikedCount}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Videos</h3>
          <p className="text-2xl font-bold">{videoCount}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Blogs</h3>
          <p className="text-2xl font-bold">{blogCount}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Documents</h3>
          <p className="text-2xl font-bold">{documentCount}</p>
        </div>
      </div>
    )
  }
  
  