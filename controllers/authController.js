import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import otpGenerator from 'otp-generator';
import { sendOTPEmail, sendPasswordChangeEmail, sendPasswordChangedNotification } from '../utils/mailer.js';

import crypto from 'crypto';


export const register = async (req, res) => {
    try {
        const { name, email, password, gender, dob, phone, address } = req.body;
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ error: 'Email already registered!' });
        }

        // Hash the password before saving to the DB
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            name,
            email,
            password: hashedPassword,
            gender,
            dob,
            phone,
            address,
            role: 0 // Default role as normal user
        });
        
        await user.save();
        
        res.status(201).send({ message: 'Registration successful!', user });
    } catch (error) {
        res.status(400).send({ error: 'Error during registration', details: error });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).send({ error: 'Invalid email or password' });
        }

        // Compare the password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).send({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { _id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // Return user data (excluding password) and token
        const userObject = user.toObject();
        delete userObject.password;

        res.send({ 
            user: userObject, 
            token,
            message: 'Login successful' 
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send({ error: 'Internal server error' });
    }
};

export const getUserData = async (req, res) => {
    try {
        const user = req.user;
        const userObject = user.toObject();
        delete userObject.password;
        
        res.send({ user: userObject });
    } catch (error) {
        res.status(500).send({ error: 'Error fetching user data' });
    }
};



export const updateUserData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, phone, address } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, email, phone, address },
            { new: true }
        );

        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating profile" });
    }
};






// reset process  

export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Email does not exist, OTP not sent!'
            });
        }

        // Generate 6-digit OTP
        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false
        });

        // Set OTP and expiration (5 minutes)
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 300000; // 5 minutes

        await user.save();

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.status(200).json({
            success: true,
            message: 'OTP sent Successfully',
            email: email // Return email for frontend to use in next step
        });

    } catch (error) {
        console.error('Error in requestPasswordReset:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending OTP',
            error: error.message
        });
    }
};


export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user with matching email and unexpired OTP
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.resetPasswordOTP = undefined; // Clear OTP after verification

        await user.save();

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            resetToken,
            userId: user._id
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            error: error.message
        });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const { userId, resetToken, newPassword } = req.body;

        // Find user with valid reset token
        const user = await User.findOne({
            _id: userId,
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });

    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};





export const requestPasswordChangeOTP = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false
    });

    // Save OTP with expiration (5 minutes)
    user.passwordChangeOTP = otp;
    user.passwordChangeOTPExpires = Date.now() + 300000; // 5 minutes
    await user.save();

    // Send OTP email
    await sendPasswordChangeEmail(user.email, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Error requesting password change OTP:', error);
    res.status(500).json({ message: 'Error requesting OTP' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;
    const userId = req.user.id;

    const user = await User.findOne({
      _id: userId,
      passwordChangeOTP: otp,
      passwordChangeOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Verify current password again for security
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear OTP fields
    user.passwordChangeOTP = undefined;
    user.passwordChangeOTPExpires = undefined;
    await user.save();

    // Send confirmation email
    await sendPasswordChangedNotification(user.email);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};