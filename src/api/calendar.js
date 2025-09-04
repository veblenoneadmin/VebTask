// Calendar events API endpoints
import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, withOrgScope } from '../lib/rbac.js';
const router = express.Router();

// Get calendar events for a user
router.get('/events/:userId', requireAuth, withOrgScope, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, type, orgId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const where = { userId };
    
    // Add organization filter if provided
    if (orgId) {
      where.orgId = orgId;
    }
    
    // Add date range filter if provided
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    // Add type filter if provided
    if (type) {
      where.type = type;
    }
    
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    // Transform events to match frontend expectations
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      type: event.type,
      taskId: event.taskId,
      color: event.color,
      location: event.location,
      attendees: event.attendees || [],
      isRecurring: event.isRecurring,
      recurringPattern: event.recurringPattern,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    }));
    
    res.json({
      success: true,
      events: transformedEvents
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch calendar events' 
    });
  }
});

// Get calendar overview/stats for a user
router.get('/overview/:userId', requireAuth, withOrgScope, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year, orgId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth(); // JavaScript months are 0-based
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Get start and end of the target month
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    
    const where = {
      userId,
      startTime: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    };
    
    if (orgId) {
      where.orgId = orgId;
    }
    
    // Get events for the month
    const events = await prisma.calendarEvent.findMany({
      where,
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        type: true,
        status: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    // Calculate statistics
    const eventStats = {};
    const dailyStats = [];
    
    // Group events by type
    events.forEach(event => {
      const type = event.type;
      if (!eventStats[type]) {
        eventStats[type] = { count: 0, completed: 0 };
      }
      eventStats[type].count++;
      if (event.status === 'completed') {
        eventStats[type].completed++;
      }
    });
    
    // Generate daily stats for the month
    const daysInMonth = endOfMonth.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, targetMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime).toISOString().split('T')[0];
        return eventDate === dateStr;
      });
      
      const types = [...new Set(dayEvents.map(e => e.type))].join(',');
      
      dailyStats.push({
        date: dateStr,
        eventCount: dayEvents.length,
        types: types
      });
    }
    
    // Get upcoming events (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingEvents = await prisma.calendarEvent.findMany({
      where: {
        userId,
        ...(orgId ? { orgId } : {}),
        startTime: {
          gte: new Date(),
          lte: nextWeek
        },
        status: {
          in: ['scheduled', 'in_progress']
        }
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 10
    });
    
    const transformedUpcoming = upcomingEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      type: event.type,
      taskId: event.taskId,
      color: event.color,
      location: event.location,
      attendees: event.attendees || [],
      isRecurring: event.isRecurring,
      recurringPattern: event.recurringPattern,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    }));
    
    const overview = {
      month: targetMonth + 1, // Convert back to 1-based for frontend
      year: targetYear,
      eventStats,
      dailyStats,
      upcomingEvents: transformedUpcoming,
      totalEvents: events.length
    };
    
    res.json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('Error fetching calendar overview:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch calendar overview' 
    });
  }
});

// Create a new calendar event
router.post('/events', requireAuth, withOrgScope, async (req, res) => {
  try {
    const {
      userId,
      orgId,
      title,
      description,
      startTime,
      endTime,
      type = 'task',
      taskId,
      color = '#6366f1',
      location,
      attendees,
      isRecurring = false,
      recurringPattern
    } = req.body;
    
    if (!userId || !title || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'userId, title, startTime, and endTime are required'
      });
    }
    
    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        orgId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type,
        taskId,
        color,
        location,
        attendees,
        isRecurring,
        recurringPattern,
        status: 'scheduled'
      }
    });
    
    res.json({
      success: true,
      eventId: event.id,
      message: 'Calendar event created successfully'
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create calendar event'
    });
  }
});

// Update a calendar event
router.patch('/events/:eventId', requireAuth, withOrgScope, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { updateRecurring, ...updates } = req.body;
    
    // Handle date fields
    if (updates.startTime) {
      updates.startTime = new Date(updates.startTime);
    }
    if (updates.endTime) {
      updates.endTime = new Date(updates.endTime);
    }
    
    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updates
    });
    
    res.json({
      success: true,
      eventId: event.id,
      message: 'Calendar event updated successfully'
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update calendar event'
    });
  }
});

// Delete a calendar event
router.delete('/events/:eventId', requireAuth, withOrgScope, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { deleteRecurring } = req.query;
    
    await prisma.calendarEvent.delete({
      where: { id: eventId }
    });
    
    res.json({
      success: true,
      eventId: eventId,
      message: 'Calendar event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete calendar event'
    });
  }
});

export default router;