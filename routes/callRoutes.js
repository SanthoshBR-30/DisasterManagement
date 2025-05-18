require('dotenv').config();
const express = require('express');
const router = express.Router();
const twilio = require('twilio');


const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


const EMERGENCY_NUMBER = '+918431201418'; 
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;


router.post('/api/emergency-call', async (req, res) => {
  try {
   
    const call = await client.calls.create({
        twiml: `
        <Response>
        <Say>This is an emergency call. Please stay on the line while we connect you with emergency services.</Say>
        <Dial callerId="${TWILIO_PHONE_NUMBER}">${EMERGENCY_NUMBER}</Dial>
        </Response>
        `,
        
    //   url: 'http://demo.twilio.com/docs/voice.xml',

      to: EMERGENCY_NUMBER,
      from: TWILIO_PHONE_NUMBER
    });

    

    console.log('Emergency call initiated with SID:', call.sid);
    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    console.error('Error making emergency call:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to make emergency call' 
    });
  }
});

module.exports = router;

