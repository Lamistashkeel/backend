const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// @route   GET /api/expenses
// @desc    Get all expenses for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    let query = { user: req.user.id };
    
    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { date, description, category, amount, account } = req.body;
    
    const expense = new Expense({
      user: req.user.id,
      date,
      description,
      category,
      amount,
      account
    });
    
    await expense.save();
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, description, category, amount, account } = req.body;
    
    let expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Make sure user owns expense
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { date, description, category, amount, account },
      { new: true }
    );
    
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Make sure user owns expense
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
