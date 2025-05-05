const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const sosRoutes = require("./routes/sosRoutes"); // <-- Add SOS Route
const authenticate = require("./middleware/authMiddleware");
const profileRoutes = require("./routes/profileRoutes");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");  
require("dotenv").config();
const User = require("./models/User"); // Adjust path as necessary

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/profile", authenticate, profileRoutes);

// Set up EJS for rendering views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes); // <-- Add this line

// Render pages
app.get("/", (req, res) => {
  res.render("register"); // Renders views/register.ejs
});

app.get("/login", (req, res) => {
  res.render("login"); // Renders views/login.ejs
});

app.get("/forgotpassword", (req, res) => {
  res.render("forgotpassword"); // Ensure forgotpassword.ejs exists inside the views folder
});

app.get("/home", (req, res) => {
  res.render("homepage"); // Ensure homepage.ejs exists inside views folder
});

app.get("/sos", (req,res) =>{
  res.render("sos");
});
app.get("/call", (req, res) => {
  res.render("call");
});

app.get("/map", (req,res) =>{
  res.render("map");
});

app.get("/profile", async (req, res) => {
  try {
      const userId = req.user?.userId;  // ✅ Avoid undefined error
      if (!userId) {
          return res.status(401).send("Unauthorized: No user ID found");
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).send("User not found");
      }

      // ✅ Ensure emergencyContacts is always an array
      if (!user.emergencyContacts) {
          user.emergencyContacts = [];
      }

      res.render("profile", { user });
  } catch (error) {
      console.error("Profile Fetch Error:", error);
      res.status(500).send("Internal Server Error");
  }
});





// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
