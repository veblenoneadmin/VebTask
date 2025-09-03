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
      // Get revenue from invoices
      const invoiceStats = await prisma.invoice.aggregate({
        where: {
          orgId: orgId,
          status: 'PAID',
          paidAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          total: true
        },
        _count: true
      });

      // Get expenses
      const expenseStats = await prisma.expense.aggregate({
        where: {
          orgId: orgId,
          date: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          amount: true
        }
      });

      // Get hours tracked
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

      // Get completed projects
      const projectsCompleted = await prisma.project.count({
        where: {
          orgId: orgId,
          status: 'COMPLETED',
          updatedAt: {
            gte: start,
            lte: end
          }
        }
      });

      // Get active clients (clients with time logged)
      const activeClients = await prisma.timeLog.findMany({
        where: {
          orgId: orgId,
          begin: {
            gte: start,
            lte: end
          }
        },
        select: { clientId: true },
        distinct: ['clientId']
      });

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

    const projects = await prisma.project.findMany({
      where: {
        orgId: orgId
      },
      include: {
        _count: {
          select: {
            tasks: true,
            timeLogs: true
          }
        },
        tasks: {
          where: {
            status: 'COMPLETED'
          },
          select: { id: true }
        },
        timeLogs: {
          select: {
            duration: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limitNum
    });

    const projectPerformance = projects.map(project => {
      const totalTasks = project._count.tasks;
      const completedTasks = project.tasks.length;
      const completion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const totalHours = project.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / 3600;
      const estimatedHours = project.estimatedHours || totalHours || 1;
      
      let status = 'on-track';
      if (project.status === 'COMPLETED') {
        status = 'completed';
      } else if (totalHours > estimatedHours * 1.2) {
        status = 'over-budget';
      } else if (completion < 30 && totalHours > estimatedHours * 0.8) {
        status = 'behind-schedule';
      }

      return {
        name: project.name,
        completion,
        budget: project.budget || 0,
        spent: Math.round(totalHours * (project.hourlyRate || 100)),
        status,
        hoursTracked: Math.round(totalHours),
        estimatedHours: Math.round(estimatedHours)
      };
    });

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

    const clients = await prisma.client.findMany({
      where: {
        orgId: orgId
      },
      include: {
        invoices: {
          where: {
            status: 'PAID',
            paidAt: {
              gte: oneYearAgo
            }
          }
        },
        projects: {
          where: {
            createdAt: {
              gte: oneYearAgo
            }
          }
        },
        timeLogs: {
          where: {
            begin: {
              gte: oneYearAgo
            },
            end: { not: null }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limitNum
    });

    const clientMetrics = clients.map(client => {
      const revenue = client.invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      const hours = Math.round(client.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / 3600);
      const projects = client.projects.length;
      
      // Simple satisfaction score based on project completion and payment history
      let satisfaction = 4.5; // Default good score
      if (client.invoices.length > 0) {
        const paidOnTime = client.invoices.filter(inv => inv.status === 'PAID').length;
        satisfaction = Math.min(5.0, 3.0 + (paidOnTime / client.invoices.length) * 2);
      }

      return {
        name: client.name,
        revenue,
        hours,
        projects,
        satisfaction: Math.round(satisfaction * 10) / 10 // Round to 1 decimal
      };
    });

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

    // Current month stats
    const [
      currentRevenue,
      currentExpenses,
      currentHours,
      currentProjects,
      lastRevenue,
      lastExpenses,
      lastHours,
      lastProjects
    ] = await Promise.all([
      // Current month
      prisma.invoice.aggregate({
        where: { orgId, status: 'PAID', paidAt: { gte: monthStart, lte: monthEnd }},
        _sum: { total: true }
      }),
      prisma.expense.aggregate({
        where: { orgId, date: { gte: monthStart, lte: monthEnd }},
        _sum: { amount: true }
      }),
      prisma.timeLog.aggregate({
        where: { orgId, begin: { gte: monthStart, lte: monthEnd }, end: { not: null }},
        _sum: { duration: true }
      }),
      prisma.project.count({
        where: { orgId, status: 'ACTIVE' }
      }),
      
      // Last month  
      prisma.invoice.aggregate({
        where: { orgId, status: 'PAID', paidAt: { gte: lastMonthStart, lte: lastMonthEnd }},
        _sum: { total: true }
      }),
      prisma.expense.aggregate({
        where: { orgId, date: { gte: lastMonthStart, lte: lastMonthEnd }},
        _sum: { amount: true }
      }),
      prisma.timeLog.aggregate({
        where: { orgId, begin: { gte: lastMonthStart, lte: lastMonthEnd }, end: { not: null }},
        _sum: { duration: true }
      }),
      prisma.project.count({
        where: { orgId, status: 'COMPLETED', updatedAt: { gte: lastMonthStart, lte: lastMonthEnd }}
      })
    ]);

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