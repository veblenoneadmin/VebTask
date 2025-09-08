// Project management API endpoints
import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, withOrgScope, requireResourceOwnership } from '../lib/rbac.js';
import { validateBody, validateQuery, commonSchemas, projectSchemas } from '../lib/validation.js';
const router = express.Router();

// Get all projects for a user/organization
router.get('/', requireAuth, withOrgScope, validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { userId, orgId, status, limit = 50 } = req.query;
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }
    
    const where = { orgId };
    if (status) where.status = status;
    
    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit)
    });
    
    res.json({ 
      success: true, 
      projects,
      total: projects.length 
    });
    
  } catch (error) {
    console.error('Error fetching projects:', {
      error: error.message,
      code: error.code,
      userId: req.user?.id,
      orgId: req.query.orgId,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Handle specific error types
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Duplicate project constraint violation' });
    } else if (error.code?.startsWith('P')) {
      res.status(400).json({ error: 'Database constraint error', details: error.message });
    } else if (error.message.includes('connect')) {
      res.status(503).json({ error: 'Database connection error', code: 'DB_CONNECTION_ERROR' });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch projects',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
});

// Create new project
router.post('/', requireAuth, withOrgScope, validateBody(projectSchemas.create), async (req, res) => {
  try {
    const { orgId, name, description, clientId, budget, estimatedHours, startDate, endDate, priority } = req.body;
    
    if (!orgId || !name) {
      return res.status(400).json({ error: 'Missing required fields: orgId and name are required' });
    }
    
    const project = await prisma.project.create({
      data: {
        orgId,
        name,
        description: description || null,
        clientId: clientId || null,
        budget: budget ? parseFloat(budget) : null,
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority || 'medium',
        status: 'planning'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`✅ Created new project: ${name}`);
    
    res.status(201).json({ 
      success: true, 
      project 
    });
    
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.patch('/:id', requireAuth, withOrgScope, requireResourceOwnership('project'), validateBody(projectSchemas.update), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.orgId;
    
    // Handle numeric fields
    if (updates.budget !== undefined) {
      updates.budget = updates.budget ? parseFloat(updates.budget) : null;
    }
    if (updates.estimatedHours !== undefined) {
      updates.estimatedHours = updates.estimatedHours ? parseInt(updates.estimatedHours) : 0;
    }
    if (updates.hoursLogged !== undefined) {
      updates.hoursLogged = updates.hoursLogged ? parseInt(updates.hoursLogged) : 0;
    }
    if (updates.progress !== undefined) {
      updates.progress = updates.progress ? parseInt(updates.progress) : 0;
    }
    if (updates.spent !== undefined) {
      updates.spent = updates.spent ? parseFloat(updates.spent) : 0;
    }
    
    // Handle date fields
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }
    
    const project = await prisma.project.update({
      where: { id },
      data: updates,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`📝 Updated project ${id}`);
    
    res.json({ 
      success: true, 
      project,
      message: 'Project updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', requireAuth, withOrgScope, requireResourceOwnership('project'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.project.delete({
      where: { id }
    });
    
    console.log(`🗑️ Deleted project ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Project deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get project statistics
router.get('/stats', requireAuth, withOrgScope, validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { userId, orgId } = req.query;
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }
    
    const projects = await prisma.project.findMany({
      where: { orgId },
      select: {
        status: true,
        budget: true,
        spent: true,
        hoursLogged: true,
        estimatedHours: true,
        endDate: true
      }
    });
    
    const now = new Date();
    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      overdue: projects.filter(p => p.endDate && new Date(p.endDate) < now && p.status !== 'completed').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      totalSpent: projects.reduce((sum, p) => sum + (p.spent || 0), 0),
      totalHours: projects.reduce((sum, p) => sum + (p.hoursLogged || 0), 0),
      totalEstimatedHours: projects.reduce((sum, p) => sum + (p.estimatedHours || 0), 0)
    };
    
    res.json({ 
      success: true, 
      stats 
    });
    
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Failed to fetch project statistics' });
  }
});

export default router;