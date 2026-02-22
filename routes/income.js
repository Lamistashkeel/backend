const express = require('express');
const router = express.Router();
const Income = require('../models/Income');
const auth = require('../middleware/auth');

// @route   GET /api/income
// @desc    Get all income sources for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const income = await Income.find({ user: req.user.id });
    res.json(income);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/income
// @desc    Create a new income source
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { source, amount } = req.body;
    
    const income = new Income({
      user: req.user.id,
      source,
      amount
    });
    
    await income.save();
    res.json(income);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/income/:id
// @desc    Update an income source
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { source, amount } = req.body;
    
    let income = await Income.findById(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: 'Income source not found' });
    }
    
    if (income.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    income = await Income.findByIdAndUpdate(
      req.params.id,
      { source, amount },
      { new: true }
    );
    
    res.json(income);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/income/:id
// @desc    Delete an income source
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: 'Income source not found' });
    }
    
    if (income.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await income.deleteOne();
    res.json({ message: 'Income source removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
