import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, 'secretkey');
        req.user = decoded; // Store user ID in request for future use
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate' });
    }
};

export default auth;
