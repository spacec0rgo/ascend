const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

// --- Validation Helpers ---
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePasswordComplexity = (pwd) => {
  if (!pwd || pwd.length < 12) return false;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[-!"#$%&()*,./:;?@[\\\]^_\`{|}~+<=>]/.test(pwd);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  // 1. Basic Presence Check
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }
  
  // 2. Strict Security Validations
  if (username.trim().length < 4) {
    return res.status(400).json({ error: 'Username must be at least 4 characters' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!validatePasswordComplexity(password)) {
    return res.status(400).json({ error: 'Password does not meet complexity requirements' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username.trim(), email.trim().toLowerCase(), hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    if (err.code === '23505') {
      const field = err.detail.includes('username') ? 'username' : 'email';
      return res.status(409).json({ error: `This ${field} is already taken` });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email: identifier, password } = req.body; 

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1', 
      [identifier.trim().toLowerCase()]
    );
    
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        profile_picture_url: user.profile_picture_url 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;