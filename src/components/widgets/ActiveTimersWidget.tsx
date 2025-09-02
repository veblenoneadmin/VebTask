import React, { useState, useEffect } from 'react';
import { BaseWidget } from './BaseWidget';
import { WidgetProps } from '../../lib/widgets/WidgetInterface';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Play, Pause, Square, Clock } from 'lucide-react';

interface ActiveTimer {
  id: string;
  taskTitle: string;
  projectName?: string;
  startTime: Date;
  duration: number; // seconds
  status: 'running' | 'paused';
}

interface ActiveTimersWidgetData {
  timers: ActiveTimer[];
  totalActiveTime: number;
}

interface ActiveTimersWidgetProps extends WidgetProps {
  data?: ActiveTimersWidgetData;
}

export function ActiveTimersWidget(props: ActiveTimersWidgetProps) {
  const { data } = props;
  const [localTimers, setLocalTimers] = useState<ActiveTimer[]>([]);

  // Update local timers when data changes
  useEffect(() => {
    if (data?.timers) {
      setLocalTimers(data.timers);
    }
  }, [data?.timers]);

  // Update timer durations every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTimers(prevTimers => 
        prevTimers.map(timer => {
          if (timer.status === 'running') {
            const elapsed = Math.floor((Date.now() - timer.startTime.getTime()) / 1000);
            return { ...timer, duration: elapsed };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerAction = async (timerId: string, action: 'pause' | 'stop') => {
    try {
      const response = await fetch(`/api/timers/${timerId}/${action}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // Update local state optimistically
        setLocalTimers(prevTimers => 
          prevTimers.map(timer => 
            timer.id === timerId 
              ? { ...timer, status: action === 'pause' ? 'paused' : 'running' }
              : timer
          ).filter(timer => action !== 'stop' || timer.id !== timerId)
        );
        
        // Trigger parent refresh
        props.onRefresh?.();
      }
    } catch (error) {
      console.error(`Failed to ${action} timer:`, error);
    }
  };

  const totalRunningTime = localTimers
    .filter(timer => timer.status === 'running')
    .reduce((total, timer) => total + timer.duration, 0);

  return (
    <BaseWidget {...props}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Active Timers</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {localTimers.filter(t => t.status === 'running').length} running
          </Badge>
        </div>

        {localTimers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active timers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Total time summary */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Total Active Time</span>
              <span className="text-lg font-mono font-bold text-blue-600">
                {formatDuration(totalRunningTime)}
              </span>
            </div>

            {/* Individual timers */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {localTimers.map(timer => (
                <div
                  key={timer.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {timer.taskTitle}
                    </p>
                    {timer.projectName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {timer.projectName}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant={timer.status === 'running' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {timer.status}
                      </Badge>
                      <span className="text-xs font-mono">
                        {formatDuration(timer.duration)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    {timer.status === 'running' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTimerAction(timer.id, 'pause')}
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTimerAction(timer.id, 'pause')} // Resume
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTimerAction(timer.id, 'stop')}
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}