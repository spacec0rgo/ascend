const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/users/profile_pics/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueID = crypto.randomUUID();
    cb(null, uniqueID + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

const deleteFile = (relativePath) => {
  if (!relativePath) return;
  const fullPath = path.join(__dirname, '../../', relativePath);
  fs.unlink(fullPath, (err) => {
    if (err) console.error(`Cleanup failed for: ${fullPath}`, err.message);
    else console.log(`Deleted file: ${fullPath}`);
  });
};

router.get('/check-availability', authMiddleware, async (req, res) => {
  const { type, value } = req.query;
  if (type !== 'username') {
    return res.status(400).json({ error: 'Only username availability is supported' });
  }
  try {
    const result = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [value, req.user.id]);
    res.json({ available: result.rows.length === 0 });
  } catch (err) { 
    res.status(500).json({ error: 'Server error' }); }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, profile_picture_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/profile', authMiddleware, async (req, res) => {
  const { username, email, password, currentPassword } = req.body;
  try {
    if (username) {
      if (username.trim().length < 4) return res.status(400).json({ error: 'Username must be at least 4 characters' });
      const check_username = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, req.user.id]);
      if (check_username.rows.length > 0) return res.status(400).json({ error: 'Username taken' });
      await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, req.user.id]);
    }
    
    if (email) {
      if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
      const check_email = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (check_email.rows.length > 0) return res.status(400).json({ error: 'Email already in use' });
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, req.user.id]);
    }

    if (password) {
      if (!validatePasswordComplexity(password)) {
        return res.status(400).json({ error: 'New password does not meet complexity requirements' });
      }
      const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const valid = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: 'Incorrect current password' });

      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(password, salt);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/profile-picture', authMiddleware, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const oldPicQuery = await pool.query('SELECT profile_picture_url FROM users WHERE id = $1', [req.user.id]);
    const oldPath = oldPicQuery.rows[0]?.profile_picture_url;

    const url = `/uploads/users/profile_pics/${req.file.filename}`;
    await pool.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [url, req.user.id]);
    if (oldPath) deleteFile(oldPath);
    
    res.json({ profile_picture_url: url });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.delete('/profile-picture', authMiddleware, async (req, res) => {
  try {
    const userRes = await pool.query('SELECT profile_picture_url FROM users WHERE id = $1', [req.user.id]);
    const currentPath = userRes.rows[0]?.profile_picture_url;

    if (currentPath) deleteFile(currentPath);

    await pool.query('UPDATE users SET profile_picture_url = NULL WHERE id = $1', [req.user.id]);
    res.json({ message: 'Profile picture removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;