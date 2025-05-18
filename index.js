const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const sosRoutes = require("./routes/sosRoutes");
const callRoutes = require("./routes/callRoutes");
const profileRoutes = require("./routes/profileRoutes");
const authenticate = require("./middleware/authMiddleware");
const Volunteer = require('./models/volunteer');
const Donation = require("./models/donation");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser"); 
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  timeout: 120000, 
});

const User = require("./models/User");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;



// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/profile", authenticate, profileRoutes);

app.post('/webhook', 
  express.raw({type: 'application/json'}), 
  async (req, res) => {
    // Get the signature sent by Stripe
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verify the event using the webhook secret
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    console.log(`✅ Webhook received: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Update donation record in MongoDB
        try {
          const updatedDonation = await Donation.findOneAndUpdate(
            { stripeSessionId: session.id },
            { 
              paymentStatus: 'completed',
              stripePaymentIntentId: session.payment_intent 
            },
            { new: true } // Return the updated document
          );
          
          if (updatedDonation) {
            console.log(`💰 Payment succeeded for donation ID: ${updatedDonation._id}`);
            // Here you could send confirmation email, update inventory, etc.
          } else {
            console.log(`⚠️ No donation found with session ID: ${session.id}`);
          }
        } catch (err) {
          console.error('Error updating donation record:', err);
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log(`❌ Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`);
        
        try {
          // Find donation by payment intent ID if available, otherwise try the client_secret
          const filter = paymentIntent.id 
            ? { stripePaymentIntentId: paymentIntent.id }
            : { 'stripeSessionId': { $regex: paymentIntent.client_secret.split('_secret')[0] } };
            
          await Donation.findOneAndUpdate(
            filter,
            { paymentStatus: 'failed' }
          );
        } catch (err) {
          console.error('Error updating failed donation:', err);
        }
        break;
      }
      
      // Handle other event types if needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({received: true});
  }
);
app.use(express.urlencoded({ extended: true }));

// Set up EJS for rendering views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes); // <-- Add this line
app.use(callRoutes);

// Render pages
app.get("/register", (req, res) => {
  res.render("register"); // Renders views/register.ejs
});

app.get("/login", (req, res) => {
  res.render("login"); // Renders views/login.ejs
});

app.get("/forgotpassword", (req, res) => {
  res.render("forgotpassword"); // Ensure forgotpassword.ejs exists inside the views folder
});

app.get("/", (req, res) => {
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

app.get("/profile", async (req,res) =>{
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

app.get('/donation', (req, res) => {
  
  const templateData = {
    disasterName: "Hurricane Relief",
    disasterId: req.params.disasterId,
    disasterDescription: "This hurricane has affected over 100,000 people across the region, destroying homes and infrastructure.",
    responseDescription: "Our teams are on the ground providing emergency shelter, food, and medical assistance.",
    donationImpacts: [
      { amount: 25, description: "Provides emergency food for a family of four for one day" },
      { amount: 50, description: "Supplies clean water for 20 people for a week" },
      { amount: 100, description: "Provides emergency shelter materials for one family" },
      { amount: 250, description: "Funds medical supplies for 50 people" }
    ],
    donationAmounts: [25, 50, 100, 250],
    emergency: true,
    emergencyMessage: "Urgent need for shelter and medical supplies",
    organizationName: "Global Disaster Relief",
    charityRegistrationNumber: "12345-67890"
  };
  
  res.render('donation', templateData);
});

app.get('/volunteer', (req, res) => {
  res.render('volunteer');
});



app.post('/create-checkout-session', async (req, res) => {
  try {
    const { firstName, lastName, email, amount, disasterId } = req.body;
    
    // Create a new donation document in MongoDB
    const donation = new Donation({
      firstName,
      lastName,
      email,
      amount,
      // disasterId
    });
    
    await donation.save();

      
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Disaster Relief Donation',
              description: `Donation for disaster ID: ${disasterId}`,
            },
            unit_amount: amount * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
     
      mode: 'payment',
      success_url: `${req.headers.origin}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/donation-cancel`,
    });
    
    // Update donation with session ID
    donation.stripeSessionId = session.id;
    await donation.save();
    
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook to update payment status
// app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.error('Webhook signature verification failed:', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   // Handle the checkout.session.completed event
//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object;
    
//     // Update donation status in MongoDB
//     try {
//       await Donation.findOneAndUpdate(
//         { stripeSessionId: session.id },
//         { 
//           paymentStatus: 'completed',
//           stripePaymentIntentId: session.payment_intent
//         }
//       );
//       console.log('Donation payment completed!');
//     } catch (err) {
//       console.error('Error updating donation record:', err);
//     }
//   }

//   res.json({ received: true });
// }); 


   


// Donation success page
app.get('/donation-success', async (req, res) => {
  const sessionId = req.query.session_id;
  
  try {
    const donation = await Donation.findOne({ stripeSessionId: sessionId });
    if (!donation) {
      return res.status(404).render('error', { message: 'Donation not found' });
    }
    
    res.render('donation-success', { donation });
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).render('error', { message: 'Server error' });
  }
});

// Donation cancel page
app.get('/donation-cancel', (req, res) => {
  res.render('donation-cancel');
});

// Route to process the donation form and redirect to Stripe
app.post('/process-donation', (req, res) => {
  
  res.render('payment-redirect', { 
    donationData: req.body,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY
  });
});

app.post('/register-volunteer', async (req, res) => {
  try {
      const { firstName, lastName, email, phone, skills, availability, location, previousExperience } = req.body;
      
      // Create a new volunteer record
      const volunteer = new Volunteer({
          firstName,
          lastName,
          email,
          phone,
          skills: Array.isArray(skills) ? skills : [skills],
          availability,
          location,
          previousExperience
      });
      
      // Save to MongoDB
      await volunteer.save();
      
      res.render('volunteer-success', { name: firstName });
  } catch (error) {
      console.error('Error registering volunteer:', error);
      res.status(500).send('An error occurred while registering as a volunteer');
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



