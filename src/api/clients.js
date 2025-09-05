// Client management API endpoints
import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, withOrgScope, requireResourceOwnership } from '../lib/rbac.js';
import { validateBody, validateQuery, commonSchemas, clientSchemas } from '../lib/validation.js';
const router = express.Router();

// Get all clients for a user/organization
router.get('/', requireAuth, withOrgScope, validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { userId, orgId, limit = 50 } = req.query;
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }
    
    const clients = await prisma.client.findMany({
      where: { orgId },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit)
    });
    
    res.json({ 
      success: true, 
      clients,
      total: clients.length 
    });
    
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Create new client
router.post('/', requireAuth, withOrgScope, validateBody(clientSchemas.create), async (req, res) => {
  try {
    const { orgId, name, email, company, phone, address, hourlyRate, contactPerson, industry, priority, notes } = req.body;
    
    if (!orgId || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields: orgId, name, and email are required' });
    }
    
    const client = await prisma.client.create({
      data: {
        orgId,
        name,
        email,
        company: company || null,
        phone: phone || null,
        address: address || null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        contactPerson: contactPerson || null,
        industry: industry || null,
        priority: priority || 'medium',
        notes: notes || null,
        status: 'active'
      }
    });
    
    console.log(`✅ Created new client: ${name}`);
    
    res.status(201).json({ 
      success: true, 
      client 
    });
    
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.patch('/:id', requireAuth, withOrgScope, requireResourceOwnership('client'), validateBody(clientSchemas.update), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.orgId;
    
    // Handle numeric fields
    if (updates.hourlyRate !== undefined) {
      updates.hourlyRate = updates.hourlyRate ? parseFloat(updates.hourlyRate) : null;
    }
    
    const client = await prisma.client.update({
      where: { id },
      data: updates
    });
    
    console.log(`📝 Updated client ${id}`);
    
    res.json({ 
      success: true, 
      client,
      message: 'Client updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', requireAuth, withOrgScope, requireResourceOwnership('client'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.client.delete({
      where: { id }
    });
    
    console.log(`🗑️ Deleted client ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Client deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;