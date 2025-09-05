import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/rbac.js';

const router = express.Router();

/**
 * GET /api/reports/financial
 * Get financial report data (revenue, expenses, profit) for different periods
 */
router.get('/financial', requireAuth, async (req, res) => {
  try {
    const { orgId = 'default', period = 'month', limit = '12' } = req.query;
    const limitNum = Math.min(24, Math.max(1, parseInt(limit)));

    // Calculate date ranges based on period
    const now = new Date();
    const periods = [];
    
    for (let i = 0; i < limitNum; i++) {
      const periodStart = new Date(now);
      const periodEnd = new Date(now);
      
      switch (period) {
        case 'week':
          periodStart.setDate(now.getDate() - (i * 7 + 7));
          periodEnd.setDate(now.getDate() - (i * 7));
          break;
        case 'quarter':
          periodStart.setMonth(now.getMonth() - (i * 3 + 3));
          periodEnd.setMonth(now.getMonth() - (i * 3));
          break;
        case 'year':
          periodStart.setFullYear(now.getFullYear() - (i + 1));
          periodEnd.setFullYear(now.getFullYear() - i);
          break;
        case 'month':
        default:
          periodStart.setMonth(now.getMonth() - (i + 1));
          periodEnd.setMonth(now.getMonth() - i);
          break;
      }
      
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(0); // Last day of month
      periodEnd.setHours(23, 59, 59, 999);
      
      periods.push({ start: periodStart, end: periodEnd });
    }

    const reportData = [];

    for (const { start, end } of periods) {
      // Get hours tracked (only real data we have)
      const hoursStats = await prisma.timeLog.aggregate({
        where: {
          orgId: orgId,
          begin: {
            gte: start,
            lte: end
          },
          end: { not: null }
        },
        _sum: {
          duration: true
        }
      });

      // Mock data for features not yet implemented
      const invoiceStats = { _sum: { total: 0 }, _count: 0 };
      const expenseStats = { _sum: { amount: 0 } };
      const projectsCompleted = 0;
      const activeClients = [];

      const revenue = invoiceStats._sum.total || 0;
      const expenses = expenseStats._sum.amount || 0;
      const profit = revenue - expenses;
      const hoursTracked = Math.round((hoursStats._sum.duration || 0) / 3600); // Convert to hours
      const averageHourlyRate = hoursTracked > 0 ? Math.round(revenue / hoursTracked) : 0;

      reportData.push({
        period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        revenue,
        expenses,
        profit,
        hoursTracked,
        projectsCompleted,
        clientsActive: activeClients.length,
        invoicesSent: invoiceStats._count,
        averageHourlyRate
      });
    }

    res.json({
      success: true,
      data: reportData.reverse() // Most recent first
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch financial report',
      data: []
    });
  }
});

/**
 * GET /api/reports/projects
 * Get project performance metrics
 */
router.get('/projects', requireAuth, async (req, res) => {
  try {
    const { orgId = 'default', limit = '10' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Mock project data since projects table doesn't exist yet
    const projectPerformance = [
      {
        name: "Demo Project A",
        completion: 75,
        budget: 5000,
        spent: 3750,
        status: 'on-track',
        hoursTracked: 38,
        estimatedHours: 50
      },
      {
        name: "Demo Project B", 
        completion: 40,
        budget: 8000,
        spent: 4800,
        status: 'behind-schedule',
        hoursTracked: 48,
        estimatedHours: 80
      }
    ];

    res.json({
      success: true,
      data: projectPerformance
    });
  } catch (error) {
    console.error('Project performance report error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch project performance',
      data: []
    });
  }
});

/**
 * GET /api/reports/clients
 * Get client metrics and performance
 */
router.get('/clients', requireAuth, async (req, res) => {
  try {
    const { orgId = 'default', limit = '10' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Get the last 12 months for client analysis
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Mock client data since clients table doesn't exist yet  
    const clientMetrics = [
      {
        name: "Demo Client A",
        revenue: 12500,
        hours: 125,
        projects: 3,
        satisfaction: 4.8
      },
      {
        name: "Demo Client B",
        revenue: 8750,
        hours: 87,
        projects: 2,
        satisfaction: 4.2
      },
      {
        name: "Demo Client C",
        revenue: 15600,
        hours: 156,
        projects: 4,
        satisfaction: 4.9
      }
    ];

    res.json({
      success: true,
      data: clientMetrics
    });
  } catch (error) {
    console.error('Client metrics report error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch client metrics',
      data: []
    });
  }
});

/**
 * GET /api/reports/summary
 * Get high-level summary metrics for dashboard
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { orgId = 'default' } = req.query;
    
    // Get current month data
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Get last month for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Current month stats - only get real data for time logs
    const [currentHours, lastHours] = await Promise.all([
      prisma.timeLog.aggregate({
        where: { orgId, begin: { gte: monthStart, lte: monthEnd }, end: { not: null }},
        _sum: { duration: true }
      }),
      prisma.timeLog.aggregate({
        where: { orgId, begin: { gte: lastMonthStart, lte: lastMonthEnd }, end: { not: null }},
        _sum: { duration: true }
      })
    ]);

    // Mock data for features not implemented yet
    const currentRevenue = { _sum: { total: 0 } };
    const currentExpenses = { _sum: { amount: 0 } };
    const currentProjects = 0;
    const lastRevenue = { _sum: { total: 0 } };
    const lastExpenses = { _sum: { amount: 0 } };
    const lastProjects = 0;

    const currentRevenueValue = currentRevenue._sum.total || 0;
    const currentExpenseValue = currentExpenses._sum.amount || 0;
    const currentHoursValue = Math.round((currentHours._sum.duration || 0) / 3600);
    const lastRevenueValue = lastRevenue._sum.total || 0;
    const lastExpenseValue = lastExpenses._sum.amount || 0;
    const lastHoursValue = Math.round((lastHours._sum.duration || 0) / 3600);

    // Calculate trends
    const revenueTrend = lastRevenueValue > 0 ? 
      Math.round(((currentRevenueValue - lastRevenueValue) / lastRevenueValue) * 100) : 0;
    const expenseTrend = lastExpenseValue > 0 ?
      Math.round(((currentExpenseValue - lastExpenseValue) / lastExpenseValue) * 100) : 0;
    const hoursTrend = lastHoursValue > 0 ?
      Math.round(((currentHoursValue - lastHoursValue) / lastHoursValue) * 100) : 0;

    res.json({
      success: true,
      summary: {
        revenue: {
          current: currentRevenueValue,
          trend: revenueTrend,
          direction: revenueTrend >= 0 ? 'up' : 'down'
        },
        expenses: {
          current: currentExpenseValue,
          trend: Math.abs(expenseTrend),
          direction: expenseTrend >= 0 ? 'up' : 'down'
        },
        profit: {
          current: currentRevenueValue - currentExpenseValue,
          trend: revenueTrend - expenseTrend,
          direction: (currentRevenueValue - currentExpenseValue) >= (lastRevenueValue - lastExpenseValue) ? 'up' : 'down'
        },
        hours: {
          current: currentHoursValue,
          trend: Math.abs(hoursTrend),
          direction: hoursTrend >= 0 ? 'up' : 'down'
        },
        activeProjects: currentProjects,
        completedLastMonth: lastProjects
      }
    });
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch summary report',
      summary: {}
    });
  }
});

export default router;