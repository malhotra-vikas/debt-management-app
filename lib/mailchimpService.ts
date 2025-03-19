import mailchimp from "@mailchimp/mailchimp_marketing";
import dotenv from "dotenv";

dotenv.config();

// Configure Mailchimp API
mailchimp.setConfig({
    apiKey: process.env.CLEARONE_MAILCHIMP_API_KEY,
    server: process.env.CLEARONE_MAILCHIMP_SERVER_PREFIX, // Example: 'us12'
});

// Type definition for User Payload
interface UserPayload {
    SPONSOR_NAME: string;
    CLIENT_FIRST: string;
    CLIENT_LAST: string;
    CLIENT_ZIP: string;
    CLIENT_EMAIL: string;
    CLIENT_MOBILE: string;
    CLIENT_STATE: string;
    CLIENT_DOB: string;
    CLIENT_ID: string;
    PROCESSOR_ACCT: string;
    CLIENT_STATUS: string;
    AFFILIATE_ENROLLED_DATE: string;
    DRAFTS: number;
    DEBT_AMT_ENROLLED: number;
    SETTLEMENTS_REACHED: string;
}

// Fetch user data from Mailchimp based on email
export async function getUserDataFromEmail(email: string): Promise<UserPayload | null> {
    try {
        const listId = process.env.CLEARONE_MAILCHIMP_LIST_ID!; // Your Mailchimp audience ID
        const emailHash = require("crypto").createHash("md5").update(email.toLowerCase()).digest("hex");

        console.log("mList id is ", listId);
        console.log("CLEARONE_MAILCHIMP_API_KEY id is ", process.env.CLEARONE_MAILCHIMP_API_KEY);
        console.log("process.env.CLEARONE_MAILCHIMP_SERVER_PREFIX id is ", process.env.CLEARONE_MAILCHIMP_SERVER_PREFIX);
        console.log("MD5 hash is  ", emailHash);

        // Fetch subscriber details from Mailchimp
        const response = await mailchimp.lists.getListMember(listId, emailHash);

        if (!response) {
            console.error(`User not found in Mailchimp: ${email}`);
            return null;
        }

        // Beautify and Log All Merge Fields
        console.log("\n🎯 Merge Fields Received from Mailchimp:");
        console.table(response.merge_fields);
        
        return {
            SPONSOR_NAME: response.merge_fields.SPONSOR || "Unknown Sponsor",
            CLIENT_FIRST: response.merge_fields.FNAME || "Unknown",
            CLIENT_LAST: response.merge_fields.LNAME || "Unknown",
            CLIENT_ZIP: response.merge_fields.ZIP || "00000",
            CLIENT_EMAIL: response.email_address,
            CLIENT_MOBILE: response.merge_fields.MOBILE || "0000000000",
            CLIENT_STATE: response.merge_fields.STATE || "Unknown",
            CLIENT_DOB: response.merge_fields.DOB || "1900-01-01",
            CLIENT_ID: response.merge_fields.CLIENT_ID || "Unknown",
            PROCESSOR_ACCT: response.merge_fields.PROCESSOR || "Unknown",
            CLIENT_STATUS: response.merge_fields.STATUS || "prospect",
            AFFILIATE_ENROLLED_DATE: response.merge_fields.MEM_DATE || new Date().toISOString().split("T")[0],
            DRAFTS: parseInt(response.merge_fields.DRAFTS) || 0,
            DEBT_AMT_ENROLLED: parseFloat(response.merge_fields.DEBT_AMT) || 0,
            SETTLEMENTS_REACHED: response.merge_fields.SETTLEMENTS_REACHED || "zero",
        };
    } catch (error: any) {
        console.error("❌ Error fetching user from Mailchimp:", error.response || error.message);
        return null;
    }
}
