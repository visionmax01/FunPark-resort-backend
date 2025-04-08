import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateUser = async (req, res, next) => {
  try {
    // Get token from header or cookies
    let token = req.header('Authorization') || req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization token missing' 
      });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trimLeft();
    }

    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request
    req.user = verified.user || verified; // Handle both formats
    next();
    
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token',
      error: err.message 
    });
  }
};






export const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded._id).select('-password');
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expired, please login again',
                expired: true
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};