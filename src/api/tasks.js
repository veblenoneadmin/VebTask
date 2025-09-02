// Task management API endpoints
import express from 'express';
const router = express.Router();

// Get recent tasks
router.get('/recent', async (req, res) => {
  try {
    const { orgId, limit = 10 } = req.query;
    
    // Mock recent tasks data - replace with actual database queries
    const mockTasks = [
      {
        id: 'task-1',
        title: 'Complete User Authentication Module',
        projectName: 'VebTask Platform',
        status: 'in_progress',
        priority: 'High',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
        lastWorked: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        totalTime: 4 * 3600 + 30 * 60 // 4.5 hours in seconds
      },
      {
        id: 'task-2',
        title: 'Design Dashboard Widgets System',
        projectName: 'Client Portal Redesign',
        status: 'completed',
        priority: 'Medium',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Was due yesterday
        lastWorked: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        totalTime: 6 * 3600 + 15 * 60 // 6.25 hours in seconds
      },
      {
        id: 'task-3',
        title: 'Client Meeting Preparation',
        projectName: 'E-commerce Platform',
        status: 'not_started',
        priority: 'Urgent',
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // Due in 4 hours
        lastWorked: null,
        totalTime: 0
      },
      {
        id: 'task-4',
        title: 'Database Schema Optimization',
        projectName: 'VebTask Platform',
        status: 'on_hold',
        priority: 'Low',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 1 week
        lastWorked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        totalTime: 2 * 3600 + 45 * 60 // 2.75 hours in seconds
      },
      {
        id: 'task-5',
        title: 'API Documentation Update',
        projectName: 'Developer Tools',
        status: 'in_progress',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
        lastWorked: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        totalTime: 3 * 3600 + 20 * 60 // 3.33 hours in seconds
      },
      {
        id: 'task-6',
        title: 'Mobile App UI Testing',
        projectName: 'Mobile Development',
        status: 'completed',
        priority: 'High',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Was due 2 days ago
        lastWorked: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        totalTime: 5 * 3600 + 10 * 60 // 5.17 hours in seconds
      }
    ];
    
    // Sort by last worked date (most recent first)
    const sortedTasks = mockTasks
      .sort((a, b) => {
        const aTime = a.lastWorked ? (a.lastWorked instanceof Date ? a.lastWorked.getTime() : new Date(a.lastWorked).getTime()) : 0;
        const bTime = b.lastWorked ? (b.lastWorked instanceof Date ? b.lastWorked.getTime() : new Date(b.lastWorked).getTime()) : 0;
        return bTime - aTime;
      })
      .slice(0, parseInt(limit));
    
    res.json({
      tasks: sortedTasks,
      total: mockTasks.length
    });
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
    res.status(500).json({ error: 'Failed to fetch recent tasks' });
  }
});

// Get task details
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Mock task details - replace with actual database query
    const mockTask = {
      id: taskId,
      title: 'Complete User Authentication Module',
      description: 'Implement secure user authentication with email verification, password reset, and social login options.',
      projectName: 'VebTask Platform',
      status: 'in_progress',
      priority: 'High',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lastWorked: new Date(Date.now() - 30 * 60 * 1000),
      totalTime: 4 * 3600 + 30 * 60,
      assignedTo: 'current-user',
      tags: ['authentication', 'security', 'backend']
    };
    
    res.json(mockTask);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ error: 'Failed to fetch task details' });
  }
});

// Update task status
router.patch('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    console.log(`📝 Updated task ${taskId} status to: ${status}`);
    
    res.json({
      message: 'Task status updated successfully',
      taskId: taskId,
      status: status
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

export default router;