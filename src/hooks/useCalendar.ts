import { useState, useEffect, useCallback } from 'react';
import { useSession } from '../lib/auth-client';
import { useApiClient } from '../lib/api-client';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'task' | 'break' | 'personal';
  taskId?: string;
  color: string;
  location?: string;
  attendees?: string[];
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
}

export interface CalendarOverview {
  month: number;
  year: number;
  eventStats: Record<string, { count: number; completed: number }>;
  dailyStats: Array<{ date: string; eventCount: number; types: string }>;
  upcomingEvents: CalendarEvent[];
  totalEvents: number;
}

export function useCalendar() {
  const { data: session } = useSession();
  const apiClient = useApiClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [overview, setOverview] = useState<CalendarOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get events for a date range
  const fetchEvents = useCallback(async (startDate?: string, endDate?: string, type?: string) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (type) params.append('type', type);

      const data = await apiClient.fetch(`/api/calendar/events/${session.user.id}?${params}`);

      if (data.success) {
        setEvents(data.events);
      } else {
        throw new Error(data.error || 'Failed to fetch events');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Fetch events error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, apiClient]);

  // Get calendar overview/stats
  const fetchOverview = useCallback(async (month?: number, year?: number) => {
    if (!session?.user?.id) return;

    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());

      const data = await apiClient.fetch(`/api/calendar/overview/${session.user.id}?${params}`);

      if (data.success) {
        setOverview(data.overview);
      } else {
        throw new Error(data.error || 'Failed to fetch overview');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Fetch overview error:', err);
    }
  }, [session?.user?.id, apiClient]);

  // Create a new event
  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!session?.user?.id) throw new Error('User not authenticated');

    try {
      const data = await apiClient.fetch('/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify({
          userId: session.user.id,
          ...eventData,
        }),
      });

      if (data.success) {
        // Refresh events after creation
        await fetchEvents();
        return data.eventId;
      } else {
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [session?.user?.id, fetchEvents, apiClient]);

  // Update an event
  const updateEvent = useCallback(async (
    eventId: string, 
    updates: Partial<CalendarEvent>, 
    updateRecurring = false
  ) => {
    try {
      const data = await apiClient.fetch(`/api/calendar/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...updates,
          updateRecurring,
        }),
      });

      if (data.success) {
        // Refresh events after update
        await fetchEvents();
        return data.eventId;
      } else {
        throw new Error(data.error || 'Failed to update event');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [fetchEvents, apiClient]);

  // Delete an event
  const deleteEvent = useCallback(async (eventId: string, deleteRecurring = false) => {
    try {
      const params = deleteRecurring ? '?deleteRecurring=true' : '';
      const data = await apiClient.fetch(`/api/calendar/events/${eventId}${params}`, {
        method: 'DELETE',
      });

      if (data.success) {
        // Refresh events after deletion
        await fetchEvents();
        return data.eventId;
      } else {
        throw new Error(data.error || 'Failed to delete event');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [fetchEvents, apiClient]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: string) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  }, [events]);

  // Auto-fetch events when user session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchEvents();
      fetchOverview();
    }
  }, [session?.user?.id, fetchEvents, fetchOverview]);

  return {
    events,
    overview,
    loading,
    error,
    fetchEvents,
    fetchOverview,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    clearError: () => setError(null),
  };
}