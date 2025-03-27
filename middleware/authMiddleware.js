const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("⚠️ No token provided or incorrect format.");
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1]; // Extract token after "Bearer"

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Store user info for further use
        console.log("✅ Token Verified:", decoded); // Debugging
        next();
    } catch (err) {
        console.error("❌ Invalid Token:", err.message);
        return res.status(401).json({ message: "Invalid Token" });
    }
};
  