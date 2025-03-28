import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "NPR"
  },
  paymentMethod: {
    type: String,
    enum: ["phonepe", "payLater", "fonepay"],
    required: true
  },
  transactionId: {
    type: String
  },
  screenshot: {
    type: String,
    required: function() {
      return this.paymentMethod === 'phonepe';
    }
  },
  status: {
    type: String,
    enum: ["pending", "verified", "failed", "initiated"],
    default: "pending"
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  verifiedAt: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);