import express from "express";
import { createContact, getContacts, deleteContact, getUnseenContacts, markContactsAsSeen } from "../controllers/contactController.js";
import { body } from "express-validator";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Validation rules
const contactValidationRules = [
  body("firstName").notEmpty().withMessage("First name is required").trim(),
  body("lastName").notEmpty().withMessage("Last name is required").trim(),
  body("email").isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  body("subject").notEmpty().withMessage("Subject is required").trim(),
  body("message").notEmpty().withMessage("Message is required").trim()
];

// Contact routes
router.post("/contactme", contactValidationRules, createContact);
router.get("/getcontacts", getContacts); // For admin to view submissions
router.delete("/deletecontact/:id", deleteContact); // For admin to delete a contact
router.get('/unseen', auth, getUnseenContacts);
router.put('/mark-seen', auth, markContactsAsSeen);

export default router;