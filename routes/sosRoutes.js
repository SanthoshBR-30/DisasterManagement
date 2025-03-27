// const express = require("express");
// const router = express.Router();
// const authenticate = require("../middleware/authMiddleware");
// const User = require("../models/User");
// const sendEmergencySMS = require("../utils/sendSMS");

// router.post("/", authenticate, async (req, res) => {
//     try {
//         const { latitude, longitude, message } = req.body;

//         // Fetch user emergency contact from database
//         const user = await User.findById(req.user.userId);
//         if (!user) return res.status(404).json({ message: "User not found" });

//         const emergencyContact = user.emermob; // Fetch from DB
//         if (!emergencyContact) return res.status(400).json({ message: "No emergency contact provided" });

//         const fullMessage = `🚨 SOS ALERT 🚨\nUser needs help at:\n📍Location: https://www.google.com/maps?q=${latitude},${longitude}\n📩 Message: ${message}`;

//         // Send SMS using Twilio
//         sendEmergencySMS(emergencyContact, fullMessage);
        
//         res.status(200).json({ message: "SOS alert sent successfully!" });
//     } catch (error) {
//         console.error("SOS Error:", error);
//         res.status(500).json({ message: "Failed to send SOS alert" });
//     }
// });

// module.exports = router;
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

        console.log("📞 Sending SOS to:", emergencyContact);

        const encodedLocation = encodeURIComponent(`${latitude},${longitude}`);
const fullMessage = `🚨 SOS ALERT 🚨
User needs help at:
📍 Location: https://maps.google.com/?q=${encodedLocation}
📩 Message: ${message}`;


        // Send SMS using Twilio
        const response = await sendEmergencySMS(emergencyContact, fullMessage);
        console.log("📤 Twilio Response:", response);

        res.status(200).json({ message: "✅ SOS alert sent successfully!" });
    } catch (error) {
        console.error("❌ SOS Error:", error);
        res.status(500).json({ message: "Failed to send SOS alert" });
    }
});

module.exports = router;

