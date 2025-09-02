// Timer management API endpoints
import express from 'express';
const router = express.Router();

// Get active timers
router.get('/active', async (req, res) => {
  try {
    const { orgId, userId } = req.query;
    
    // Mock active timers data - replace with actual database queries
    const mockTimers = [
      {
        id: 'timer-1',
        taskTitle: 'Website Redesign - Header Component',
        projectName: 'Client Portal Redesign',
        startTime: new Date(Date.now() - 45 * 60 * 1000), // Started 45 minutes ago
        duration: 45 * 60, // 45 minutes in seconds
        status: 'running'
      },
      {
        id: 'timer-2',
        taskTitle: 'Code Review - Authentication Module',
        projectName: 'VebTask Platform',
        startTime: new Date(Date.now() - 120 * 60 * 1000), // Started 2 hours ago
        duration: 30 * 60, // 30 minutes actual work (was paused)
        status: 'paused'
      }
    ];
    
    // Filter to show only a few active timers for demo
    const activeTimers = Math.random() > 0.3 ? mockTimers : [mockTimers[0]];
    const totalActiveTime = activeTimers
      .filter(t => t.status === 'running')
      .reduce((total, timer) => total + timer.duration, 0);
    
    res.json({
      timers: activeTimers,
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
    const { taskId, description } = req.body;
    
    // Mock timer creation - replace with actual database insert
    const newTimer = {
      id: `timer-${Date.now()}`,
      taskId: taskId,
      description: description || 'Working on task',
      startTime: new Date(),
      status: 'running'
    };
    
    console.log(`✅ Started timer for task ${taskId}: ${description}`);
    
    res.status(201).json({
      timer: newTimer,
      message: 'Timer started successfully'
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Pause/Resume timer
router.post('/:timerId/pause', async (req, res) => {
  try {
    const { timerId } = req.params;
    
    // Mock pause/resume logic - replace with actual database update
    console.log(`⏸️ Paused/Resumed timer ${timerId}`);
    
    res.json({
      message: 'Timer status updated',
      timerId: timerId,
      status: 'paused' // or 'running' for resume
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
    
    // Mock stop logic - replace with actual database update
    console.log(`⏹️ Stopped timer ${timerId}`);
    
    res.json({
      message: 'Timer stopped successfully',
      timerId: timerId,
      status: 'stopped'
    });
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

export default router;