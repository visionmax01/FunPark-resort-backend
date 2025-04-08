import express from 'express';
import { register, login, getUserData, logout, updateUserData, requestPasswordReset, verifyOTP, resetPassword, changePassword, requestPasswordChangeOTP } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', auth, getUserData);
router.put('/update', auth, updateUserData);
router.post('/forgot-password', requestPasswordReset);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.put('/change-password', auth, changePassword);
router.post('/request-password-change-otp', auth, requestPasswordChangeOTP);
router.post('/logout', logout);
export default router;
