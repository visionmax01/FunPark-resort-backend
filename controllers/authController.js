import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

        // Log the email to ensure it's being sent correctly
        console.log("Received email:", email);

        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            // Log the failure of finding the user
            console.log("No user found with this email:", email);
            return res.status(401).send({ error: 'Invalid email or password' });
        }

        // Log the password hash to ensure it's being properly stored
        console.log("Stored password hash:", user.password);

        // Compare the password with the stored hash
        const isMatch =  bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Log the password mismatch
            console.log("Password mismatch for email:", email);
            return res.status(401).send({ error: 'Invalid email or password' });
        }

        // If password is correct, generate a JWT token
        const token = jwt.sign({ _id: user._id, role: user.role }, 'secretkey', { expiresIn: '1h' });

        // Log successful login
        console.log("Login successful for email:", email);

        // Return user and token
        res.send({ user, token });
    } catch (error) {
        // Log any unexpected errors
        console.error("Error during login:", error);
        res.status(500).send({ error: 'Something went wrong during login', details: error });
    }
};




export const getUserData = async (req, res) => {
    try {
        // Get the token from the authorization header
        const token = req.header('Authorization').replace('Bearer ', '');

        // Log the token to check if it's being received properly
        console.log("Received Token:", token);

        // Verify the token
        const decoded = jwt.verify(token, 'secretkey'); // Ensure this matches your JWT secret
        console.log("Decoded Token:", decoded);  // Log decoded token

        // Find the user using the decoded ID
        const user = await User.findOne({ _id: decoded._id });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        // Return the user's data (e.g., name and email)
        res.send({ name: user.name, email: user.email });
    } catch (error) {
        // Log error to understand why it's failing
        console.error("Error fetching user data:", error);
        res.status(400).send({ error: 'Failed to fetch user data' });
    }
};

