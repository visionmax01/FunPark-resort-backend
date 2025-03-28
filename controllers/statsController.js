// controllers/statsController.js
import User from '../models/User.js';
import Booking from '../models/Booking.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Get total users with role 0
    const totalUsers = await User.countDocuments({ role: 0 });
    
    // Get booking statistics - using your exact enum values
    const [totalPendingBookings, totalConfirmedBookings] = await Promise.all([
      Booking.countDocuments({ bookingStatus: 'pending' }),
      Booking.countDocuments({ bookingStatus: 'confirmed' })
    ]);
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPendingBookings,
        totalConfirmedBookings,
        totalBookings: totalPendingBookings + totalConfirmedBookings // Optional: show total
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};