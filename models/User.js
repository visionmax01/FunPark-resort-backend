import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: String,
    gender: String,
    dob: Date,
    email: { type: String, unique: true },
    phone: String,
    address: String,
    password: String,
    role: { type: Number, default: 0 } // 0 for normal user, 1 for admin
});

UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

export default mongoose.model('User', UserSchema);
