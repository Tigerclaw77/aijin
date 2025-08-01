// utils/sendSMSConfirmation.js

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function sendSMSConfirmation(to, code) {
  try {
    const message = await client.messages.create({
      body: `Your breakup confirmation code is: ${code}`,
      from: fromNumber,
      to,
    });
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('❌ SMS sending failed:', error);
    return { success: false, error };
  }
}
