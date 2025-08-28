import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
}

export function BrainDump() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedTasks, setProcessedTasks] = useState<ProcessedTask[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks] = useState<Blob[]>([]);
  console.log(audioChunks);
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

  // Initialize speech recognition
  useEffect(() => {
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
      // Stop recording
      if (useWhisper && mediaRecorder) {
        mediaRecorder.stop();
      } else if (recognition) {
        recognition.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      setError('');
      
      if (useWhisper) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
          });
          
          const chunks: Blob[] = [];
          
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
          
          recorder.onstop = async () => {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            await transcribeWithWhisper(audioBlob);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
          };
          
          recorder.start();
          setMediaRecorder(recorder);
          console.log('Audio chunks:', chunks);
          setIsRecording(true);
          
        } catch (err) {
          setError('Microphone access denied or not available');
          console.error('Media access error:', err);
        }
      } else {
        // Fallback to Web Speech API
        if (!recognition) {
          setError('Voice recognition not supported in this browser');
          return;
        }
        recognition.start();
        setIsRecording(true);
      }
    }
  };

  const transcribeWithWhisper = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const data = await response.json();
      
      // Add transcribed text to content
      setContent(prev => {
        const newContent = prev + (prev.endsWith(' ') || !prev ? '' : ' ') + data.transcription;
        return newContent;
      });
      
    } catch (err) {
      setError('Transcription failed. Please try again.');
      console.error('Whisper transcription error:', err);
    } finally {
      setIsProcessing(false);
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
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process brain dump');
      }

      const data = await response.json();
      const tasks = data.extractedTasks || [];
      
      // Convert server format to component format
      const formattedTasks: ProcessedTask[] = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        category: task.category,
        tags: task.tags || [],
        microTasks: task.microTasks || []
      }));
      
      setProcessedTasks(formattedTasks);
      
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
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <input 
                      type="checkbox" 
                      checked={useWhisper} 
                      onChange={(e) => setUseWhisper(e.target.checked)}
                      className="w-3 h-3"
                    />
                    <span>OpenAI Whisper</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceToggle}
                    className={isRecording ? 'timer-active' : 'glass-surface'}
                    disabled={isProcessing}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isRecording ? 'Stop' : (isProcessing ? 'Processing...' : 'Voice')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing or speaking your thoughts...

Examples:
• Need to finish the quarterly reports by Friday
• Call John about the marketing campaign 
• Review the budget proposal from finance team
• Schedule team meeting for project planning
• Research new CRM tools for better productivity"
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
                    className="bg-gradient-primary hover:bg-gradient-primary/90 text-white"
                    onClick={() => navigate('/tasks')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Save Tasks
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
                        </div>
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
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