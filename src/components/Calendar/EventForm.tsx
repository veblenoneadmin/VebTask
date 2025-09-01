import { useState, useEffect } from 'react';
import type { CalendarEvent, RecurringPattern } from '../../hooks/useCalendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Repeat,
  X,
  Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialEvent?: CalendarEvent;
  selectedDate?: string;
}

const eventTypes = [
  { value: 'meeting', label: 'Meeting', color: 'bg-error', icon: Users },
  { value: 'task', label: 'Task', color: 'bg-success', icon: Clock },
  { value: 'break', label: 'Break', color: 'bg-info', icon: CalendarIcon },
  { value: 'personal', label: 'Personal', color: 'bg-warning', icon: CalendarIcon },
];

const eventColors = [
  '#6366f1', '#ef4444', '#22c55e', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
  '#ec4899', '#64748b'
];

export function EventForm({ isOpen, onClose, onSubmit, initialEvent, selectedDate }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'personal' as CalendarEvent['type'],
    color: '#6366f1',
    location: '',
    attendees: [] as string[],
    isRecurring: false,
    recurringPattern: {
      frequency: 'weekly' as RecurringPattern['frequency'],
      interval: 1,
      endDate: '',
      daysOfWeek: [] as number[]
    },
    status: 'scheduled' as CalendarEvent['status']
  });
  
  const [newAttendee, setNewAttendee] = useState('');
  const [showRecurring, setShowRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize form with initial event or selected date
  useEffect(() => {
    if (initialEvent) {
      const start = new Date(initialEvent.startTime);
      const end = new Date(initialEvent.endTime);
      
      setFormData({
        title: initialEvent.title,
        description: initialEvent.description || '',
        startTime: start.toISOString().slice(0, 16), // Format for datetime-local
        endTime: end.toISOString().slice(0, 16),
        type: initialEvent.type,
        color: initialEvent.color,
        location: initialEvent.location || '',
        attendees: initialEvent.attendees || [],
        isRecurring: initialEvent.isRecurring,
        recurringPattern: {
          frequency: initialEvent.recurringPattern?.frequency || 'weekly',
          interval: initialEvent.recurringPattern?.interval || 1,
          endDate: initialEvent.recurringPattern?.endDate || '',
          daysOfWeek: initialEvent.recurringPattern?.daysOfWeek || []
        },
        status: initialEvent.status
      });
      setShowRecurring(initialEvent.isRecurring);
    } else if (selectedDate) {
      const date = new Date(selectedDate);
      const startTime = new Date(date);
      startTime.setHours(9, 0, 0, 0); // Default to 9:00 AM
      const endTime = new Date(startTime);
      endTime.setHours(10, 0, 0, 0); // Default duration: 1 hour
      
      setFormData(prev => ({
        ...prev,
        startTime: startTime.toISOString().slice(0, 16),
        endTime: endTime.toISOString().slice(0, 16),
      }));
    }
  }, [initialEvent, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        recurringPattern: formData.isRecurring ? formData.recurringPattern : undefined
      };

      await onSubmit(eventData);
      handleClose();
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      type: 'personal',
      color: '#6366f1',
      location: '',
      attendees: [],
      isRecurring: false,
      recurringPattern: {
        frequency: 'weekly' as const,
        interval: 1,
        endDate: '',
        daysOfWeek: [] as number[]
      },
      status: 'scheduled'
    });
    setShowRecurring(false);
    setNewAttendee('');
    onClose();
  };

  const addAttendee = () => {
    if (newAttendee.trim() && !formData.attendees.includes(newAttendee.trim())) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee.trim()]
      }));
      setNewAttendee('');
    }
  };

  const removeAttendee = (attendee: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== attendee)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>{initialEvent ? 'Edit Event' : 'New Event'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Event title"
              required
              className="glass-surface"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Event description"
              rows={3}
              className="glass-surface"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Time *</label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
                className="glass-surface"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time *</label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
                className="glass-surface"
              />
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Event Type</label>
            <div className="grid grid-cols-4 gap-3">
              {eventTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        type: type.value as CalendarEvent['type'],
                        color: isSelected ? prev.color : type.color.replace('bg-', '#')
                      }));
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all duration-200 glass-surface",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex space-x-2">
              {eventColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all duration-200",
                    formData.color === color 
                      ? "border-foreground scale-110" 
                      : "border-border hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Event location"
              className="glass-surface"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Attendees
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                placeholder="Email address"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                className="glass-surface"
              />
              <Button type="button" onClick={addAttendee} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.attendees.map((attendee) => (
                <Badge key={attendee} variant="outline" className="glass-surface">
                  {attendee}
                  <button
                    type="button"
                    onClick={() => removeAttendee(attendee)}
                    className="ml-2 hover:text-error"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Recurring Options */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.isRecurring}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, isRecurring: e.target.checked }));
                  setShowRecurring(e.target.checked);
                }}
                className="rounded"
              />
              <label htmlFor="recurring" className="text-sm font-medium flex items-center">
                <Repeat className="h-4 w-4 mr-1" />
                Recurring Event
              </label>
            </div>

            {showRecurring && (
              <div className="space-y-4 p-4 glass-surface rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Frequency</label>
                    <select
                      value={formData.recurringPattern.frequency}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurringPattern: {
                          ...prev.recurringPattern,
                          frequency: e.target.value as RecurringPattern['frequency']
                        }
                      }))}
                      className="w-full p-2 glass-surface rounded-lg border border-border"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Every</label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.recurringPattern.interval}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurringPattern: {
                          ...prev.recurringPattern,
                          interval: parseInt(e.target.value) || 1
                        }
                      }))}
                      className="glass-surface"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                  <Input
                    type="date"
                    value={formData.recurringPattern.endDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurringPattern: {
                        ...prev.recurringPattern,
                        endDate: e.target.value
                      }
                    }))}
                    className="glass-surface"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90"
            >
              {loading ? 'Saving...' : (initialEvent ? 'Update Event' : 'Create Event')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="glass-surface"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}