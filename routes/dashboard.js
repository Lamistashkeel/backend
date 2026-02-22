const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const Income = require('../models/Income');
const auth = require('../middleware/auth');

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary (monthly stats)
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();
    
    // Get date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    // Get all data
    const [expenses, categories, income] = await Promise.all([
      Expense.find({
        user: req.user.id,
        date: { $gte: startDate, $lte: endDate }
      }),
      Category.find({ user: req.user.id }),
      Income.find({ user: req.user.id })
    ]);
    
    // Calculate totals
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
    
    // Calculate spending by category
    const categorySpending = {};
    categories.forEach(cat => {
      categorySpending[cat.name] = {
        budget: cat.budget,
        spent: 0,
        color: cat.color
      };
    });
    
    expenses.forEach(exp => {
      if (categorySpending[exp.category]) {
        categorySpending[exp.category].spent += exp.amount;
      }
    });
    
    // Calculate variance
    const variance = Object.entries(categorySpending).map(([name, data]) => ({
      category: name,
      budget: data.budget,
      actual: data.spent,
      remaining: data.budget - data.spent,
      percentage: (data.spent / data.budget) * 100,
      color: data.color
    }));
    
    res.json({
      totalIncome,
      totalExpenses,
      totalBudget,
      remaining: totalIncome - totalExpenses,
      categorySpending,
      variance,
      averageDailySpend: totalExpenses / new Date().getDate(),
      expenseCount: expenses.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;