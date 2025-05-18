
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const User = require("../models/User");
const sendEmergencySMS = require("../utils/sendSMS");

router.post("/", authenticate, async (req, res) => {
    try {
        const { latitude, longitude, message } = req.body;

        // Fetch user emergency contact from database
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        let emergencyContact = user.emermob;
        if (!emergencyContact) {
            return res.status(400).json({ message: "No emergency contact provided" });
        }

        // Ensure the emergency number is in E.164 format (+CountryCodeXXXXXXXXXX)
        if (!emergencyContact.startsWith("+")) {
            emergencyContact = `+91${emergencyContact}`; // Assuming Indian numbers, modify as needed
        }

        let emerContact = "7795969832";
        if (!emerContact.startsWith("+")) {
            emerContact = `+91${emerContact}`; // Assuming Indian numbers, modify as needed
        }
        console.log("📞 Sending SOS to:", emerContact);
        console.log("📞 Sending SOS to:", emergencyContact);

        const encodedLocation = encodeURIComponent(`${latitude},${longitude}`);
const fullMessage = `🚨 SOS ALERT 🚨
User needs help at:
📍 Location: https://maps.google.com/?q=${encodedLocation}
📩 Message: ${message}`;


        // // Send SMS using Twilio
        // const response = await sendEmergencySMS(emergencyContact, fullMessage);
        // const response1 = await sendEmergencySMS(emerContact, fullMessage);
        // console.log("📤 Twilio Response:", response);
        // console.log("📤 Twilio Response1:", response1);

        // res.status(200).json({ message: "✅ SOS alert sent successfully!" });
        try {
            // Send SMS to both numbers concurrently
            const [response1, response2] = await Promise.all([
                sendEmergencySMS(emergencyContact, fullMessage), // First number
                sendEmergencySMS(emerContact, fullMessage)       // Second number
            ]);
        
            if (!response1) {
                console.error("❌ Failed to send SMS to:", emergencyContact);
            } else {
                console.log("📤 Twilio Response1:", response1);
            }
            
            if (!response2) {
                console.error("❌ Failed to send SMS to:", emerContact);
            } else {
                console.log("📤 Twilio Response2:", response2);
            }
        
            res.status(200).json({ message: "✅ SOS alert sent successfully!" });
        } catch (error) {
            console.error("❌ SOS Error:", error);
            res.status(500).json({ message: "Failed to send SOS alert" });
        }

    } catch (error) {
        console.error("❌ SOS Error:", error);
        res.status(500).json({ message: "Failed to send SOS alert" });
    }

    
});

module.exports = router;

