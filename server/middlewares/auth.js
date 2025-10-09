import jwt from 'jsonwebtoken';

const userAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    const parts = authHeader.split(' ');
    if (parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;
    req.user = decoded;

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err.message);
    res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

export default userAuth;
