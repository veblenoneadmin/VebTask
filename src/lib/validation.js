import { z } from 'zod';

/**
 * Middleware factory to validate request body using Zod schemas
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: validation.error.errors
      });
    }
    req.validatedData = validation.data;
    next();
  };
}

/**
 * Middleware factory to validate query parameters using Zod schemas
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const validation = schema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: validation.error.errors
      });
    }
    req.validatedQuery = validation.data;
    next();
  };
}

/**
 * Middleware factory to validate URL parameters using Zod schemas
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const validation = schema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid URL parameters',
        code: 'VALIDATION_ERROR',
        details: validation.error.errors
      });
    }
    req.validatedParams = validation.data;
    next();
  };
}

// Common validation schemas
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid(),
  
  // MongoDB ObjectId validation (24 character hex string)
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  
  // Organization ID validation (flexible for both UUID and ObjectId)
  orgId: z.string().min(1).max(50),
  
  // User ID validation
  userId: z.string().min(1).max(50),
  
  // Pagination parameters
  pagination: z.object({
    limit: z.string().optional().transform((val) => {
      const num = parseInt(val);
      return isNaN(num) ? 50 : Math.min(Math.max(num, 1), 100);
    }),
    offset: z.string().optional().transform((val) => {
      const num = parseInt(val);
      return isNaN(num) ? 0 : Math.max(num, 0);
    })
  }),
  
  // Date range parameters
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }).refine((data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, {
    message: "Start date must be before or equal to end date"
  })
};

// Task-specific schemas
export const taskSchemas = {
  create: z.object({
    title: z.string().min(1).max(200).trim(),
    description: z.string().max(2000).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
    dueDate: z.string().datetime().optional(),
    assigneeId: z.string().optional(),
    projectId: z.string().optional(),
    estimatedHours: z.number().min(0).max(1000).optional(),
    tags: z.array(z.string().max(50)).max(10).optional()
  }),
  
  update: z.object({
    title: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(2000).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    dueDate: z.string().datetime().optional(),
    assigneeId: z.string().optional(),
    projectId: z.string().optional(),
    estimatedHours: z.number().min(0).max(1000).optional(),
    tags: z.array(z.string().max(50)).max(10).optional()
  }),
  
  statusUpdate: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  })
};

// Timer-specific schemas
export const timerSchemas = {
  create: z.object({
    taskId: z.string().optional(),
    projectId: z.string().optional(),
    description: z.string().max(500).optional(),
    startTime: z.string().datetime().optional()
  }),
  
  update: z.object({
    description: z.string().max(500).optional(),
    endTime: z.string().datetime().optional()
  })
};

// Project-specific schemas
export const projectSchemas = {
  create: z.object({
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(2000).optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('ACTIVE'),
    clientId: z.string().optional(),
    budget: z.number().min(0).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }),
  
  update: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).optional(),
    clientId: z.string().optional(),
    budget: z.number().min(0).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  })
};

// Client-specific schemas
export const clientSchemas = {
  create: z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    company: z.string().max(100).optional(),
    address: z.string().max(500).optional()
  }),
  
  update: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    company: z.string().max(100).optional(),
    address: z.string().max(500).optional()
  })
};

// Expense-specific schemas
export const expenseSchemas = {
  create: z.object({
    amount: z.number().min(0.01).max(999999.99),
    currency: z.string().length(3).default('USD'),
    description: z.string().min(1).max(200).trim(),
    category: z.string().max(50).optional(),
    date: z.string().datetime().optional(),
    projectId: z.string().optional(),
    receiptUrl: z.string().url().optional()
  }),
  
  update: z.object({
    amount: z.number().min(0.01).max(999999.99).optional(),
    currency: z.string().length(3).optional(),
    description: z.string().min(1).max(200).trim().optional(),
    category: z.string().max(50).optional(),
    date: z.string().datetime().optional(),
    projectId: z.string().optional(),
    receiptUrl: z.string().url().optional()
  })
};

// Invoice-specific schemas
export const invoiceSchemas = {
  create: z.object({
    clientId: z.string().min(1),
    amount: z.number().min(0.01).max(999999.99),
    currency: z.string().length(3).default('USD'),
    description: z.string().min(1).max(200).trim(),
    dueDate: z.string().datetime().optional(),
    projectId: z.string().optional(),
    items: z.array(z.object({
      description: z.string().min(1).max(200),
      quantity: z.number().min(0.01),
      unitPrice: z.number().min(0.01)
    })).optional()
  }),
  
  statusUpdate: z.object({
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
  })
};