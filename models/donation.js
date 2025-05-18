const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        sparse: true  
      },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    
    paymentStatus: { type: String, default: 'completed' },
    stripeSessionId: String,
    stripePaymentIntentId: String,
    createdAt: { type: Date, default: Date.now }
  });
  

module.exports = mongoose.model("Donation", donationSchema);