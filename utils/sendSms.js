const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

async function sendSMS(to, message) {
    await client.messages.create({
        body: message,
        from: twilioPhone,
        to: to, // Emergency contact number
    });
}

module.exports = sendSMS;
