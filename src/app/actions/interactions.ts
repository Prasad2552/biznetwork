'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'

export async function handleInteraction(
  type: 'like' | 'dislike' | 'subscribe' | 'save',
  targetId: string
) {
  const session = await getServerSession()
  
  if (!session?.user) {
    throw new Error('Authentication required')
  }

  const userId = session.user.id

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        targetId,
        userId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to process interaction')
    }

    const data = await response.json()
    revalidatePath('/') // Revalidate the page to show updated counts
    return data
  } catch (error) {
    console.error('Error in interaction:', error)
    throw error
  }
}

