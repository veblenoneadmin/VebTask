import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '../lib/auth-client';
import { useApiClient } from '../lib/api-client';
import { useOrganization } from '../contexts/OrganizationContext';

export interface TimerSession {
  id: string;
  taskId: string;
  taskTitle: string;
  description: string;
  category: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'running' | 'stopped';
}

export function useTimer() {
  const { data: session } = useSession();
  const { currentOrg } = useOrganization();
  const apiClient = useApiClient();
  const [activeTimer, setActiveTimer] = useState<TimerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0); // Track total paused time

  // Use ref to track the interval so it persists across renders
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const pauseStartRef = useRef<Date | null>(null);

  // Clear the interval when component unmounts or timer stops
  const clearTimerInterval = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, []);

  // Update elapsed time every second for active timer
  const updateElapsedTime = useCallback(() => {
    if (startTimeRef.current && !isPaused) {
      const now = Date.now();
      const totalElapsed = Math.floor((now - startTimeRef.current.getTime()) / 1000);
      const activeElapsed = totalElapsed - pausedTime;
      setElapsedTime(Math.max(0, activeElapsed));
    }
  }, [isPaused, pausedTime]);

  // Start the timer interval
  const startTimerInterval = useCallback(() => {
    clearTimerInterval(); // Clear any existing interval
    updateElapsedTime(); // Update immediately
    timerInterval.current = setInterval(updateElapsedTime, 1000);
  }, [clearTimerInterval, updateElapsedTime]);

  // Fetch active timer from API
  const fetchActiveTimer = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      // EMERGENCY FIX: Use hardcoded orgId if currentOrg is not available
      const orgId = currentOrg?.id || 'org_1757046595553';
      console.log('🔧 Fetching active timer with orgId:', orgId, 'from:', currentOrg?.id ? 'currentOrg' : 'hardcoded fallback');

      const data = await apiClient.fetch(`/api/timer/active?userId=${session.user.id}&orgId=${orgId}&limit=100`);
      
      if (data.timers && data.timers.length > 0) {
        const timer = data.timers[0]; // Get the first active timer
        
        // Only update if timer has actually changed to prevent unnecessary re-renders
        setActiveTimer(prev => {
          if (!prev || prev.id !== timer.id || prev.startTime !== timer.startTime) {
            startTimeRef.current = new Date(timer.startTime);
            startTimerInterval();
            return timer;
          }
          return prev;
        });
      } else {
        setActiveTimer(prev => {
          if (prev !== null) {
            startTimeRef.current = null;
            clearTimerInterval();
            setElapsedTime(0);
            return null;
          }
          return prev;
        });
      }
    } catch (err: any) {
      console.error('Error fetching active timer:', err);
      setError(err.message);
      setActiveTimer(null);
      clearTimerInterval();
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, currentOrg?.id, startTimerInterval, clearTimerInterval]);

  // Start a new timer
  const startTimer = useCallback(async (taskId: string, description?: string, category: string = 'work') => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      // Start timer immediately in UI - don't wait for API response
      const now = new Date();
      startTimeRef.current = now;
      setElapsedTime(0);
      setIsPaused(false);
      setPausedTime(0);
      pauseStartRef.current = null;
      startTimerInterval();

      // Create temporary timer object for immediate UI update
      const tempTimer = {
        id: 'temp-' + Date.now(),
        taskId,
        taskTitle: 'Starting...',
        description: description || '',
        category,
        startTime: now.toISOString(),
        status: 'running' as const
      };
      setActiveTimer(tempTimer);

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // EMERGENCY FIX: Use hardcoded orgId if currentOrg is not available
      const orgId = currentOrg?.id || 'org_1757046595553';
      console.log('🔧 Starting timer with orgId:', orgId, 'from:', currentOrg?.id ? 'currentOrg' : 'hardcoded fallback');

      const data = await apiClient.fetch('/api/timer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          orgId,
          taskId,
          description,
          category,
          timezone
        })
      });

      if (data.timer) {
        // Update with real timer data from server
        setActiveTimer(data.timer);
        return data.timer;
      }
    } catch (err: any) {
      console.error('Error starting timer:', err);
      setError(err.message);
      throw err;
    }
  }, [session?.user?.id, currentOrg?.id, startTimerInterval]);

  // Stop the active timer
  const stopTimer = useCallback(async () => {
    if (!activeTimer || !session?.user?.id) {
      throw new Error('No active timer to stop');
    }

    try {
      setError(null);
      // EMERGENCY FIX: Use hardcoded orgId if currentOrg is not available
      const orgId = currentOrg?.id || 'org_1757046595553';

      const data = await apiClient.fetch(`/api/timer/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          orgId
        })
      });

      if (data.timer) {
        setActiveTimer(null);
        startTimeRef.current = null;
        setIsPaused(false);
        setPausedTime(0);
        pauseStartRef.current = null;
        clearTimerInterval();
        setElapsedTime(0);
        return data.timer;
      }
    } catch (err: any) {
      console.error('Error stopping timer:', err);
      setError(err.message);
      throw err;
    }
  }, [activeTimer, session?.user?.id, currentOrg?.id, clearTimerInterval]);

  // Update timer description or category
  const updateTimer = useCallback(async (updates: { description?: string; category?: string; taskId?: string }) => {
    if (!activeTimer || !session?.user?.id) {
      throw new Error('No active timer to update');
    }

    try {
      setError(null);
      // EMERGENCY FIX: Use hardcoded orgId if currentOrg is not available
      const orgId = currentOrg?.id || 'org_1757046595553';

      const data = await apiClient.fetch(`/api/timer/update/${activeTimer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          orgId,
          ...updates
        })
      });

      if (data.timer) {
        setActiveTimer(data.timer);
        return data.timer;
      }
    } catch (err: any) {
      console.error('Error updating timer:', err);
      setError(err.message);
      throw err;
    }
  }, [activeTimer, session?.user?.id, currentOrg?.id]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (!activeTimer || isPaused) return;

    setIsPaused(true);
    pauseStartRef.current = new Date();
  }, [activeTimer, isPaused]);

  // Resume the timer
  const resumeTimer = useCallback(() => {
    if (!activeTimer || !isPaused || !pauseStartRef.current) return;

    // Add the paused duration to total paused time
    const pauseDuration = Math.floor((Date.now() - pauseStartRef.current.getTime()) / 1000);
    setPausedTime(prev => prev + pauseDuration);

    setIsPaused(false);
    pauseStartRef.current = null;
  }, [activeTimer, isPaused]);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Auto-fetch active timer when session changes or on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchActiveTimer();
    }
  }, [session?.user?.id]);

  // Set up periodic refresh (separate effect to avoid re-creating interval)
  useEffect(() => {
    if (!session?.user?.id || !activeTimer) {
      return; // Don't sync if no user or no active timer
    }
    
    const syncInterval = setInterval(() => {
      fetchActiveTimer();
    }, 60000); // Reduced to 1 minute to reduce blinking
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [session?.user?.id, activeTimer?.id]); // Only sync when there's an active timer

  // Handle page visibility change to sync timer when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeTimer && session?.user?.id) {
        // Refresh timer when tab becomes visible, but only if we have an active timer
        fetchActiveTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTimer?.id, session?.user?.id]); // Stable dependencies

  // Handle beforeunload to warn user about active timer
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeTimer) {
        e.preventDefault();
        e.returnValue = 'You have an active timer running. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTimer]);

  return {
    activeTimer,
    loading,
    error,
    elapsedTime,
    formattedElapsedTime: formatElapsedTime(elapsedTime),
    startTimer,
    stopTimer,
    updateTimer,
    pauseTimer,
    resumeTimer,
    refreshTimer: fetchActiveTimer,
    clearError: () => setError(null),
    isRunning: !!activeTimer,
    isPaused
  };
}