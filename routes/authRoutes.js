import express from 'express';
import { register, login, getUserData } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);



// Define the route to get logged-in user data
router.get('/user', getUserData);

export default router;
