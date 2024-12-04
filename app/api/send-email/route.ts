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

        // Create a campaign
        const campaign = await Mailchimp.campaigns.create({
            type: 'regular',
            recipients: { list_id: listId },
            settings: {
                subject_line: 'Your Credit Card Debt Report',
                from_name: 'DealingWithDebt.org',
                reply_to: 'no-reply@DealingWithDebt.org'
            }
        });

        // Set campaign content
        await Mailchimp.campaigns.setContent(campaign.id, {
            html: `Hello ${name},<br><br>Here's your credit card debt report: <a href="${pdfUrl}">${pdfUrl}</a>`
        });

        // Send the campaign
        await Mailchimp.campaigns.send(campaign.id);

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 });
    }
}