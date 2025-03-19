"use server"

import { z } from "zod"
import { getUserDataFromEmail } from "@/lib/mailchimpService";

// Define the expected payload structure
const userPayloadSchema = z.object({
    SPONSOR_NAME: z.string(),
    CLIENT_FIRST: z.string(),
    CLIENT_LAST: z.string(),
    CLIENT_ZIP: z.string(),
    CLIENT_EMAIL: z.string().email(),
    CLIENT_MOBILE: z.string(),
    CLIENT_STATE: z.string(),
    CLIENT_DOB: z.string(),
    CLIENT_ID: z.string(),
    PROCESSOR_ACCT: z.string(),
    CLIENT_STATUS: z.string(),
    AFFILIATE_ENROLLED_DATE: z.string(),
    DRAFTS: z.number(),
    DEBT_AMT_ENROLLED: z.number(),
    SETTLEMENTS_REACHED: z.string(),
})

type UserPayload = z.infer<typeof userPayloadSchema>


export async function activateUser(email: string) {
    try {
        // 1. Get user data based on email
        const userData = await getUserDataFromEmail(email)

        // 2. Make API call to create user
        const apiUrl = "https://app.dealingwithdebt.org/wp-json/affiliate/v1/create-user"
        const apiSecret = process.env.API_SECRET_TOKEN

        if (!apiSecret) {
            throw new Error("API secret token is not configured")
        }

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "X-API-Secret": apiSecret,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            throw new Error(
                `API request failed with status ${response.status}: ${errorData ? JSON.stringify(errorData) : response.statusText
                }`,
            )
        }

        const data = await response.json()

        // 3. Update local user status if needed
        // This would be where you update your local database to mark the user as activated

        return {
            success: true,
            message: "Your account has been successfully activated!",
        }
    } catch (error) {
        console.error("Activation error:", error)
        throw error
    }
}

