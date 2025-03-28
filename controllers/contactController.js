import Contact from "../models/Contact.js";
import { validationResult } from "express-validator";

// Create new contact form submission
export const createContact = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { firstName, lastName, email, subject, message } = req.body;

    // Create new contact
    const newContact = new Contact({
      firstName,
      lastName,
      email,
      subject,
      message
    });

    // Save to database
    const savedContact = await newContact.save();

    res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
      data: savedContact
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit contact form",
      error: error.message
    });
  }
};

// Get all contact submissions (for admin)
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
      error: error.message
    });
  }
};




// controllers/contactController.js
export const deleteContact = async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);
    if (!deletedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Contact deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
      error: error.message
    });
  }
};


// Get unseen contacts
export const getUnseenContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ seen: false }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    console.error("Error fetching unseen contacts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unseen contacts",
      error: error.message
    });
  }
};

// Mark contacts as seen
export const markContactsAsSeen = async (req, res) => {
  try {
    await Contact.updateMany({ seen: false }, { $set: { seen: true } });
    res.status(200).json({
      success: true,
      message: "Contacts marked as seen"
    });
  } catch (error) {
    console.error("Error marking contacts as seen:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark contacts as seen",
      error: error.message
    });
  }
};