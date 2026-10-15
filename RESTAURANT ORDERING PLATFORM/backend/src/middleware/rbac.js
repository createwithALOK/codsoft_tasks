/**
 * requireRole factory
 * Returns middleware that checks req.user.role is in the allowed roles array.
 * Returns 403 if the role does not match.
 *
 * @param  {...string} roles - Allowed roles (e.g. 'ADMIN', 'KITCHEN', 'CUSTOMER')
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireRole };
