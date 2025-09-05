import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '../lib/auth-client';
import { useApiClient } from '../lib/api-client';

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
  const apiClient = useApiClient();
  const [activeTimer, setActiveTimer] = useState<TimerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Use ref to track the interval so it persists across renders
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Clear the interval when component unmounts or timer stops
  const clearInterval = useCallback(() => {
    if (timerInterval.current) {
      clearTimeout(timerInterval.current);
      timerInterval.current = null;
    }
  }, []);

  // Update elapsed time every second for active timer
  const updateElapsedTime = useCallback(() => {
    if (activeTimer && startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
      setElapsedTime(elapsed);
    }
  }, [activeTimer]);

  // Start the timer interval
  const startTimerInterval = useCallback(() => {
    clearInterval(); // Clear any existing interval
    updateElapsedTime(); // Update immediately
    timerInterval.current = setInterval(updateElapsedTime, 1000);
  }, [clearInterval, updateElapsedTime]);

  // Fetch active timer from API
  const fetchActiveTimer = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await apiClient.fetch(`/api/timers/active?userId=${session.user.id}`);
      
      if (data.timers && data.timers.length > 0) {
        const timer = data.timers[0]; // Get the first active timer
        setActiveTimer(timer);
        startTimeRef.current = new Date(timer.startTime);
        startTimerInterval();
      } else {
        setActiveTimer(null);
        startTimeRef.current = null;
        clearInterval();
        setElapsedTime(0);
      }
    } catch (err: any) {
      console.error('Error fetching active timer:', err);
      setError(err.message);
      setActiveTimer(null);
      clearInterval();
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, apiClient, startTimerInterval, clearInterval]);

  // Start a new timer
  const startTimer = useCallback(async (taskId: string, description?: string, category: string = 'work') => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const data = await apiClient.fetch('/api/timers', {
        method: 'POST',
        body: JSON.stringify({
          userId: session.user.id,
          orgId: session.user.orgId,
          taskId,
          description,
          category,
          timezone
        })
      });

      if (data.timer) {
        setActiveTimer(data.timer);
        startTimeRef.current = new Date(data.timer.startTime);
        setElapsedTime(0);
        startTimerInterval();
        return data.timer;
      }
    } catch (err: any) {
      console.error('Error starting timer:', err);
      setError(err.message);
      throw err;
    }
  }, [session?.user?.id, session?.user?.orgId, apiClient, startTimerInterval]);

  // Stop the active timer
  const stopTimer = useCallback(async () => {
    if (!activeTimer || !session?.user?.id) {
      throw new Error('No active timer to stop');
    }

    try {
      setError(null);
      const data = await apiClient.fetch(`/api/timers/${activeTimer.id}/stop`, {
        method: 'POST',
        body: JSON.stringify({
          userId: session.user.id
        })
      });

      if (data.timer) {
        setActiveTimer(null);
        startTimeRef.current = null;
        clearInterval();
        setElapsedTime(0);
        return data.timer;
      }
    } catch (err: any) {
      console.error('Error stopping timer:', err);
      setError(err.message);
      throw err;
    }
  }, [activeTimer, session?.user?.id, apiClient, clearInterval]);

  // Update timer description or category
  const updateTimer = useCallback(async (updates: { description?: string; category?: string; taskId?: string }) => {
    if (!activeTimer || !session?.user?.id) {
      throw new Error('No active timer to update');
    }

    try {
      setError(null);
      const data = await apiClient.fetch(`/api/timers/${activeTimer.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: session.user.id,
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
  }, [activeTimer, session?.user?.id, apiClient]);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Auto-fetch active timer when session changes or on mount
  useEffect(() => {
    fetchActiveTimer();
    
    // Set up periodic refresh to sync with server (every 30 seconds)
    const syncInterval = setInterval(fetchActiveTimer, 30000);
    
    return () => {
      clearInterval(syncInterval);
      clearInterval();
    };
  }, [fetchActiveTimer]);

  // Handle page visibility change to sync timer when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeTimer) {
        // Refresh timer when tab becomes visible
        fetchActiveTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTimer, fetchActiveTimer]);

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
    refreshTimer: fetchActiveTimer,
    clearError: () => setError(null),
    isRunning: !!activeTimer
  };
}