// User Reports management API endpoints
import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, withOrgScope } from '../lib/rbac.js';
import { validateBody, validateQuery, commonSchemas } from '../lib/validation.js';

const router = express.Router();

// Get user reports
router.get('/', requireAuth, withOrgScope, validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { orgId, userId, limit = 50, offset = 0 } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }

    console.log('📊 Fetching user reports:', { orgId, userId, limit, offset });

    const where = { orgId };

    // Apply filters
    if (userId) where.userId = userId;

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            status: true,
            budget: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.report.count({ where });

    console.log(`✅ Found ${reports.length} user reports for orgId: ${orgId}`);

    // Format reports for frontend compatibility
    const formattedReports = reports.map(report => ({
      id: report.id,
      title: report.title,
      description: report.description,
      userName: report.userName,
      image: report.image,
      project: report.project ? {
        id: report.project.id,
        name: report.project.name,
        color: report.project.color,
        status: report.project.status,
        budget: report.project.budget
      } : null,
      user: report.user,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }));

    res.json({
      success: true,
      reports: formattedReports,
      total
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user reports' });
  }
});

// Create a new user report
router.post('/', requireAuth, withOrgScope, async (req, res) => {
  try {
    const { orgId } = req.query;
    const { title, description, userName, image, projectId } = req.body;
    const userId = req.user.id;

    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }

    if (!description || !userName) {
      return res.status(400).json({ error: 'Description and userName are required' });
    }

    console.log('📝 Creating user report:', { orgId, userId, projectId, userName });

    const report = await prisma.report.create({
      data: {
        title,
        description,
        userName,
        image,
        projectId,
        userId,
        orgId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            status: true,
            budget: true
          }
        }
      }
    });

    console.log('✅ Created user report:', report.id);

    // Format report for frontend
    const formattedReport = {
      id: report.id,
      title: report.title,
      description: report.description,
      userName: report.userName,
      image: report.image,
      project: report.project ? {
        id: report.project.id,
        name: report.project.name,
        color: report.project.color,
        status: report.project.status,
        budget: report.project.budget
      } : null,
      user: report.user,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    };

    res.status(201).json({
      success: true,
      report: formattedReport
    });
  } catch (error) {
    console.error('Error creating user report:', error);
    res.status(500).json({ success: false, error: 'Failed to create user report' });
  }
});

// Get a specific user report
router.get('/:id', requireAuth, withOrgScope, async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }

    const report = await prisma.report.findFirst({
      where: {
        id,
        orgId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            status: true,
            budget: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'User report not found' });
    }

    // Format report for frontend
    const formattedReport = {
      id: report.id,
      title: report.title,
      description: report.description,
      userName: report.userName,
      image: report.image,
      project: report.project ? {
        id: report.project.id,
        name: report.project.name,
        color: report.project.color,
        status: report.project.status,
        budget: report.project.budget
      } : null,
      user: report.user,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    };

    res.json({
      success: true,
      report: formattedReport
    });
  } catch (error) {
    console.error('Error fetching user report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user report' });
  }
});

// Delete a user report
router.delete('/:id', requireAuth, withOrgScope, async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId } = req.query;
    const userId = req.user.id;

    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }

    // Check if report exists and belongs to the user/org
    const existingReport = await prisma.report.findFirst({
      where: {
        id,
        orgId,
        userId // Users can only delete their own reports
      }
    });

    if (!existingReport) {
      return res.status(404).json({ success: false, error: 'User report not found or access denied' });
    }

    await prisma.report.delete({
      where: { id }
    });

    console.log('🗑️ Deleted user report:', id);

    res.json({
      success: true,
      message: 'User report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user report:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user report' });
  }
});

export default router;