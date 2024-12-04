import { NextResponse } from 'next/server';
import Mailchimp from '@mailchimp/mailchimp_marketing';

import dotenv from 'dotenv';
dotenv.config();

const listId = process.env.MAILCHIMP_LIST_ID;

// Initialize Mailchimp
Mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g., 'us1'
});

export async function POST(request: Request) {
    try {
        const { email, name, pdfUrl } = await request.json();

        // Send email using Mailchimp
        const response = await Mailchimp.messages.send({
            message: {
                from_email: 'your-email@example.com',
                subject: 'Your Credit Card Debt Report',
                text: `Hello ${name},\n\nHere's your credit card debt report: ${pdfUrl}`,
                to: [{ email, type: 'to' }]
            }
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 });
    }
}