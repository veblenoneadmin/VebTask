// Task management API endpoints
import express from 'express';
import { prisma } from '../lib/prisma.js';
const router = express.Router();

// Get recent tasks
router.get('/recent', async (req, res) => {
  try {
    const { orgId, userId, limit = 10 } = req.query;
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }
    
    const tasks = await prisma.macroTask.findMany({
      where: {
        orgId: orgId,
        ...(userId ? { userId: userId } : {})
      },
      include: {
        timeLogs: {
          select: {
            begin: true,
            end: true,
            duration: true
          },
          orderBy: {
            begin: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            timeLogs: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit)
    });
    
    // Calculate total time and last worked for each task
    const tasksWithStats = await Promise.all(tasks.map(async (task) => {
      // Get total time worked on this task
      const timeStats = await prisma.timeLog.aggregate({
        where: {
          taskId: task.id,
          end: { not: null } // Only completed time entries
        },
        _sum: {
          duration: true
        }
      });
      
      const totalTime = timeStats._sum.duration || 0;
      const lastWorked = task.timeLogs.length > 0 ? task.timeLogs[0].begin : null;
      
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate,
        lastWorked: lastWorked,
        totalTime: totalTime,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        completedAt: task.completedAt
      };
    }));
    
    res.json({
      tasks: tasksWithStats,
      total: tasksWithStats.length
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
    
    const task = await prisma.macroTask.findUnique({
      where: { id: taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        org: {
          select: {
            id: true,
            name: true
          }
        },
        timeLogs: {
          select: {
            id: true,
            begin: true,
            end: true,
            duration: true,
            description: true,
            category: true
          },
          orderBy: {
            begin: 'desc'
          }
        }
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Calculate total time worked
    const totalTime = task.timeLogs
      .filter(log => log.end !== null)
      .reduce((sum, log) => sum + log.duration, 0);
    
    // Get last worked time
    const lastWorked = task.timeLogs.length > 0 ? task.timeLogs[0].begin : null;
    
    const taskDetails = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      lastWorked: lastWorked,
      totalTime: totalTime,
      assignedTo: task.user,
      organization: task.org,
      tags: task.tags,
      timeLogs: task.timeLogs
    };
    
    res.json(taskDetails);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ error: 'Failed to fetch task details' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      userId, 
      orgId, 
      priority = 'Medium', 
      estimatedHours = 0, 
      category = 'General',
      dueDate,
      tags
    } = req.body;
    
    if (!title || !userId || !orgId) {
      return res.status(400).json({ error: 'title, userId, and orgId are required' });
    }
    
    const task = await prisma.macroTask.create({
      data: {
        title,
        description,
        userId,
        orgId,
        createdBy: userId,
        priority,
        estimatedHours: parseFloat(estimatedHours),
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`✅ Created new task: ${title}`);
    
    res.status(201).json({
      task: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.createdBy;
    
    // Handle date fields
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }
    if (updates.completedAt) {
      updates.completedAt = new Date(updates.completedAt);
    }
    
    // Handle numeric fields
    if (updates.estimatedHours) {
      updates.estimatedHours = parseFloat(updates.estimatedHours);
    }
    if (updates.actualHours) {
      updates.actualHours = parseFloat(updates.actualHours);
    }
    
    const task = await prisma.macroTask.update({
      where: { id: taskId },
      data: updates,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`📝 Updated task ${taskId}`);
    
    res.json({
      task: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task status
router.patch('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    
    const updateData = { status };
    
    // If marking as completed, set completedAt timestamp
    if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status !== 'completed') {
      // If changing from completed to something else, clear completedAt
      updateData.completedAt = null;
    }
    
    const task = await prisma.macroTask.update({
      where: { id: taskId },
      data: updateData
    });
    
    console.log(`📝 Updated task ${taskId} status to: ${status}`);
    
    res.json({
      message: 'Task status updated successfully',
      taskId: taskId,
      status: status,
      completedAt: task.completedAt
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Delete task
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    await prisma.macroTask.delete({
      where: { id: taskId }
    });
    
    console.log(`🗑️ Deleted task ${taskId}`);
    
    res.json({
      message: 'Task deleted successfully',
      taskId: taskId
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get tasks by organization
router.get('/org/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { status, priority, userId, limit = 50, offset = 0 } = req.query;
    
    const where = { orgId };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (userId) where.userId = userId;
    
    const tasks = await prisma.macroTask.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            timeLogs: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const total = await prisma.macroTask.count({ where });
    
    res.json({
      tasks,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching organization tasks:', error);
    res.status(500).json({ error: 'Failed to fetch organization tasks' });
  }
});

export default router;