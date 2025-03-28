import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, "Please enter a valid email"]
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true
  },
  seen: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;