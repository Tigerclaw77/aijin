import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Get your Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

export async function POST(req) {
    const { to, message } = await req.json();  // Extract phone number and message from the request

    try {
        // Send the SMS using the Twilio API
        const response = await client.messages.create({
            body: message,                // Message content
            from: process.env.TWILIO_PHONE_NUMBER,  // Your Twilio number
            to: to                        // The recipient's number
        });

        // Return the response back to the frontend
        return NextResponse.json({ success: true, sid: response.sid });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
