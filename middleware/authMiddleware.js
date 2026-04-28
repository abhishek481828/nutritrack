const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Extract Bearer token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }

  try {
    // Verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB — token may be valid but user could have been deleted
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    // Covers: JsonWebTokenError, TokenExpiredError, DB errors
    const message =
      error.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Not authorized, invalid token.';

    return res.status(401).json({ success: false, message });
  }
};

module.exports = { protect };
