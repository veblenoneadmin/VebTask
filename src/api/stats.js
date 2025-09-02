// Widget statistics API endpoints
import express from 'express';
const router = express.Router();

// Tasks completed today endpoint
router.get('/tasks-completed-today', async (req, res) => {
  try {
    const { orgId } = req.query;
    
    // Mock data for now - replace with actual database queries
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Simulate database query results
    const todayCount = Math.floor(Math.random() * 15) + 5; // 5-20 tasks
    const yesterdayCount = Math.floor(Math.random() * 15) + 3; // 3-18 tasks
    
    const trendPercentage = yesterdayCount > 0 
      ? ((todayCount - yesterdayCount) / yesterdayCount * 100).toFixed(1)
      : 0;
    
    const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral';
    
    res.json({
      count: todayCount,
      trend: {
        percentage: Math.abs(trendPercentage),
        direction: trendDirection
      }
    });
  } catch (error) {
    console.error('Error fetching tasks completed today:', error);
    res.status(500).json({ error: 'Failed to fetch task statistics' });
  }
});

// Time tracked today endpoint
router.get('/time-today', async (req, res) => {
  try {
    const { orgId, userId } = req.query;
    
    // Mock data - replace with actual time tracking queries
    const todaySeconds = Math.floor(Math.random() * 28800) + 3600; // 1-9 hours in seconds
    const yesterdaySeconds = Math.floor(Math.random() * 25200) + 1800; // 0.5-7.5 hours
    
    const trendPercentage = yesterdaySeconds > 0 
      ? ((todaySeconds - yesterdaySeconds) / yesterdaySeconds * 100).toFixed(1)
      : 0;
    
    const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral';
    
    res.json({
      seconds: todaySeconds,
      trend: {
        percentage: Math.abs(trendPercentage),
        direction: trendDirection
      }
    });
  } catch (error) {
    console.error('Error fetching time today:', error);
    res.status(500).json({ error: 'Failed to fetch time statistics' });
  }
});

// Active projects count endpoint
router.get('/active-projects', async (req, res) => {
  try {
    const { orgId } = req.query;
    
    // Mock data - replace with actual project queries
    const activeCount = Math.floor(Math.random() * 8) + 2; // 2-10 projects
    const dueSoon = Math.floor(Math.random() * 3) + 1; // 1-3 due soon
    
    res.json({
      count: activeCount,
      dueSoon: dueSoon,
      label: `${dueSoon} due this week`
    });
  } catch (error) {
    console.error('Error fetching active projects:', error);
    res.status(500).json({ error: 'Failed to fetch project statistics' });
  }
});

// Team members count endpoint
router.get('/team-members', async (req, res) => {
  try {
    const { orgId } = req.query;
    
    // Mock data - replace with actual member queries
    const memberCount = Math.floor(Math.random() * 12) + 3; // 3-15 members
    const activeToday = Math.floor(memberCount * 0.7); // ~70% active today
    
    res.json({
      count: memberCount,
      activeToday: activeToday,
      label: `${activeToday} active today`
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch member statistics' });
  }
});

// Weekly hours endpoint
router.get('/weekly-hours', async (req, res) => {
  try {
    const { orgId, userId } = req.query;
    
    // Mock data - replace with actual weekly time queries
    const weeklySeconds = Math.floor(Math.random() * 144000) + 36000; // 10-50 hours
    const lastWeekSeconds = Math.floor(Math.random() * 129600) + 28800; // 8-44 hours
    
    const trendPercentage = lastWeekSeconds > 0 
      ? ((weeklySeconds - lastWeekSeconds) / lastWeekSeconds * 100).toFixed(1)
      : 0;
    
    const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral';
    
    res.json({
      seconds: weeklySeconds,
      trend: {
        percentage: Math.abs(trendPercentage),
        direction: trendDirection
      }
    });
  } catch (error) {
    console.error('Error fetching weekly hours:', error);
    res.status(500).json({ error: 'Failed to fetch weekly statistics' });
  }
});

// Productivity score endpoint
router.get('/productivity-score', async (req, res) => {
  try {
    const { orgId, userId } = req.query;
    
    // Mock productivity calculation - replace with actual algorithm
    const score = Math.floor(Math.random() * 30) + 70; // 70-100% score
    const lastWeekScore = Math.floor(Math.random() * 25) + 65; // 65-90% last week
    
    const trendPercentage = ((score - lastWeekScore) / lastWeekScore * 100).toFixed(1);
    const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral';
    
    res.json({
      score: score,
      trend: {
        percentage: Math.abs(trendPercentage),
        direction: trendDirection
      }
    });
  } catch (error) {
    console.error('Error fetching productivity score:', error);
    res.status(500).json({ error: 'Failed to fetch productivity statistics' });
  }
});

// Overdue tasks endpoint
router.get('/overdue-tasks', async (req, res) => {
  try {
    const { orgId } = req.query;
    
    // Mock data - replace with actual overdue task queries
    const overdueCount = Math.floor(Math.random() * 8); // 0-8 overdue tasks
    const priority = overdueCount > 5 ? 'high' : overdueCount > 2 ? 'medium' : 'low';
    
    res.json({
      count: overdueCount,
      priority: priority,
      label: overdueCount === 0 ? 'All caught up!' : `${overdueCount} overdue`
    });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({ error: 'Failed to fetch overdue task statistics' });
  }
});

export default router;