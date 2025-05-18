
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

module.exports = (req, res, next) => {
    console.log("🔍 Request Headers:", req.headers);
    console.log("🔍 Cookies:", req.cookies);

    let token;
    const authHeader = req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    console.log("🔑 Extracted Token:", token);

    if (!token) {
        console.log("⚠️ No token provided.");
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token Verified:", decoded);

        if (!decoded.userId) {
            console.error("🚨 Token does not contain userId!");
            return res.status(401).json({ message: "Invalid token payload" });
        }

        req.user = { userId: decoded.userId };
        next();
    } catch (err) {
        console.error("❌ Invalid Token:", err.message);
        return res.status(401).json({ message: "Invalid Token" });
    }
};

