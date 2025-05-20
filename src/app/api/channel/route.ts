import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function GET() {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017')
    const db = client.db('biznetwork')
    const channels = await db.collection('channels').find().toArray() // Fetch channels from the 'channels' collection. Update the collection name in your DB.
    await client.close()

    return NextResponse.json(channels)
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
  }
}