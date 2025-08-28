import { useState, useEffect } from 'react';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Target,
  DollarSign,
  Coffee,
  Timer as TimerIcon,
  BarChart3,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TimerState {
  isRunning: boolean;
  isOnBreak: boolean;
  currentSessionTime: number;
  breakTime: number;
  startTime: Date | null;
  breakStartTime: Date | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  actualHours: number;
  isBillable: boolean;
  hourlyRate?: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Quarterly Report Analysis',
    description: 'Review Q4 financial data and prepare executive summary',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 1.5,
    isBillable: true,
    hourlyRate: 85,
    status: 'in_progress'
  },
  {
    id: '2',
    title: 'Client Meeting Preparation',
    description: 'Prepare presentation materials for tomorrow\'s client meeting',
    priority: 'medium',
    estimatedHours: 2,
    actualHours: 0.5,
    isBillable: true,
    hourlyRate: 95,
    status: 'in_progress'
  },
  {
    id: '3',
    title: 'Code Review - Authentication Module',
    description: 'Review pull request for new auth system implementation',
    priority: 'medium',
    estimatedHours: 1.5,
    actualHours: 0,
    isBillable: false,
    status: 'not_started'
  }
];

export function Timer() {
  const { data: session } = useSession();
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isOnBreak: false,
    currentSessionTime: 0,
    breakTime: 0,
    startTime: null,
    breakStartTime: null
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string>(mockTasks[0]?.id || '');
  const [currentMicroTask, setCurrentMicroTask] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Get current task
  const currentTask = mockTasks.find(t => t.id === selectedTaskId) || mockTasks[0];

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerState.isRunning) {
      interval = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          currentSessionTime: prev.isOnBreak ? prev.currentSessionTime : prev.currentSessionTime + 1,
          breakTime: prev.isOnBreak ? prev.breakTime + 1 : prev.breakTime
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.isOnBreak]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!currentTask) return;
    
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startTime: new Date(),
      isOnBreak: false
    }));
  };

  const handlePause = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const handleBreak = () => {
    if (!timerState.isRunning || timerState.isOnBreak) return;
    
    setTimerState(prev => ({
      ...prev,
      isOnBreak: true,
      isRunning: true,
      breakStartTime: new Date()
    }));
  };

  const handleResumeWork = () => {
    if (!timerState.isOnBreak) return;
    
    setTimerState(prev => ({
      ...prev,
      isOnBreak: false,
      isRunning: true,
      breakStartTime: null,
      startTime: new Date()
    }));
  };

  const handleStop = () => {
    const totalWorkMinutes = Math.floor(timerState.currentSessionTime / 60);
    const totalBreakMinutes = Math.floor(timerState.breakTime / 60);
    
    if (totalWorkMinutes > 0) {
      // Here you would normally save to database
      console.log('Session completed:', {
        taskId: currentTask?.id,
        workTime: timerState.currentSessionTime,
        breakTime: timerState.breakTime,
        microTask: currentMicroTask,
        notes: sessionNotes
      });
    }

    // Reset timer state
    setTimerState({
      isRunning: false,
      isOnBreak: false,
      currentSessionTime: 0,
      breakTime: 0,
      startTime: null,
      breakStartTime: null
    });
    
    setCurrentMicroTask('');
    setSessionNotes('');
  };

  const getTimerStateClass = () => {
    if (timerState.isOnBreak) return 'timer-break';
    if (timerState.isRunning) return 'timer-active';
    return '';
  };

  const currentEarnings = currentTask?.isBillable && currentTask?.hourlyRate 
    ? (timerState.currentSessionTime / 3600) * Number(currentTask.hourlyRate)
    : 0;

  const totalSessionTime = timerState.currentSessionTime + timerState.breakTime;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Active Timer</h1>
          <p className="text-muted-foreground mt-2">Track your time with precision and purpose</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Today's Total</p>
            <p className="text-2xl font-bold text-success">3.5h</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tasks Completed</p>
            <p className="text-2xl font-bold text-primary">2</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Timer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Task Info */}
          <Card className="glass shadow-elevation">
            <CardContent className="p-6">
              {currentTask ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shadow-glow",
                        currentTask.priority === 'high' ? 'bg-gradient-error' :
                        currentTask.priority === 'medium' ? 'bg-gradient-warning' :
                        'bg-gradient-primary'
                      )}>
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{currentTask.title}</h2>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {currentTask.hourlyRate && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>${currentTask.hourlyRate}/hr</span>
                            </span>
                          )}
                          {currentTask.isBillable && (
                            <Badge className="bg-success/20 text-success">Billable</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="text-lg font-semibold">
                        {currentTask.actualHours}h / {currentTask.estimatedHours}h
                      </p>
                      <div className="w-32 h-2 bg-surface-elevated rounded-full mt-2">
                        <div 
                          className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((currentTask.actualHours / currentTask.estimatedHours) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Micro Task Input */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Enter micro-task (e.g., Testing, Debugging, Documentation)"
                        value={currentMicroTask}
                        onChange={(e) => setCurrentMicroTask(e.target.value)}
                        className="flex-1 px-3 py-2 glass-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    {/* Session Notes */}
                    <textarea
                      placeholder="Session notes (optional)..."
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      className="w-full px-3 py-2 glass-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Task Selected</h3>
                  <p className="text-muted-foreground">Choose a task to start tracking time</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timer Display */}
          <Card className={cn("glass shadow-elevation text-center", getTimerStateClass())}>
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Main Timer */}
                <div>
                  <div className="text-6xl font-bold font-mono text-foreground mb-2">
                    {timerState.isOnBreak ? formatTime(timerState.breakTime) : formatTime(timerState.currentSessionTime)}
                  </div>
                  <p className="text-muted-foreground">
                    {timerState.isOnBreak ? '☕ On Break' :
                     timerState.isRunning ? '🎯 Working' : 'Ready to Start'}
                  </p>
                  {timerState.isRunning && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total session: {formatTime(totalSessionTime)} 
                      {timerState.breakTime > 0 && ` (Work: ${formatTime(timerState.currentSessionTime)}, Break: ${formatTime(timerState.breakTime)})`}
                    </p>
                  )}
                </div>

                {/* Real-time Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 glass-surface rounded-lg">
                    <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">Work Time</p>
                    <p className="font-semibold">{formatTime(timerState.currentSessionTime)}</p>
                  </div>
                  <div className="p-3 glass-surface rounded-lg">
                    <DollarSign className="h-5 w-5 text-success mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">Session Earnings</p>
                    <p className="font-semibold">${currentEarnings.toFixed(2)}</p>
                  </div>
                  <div className="p-3 glass-surface rounded-lg">
                    <Coffee className="h-5 w-5 text-info mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">Break Time</p>
                    <p className="font-semibold">{formatTime(timerState.breakTime)}</p>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="flex items-center justify-center space-x-4">
                  {!timerState.isRunning ? (
                    <Button
                      size="lg"
                      onClick={handleStart}
                      className="px-8 py-4 text-lg font-medium bg-gradient-success hover:bg-gradient-success/90 text-white shadow-glow transition-all duration-300"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Work
                    </Button>
                  ) : timerState.isOnBreak ? (
                    <>
                      <Button
                        size="lg"
                        onClick={handleResumeWork}
                        className="px-8 py-4 text-lg font-medium bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow transition-all duration-300"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Resume Work
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleStop}
                        className="glass-surface"
                      >
                        <Square className="h-5 w-5 mr-2" />
                        Stop Session
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={handlePause}
                        className="px-6 py-4 text-lg font-medium bg-gradient-warning hover:bg-gradient-warning/90 text-white shadow-glow transition-all duration-300"
                      >
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleBreak}
                        className="px-6 py-4 text-lg font-medium bg-gradient-info hover:bg-gradient-info/90 text-white shadow-glow transition-all duration-300"
                      >
                        <Coffee className="h-5 w-5 mr-2" />
                        Take Break
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleStop}
                        className="glass-surface"
                      >
                        <Square className="h-5 w-5 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>

                {/* Current Micro Task Display */}
                {timerState.isRunning && currentMicroTask && (
                  <div className="glass-surface p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Currently working on:</p>
                    <p className="font-medium">{currentMicroTask}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Selection */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Select Task</h2>
                  <p className="text-sm text-muted-foreground">Choose what to work on</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={cn(
                    "w-full p-3 text-left glass-surface rounded-lg transition-all duration-200 hover:shadow-md",
                    selectedTaskId === task.id ? "ring-2 ring-primary bg-primary/10 shadow-glow" : ""
                  )}
                >
                  <h3 className="font-medium text-sm truncate">{task.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {task.actualHours}h / {task.estimatedHours}h
                    </span>
                    {task.isBillable && task.hourlyRate && (
                      <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">
                        ${task.hourlyRate}/hr
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1 bg-surface-elevated rounded-full mt-2">
                    <div 
                      className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%` }}
                    />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Today's Summary</h2>
                  <p className="text-sm text-muted-foreground">Performance overview</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 glass-surface rounded-lg">
                <span className="text-sm text-muted-foreground">Total Time</span>
                <span className="font-semibold">3.5h</span>
              </div>
              <div className="flex items-center justify-between p-3 glass-surface rounded-lg">
                <span className="text-sm text-muted-foreground">Focus Time</span>
                <span className="font-semibold text-success">2h 45m</span>
              </div>
              <div className="flex items-center justify-between p-3 glass-surface rounded-lg">
                <span className="text-sm text-muted-foreground">Tasks Completed</span>
                <span className="font-semibold">2</span>
              </div>
              <div className="flex items-center justify-between p-3 glass-surface rounded-lg">
                <span className="text-sm text-muted-foreground">Earnings Today</span>
                <span className="font-semibold text-success">$297.50</span>
              </div>
            </CardContent>
          </Card>

          {/* Productivity Tips */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-info flex items-center justify-center shadow-glow">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Smart Insights</h2>
                  <p className="text-sm text-muted-foreground">AI recommendations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm font-medium text-success">Great Focus!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You've maintained excellent concentration. Keep it up!
                </p>
              </div>
              <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
                <p className="text-sm font-medium text-info">Time Estimate</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on your pace, you'll finish on schedule.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}