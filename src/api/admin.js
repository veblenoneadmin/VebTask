import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, withOrgScope, requireAdmin } from '../lib/rbac.js';
import crypto from 'crypto';

const router = express.Router();

// Validation schemas
const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'STAFF', 'CLIENT'])
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'STAFF', 'CLIENT'])
});

/**
 * GET /api/admin/users
 * List all users in the organization
 */
router.get('/users', requireAuth, withOrgScope, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            orgId: req.orgId
          }
        }
      },
      include: {
        memberships: {
          where: { orgId: req.orgId },
          include: {
            org: {
              select: { name: true, slug: true }
            }
          }
        },
        _count: {
          select: {
            timeLogs: {
              where: { orgId: req.orgId }
            },
            createdTasks: {
              where: { orgId: req.orgId }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      code: 'FETCH_USERS_ERROR' 
    });
  }
});

/**
 * GET /api/admin/invites
 * List all invitations for the organization
 */
router.get('/invites', requireAuth, withOrgScope, requireAdmin, async (req, res) => {
  try {
    const invites = await prisma.invite.findMany({
      where: {
        orgId: req.orgId
      },
      include: {
        invitedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      invites,
      count: invites.length
    });
  } catch (error) {
    console.error('Get admin invites error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invites',
      code: 'FETCH_INVITES_ERROR' 
    });
  }
});

/**
 * POST /api/admin/invite
 * Send invitation to new user
 */
router.post('/invite', requireAuth, withOrgScope, requireAdmin, async (req, res) => {
  try {
    const validation = inviteUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        details: validation.error.errors 
      });
    }

    const { email, role } = validation.data;

    // Check if user already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        memberships: {
          some: { orgId: req.orgId }
        }
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists in this organization',
        code: 'USER_EXISTS'
      });
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email,
        orgId: req.orgId,
        status: 'PENDING'
      }
    });

    if (existingInvite) {
      return res.status(409).json({
        error: 'Invitation already sent to this email',
        code: 'INVITE_EXISTS'
      });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation
    const invite = await prisma.invite.create({
      data: {
        orgId: req.orgId,
        email,
        role,
        token,
        expiresAt,
        invitedById: req.user.id
      },
      include: {
        invitedBy: {
          select: { name: true, email: true }
        }
      }
    });

    // TODO: Send email invitation here
    console.log(`📧 Invitation created for ${email} with token: ${token}`);
    console.log(`🔗 Invite link: ${process.env.BETTER_AUTH_URL}/invite/${token}`);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt,
        invitedBy: invite.invitedBy
      }
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ 
      error: 'Failed to send invitation',
      code: 'SEND_INVITE_ERROR' 
    });
  }
});

/**
 * PATCH /api/admin/users/:userId/role
 * Update user role in the organization
 */
router.patch('/users/:userId/role', requireAuth, withOrgScope, requireAdmin, async (req, res) => {
  try {
    const validation = updateRoleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        details: validation.error.errors 
      });
    }

    const { userId } = req.params;
    const { role } = validation.data;

    // Check if user exists in the organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId: req.orgId
        }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!membership) {
      return res.status(404).json({
        error: 'User not found in this organization',
        code: 'USER_NOT_FOUND'
      });
    }

    // Cannot change owner role
    if (membership.role === 'OWNER') {
      return res.status(403).json({
        error: 'Cannot change owner role',
        code: 'CANNOT_CHANGE_OWNER'
      });
    }

    // Update user role
    const updatedMembership = await prisma.membership.update({
      where: {
        userId_orgId: {
          userId,
          orgId: req.orgId
        }
      },
      data: { role },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      membership: {
        userId: updatedMembership.userId,
        role: updatedMembership.role,
        user: updatedMembership.user
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ 
      error: 'Failed to update user role',
      code: 'UPDATE_ROLE_ERROR' 
    });
  }
});

/**
 * POST /api/admin/invites/:inviteId/revoke
 * Revoke an invitation
 */
router.post('/invites/:inviteId/revoke', requireAuth, withOrgScope, requireAdmin, async (req, res) => {
  try {
    const { inviteId } = req.params;

    // Check if invite exists and belongs to the organization
    const invite = await prisma.invite.findFirst({
      where: {
        id: inviteId,
        orgId: req.orgId
      }
    });

    if (!invite) {
      return res.status(404).json({
        error: 'Invitation not found',
        code: 'INVITE_NOT_FOUND'
      });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Only pending invitations can be revoked',
        code: 'INVALID_INVITE_STATUS'
      });
    }

    // Revoke invitation
    await prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' }
    });

    res.json({
      success: true,
      message: 'Invitation revoked successfully'
    });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    res.status(500).json({ 
      error: 'Failed to revoke invitation',
      code: 'REVOKE_INVITE_ERROR' 
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Remove user from organization (soft delete membership)
 */
router.delete('/users/:userId', requireAuth, withOrgScope, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists in the organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId: req.orgId
        }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!membership) {
      return res.status(404).json({
        error: 'User not found in this organization',
        code: 'USER_NOT_FOUND'
      });
    }

    // Cannot remove owner
    if (membership.role === 'OWNER') {
      return res.status(403).json({
        error: 'Cannot remove organization owner',
        code: 'CANNOT_REMOVE_OWNER'
      });
    }

    // Remove user from organization
    await prisma.membership.delete({
      where: {
        userId_orgId: {
          userId,
          orgId: req.orgId
        }
      }
    });

    res.json({
      success: true,
      message: 'User removed from organization successfully'
    });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ 
      error: 'Failed to remove user',
      code: 'REMOVE_USER_ERROR' 
    });
  }
});

/**
 * GET /api/admin/stats
 * Get organization statistics for admin dashboard
 */
router.get('/stats', requireAuth, withOrgScope, requireAdmin, async (req, res) => {
  try {
    const stats = await prisma.$transaction(async (tx) => {
      const [
        userCount,
        pendingInvites,
        totalTasks,
        totalTimeLogs,
        activeUsers,
        totalRevenue
      ] = await Promise.all([
        // Total users in org
        tx.membership.count({
          where: { orgId: req.orgId }
        }),
        // Pending invites
        tx.invite.count({
          where: { 
            orgId: req.orgId,
            status: 'PENDING'
          }
        }),
        // Total tasks
        tx.macroTask.count({
          where: { orgId: req.orgId }
        }),
        // Total time logs
        tx.timeLog.count({
          where: { orgId: req.orgId }
        }),
        // Active users (users with recent activity)
        tx.timeLog.groupBy({
          by: ['userId'],
          where: {
            orgId: req.orgId,
            begin: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }).then(groups => groups.length),
        // Total revenue from billable time
        tx.timeLog.aggregate({
          where: {
            orgId: req.orgId,
            isBillable: true,
            earnings: { not: null }
          },
          _sum: { earnings: true }
        }).then(result => result._sum.earnings || 0)
      ]);

      return {
        userCount,
        pendingInvites,
        totalTasks,
        totalTimeLogs,
        activeUsers,
        totalRevenue
      };
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      code: 'FETCH_STATS_ERROR' 
    });
  }
});

/**
 * GET /api/admin/system/status
 * Get internal system status and configuration
 */
router.get('/system/status', requireAuth, withOrgScope, requireAdmin, async (req, res) => {
  try {
    const { INTERNAL_CONFIG } = await import('../config/internal.js');
    
    // Get user count
    const userCount = await prisma.user.count();
    
    // Get pending invitations
    const pendingInvitations = await prisma.invitation.count({
      where: { 
        orgId: req.orgId,
        status: { in: ['pending_approval', 'sent'] }
      }
    });

    res.json({
      success: true,
      system: {
        mode: INTERNAL_CONFIG.MODE,
        organization: INTERNAL_CONFIG.ORGANIZATION.name,
        brandingName: INTERNAL_CONFIG.UI.brandingName,
        inviteOnly: INTERNAL_CONFIG.FEATURES.inviteOnly,
        maxUsers: INTERNAL_CONFIG.ADMIN.maxUsers,
        currentUsers: userCount,
        availableSlots: Math.max(0, INTERNAL_CONFIG.ADMIN.maxUsers - userCount),
        pendingInvitations
      }
    });
  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({
      error: 'Failed to fetch system status',
      code: 'FETCH_SYSTEM_STATUS_ERROR'
    });
  }
});

export default router;