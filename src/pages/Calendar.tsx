import { useState, useMemo } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { EventForm } from '../components/Calendar/EventForm';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Coffee,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const {
    events,
    overview,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEvents,
    getEventsForDate,
    clearError
  } = useCalendar();

  // Get events for current month view
  const monthEvents = useMemo(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });
  }, [events, currentDate]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      await createEvent(eventData);
      setShowEventForm(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdateEvent = async (eventData: any) => {
    if (!selectedEvent) return;
    
    try {
      await updateEvent(selectedEvent.id, eventData);
      setShowEventForm(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDate = new Date(year, month - 1, lastDay.getDate() - i);
      days.push({
        date: prevMonthDate.getDate(),
        isCurrentMonth: false,
        fullDate: prevMonthDate.toISOString().split('T')[0]
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: currentDate.toISOString().split('T')[0]
      });
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length; // 6 rows × 7 days = 42
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonthDate = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: nextMonthDate.toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  const getEventsByDate = (date: string) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    return monthEvents.filter(event => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="h-3 w-3" />;
      case 'task': return <Clock className="h-3 w-3" />;
      case 'break': return <Coffee className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Calendar</h1>
          <p className="text-muted-foreground mt-2">Schedule and manage your time effectively</p>
          {error && (
            <div className="flex items-center space-x-2 mt-2 text-error text-sm">
              <span>{error}</span>
              <button onClick={clearError} className="underline">Dismiss</button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-surface-elevated rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1 rounded text-sm font-medium transition-colors capitalize",
                  viewMode === mode 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <Button 
            onClick={() => {
              setSelectedEvent(null);
              setShowEventForm(true);
            }}
            disabled={loading}
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            New Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className="xl:col-span-3">
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-2xl font-bold">
                    {months[currentMonth]} {currentYear}
                  </h2>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="glass-surface"
                >
                  Today
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center py-2 text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dayEvents = getEventsByDate(day.fullDate);
                  const isToday = day.fullDate === today;
                  const isSelected = selectedDate === day.fullDate;

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(day.fullDate)}
                      onDoubleClick={() => {
                        setSelectedDate(day.fullDate);
                        setSelectedEvent(null);
                        setShowEventForm(true);
                      }}
                      className={cn(
                        "min-h-[100px] p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-surface-elevated/50",
                        !day.isCurrentMonth && "opacity-50",
                        isToday && "ring-2 ring-primary bg-primary/5",
                        isSelected && "ring-2 ring-accent bg-accent/5",
                        "border border-border"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1 flex items-center justify-between",
                        isToday ? "text-primary" : day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                      )}>
                        <span>{day.date}</span>
                        {dayEvents.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {dayEvents.length}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setShowEventForm(true);
                            }}
                            className="text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center group"
                            style={{ backgroundColor: event.color }}
                            title={`${event.title} (${new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                          >
                            {getEventTypeIcon(event.type)}
                            <span className="ml-1 truncate">{event.title}</span>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setShowEventForm(true);
                                }}
                                className="hover:text-warning"
                              >
                                <Edit className="h-2 w-2" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this event?')) {
                                    handleDeleteEvent(event.id);
                                  }
                                }}
                                className="hover:text-error"
                              >
                                <Trash2 className="h-2 w-2" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <h3 className="font-semibold">Quick Navigation</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-2xl font-bold">{new Date().getDate()}</p>
                <p className="text-sm text-muted-foreground">
                  {months[new Date().getMonth()]} {new Date().getFullYear()}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full glass-surface"
                onClick={() => setCurrentDate(new Date())}
              >
                Go to Today
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <h3 className="font-semibold">Upcoming Events</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.upcomingEvents?.length > 0 ? (
                overview.upcomingEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-2 glass-surface rounded-lg">
                    <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: event.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventForm(true);
                        }}
                        className="p-1 hover:bg-surface-elevated rounded"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Types */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <h3 className="font-semibold">Event Types</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-error rounded-full" />
                <span className="text-sm">Meetings</span>
                <Badge variant="outline" className="ml-auto">
                  {overview?.eventStats?.meeting?.count || 0}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full" />
                <span className="text-sm">Tasks</span>
                <Badge variant="outline" className="ml-auto">
                  {overview?.eventStats?.task?.count || 0}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-info rounded-full" />
                <span className="text-sm">Breaks</span>
                <Badge variant="outline" className="ml-auto">
                  {overview?.eventStats?.break?.count || 0}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-warning rounded-full" />
                <span className="text-sm">Personal</span>
                <Badge variant="outline" className="ml-auto">
                  {overview?.eventStats?.personal?.count || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <h3 className="font-semibold">Today's Schedule</h3>
            </CardHeader>
            <CardContent>
              {getEventsByDate(today).length > 0 ? (
                <div className="space-y-3">
                  {getEventsByDate(today).map((event) => (
                    <div key={event.id} className="flex items-center space-x-3 p-2 glass-surface rounded-lg">
                      <div className="w-2 h-8 rounded-full" style={{ backgroundColor: event.color }} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventForm(true);
                        }}
                        className="p-1 hover:bg-surface-elevated rounded opacity-0 group-hover:opacity-100"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No events today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Form Modal */}
      <EventForm
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setSelectedEvent(null);
        }}
        onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
        initialEvent={selectedEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
}