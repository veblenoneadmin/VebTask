const { prisma } = require('../../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// Start a new timer session
async function startTimer(req, res) {
  try {
    const { taskId, description, category = 'work' } = req.body;
    const userId = req.user.id;
    const orgId = req.user.orgId;

    // Check if user has any active timers and stop them
    const activeTimer = await prisma.timeLog.findFirst({
      where: {
        userId,
        orgId,
        end: null // Active timer has no end time
      }
    });

    if (activeTimer) {
      // Stop the active timer
      const now = new Date();
      const duration = Math.floor((now - activeTimer.begin) / 1000); // Duration in seconds
      
      await prisma.timeLog.update({
        where: { id: activeTimer.id },
        data: {
          end: now,
          duration
        }
      });
    }

    // Start new timer
    const newTimer = await prisma.timeLog.create({
      data: {
        userId,
        orgId,
        taskId,
        description,
        category,
        begin: new Date(),
        timezone: req.body.timezone || 'UTC'
      },
      include: {
        task: true,
        user: true
      }
    });

    res.json({
      success: true,
      timer: newTimer
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start timer'
    });
  }
}

// Stop the active timer
async function stopTimer(req, res) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId;

    const activeTimer = await prisma.timeLog.findFirst({
      where: {
        userId,
        orgId,
        end: null
      }
    });

    if (!activeTimer) {
      return res.status(404).json({
        success: false,
        error: 'No active timer found'
      });
    }

    const now = new Date();
    const duration = Math.floor((now - activeTimer.begin) / 1000);

    const stoppedTimer = await prisma.timeLog.update({
      where: { id: activeTimer.id },
      data: {
        end: now,
        duration
      },
      include: {
        task: true,
        user: true
      }
    });

    res.json({
      success: true,
      timer: stoppedTimer
    });
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop timer'
    });
  }
}

// Get current active timer
async function getActiveTimer(req, res) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId;

    const activeTimer = await prisma.timeLog.findFirst({
      where: {
        userId,
        orgId,
        end: null
      },
      include: {
        task: true,
        user: true
      }
    });

    if (!activeTimer) {
      return res.json({
        success: true,
        timer: null
      });
    }

    // Calculate current duration
    const now = new Date();
    const currentDuration = Math.floor((now - activeTimer.begin) / 1000);

    res.json({
      success: true,
      timer: {
        ...activeTimer,
        currentDuration
      }
    });
  } catch (error) {
    console.error('Error getting active timer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active timer'
    });
  }
}

// Get timer history
async function getTimerHistory(req, res) {
  try {
    const userId = req.user.id;
    const orgId = req.user.orgId;
    const { page = 1, limit = 50, taskId } = req.query;

    const where = {
      userId,
      orgId,
      end: { not: null } // Only completed timers
    };

    if (taskId) {
      where.taskId = taskId;
    }

    const timers = await prisma.timeLog.findMany({
      where,
      include: {
        task: true
      },
      orderBy: {
        begin: 'desc'
      },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.timeLog.count({ where });

    res.json({
      success: true,
      timers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting timer history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get timer history'
    });
  }
}

// Update timer description or task
async function updateTimer(req, res) {
  try {
    const { timerId } = req.params;
    const { description, taskId } = req.body;
    const userId = req.user.id;
    const orgId = req.user.orgId;

    // Verify timer belongs to user and org
    const timer = await prisma.timeLog.findFirst({
      where: {
        id: timerId,
        userId,
        orgId
      }
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        error: 'Timer not found'
      });
    }

    const updatedTimer = await prisma.timeLog.update({
      where: { id: timerId },
      data: {
        description,
        taskId
      },
      include: {
        task: true,
        user: true
      }
    });

    res.json({
      success: true,
      timer: updatedTimer
    });
  } catch (error) {
    console.error('Error updating timer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update timer'
    });
  }
}

module.exports = {
  startTimer: [requireAuth, startTimer],
  stopTimer: [requireAuth, stopTimer],
  getActiveTimer: [requireAuth, getActiveTimer],
  getTimerHistory: [requireAuth, getTimerHistory],
  updateTimer: [requireAuth, updateTimer]
};