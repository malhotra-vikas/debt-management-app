import { NextResponse } from 'next/server';
import Mailchimp from '@mailchimp/mailchimp_marketing';
import crypto from 'crypto';

import dotenv from 'dotenv';
dotenv.config();

const listId = process.env.MAILCHIMP_LIST_ID;

// Initialize Mailchimp
Mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g., 'us1'
});

export function generateSubscriberHash(email: string) {
    return crypto.createHash('md5').update(email.toLowerCase()).digest("hex");
}

export async function addSubscriberToList(email: string, name: string, pdfUrl: string) {
    const source = "Credit Card Payoff Calculator"
    const listId = process.env.MAILCHIMP_LIST_ID;
    const subscriberHash = generateSubscriberHash(email); // Generate the MD5 hash of the email

    try {
        const response = await Mailchimp.lists.setListMember(listId, subscriberHash, {
            email_address: email,
            status_if_new: 'subscribed', // Status if the subscriber is new
            status: 'subscribed', // Status to be updated if the subscriber exists
            merge_fields: {
                FNAME: name,
                DocLocation: pdfUrl,
                Source: source,
                merge_field5: pdfUrl,
                merge_field7: source
            }
        });
        console.log(`Added or updated ${email} in list. Subscriber ID: ${response.id}`);
        return response;
    } catch (error) {
        console.error('Error adding subscriber:', error);
        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const { email, name, link } = await request.json();
        
        console.log("IN email seding route")

        console.log(email)
        console.log(name)
        console.log(link)
        console.log("API Key", process.env.MAILCHIMP_API_KEY)
        console.log("Prefix Key", process.env.MAILCHIMP_SERVER_PREFIX)
        console.log("List ID", process.env.MAILCHIMP_LIST_ID)

        // Add subscriber and await to ensure they are added before proceeding
        const subscriberResponse = await addSubscriberToList(email, name, link);
        if (!subscriberResponse.id) {
            throw new Error('Failed to add subscriber');
        }
/*        
        console.log("Creating campaign for:", email);


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
*/
        return NextResponse.json({ success: true, message: 'Email sent successfully' });
        
    } catch (error) {
        console.error('Detailed error from Mailchimp:', error.response || error.text);
        return NextResponse.json({ success: false, message: 'Failed to send email', details: error.message }, { status: 500 });
    }
}