import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PublishForm from '@/lib/models/PublishForm'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const form = await PublishForm.findById(params.id)

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Convert the form data to a formatted string
    const formattedData = Object.entries(form.toObject())
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

    // Set the content type to plain text
    return new NextResponse(formattedData, {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error('Error fetching submitted form:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

