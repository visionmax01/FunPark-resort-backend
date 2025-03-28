import express from 'express';
import { createBooking, getBookings, updateBookingStatus, verifyPayment,fonepayCallback,getMyBookings } from '../controllers/bookingController.js';
import { auth } from '../middleware/auth.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST request to create a booking
router.post("/bookings", authenticateUser, createBooking);

// GET request to get all bookings
router.get("/bookings",auth, getBookings);

// PUT request to update booking status
router.put("/bookings/:id",authenticateUser, updateBookingStatus);
// POST request to verify payment
router.post("/verify-payment",authenticateUser, verifyPayment);
router.post("/fonepay-callback",authenticateUser, fonepayCallback);
router.get('/my-bookings',authenticateUser, getMyBookings);

export default router;
