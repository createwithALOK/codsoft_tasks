const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * authenticate middleware
 * Extracts Bearer token from Authorization header, verifies it with JWT_SECRET,
 * attaches decoded payload as req.user, and calls next().
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
