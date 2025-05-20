// src/actions/sendEmail.ts
'use server'
import nodemailer from 'nodemailer';

interface EmailState {
  message: string;
}

export async function sendEmail(prevState: EmailState | null, formData: FormData): Promise<EmailState> {
    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();
    const companyName = formData.get('companyName')?.toString();
    const formId = formData.get('formId')?.toString();

    if(!firstName || !lastName || !companyName || !formId) {
        return { message: "Error while creating email" }
    }
    try {
        console.log("Attempting to send email...");
        
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'pratikmore402@gmail.com',
            subject: 'New Form Submission',
            html: `A new form has been submitted by ${firstName} ${lastName} from ${companyName} company.

                View the full submission details at: ${process.env.NEXT_PUBLIC_BASE_URL}/admin/channels`
        });
        console.log("Email sent:", info);
        return { message: "Email has been sent!" }
    } catch (error) {
        console.error("Error sending email:", error);
        console.log(error)
        return { message: "An error occured sending email." }
    }
}