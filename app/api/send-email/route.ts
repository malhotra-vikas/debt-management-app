import { NextResponse } from 'next/server';
import Mailchimp from '@mailchimp/mailchimp_marketing';
import crypto from 'crypto';

import dotenv from 'dotenv';
dotenv.config();

const listId = process.env.MAILCHIMP_LIST_ID;
const apiKey = process.env.MAILCHIMP_API_KEY;
const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;

// Initialize Mailchimp
Mailchimp.setConfig({
    apiKey: apiKey,
    server: serverPrefix
});

// Define TypeScript Types for Payload and Response
interface MergeFields {
    LINK: string,
    FNAME: string,
    LNAME: string,
    MMERGE5: string, // linkk
    MMERGE7: string, // Name of the tool
    MMERGE6: string // IP Address
}

interface AddUserPayload {
    email_address: string;
    status: 'subscribed' | 'pending';
    merge_fields?: MergeFields;
}


interface MailchimpResponse {
    id: string;
    email_address: string;
    status: string;
    [key: string]: any;
}


export async function POST(request: Request) {
    try {
        const { email, fname, lname, link } = await request.json();

        console.log("IN email seding route")

        console.log("Email :", email)
        console.log("FName :", fname)
        console.log("Link to be sent : ", link)
        console.log("API Key", process.env.MAILCHIMP_API_KEY)
        console.log("Prefix Key", process.env.MAILCHIMP_SERVER_PREFIX)
        console.log("List ID", process.env.MAILCHIMP_LIST_ID)

        await addUserToList(email, fname, lname, link)

        return NextResponse.json({ success: true, message: 'Email sent successfully' });

    } catch (error) {
        console.error('Detailed error from Mailchimp:', error.response || error.text);
        return NextResponse.json({ success: false, message: 'Failed to send email', details: error.message }, { status: 500 });
    }

    // Function to Add a User to a Mailchimp List
    async function addUserToList(email: string, fName: string, lLname: string, link: string): Promise<void> {
        // Mailchimp requires the email to be hashed using MD5 for identifying users
        const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

        const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`;

        const payload: AddUserPayload = {
            email_address: email,
            status: 'subscribed', // Change to 'pending' if you want to send a confirmation email
            merge_fields: {
                LINK: link,
                FNAME: fName,
                LNAME: lLname,
                MMERGE5: link,
                MMERGE6: "ip",
                MMERGE7: "Credit Card Payoff Calculator"
            },
        };

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString(
                        'base64'
                    )}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Mailchimp API Error:', error);
                throw new Error(`Failed to add user: ${response.statusText}`);
            }

            const data: MailchimpResponse = await response.json();
            console.log('User added successfully:', data);
        } catch (error) {
            console.error('Error adding user to Mailchimp:', error);
        }
    }

}