import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../lib/rbac.js';
import { 
  WIZARD_STEPS, 
  hasCompletedWizardStep, 
  markWizardStepCompleted, 
  getNextWizardStep,
  userNeedsOnboarding,
  getOnboardingProgress,
  getCompletedWizardSteps,
  resetWizardProgress
} from '../lib/wizard.js';

const router = express.Router();

// Validation schemas
const markStepSchema = z.object({
  step: z.enum(WIZARD_STEPS)
});

/**
 * GET /api/wizard/status
 * Get current wizard/onboarding status for user
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [needsOnboarding, progress, completedSteps, nextStep] = await Promise.all([
      userNeedsOnboarding(userId),
      getOnboardingProgress(userId),
      getCompletedWizardSteps(userId),
      getNextWizardStep(userId)
    ]);

    res.json({
      success: true,
      data: {
        needsOnboarding,
        progress,
        completedSteps,
        nextStep,
        totalSteps: WIZARD_STEPS.length,
        allSteps: WIZARD_STEPS
      }
    });
  } catch (error) {
    console.error('Get wizard status error:', error);
    res.status(500).json({ 
      error: 'Failed to get wizard status',
      code: 'WIZARD_STATUS_ERROR' 
    });
  }
});

/**
 * POST /api/wizard/complete-step
 * Mark a wizard step as completed
 */
router.post('/complete-step', requireAuth, async (req, res) => {
  try {
    const validation = markStepSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid step name',
        details: validation.error.issues,
        code: 'VALIDATION_ERROR'
      });
    }

    const { step } = validation.data;
    const userId = req.user.id;

    // Check if step is already completed
    const alreadyCompleted = await hasCompletedWizardStep(userId, step);
    if (alreadyCompleted) {
      return res.json({
        success: true,
        message: 'Step already completed',
        data: { step, alreadyCompleted: true }
      });
    }

    // Mark step as completed
    const success = await markWizardStepCompleted(userId, step);
    if (!success) {
      throw new Error('Failed to mark step as completed');
    }

    // Get updated status
    const [progress, nextStep, needsOnboarding] = await Promise.all([
      getOnboardingProgress(userId),
      getNextWizardStep(userId),
      userNeedsOnboarding(userId)
    ]);

    res.json({
      success: true,
      message: 'Wizard step completed successfully',
      data: {
        completedStep: step,
        progress,
        nextStep,
        needsOnboarding,
        onboardingComplete: !needsOnboarding
      }
    });

  } catch (error) {
    console.error('Complete wizard step error:', error);
    res.status(500).json({ 
      error: 'Failed to complete wizard step',
      code: 'WIZARD_COMPLETE_ERROR' 
    });
  }
});

/**
 * GET /api/wizard/step/:step
 * Check if a specific wizard step is completed
 */
router.get('/step/:step', requireAuth, async (req, res) => {
  try {
    const { step } = req.params;
    
    if (!WIZARD_STEPS.includes(step)) {
      return res.status(400).json({
        error: 'Invalid wizard step',
        validSteps: WIZARD_STEPS,
        code: 'INVALID_STEP'
      });
    }

    const userId = req.user.id;
    const completed = await hasCompletedWizardStep(userId, step);

    res.json({
      success: true,
      data: {
        step,
        completed,
        stepIndex: WIZARD_STEPS.indexOf(step),
        totalSteps: WIZARD_STEPS.length
      }
    });
  } catch (error) {
    console.error('Get wizard step error:', error);
    res.status(500).json({ 
      error: 'Failed to get wizard step status',
      code: 'WIZARD_STEP_ERROR' 
    });
  }
});

/**
 * POST /api/wizard/reset
 * Reset wizard progress (for development/testing)
 */
router.post('/reset', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const success = await resetWizardProgress(userId);

    if (!success) {
      throw new Error('Failed to reset wizard progress');
    }

    res.json({
      success: true,
      message: 'Wizard progress reset successfully',
      data: {
        resetUserId: userId,
        allSteps: WIZARD_STEPS
      }
    });
  } catch (error) {
    console.error('Reset wizard error:', error);
    res.status(500).json({ 
      error: 'Failed to reset wizard progress',
      code: 'WIZARD_RESET_ERROR' 
    });
  }
});

export default router;