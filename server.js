import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import { verifyToken } from './middleware/authMiddleware.js';
dotenv.config();

const app = express();

// Configure CORS to allow requests from Netlify frontend
app.use(cors({
  origin: ['https://hotelresort.bhishansah.com.np', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', authRoutes);
app.use('/bookApi', bookingRoutes);
app.use('/contactApi', contactRoutes);
app.use('/status', statsRoutes);
app.use('/api/protected-route', verifyToken);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


export default app;
