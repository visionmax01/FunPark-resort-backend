import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: String,
    gender: String,
    dob: Date,
    email: { type: String, unique: true },
    phone: String,
    address: String,
    password: String,
    role: { type: Number, default: 0 }, // 0 for normal user, 1 for admin
    resetPasswordOTP: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

export default mongoose.model('User', UserSchema);
