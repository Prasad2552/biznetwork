import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
})

export async function sendEmail({ 
  to, 
  subject, 
  html 
}: { 
  to: string
  subject: string
  html: string 
}) {
  try {
    console.log('Sending email:', {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    })
    console.log('Email Sent Successfully!', result);
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Add this new function
export async function sendVerificationEmail(email: string, verificationCode: string) {
  const subject = 'Your Verification Code'
  const html = `
    <h1>Verification Code</h1>
    <p>Your verification code is: <strong>${verificationCode}</strong></p>
    <p>This code will expire in 10 minutes.</p>
  `
  
  return sendEmail({ to: email, subject, html })
}