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
    
    if (!userId && !orgId) {
      return res.status(400).json({ error: 'userId or orgId is required' });
    }
    
    // For now, return empty array since we don't have project table yet
    // This will be implemented when project schema is added
    const projects = [];
    
    res.json({ 
      success: true, 
      projects,
      total: projects.length 
    });
    
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create new project
router.post('/', requireAuth, withOrgScope, validateBody(projectSchemas.create), async (req, res) => {
  try {
    const { userId, name, description, clientName, budget, deadline, priority } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For now, return mock response
    const project = {
      id: `proj_${Date.now()}`,
      name,
      description: description || '',
      clientName: clientName || '',
      budget: budget ? parseFloat(budget) : 0,
      deadline: deadline || null,
      priority: priority || 'medium',
      status: 'active',
      progress: 0,
      hoursSpent: 0,
      hoursEstimated: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({ 
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
    
    // For now, return mock response
    res.json({ 
      success: true, 
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
    
    // For now, return mock response
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
    
    if (!userId && !orgId) {
      return res.status(400).json({ error: 'userId or orgId is required' });
    }
    
    // Mock stats for now
    const stats = {
      total: 0,
      active: 0,
      completed: 0,
      overdue: 0,
      totalBudget: 0,
      totalHours: 0
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