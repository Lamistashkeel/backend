const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Category = require('../models/Category');
const Income = require('../models/Income');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    user = new User({ name, email, password });
    await user.save();

    // Create default categories for new user
    const defaultCategories = [
      { user: user._id, name: 'Housing', budget: 1500, color: '#3b82f6' },
      { user: user._id, name: 'Transportation', budget: 400, color: '#10b981' },
      { user: user._id, name: 'Groceries', budget: 600, color: '#f59e0b' },
      { user: user._id, name: 'Dining Out', budget: 300, color: '#ef4444' },
      { user: user._id, name: 'Entertainment', budget: 200, color: '#8b5cf6' },
      { user: user._id, name: 'Healthcare', budget: 250, color: '#ec4899' },
      { user: user._id, name: 'Shopping', budget: 300, color: '#14b8a6' },
      { user: user._id, name: 'Savings', budget: 1000, color: '#06b6d4' },
      { user: user._id, name: 'Utilities', budget: 200, color: '#f97316' },
      { user: user._id, name: 'Other', budget: 150, color: '#6366f1' }
    ];
    await Category.insertMany(defaultCategories);

    // Create default income sources
    const defaultIncome = [
      { user: user._id, source: 'Primary Salary', amount: 5000 },
      { user: user._id, source: 'Side Income', amount: 0 }
    ];
    await Income.insertMany(defaultIncome);

    // Create JWT token
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '30d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '30d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

