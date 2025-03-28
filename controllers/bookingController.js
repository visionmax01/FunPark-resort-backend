import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import axios from 'axios';
import { createHmac } from 'crypto'; // Import crypto directly

// Generate random booking ID
const generateBookingId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// FonePay configuration
const FONEPAY_CONFIG = {
  MERCHANT_ID: process.env.FONEPAY_MERCHANT_ID,
  SECRET_KEY: process.env.FONEPAY_SECRET_KEY,
  API_URL: process.env.FONEPAY_API_URL || 'https://fonepay.com/api/merchantRequest'
};

// Helper function to generate FonePay signature
const generateFonePaySignature = (data) => {
  const signatureData = Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
  
  return createHmac('sha256', FONEPAY_CONFIG.SECRET_KEY)
    .update(signatureData)
    .digest('hex');
};

export const createBooking = async (req, res) => {
  try {
    // User is already verified by authMiddleware
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        message: "User authentication failed" 
      });
    }

    const { paymentMethod, ...bookingData } = req.body;
    
    // Validate required fields
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required"
      });
    }

    // Create booking with user reference
    const newBooking = new Booking({
      ...bookingData,
      user: req.user._id,
      bookingId: generateBookingId(),
      bookingStatus: "pending",
      paymentStatus: paymentMethod === 'payLater' ? 'pending' : 'unpaid'
    });

    const savedBooking = await newBooking.save();

    // Handle different payment methods
    let paymentResponse = null;
    
    if (paymentMethod === 'payLater') {
      // Create payLater payment record
      await Payment.create({
        user: req.user._id,
        booking: savedBooking._id,
        amount: bookingData.amount || 0,
        currency: 'NPR',
        paymentMethod: 'payLater',
        status: 'pending'
      });
    } 
    else if (paymentMethod === 'fonepay') {
      // Initialize FonePay payment
      const fonepayPayload = {
        amount: bookingData.amount,
        transactionId: savedBooking.bookingId,
        productName: `Booking for ${bookingData.bookingType}`,
        productCode: 'BOOKING',
        merchantId: FONEPAY_CONFIG.MERCHANT_ID,
        successUrl: `${process.env.FRONTEND_URL}/payment-success`,
        failureUrl: `${process.env.FRONTEND_URL}/payment-failure`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment-canceled`,
      };

      // Generate signature for FonePay using the helper function
      fonepayPayload.signature = generateFonePaySignature({
        amount: fonepayPayload.amount,
        transactionId: fonepayPayload.transactionId,
        productName: fonepayPayload.productName,
        productCode: fonepayPayload.productCode,
        merchantId: fonepayPayload.merchantId
      });

      // Make request to FonePay API
      const fonepayResponse = await axios.post(FONEPAY_CONFIG.API_URL, fonepayPayload);
      
      // Create payment record for FonePay
      const payment = await Payment.create({
        user: req.user._id,
        booking: savedBooking._id,
        amount: bookingData.amount || 0,
        currency: 'NPR',
        paymentMethod: 'fonepay',
        transactionId: savedBooking.bookingId, // Using booking ID as initial transaction ID
        status: 'initiated'
      });

      paymentResponse = {
        paymentUrl: fonepayResponse.data.paymentUrl,
        paymentId: payment._id
      };
    } 
    else if (paymentMethod === 'phonepe') {
      // Create phonepe payment record (manual verification)
      await Payment.create({
        user: req.user._id,
        booking: savedBooking._id,
        amount: bookingData.amount || 0,
        currency: 'NPR',
        paymentMethod: 'phonepe',
        status: 'pending'
      });
    }

    res.status(201).json({ 
      success: true,
      message: "Booking successful!",
      booking: savedBooking,
      paymentRequired: paymentMethod !== 'payLater',
      paymentInfo: paymentResponse // Will contain FonePay URL if paymentMethod is fonepay
    });

  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during booking",
      error: error.message 
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Authorization required" });
    }

    const { bookingId, transactionId, screenshot, paymentMethod } = req.body;

    // Validate required fields based on payment method
    if (paymentMethod === 'fonepay' && !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required for FonePay verification"
      });
    }

    if (paymentMethod === 'phonepe' && (!transactionId || !screenshot)) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID and screenshot are required for PhonePe verification"
      });
    }

    // Find booking and verify ownership
    const booking = await Booking.findOne({ bookingId, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found or not authorized" 
      });
    }

    // Handle FonePay verification
    if (paymentMethod === 'fonepay') {
      // Verify with FonePay API
      const verifyPayload = {
        merchantId: FONEPAY_CONFIG.MERCHANT_ID,
        transactionId: transactionId,
        referenceId: booking.bookingId
      };

      const signatureData = `merchantId=${verifyPayload.merchantId},transactionId=${verifyPayload.transactionId},referenceId=${verifyPayload.referenceId}`;
      verifyPayload.signature = require('crypto')
        .createHmac('sha256', FONEPAY_CONFIG.SECRET_KEY)
        .update(signatureData)
        .digest('hex');

      const verificationResponse = await axios.post(
        `${FONEPAY_CONFIG.API_URL}/verify`,
        verifyPayload
      );

      if (!verificationResponse.data.success) {
        return res.status(400).json({
          success: false,
          message: "FonePay payment verification failed",
          details: verificationResponse.data
        });
      }
    }

    // Update payment record
    const updateData = {
      status: 'verified',
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    };

    if (paymentMethod === 'fonepay' || paymentMethod === 'phonepe') {
      updateData.transactionId = transactionId;
    }

    if (paymentMethod === 'phonepe') {
      updateData.screenshot = screenshot;
    }

    const payment = await Payment.findOneAndUpdate(
      { booking: booking._id, user: req.user._id, paymentMethod },
      updateData,
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment record not found" 
      });
    }

    // Update booking status
    booking.paymentStatus = 'paid';
    if (paymentMethod === 'fonepay') {
      booking.bookingStatus = 'confirmed'; // Auto-confirm for FonePay payments
    }
    await booking.save();

    res.json({ 
      success: true,
      message: "Payment verified successfully!",
      booking,
      payment
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error verifying payment",
      error: error.message 
    });
  }
};

// FonePay callback handler (for server-to-server notification)
export const fonepayCallback = async (req, res) => {
  try {
    const { transactionId, referenceId, status, signature } = req.body;

    // Verify signature
    const signatureData = `transactionId=${transactionId},referenceId=${referenceId},status=${status}`;
    const computedSignature = require('crypto')
      .createHmac('sha256', FONEPAY_CONFIG.SECRET_KEY)
      .update(signatureData)
      .digest('hex');

    if (computedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Find booking by referenceId (which is our bookingId)
    const booking = await Booking.findOne({ bookingId: referenceId });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Find and update payment
    const payment = await Payment.findOneAndUpdate(
      { booking: booking._id, transactionId: booking.bookingId },
      {
        transactionId,
        status: status === 'success' ? 'verified' : 'failed',
        verifiedAt: new Date()
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // Update booking status
    if (status === 'success') {
      booking.paymentStatus = 'paid';
      booking.bookingStatus = 'confirmed';
      await booking.save();
    }

    res.json({ success: true });

  } catch (error) {
    console.error("FonePay callback error:", error);
    res.status(500).json({ success: false, message: "Error processing callback" });
  }
};

// Get all booking requests
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { bookingStatus, message } = req.body;

  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { bookingStatus, message },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking updated successfully", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ message: "Error updating booking", error: error.message });
  }
};




export const getMyBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'user',
        select: 'name email phoneNumber'
      })
      .populate({
        path: 'payment',
        select: 'paymentMethod transactionId screenshot status amount createdAt'
      })
      .lean();

    // Transform data to match frontend expectations
    const transformedBookings = bookings.map(booking => {
      return {
        ...booking,
        bookingId: booking.bookingId, // Ensure bookingId is available
        bookingStatus: booking.bookingStatus || 'pending', // Ensure status exists
        bookingType: booking.type || 'room', // Ensure type exists
        payment: booking.payment || {
          status: 'pending',
          paymentMethod: 'Pay later',
        } // Provide default payment data
      };
    });

    res.status(200).json(transformedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};