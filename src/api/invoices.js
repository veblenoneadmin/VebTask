// Invoice management API endpoints
import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, withOrgScope, requireResourceOwnership } from '../lib/rbac.js';
import { validateBody, validateQuery, commonSchemas, invoiceSchemas } from '../lib/validation.js';
import { checkDatabaseConnection, handleDatabaseError } from '../lib/api-error-handler.js';
const router = express.Router();

// Get all invoices for a user
router.get('/', requireAuth, withOrgScope, validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { userId, orgId, status, limit = 50 } = req.query;
    
    if (!orgId) {
      return res.status(400).json({ error: 'orgId is required' });
    }
    
    // Check database connection first
    if (!(await checkDatabaseConnection(res))) {
      return; // Response already sent by checkDatabaseConnection
    }
  
  const where = { orgId };
  if (status) where.status = status;
  
  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true
        }
      }
    },
    orderBy: [
      { createdAt: 'desc' },
      { number: 'desc' }
    ],
    take: parseInt(limit)
  });
  
    res.json({ 
      success: true, 
      invoices,
      total: invoices.length 
    });
    
  } catch (error) {
    return handleDatabaseError(error, res, 'fetch invoices');
  }
});

// Create new invoice
router.post('/', requireAuth, withOrgScope, validateBody(invoiceSchemas.create), async (req, res) => {
  try {
    const { orgId, clientId, clientName, amount, taxAmount, description, dueDate } = req.body;
    
    if (!orgId || !clientName || !amount) {
      return res.status(400).json({ error: 'Missing required fields: orgId, clientName, and amount are required' });
    }
    
    // Check database connection first
    if (!(await checkDatabaseConnection(res))) {
      return; // Response already sent by checkDatabaseConnection
    }
    
    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({ where: { orgId } });
    const number = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;
    
    const totalAmount = parseFloat(amount) + (taxAmount ? parseFloat(taxAmount) : 0);
    
    const invoice = await prisma.invoice.create({
      data: {
        orgId,
        clientId: clientId || null,
        number,
        clientName,
        description: description || null,
        amount: parseFloat(amount),
        taxAmount: taxAmount ? parseFloat(taxAmount) : 0,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        }
      }
    });
    
    console.log(`✅ Created new invoice: ${number}`);
    
    res.status(201).json({ 
      success: true, 
      invoice 
    });
    
  } catch (error) {
    return handleDatabaseError(error, res, 'create invoice');
  }
});

// Update invoice status
router.patch('/:id/status', requireAuth, withOrgScope, requireResourceOwnership('invoice'), validateBody(invoiceSchemas.statusUpdate), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check database connection first
    if (!(await checkDatabaseConnection(res))) {
      return; // Response already sent by checkDatabaseConnection
    }
    
    const updateData = { status };
    
    // Set timestamps based on status
    if (status === 'sent' && !updateData.issuedAt) {
      updateData.issuedAt = new Date();
    } else if (status === 'paid') {
      updateData.paidAt = new Date();
    }
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        }
      }
    });
    
    console.log(`📝 Updated invoice ${id} status to: ${status}`);
    
    res.json({ 
      success: true, 
      invoice,
      message: 'Invoice status updated successfully' 
    });
    
  } catch (error) {
    return handleDatabaseError(error, res, 'update invoice status');
  }
});

// Delete invoice
router.delete('/:id', requireAuth, withOrgScope, requireResourceOwnership('invoice'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check database connection first
    if (!(await checkDatabaseConnection(res))) {
      return; // Response already sent by checkDatabaseConnection
    }
    
    await prisma.invoice.delete({
      where: { id }
    });
    
    console.log(`🗑️ Deleted invoice ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Invoice deleted successfully' 
    });
    
  } catch (error) {
    return handleDatabaseError(error, res, 'delete invoice');
  }
});

export default router;