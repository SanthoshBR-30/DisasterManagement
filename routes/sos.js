const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");
const sendSMS = require("../utils/sendSMS"); // Twilio function

router.post("/", authenticate, async (req, res) => {
    try {
        const { latitude, longitude, message } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user || !user.emermob) {
            return res.status(400).json({ message: "Emergency contact not found!" });
        }

        const sosMessage = `🚨 SOS Alert from ${user.name}!\nLocation: https://www.google.com/maps?q=${latitude},${longitude}\nMessage: ${message}`;
        
        // Send SMS
        await sendSMS(user.emermob, sosMessage);

        res.status(200).json({ message: "SOS Alert sent successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
