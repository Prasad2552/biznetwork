import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PublishForm from '@/lib/models/PublishForm'

export async function GET() {
  try {
    await connectDB()
    const forms = await PublishForm.find({}, {
      firstName: 1,
      lastName: 1,
      companyName: 1,
      businessEmail: 1,
      submittedAt: 1,
      jobTitle: 1,
      personalEmail: 1,
      contactNumber: 1,
      city: 1,
      pincode: 1,
      companySize: 1,
      companyDescription: 1,
      companyLogo: 1,
      companyBanner: 1, // Correct this line
      businessChannelName: 1,
      channelDescription: 1,
      primaryIndustry: 1,
      secondaryIndustry: 1,
      contentFocusArea: 1,
      targetAudience: 1,
      geographicFocus: 1,
      contentPostingFrequency: 1,
      typesOfContent: 1,
      specialRequirements: 1,
      isExistingUser: 1,
      additionalComments: 1,
      agreeToTerms: 1,
      createdAt: 1,
      updatedAt: 1,
    }).sort({ submittedAt: -1 });

    return NextResponse.json(forms)
  } catch (error) {
    console.error('Error fetching submitted forms:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

