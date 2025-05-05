const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Register User
exports.register = async (req, res) => {
    try {
        const { name, email, password, mobile, emermob } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword, mobile, emermob});
        await user.save();

        res.status(200).json({ message: "Signup successful", redirect: "/home" });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Login User


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.cookie("jwt", token, { 
            httpOnly: true,  // Prevents JavaScript access
            secure: false,   // Set to true if using HTTPS
            sameSite: "Strict",
        });

        res.json({ message: "Login successful", token }); // Return token for debugging
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};


// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        let user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email not found!" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
