// Expense management API endpoints
import express from 'express';
import { prisma } from '../lib/prisma.js';
const router = express.Router();

// Get all expenses for a user/organization
router.get('/', async (req, res) => {
  try {
    const { userId, orgId, startDate, endDate, category, limit = 50 } = req.query;
    
    if (!userId && !orgId) {
      return res.status(400).json({ error: 'userId or orgId is required' });
    }
    
    // For now, return empty array since we don't have expense table yet
    const expenses = [];
    
    res.json({ 
      success: true, 
      expenses,
      total: expenses.length,
      totalAmount: 0
    });
    
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const { userId, title, amount, category, date, description, receipt } = req.body;
    
    if (!userId || !title || !amount || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For now, return mock response
    const expense = {
      id: `expense_${Date.now()}`,
      title,
      amount: parseFloat(amount),
      category,
      date: date || new Date().toISOString().split('T')[0],
      description: description || '',
      receipt: receipt || null,
      status: 'pending',
      isReimbursable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({ 
      success: true, 
      expense 
    });
    
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // For now, return mock response
    res.json({ 
      success: true, 
      message: 'Expense updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, return mock response
    res.json({ 
      success: true, 
      message: 'Expense deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get expense statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId, orgId, startDate, endDate } = req.query;
    
    if (!userId && !orgId) {
      return res.status(400).json({ error: 'userId or orgId is required' });
    }
    
    // Mock stats for now
    const stats = {
      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      totalExpenses: 0,
      categories: {},
      monthlyTrend: []
    };
    
    res.json({ 
      success: true, 
      stats 
    });
    
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({ error: 'Failed to fetch expense statistics' });
  }
});

export default router;