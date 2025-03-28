import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, required: true },
  bookingType: { type: String, required: true },
  numPeople: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  date: { type: String, required: true },
  dateextended: { type: String },
  time: { type: String, required: true },
  bookingFor: { type: String, required: true },
  bookingStatus: { 
    type: String, 
    enum: ["pending", "confirmed", "cancelled"], 
    default: "pending" 
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "pending", "paid", "failed"],
    default: "unpaid"
  },
  amount: { type: Number, required: true },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  message: { type: String },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);