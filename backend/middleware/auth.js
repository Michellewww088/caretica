const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'caretica-secret-key-change-in-production';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function generateToken(user) {
  const SECRET = process.env.JWT_SECRET || 'caretica-secret-key-change-in-production';
  return jwt.sign(
    { id: user.id, email: user.email, is_premium: user.is_premium, subscription_status: user.subscription_status },
    SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authMiddleware, generateToken };
