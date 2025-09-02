// Timer management API endpoints
import express from 'express';
import { timerService } from '../services/TimerService.js';
const router = express.Router();

// Get active timers
router.get('/active', async (req, res) => {
  try {
    const { orgId, userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const activeTimers = await timerService.getActiveTimers(userId, orgId);
    
    // Calculate total active time
    const totalActiveTime = activeTimers.reduce((total, timer) => {
      const elapsed = Math.floor((Date.now() - timer.begin.getTime()) / 1000);
      return total + elapsed;
    }, 0);
    
    res.json({
      timers: activeTimers.map(timer => ({
        id: timer.id,
        taskId: timer.taskId,
        taskTitle: timer.task?.title || 'Untitled Task',
        description: timer.description,
        category: timer.category,
        startTime: timer.begin,
        status: 'running'
      })),
      totalActiveTime: totalActiveTime
    });
  } catch (error) {
    console.error('Error fetching active timers:', error);
    res.status(500).json({ error: 'Failed to fetch active timers' });
  }
});

// Start a new timer
router.post('/', async (req, res) => {
  try {
    const { taskId, description, category, timezone, userId, orgId } = req.body;
    
    if (!userId || !orgId) {
      return res.status(400).json({ error: 'userId and orgId are required' });
    }
    
    const timer = await timerService.startTimer(userId, orgId, {
      taskId,
      description: description || 'Working on task',
      category: category || 'work',
      timezone: timezone || 'UTC'
    });
    
    console.log(`✅ Started timer for task ${taskId}: ${description}`);
    
    res.status(201).json({
      timer: {
        id: timer.id,
        taskId: timer.taskId,
        taskTitle: timer.task?.title || 'Untitled Task',
        description: timer.description,
        category: timer.category,
        startTime: timer.begin,
        status: 'running'
      },
      message: 'Timer started successfully'
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Update timer details (description, category, etc.)
router.put('/:timerId', async (req, res) => {
  try {
    const { timerId } = req.params;
    const { userId } = req.body;
    const updates = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    delete updates.userId; // Remove userId from updates object
    
    const timer = await timerService.updateTimer(timerId, userId, updates);
    
    console.log(`📝 Updated timer ${timerId}`);
    
    res.json({
      timer: {
        id: timer.id,
        taskId: timer.taskId,
        taskTitle: timer.task?.title || 'Untitled Task',
        description: timer.description,
        category: timer.category,
        startTime: timer.begin,
        endTime: timer.end,
        duration: timer.duration,
        status: timer.end ? 'stopped' : 'running'
      },
      message: 'Timer updated successfully'
    });
  } catch (error) {
    console.error('Error updating timer:', error);
    res.status(500).json({ error: 'Failed to update timer' });
  }
});

// Stop timer
router.post('/:timerId/stop', async (req, res) => {
  try {
    const { timerId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const timer = await timerService.stopTimer(timerId, userId);
    
    console.log(`⏹️ Stopped timer ${timerId}`);
    
    res.json({
      timer: {
        id: timer.id,
        taskId: timer.taskId,
        taskTitle: timer.task?.title || 'Untitled Task',
        description: timer.description,
        category: timer.category,
        startTime: timer.begin,
        endTime: timer.end,
        duration: timer.duration,
        status: 'stopped'
      },
      message: 'Timer stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// Restart timer (create new one based on existing)
router.post('/:timerId/restart', async (req, res) => {
  try {
    const { timerId } = req.params;
    const { userId, orgId } = req.body;
    
    if (!userId || !orgId) {
      return res.status(400).json({ error: 'userId and orgId are required' });
    }
    
    const timer = await timerService.restartTimer(timerId, userId, orgId);
    
    console.log(`🔄 Restarted timer ${timerId}`);
    
    res.status(201).json({
      timer: {
        id: timer.id,
        taskId: timer.taskId,
        taskTitle: timer.task?.title || 'Untitled Task',
        description: timer.description,
        category: timer.category,
        startTime: timer.begin,
        status: 'running'
      },
      message: 'Timer restarted successfully'
    });
  } catch (error) {
    console.error('Error restarting timer:', error);
    res.status(500).json({ error: 'Failed to restart timer' });
  }
});

// Get timer statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId, orgId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const stats = await timerService.getTimerStats(userId, orgId);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching timer stats:', error);
    res.status(500).json({ error: 'Failed to fetch timer stats' });
  }
});

// Get recent time entries
router.get('/recent', async (req, res) => {
  try {
    const { userId, orgId, limit = 10 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const entries = await timerService.getRecentEntries(userId, orgId, parseInt(limit));
    
    res.json({
      entries: entries.map(entry => ({
        id: entry.id,
        taskId: entry.taskId,
        taskTitle: entry.task?.title || 'Untitled Task',
        description: entry.description,
        category: entry.category,
        startTime: entry.begin,
        endTime: entry.end,
        duration: entry.duration,
        status: entry.end ? 'stopped' : 'running'
      }))
    });
  } catch (error) {
    console.error('Error fetching recent entries:', error);
    res.status(500).json({ error: 'Failed to fetch recent entries' });
  }
});

// Delete timer
router.delete('/:timerId', async (req, res) => {
  try {
    const { timerId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const result = await timerService.deleteTimer(timerId, userId);
    
    console.log(`🗑️ Deleted timer ${timerId}`);
    
    res.json({
      message: 'Timer deleted successfully',
      deletedTimer: result.deletedTimer
    });
  } catch (error) {
    console.error('Error deleting timer:', error);
    res.status(500).json({ error: 'Failed to delete timer' });
  }
});

export default router;