import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { WhisperRecorder, transcribeWithWhisper } from '../utils/whisperApi';
import { 
  Brain, 
  Mic, 
  MicOff, 
  Zap, 
  Save, 
  Sparkles,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  Plus
} from 'lucide-react';

interface ProcessedTask {
  id: string;
  title: string;
  description: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  category: string;
  tags: string[];
  microTasks: string[];
  optimalTimeSlot?: string;
  energyLevel?: 'High' | 'Medium' | 'Low';
  focusType?: 'Deep Work' | 'Collaboration' | 'Administrative';
  suggestedDay?: 'Today' | 'Tomorrow' | 'This Week';
}

interface DailySchedule {
  totalEstimatedHours: number;
  workloadAssessment: 'Optimal' | 'Heavy' | 'Light';
  recommendedOrder: string[];
  timeBlocks: {
    time: string;
    taskId: string;
    rationale: string;
  }[];
}

export function BrainDump() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedTasks, setProcessedTasks] = useState<ProcessedTask[]>([]);
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [whisperRecorder, setWhisperRecorder] = useState<WhisperRecorder | null>(null);
  const [useWhisper, setUseWhisper] = useState(true);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();
  console.log('Session:', session); // Keep session for future use

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (content.trim()) {
      const timer = setTimeout(() => {
        setLastSaved(new Date());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content]);

  // Initialize speech recognition systems
  useEffect(() => {
    // Initialize Whisper recorder
    const recorder = new WhisperRecorder();
    setWhisperRecorder(recorder);
    
    // Initialize browser speech recognition as fallback
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      let finalTranscript = '';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Only add final results to content
        if (finalTranscript) {
          setContent(prev => {
            const newContent = prev + (prev.endsWith(' ') || !prev ? '' : ' ') + finalTranscript;
            finalTranscript = '';
            return newContent;
          });
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError('Voice recognition error. Please try again.');
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognition);
    }
  }, []);

  const handleVoiceToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      setError('');
      setIsRecording(true);

      if (useWhisper && whisperRecorder) {
        console.log('🎤 Starting Whisper recording...');
        await whisperRecorder.startRecording();
      } else if (recognition) {
        console.log('🎤 Starting browser speech recognition...');
        recognition.start();
      } else {
        throw new Error('No voice recognition available');
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start voice recording. Please check microphone permissions.');
      setIsRecording(false);
      
      // Fallback to browser recognition
      if (useWhisper && recognition) {
        setUseWhisper(false);
        try {
          recognition.start();
          setIsRecording(true);
        } catch (fallbackError) {
          console.error('Fallback recording failed:', fallbackError);
        }
      }
    }
  };

  const stopRecording = async () => {
    try {
      if (useWhisper && whisperRecorder?.isCurrentlyRecording()) {
        console.log('🎤 Stopping Whisper recording...');
        const audioBlob = await whisperRecorder.stopRecording();
        
        // Transcribe with Whisper API
        setError('Processing audio...');
        try {
          const result = await transcribeWithWhisper(audioBlob, {
            language: 'auto', // Let GPT-4o auto-detect language
            onFallback: () => {
              setUseWhisper(false);
              setError('Whisper unavailable, switched to browser recognition');
            }
          });
          
          // Add transcription to content
          setContent(prev => {
            const newContent = prev + (prev.endsWith(' ') || !prev ? '' : ' ') + result.transcription;
            return newContent;
          });
          
          setError('');
          console.log('✅ Whisper transcription completed');
        } catch (transcribeError) {
          console.warn('Whisper transcription failed:', transcribeError);
          setError('Transcription failed. Please try again or switch to browser recognition.');
        }
      } else if (recognition) {
        console.log('🎤 Stopping browser speech recognition...');
        recognition.stop();
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setError('Failed to stop recording.');
    } finally {
      setIsRecording(false);
    }
  };

  const handleProcessDump = async () => {
    if (!content.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // Call our backend API to process with OpenAI
      const response = await fetch('/api/ai/process-brain-dump', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: content.trim(),
          timestamp: new Date().toISOString(),
          preferences: {
            workingHours: { start: '9:00 AM', end: '5:00 PM' },
            focusHours: ['9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM'],
            breakInterval: 90, // minutes
            maxTasksPerDay: 6,
            prioritizeUrgent: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process brain dump');
      }

      const data = await response.json();
      const tasks = data.extractedTasks || [];
      const schedule = data.dailySchedule || null;
      
      // Convert server format to component format
      const formattedTasks: ProcessedTask[] = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        category: task.category,
        tags: task.tags || [],
        microTasks: task.microTasks || [],
        optimalTimeSlot: task.optimalTimeSlot,
        energyLevel: task.energyLevel,
        focusType: task.focusType,
        suggestedDay: task.suggestedDay
      }));
      
      setProcessedTasks(formattedTasks);
      setDailySchedule(schedule);
      
      if (formattedTasks.length > 0) {
        setError('');
      } else {
        setError('No tasks could be extracted from your input. Try being more specific about what needs to be done.');
      }
      
    } catch (error) {
      console.error('Brain dump processing failed:', error);
      setError('Processing failed. Please try again.');
      setProcessedTasks([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveTasks = async () => {
    if (!processedTasks.length || !session?.user?.id) return;

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/brain-dump/save-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedTasks: processedTasks,
          dailySchedule: dailySchedule,
          userId: session.user.id,
          originalContent: content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tasks');
      }

      await response.json();
      
      // Show success and navigate
      setLastSaved(new Date());
      
      // Navigate to tasks page to see the created tasks
      setTimeout(() => {
        navigate('/tasks');
      }, 1000);

    } catch (error) {
      console.error('Save tasks failed:', error);
      setError('Failed to save tasks. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-error';
      case 'High': return 'text-error';
      case 'Medium': return 'text-warning';
      case 'Low': return 'text-info';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-error/10 border-error/20';
      case 'High': return 'bg-error/10 border-error/20';
      case 'Medium': return 'bg-warning/10 border-warning/20';
      case 'Low': return 'bg-info/10 border-info/20';
      default: return 'bg-muted/10 border-border';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Brain Dump</h1>
          <p className="text-muted-foreground mt-2">Transform your thoughts into organized, actionable tasks</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {lastSaved && (
            <>
              <Save className="h-4 w-4" />
              <span>Last saved {lastSaved.toLocaleTimeString()}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brain Dump Input */}
        <div className="space-y-6">
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Daily Thoughts</h2>
                    <p className="text-sm text-muted-foreground">Dump everything on your mind</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceToggle}
                    className={isRecording ? 'timer-active' : 'glass-surface'}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isRecording ? 'Stop' : 'Voice'}
                  </Button>
                  {useWhisper && (
                    <div className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                      GPT-4o Whisper
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing or speaking your thoughts...

The AI will create optimal daily schedules by:
• Analyzing task complexity and priority
• Scheduling high-focus work during peak energy hours
• Grouping similar tasks to reduce context switching
• Creating realistic time blocks with proper buffers
• Automatically adding tasks and events to your calendar

Examples:
• Need to finish the quarterly reports by Friday - complex analysis work
• Call John about the marketing campaign - urgent follow-up needed
• Review the budget proposal from finance team - detailed review required
• Schedule team meeting for project planning - coordination needed
• Research new CRM tools for better productivity - exploration task"
                className="w-full min-h-[300px] p-4 glass-surface border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
              />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {content.length} characters • {content.split(' ').filter(word => word.length > 0).length} words
                </div>
                <Button 
                  onClick={handleProcessDump}
                  disabled={!content.trim() || isProcessing}
                  className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow transition-all duration-300"
                >
                  {isProcessing ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Processing with AI...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Organize with AI
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Processing Status */}
          {isProcessing && (
            <Card className="glass shadow-elevation">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center animate-pulse-glow">
                    <Sparkles className="h-6 w-6 text-white animate-spin" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">AI is analyzing your thoughts...</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Extracting tasks, estimating time, and organizing priorities
                    </p>
                    <div className="w-64 h-2 bg-surface-elevated rounded-full mt-3">
                      <div className="h-full bg-gradient-primary rounded-full animate-pulse" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Processed Tasks */}
        <div className="space-y-6">
          {processedTasks.length > 0 && (
            <Card className="glass shadow-elevation">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-success flex items-center justify-center shadow-glow">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Organized Tasks</h2>
                      <p className="text-sm text-muted-foreground">{processedTasks.length} tasks identified</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gradient-success hover:bg-gradient-success/90 text-white"
                    onClick={handleSaveTasks}
                    disabled={isSaving || !processedTasks.length}
                  >
                    {isSaving ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Save to Tasks & Calendar
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {processedTasks.map((task, index) => (
                  <div key={task.id || index} className={`p-4 rounded-lg border ${getPriorityBg(task.priority)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
                          <span className={`text-xs font-medium uppercase ${getPriorityColor(task.priority)}`}>
                            {task.priority} Priority
                          </span>
                          {task.suggestedDay && (
                            <span className="text-xs bg-info/10 text-info px-2 py-1 rounded">
                              {task.suggestedDay}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        
                        {/* Optimal Scheduling Info */}
                        {task.optimalTimeSlot && (
                          <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="font-medium text-primary">Optimal Time:</span>
                                <span className="text-foreground">{task.optimalTimeSlot}</span>
                              </div>
                              {task.energyLevel && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  task.energyLevel === 'High' ? 'bg-success/10 text-success' :
                                  task.energyLevel === 'Medium' ? 'bg-warning/10 text-warning' :
                                  'bg-info/10 text-info'
                                }`}>
                                  {task.energyLevel} Energy
                                </span>
                              )}
                            </div>
                            {task.focusType && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Best for: {task.focusType}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground ml-4">
                        <Clock className="h-4 w-4" />
                        <span>{task.estimatedHours}h</span>
                      </div>
                    </div>

                    {/* Micro Tasks */}
                    {task.microTasks && task.microTasks.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                          <Target className="h-4 w-4 mr-2" />
                          Breakdown ({task.microTasks.length} steps)
                        </h4>
                        <div className="space-y-2">
                          {task.microTasks.map((microTask, microIndex) => (
                            <div key={microIndex} className="flex items-center p-2 glass-surface rounded">
                              <CheckCircle2 className="h-3 w-3 text-muted-foreground mr-2" />
                              <span className="text-sm text-foreground">{microTask}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground glass-surface px-2 py-1 rounded">
                        {task.category}
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => navigate('/tasks')}>
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-gradient-primary hover:bg-gradient-primary/90 text-white"
                          onClick={() => navigate('/timer')}
                        >
                          Start Timer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Daily Schedule Summary */}
          {dailySchedule && processedTasks.length > 0 && (
            <Card className="glass shadow-elevation">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-info flex items-center justify-center shadow-glow">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Daily Schedule</h2>
                    <p className="text-sm text-muted-foreground">AI-optimized time blocks</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Schedule Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 glass-surface rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Total Time</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {dailySchedule.totalEstimatedHours}h
                    </p>
                  </div>
                  <div className="p-3 glass-surface rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Workload</span>
                    </div>
                    <p className={`text-lg font-semibold ${
                      dailySchedule.workloadAssessment === 'Optimal' ? 'text-success' :
                      dailySchedule.workloadAssessment === 'Heavy' ? 'text-warning' :
                      'text-info'
                    }`}>
                      {dailySchedule.workloadAssessment}
                    </p>
                  </div>
                </div>

                {/* Time Blocks */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Recommended Schedule
                  </h4>
                  {dailySchedule.timeBlocks.map((block, index) => {
                    const task = processedTasks.find(t => t.id === block.taskId);
                    return (
                      <div key={index} className="p-3 glass-surface rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-primary">{block.time}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            task?.priority === 'Urgent' || task?.priority === 'High' ? 'bg-error/10 text-error' :
                            task?.priority === 'Medium' ? 'bg-warning/10 text-warning' :
                            'bg-info/10 text-info'
                          }`}>
                            {task?.priority} Priority
                          </span>
                        </div>
                        <p className="font-medium text-foreground text-sm">
                          {task?.title || 'Task'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {block.rationale}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          {processedTasks.length === 0 && !isProcessing && (
            <Card className="glass shadow-elevation">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">AI Tips</h2>
                    <p className="text-sm text-muted-foreground">Get better results</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 glass-surface rounded-lg">
                  <h3 className="font-medium text-sm">Be Specific</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Include deadlines, context, and any constraints
                  </p>
                </div>
                <div className="p-3 glass-surface rounded-lg">
                  <h3 className="font-medium text-sm">Include All Details</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mention projects, clients, and priority levels
                  </p>
                </div>
                <div className="p-3 glass-surface rounded-lg">
                  <h3 className="font-medium text-sm">Think Out Loud</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Include your thoughts, concerns, and ideas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}