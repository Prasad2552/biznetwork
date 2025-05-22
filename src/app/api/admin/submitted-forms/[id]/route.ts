// src/app/api/admin/submitted-forms/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PublishForm from '@/lib/models/PublishForm';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params; // Await the Promise to get the params object

    // Validate id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    const form = await PublishForm.findById(id);

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Convert the form data to a formatted string
    const formattedData = Object.entries(form.toObject())
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    // Set the content type to plain text
    return new NextResponse(formattedData, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error fetching submitted form:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}