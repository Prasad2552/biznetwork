
//src\app\documents\[slug]\not-found.tsx
import Link from 'next/link'
import { FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <FileX className="h-16 w-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h2>
      <p className="text-gray-600 mb-4">The document you're looking for doesn't exist or has been removed.</p>
      <Button asChild>
        <Link href="http://localhost:3000/?activeNavItem=E-books">Back to Documents</Link>
      </Button>
    </div>
  )
}

