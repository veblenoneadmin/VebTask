import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting server...');

// CORS headers with environment-aware configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:3001',
    'http://localhost:3000',
    'https://vebtask.com',
    'https://www.vebtask.com',
    'https://vebtask-production.up.railway.app'
  ];
  
  const origin = req.headers.origin;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (isProduction) {
    // In production, be more restrictive
    const host = req.get('host');
    if (host && (host.includes('railway.app') || host.includes('vebtask.com'))) {
      res.header('Access-Control-Allow-Origin', `https://${host}`);
    } else {
      res.header('Access-Control-Allow-Origin', 'https://vebtask-production.up.railway.app');
    }
  } else {
    // In development, allow localhost with current port
    res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Mount express json middleware BEFORE auth routes for request logging  
app.use(express.json({ limit: '10mb' }));


// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Add logging middleware for auth routes
app.use('/api/auth/*', (req, res, next) => {
  console.log(`🔐 Auth ${req.method} ${req.path}`, {
    body: req.method === 'POST' ? req.body : undefined,
    headers: {
      'content-type': req.headers['content-type'],
      'origin': req.headers.origin,
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
    }
  });
  next();
});

// Auth routes using proper Express adapter with error handling
app.all('/api/auth/*', async (req, res, next) => {
  try {
    await toNodeHandler(auth)(req, res, next);
  } catch (error) {
    console.error('❌ Auth handler error:', {
      path: req.path,
      method: req.method,
      error: error.message,
      stack: error.stack
    });
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Authentication error', 
        message: error.message,
        path: req.path 
      });
    }
  }
});

// Test endpoint for Whisper API debugging
app.get('/api/ai/whisper-status', (req, res) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const status = {
    openai_key_configured: !!openaiKey,
    openai_key_length: openaiKey ? openaiKey.length : 0,
    openai_key_prefix: openaiKey ? openaiKey.substring(0, 20) : 'none',
    openai_key_suffix: openaiKey ? openaiKey.substring(openaiKey.length - 10) : 'none',
    openai_key_has_spaces: openaiKey ? (openaiKey !== openaiKey.trim()) : false,
    openrouter_key_configured: !!process.env.OPENROUTER_API_KEY,
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };
  
  console.log('🔍 Whisper status check:', status);
  res.json(status);
});

// Test OpenAI API key with simple models endpoint
app.get('/api/ai/openai-test', async (req, res) => {
  try {
    console.log('🧪 Testing OpenAI API key with models endpoint...');
    
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    // Test with simple models endpoint first
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    
    console.log('🧪 OpenAI models response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🧪 OpenAI models error:', errorText);
      return res.json({
        test: 'openai-models',
        status: response.status,
        error: errorText,
        success: false,
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await response.json();
    const whisperModels = result.data?.filter(model => model.id.includes('whisper')) || [];
    
    console.log('🧪 OpenAI API key valid, found models:', result.data?.length);
    
    res.json({
      test: 'openai-models',
      status: response.status,
      success: true,
      totalModels: result.data?.length || 0,
      whisperModels: whisperModels.map(m => m.id),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ OpenAI test error:', error);
    res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint using OpenAI SDK
app.post('/api/ai/whisper-sdk-test', async (req, res) => {
  try {
    console.log('🧪 Testing Whisper API with OpenAI SDK...');
    
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    // Import OpenAI SDK
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });
    
    // Create a minimal base64 audio data for testing
    const testAudioData = 'UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAAC4uLi4uLi4uLi4'; 
    const audioBuffer = Buffer.from(testAudioData, 'base64');
    
    console.log('🧪 Test audio buffer:', {
      length: audioBuffer.length,
      first8Bytes: Array.from(audioBuffer.slice(0, 8)).map(b => String.fromCharCode(b)).join('')
    });
    
    // Create a File-like object for the SDK
    const audioFile = new File([audioBuffer], 'test-audio.wav', { type: 'audio/wav' });
    
    console.log('🧪 Sending request via OpenAI SDK...');
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'json'
    });
    
    console.log('🧪 OpenAI SDK success:', transcription);
    
    res.json({
      test: 'whisper-sdk',
      success: true,
      result: transcription,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Whisper SDK test error:', error);
    res.status(500).json({ 
      error: 'SDK test failed',
      message: error.message,
      details: error.response?.data || error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Whisper Speech-to-Text API endpoint with GPT-4o transcribe models
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    console.log('🎤 Whisper API called:', {
      hasBody: !!req.body,
      hasAudioData: !!(req.body && req.body.audioData),
      audioDataLength: req.body && req.body.audioData ? req.body.audioData.length : 0,
      audioFormat: req.body ? req.body.audioFormat : 'none',
      language: req.body ? req.body.language : 'none',
      model: req.body ? req.body.model : 'auto',
      includeLogProbs: req.body ? req.body.includeLogProbs : false
    });

    if (!req.body || !req.body.audioData) {
      console.log('❌ Missing audio data in request');
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
    
    if (!OPENAI_API_KEY) {
      console.log('❌ OpenAI API key not found in environment variables');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured', 
        debug: {
          env_keys: Object.keys(process.env).filter(key => key.includes('OPENAI')),
          node_env: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        },
        fallback: 'browser-speech-recognition' 
      });
    }

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(req.body.audioData, 'base64');
    
    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (audioBuffer.length > maxSize) {
      return res.status(413).json({ 
        error: 'Audio file too large. Maximum size is 25MB.', 
        fallback: 'browser-speech-recognition' 
      });
    }
    
    // Determine file extension based on audio format
    const audioFormat = req.body.audioFormat || 'webm';
    const filename = `audio.${audioFormat}`;
    const contentType = `audio/${audioFormat}`;
    
    // Select optimal model based on requirements - defaulting to mini for speed & cost
    let selectedModel = 'gpt-4o-mini-transcribe'; // Default: fast, cheap, and accurate!
    if (req.body.model) {
      if (['gpt-4o-transcribe', 'gpt-4o-mini-transcribe', 'whisper-1'].includes(req.body.model)) {
        selectedModel = req.body.model;
      }
    } else {
      // Keep mini as default for most cases - it's 50% cheaper and fast!
      // Only upgrade to full gpt-4o for special requirements
      if (req.body.includeLogProbs) { // Log probs available on both GPT-4o models
        selectedModel = 'gpt-4o-mini-transcribe'; // Mini supports logprobs too!
      }
      // Only use full gpt-4o-transcribe for very demanding use cases
      if (audioBuffer.length > 20 * 1024 * 1024) { // Only for very large files (>20MB)
        selectedModel = 'gpt-4o-transcribe';
      }
    }
    
    console.log('🎤 Processing audio with OpenAI transcription...', {
      audioSize: audioBuffer.length,
      audioFormat: audioFormat,
      language: req.body.language,
      model: selectedModel,
      filename: filename
    });
    
    // Use OpenAI SDK for reliable multipart handling
    console.log('🔧 Using OpenAI SDK for transcription...');
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });
    
    // Create a File-like object for the SDK
    const audioFile = new File([audioBuffer], filename, { type: contentType });
    
    console.log('🔧 Sending request via OpenAI SDK...', {
      filename,
      contentType,
      bufferLength: audioBuffer.length,
      language: req.body.language,
      model: selectedModel
    });
    
    // Build transcription parameters based on model capabilities
    const transcriptionParams = {
      file: audioFile,
      model: selectedModel
    };
    
    // GPT-4o models only support JSON response format
    if (selectedModel.includes('gpt-4o')) {
      transcriptionParams.response_format = 'json';
      
      // Add chunking strategy for better accuracy (GPT-4o models only)
      if (req.body.chunkingStrategy) {
        transcriptionParams.chunking_strategy = req.body.chunkingStrategy;
      } else {
        transcriptionParams.chunking_strategy = 'auto'; // Use voice activity detection
      }
      
      // Add log probabilities if requested (GPT-4o models only)
      if (req.body.includeLogProbs) {
        transcriptionParams.include = ['logprobs'];
      }
      
      // Temperature for consistency (GPT-4o models)
      if (req.body.temperature !== undefined) {
        transcriptionParams.temperature = Math.max(0, Math.min(1, req.body.temperature));
      }
    } else {
      // Whisper-1 model supports multiple response formats
      transcriptionParams.response_format = req.body.responseFormat || 'json';
      
      // Add language if specified (all models)
      if (req.body.language && req.body.language !== 'auto') {
        transcriptionParams.language = req.body.language;
      }
      
      // Add prompt for context (whisper-1 only)
      if (req.body.prompt) {
        transcriptionParams.prompt = req.body.prompt;
      }
    }
    
    const data = await openai.audio.transcriptions.create(transcriptionParams);
    
    console.log('🔧 OpenAI SDK response received successfully');
    
    // Build response based on model and requested features
    const response = {
      transcription: data.text,
      model: selectedModel,
      language: data.language || req.body.language || 'en'
    };
    
    // Add confidence score (simulate for models that don't provide it)
    if (data.confidence !== undefined) {
      response.confidence = data.confidence;
    } else {
      // Estimate confidence based on text length and model
      const textLength = data.text?.length || 0;
      if (selectedModel.includes('gpt-4o')) {
        response.confidence = Math.min(0.95, 0.7 + (textLength * 0.001)); // GPT-4o models are generally more accurate
      } else {
        response.confidence = Math.min(0.9, 0.6 + (textLength * 0.001));
      }
    }
    
    // Add log probabilities if available
    if (data.logprobs) {
      response.logprobs = data.logprobs;
    }
    
    // Add segments if available (verbose response)
    if (data.segments) {
      response.segments = data.segments;
    }
    
    // Add processing metadata
    response.processing = {
      audioSizeBytes: audioBuffer.length,
      audioFormat: audioFormat,
      chunkingStrategy: transcriptionParams.chunking_strategy,
      processingTime: new Date().toISOString()
    };
    
    console.log('✅ Audio transcribed successfully with', selectedModel);
    return res.json(response);

  } catch (error) {
    console.error('❌ Whisper transcription error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      requestBody: {
        hasAudioData: !!(req.body && req.body.audioData),
        audioDataLength: req.body && req.body.audioData ? req.body.audioData.length : 0,
        audioFormat: req.body ? req.body.audioFormat : 'none',
        model: req.body ? req.body.model : 'auto'
      },
      environment: {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
      },
      timestamp: new Date().toISOString()
    });
    
    // Enhanced error handling with specific error types
    let errorMessage = 'Transcription failed';
    let statusCode = 500;
    
    if (error.message?.includes('model') || error.message?.includes('gpt-4o')) {
      errorMessage = 'Model not available. Falling back to whisper-1.';
      statusCode = 503;
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message?.includes('invalid')) {
      errorMessage = 'Invalid audio format or parameters.';
      statusCode = 400;
    }
    
    return res.status(statusCode).json({ 
      error: errorMessage, 
      message: error.message,
      type: error.name,
      debug: {
        timestamp: new Date().toISOString(),
        hasAudioData: !!(req.body && req.body.audioData),
        audioDataLength: req.body && req.body.audioData ? req.body.audioData.length : 0,
        requestedModel: req.body?.model || 'auto-select',
        hasApiKey: !!process.env.OPENAI_API_KEY
      },
      fallback: 'browser-speech-recognition',
      retryWithWhisper1: statusCode === 503 // Suggest fallback to whisper-1 if GPT-4o unavailable
    });
  }
});

// AI Processing API endpoint (secure server-side OpenRouter proxy)
app.post('/api/ai/process-brain-dump', async (req, res) => {
  try {
    const { content, timestamp } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

    // If no API key, fallback to simulation
    if (!OPENROUTER_API_KEY) {
      console.warn('OpenRouter API key not found, using simulation fallback');
      const result = simulateAIProcessing(content);
      return res.status(200).json(result);
    }

    console.log('🤖 Processing brain dump with GPT-5 Nano...');

    // Call OpenRouter API securely from server
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [{
          role: 'system',
          content: getAISystemPrompt()
        }, {
          role: 'user', 
          content: content
        }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      // Fallback to simulation on API error
      const result = simulateAIProcessing(content);
      return res.status(200).json(result);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(aiResponse);
      const result = {
        ...parsed,
        processingTimestamp: new Date().toISOString(),
        aiModel: 'gpt-5-nano'
      };
      
      console.log('✅ Brain dump processed successfully with AI');
      return res.status(200).json(result);
    } catch (parseError) {
      console.warn('AI response not valid JSON, falling back to simulation');
      const result = simulateAIProcessing(content);
      return res.status(200).json(result);
    }

  } catch (error) {
    console.error('❌ AI processing error:', error);
    
    // Always provide fallback simulation on error
    try {
      const result = simulateAIProcessing(req.body.content || '');
      return res.status(200).json(result);
    } catch (fallbackError) {
      return res.status(500).json({ error: 'AI processing failed' });
    }
  }
});

// AI helper functions
function getAISystemPrompt() {
  return `You are an expert AI assistant specialized in analyzing brain dumps and creating optimal daily schedules for employees.

CORE RESPONSIBILITIES:
1. Parse unstructured thoughts into clear, actionable tasks with proper grammar and formatting
2. Assign realistic priorities based on context and urgency indicators  
3. Provide accurate time estimates based on task complexity and employee productivity patterns
4. Categorize tasks into relevant professional categories
5. Extract meaningful tags that enhance organization and searchability
6. Break down complex tasks into manageable micro-tasks when beneficial
7. Create optimal time blocks considering energy levels, task complexity, and deadlines
8. Suggest ideal scheduling times based on task type and priority
9. Use proper capitalization and professional language throughout

OPTIMAL SCHEDULING PRINCIPLES:
- Schedule high-cognitive tasks during peak focus hours (typically 9AM-11AM, 2PM-4PM)
- Group similar tasks together to minimize context switching
- Place urgent/important tasks in morning slots when energy is highest
- Buffer time between meetings and complex tasks
- Consider task dependencies and logical workflow
- Account for collaboration requirements and team availability
- Suggest realistic daily workload (6-7 productive hours)

PRIORITY ASSIGNMENT LOGIC:
- "Urgent": Critical issues, emergencies, immediate deadlines, blocking other work
- "High": Important deliverables, upcoming deadlines, key stakeholder requests  
- "Medium": Standard work items, planned features, regular maintenance
- "Low": Nice-to-have features, optimization tasks, long-term improvements

CATEGORY DEFINITIONS:
- "Development": Code writing, programming, technical implementation
- "Design": UI/UX design, wireframes, mockups, visual assets
- "Testing": QA testing, debugging, code review, validation
- "Research": Investigation, analysis, learning, competitive research  
- "Documentation": Writing docs, technical specs, user guides
- "Meeting": Calls, discussions, presentations, planning sessions
- "Deployment": Release management, CI/CD, infrastructure, monitoring
- "General": Administrative tasks, planning, organization

TAG GUIDELINES:
- Use Title Case for all tags (e.g., "Frontend", "API Integration", "User Experience")
- Keep tags concise but descriptive (2-3 words max)
- Focus on technology, feature area, or skill type
- Avoid redundant tags that duplicate the category

FORMATTING REQUIREMENTS:
- All task titles must be properly capitalized and professional
- Descriptions should be clear, specific, and actionable
- Micro-tasks should be concrete steps, not vague suggestions
- Use consistent terminology and avoid abbreviations

Return a JSON object with this exact structure:
{
  "originalContent": "preserved original input",
  "extractedTasks": [{
    "id": "task-[timestamp]-[random]",
    "title": "Professional Task Title (max 60 chars)",
    "description": "Clear, detailed description of what needs to be done and why",
    "priority": "Urgent|High|Medium|Low", 
    "estimatedHours": 2.5,
    "category": "Development|Design|Testing|Research|Documentation|Meeting|Deployment|General",
    "tags": ["Title Case Tag", "Another Tag"],
    "microTasks": ["Specific actionable step 1", "Specific actionable step 2"],
    "optimalTimeSlot": "9:00 AM - 11:00 AM",
    "energyLevel": "High|Medium|Low",
    "focusType": "Deep Work|Collaboration|Administrative",
    "dependencies": ["Optional dependency task IDs"],
    "suggestedDay": "Today|Tomorrow|This Week"
  }],
  "dailySchedule": {
    "totalEstimatedHours": 6.5,
    "workloadAssessment": "Optimal|Heavy|Light",
    "recommendedOrder": ["task-id-1", "task-id-2", "task-id-3"],
    "timeBlocks": [{
      "time": "9:00 AM - 11:00 AM",
      "taskId": "task-id-1",
      "rationale": "High-focus morning slot for complex cognitive work"
    }]
  },
  "summary": "Professional summary highlighting key tasks, total time, and scheduling rationale"
}

CRITICAL: Return ONLY the JSON object. No additional text, explanations, or formatting.`;
}

function simulateAIProcessing(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const tasks = [];
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) return;
    
    if (isTaskLike(trimmedLine)) {
      const priority = determinePriority(trimmedLine);
      const estimatedTime = Math.random() * 4 + 1;
      
      tasks.push({
        id: generateSimpleId(),
        title: extractSimpleTitle(trimmedLine),
        description: trimmedLine,
        priority,
        estimatedHours: Math.round(estimatedTime * 10) / 10,
        category: 'general',
        tags: [],
        microTasks: []
      });
    }
  });

  if (tasks.length === 0) {
    tasks.push({
      id: generateSimpleId(),
      title: extractSimpleTitle(content.substring(0, 50)),
      description: content,
      priority: 'medium',
      estimatedHours: 2,
      category: 'general',
      tags: [],
      microTasks: []
    });
  }

  return {
    originalContent: content,
    extractedTasks: tasks,
    summary: `Identified ${tasks.length} actionable tasks. Estimated total time: ${Math.round(tasks.reduce((sum, task) => sum + task.estimatedHours, 0) * 10) / 10} hours.`,
    processingTimestamp: new Date().toISOString(),
    aiModel: 'simulation-fallback'
  };
}

function isTaskLike(text) {
  const taskIndicators = [
    'need to', 'have to', 'should', 'must', 'create', 'build', 'implement',
    'fix', 'update', 'review', 'test', 'deploy', 'setup', 'configure',
    'design', 'research', 'analyze', 'write', 'document', 'plan'
  ];
  
  const lowerText = text.toLowerCase();
  return taskIndicators.some(indicator => lowerText.includes(indicator));
}

function determinePriority(text) {
  const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'blocking'];
  const highWords = ['important', 'priority', 'soon', 'deadline', 'milestone'];
  const lowWords = ['low priority', 'when time', 'eventually', 'nice to have', 'optional'];
  
  const lowerText = text.toLowerCase();
  
  if (urgentWords.some(word => lowerText.includes(word))) return 'Urgent';
  if (highWords.some(word => lowerText.includes(word))) return 'High';
  if (lowWords.some(word => lowerText.includes(word))) return 'Low';
  
  return 'Medium';
}

function extractSimpleTitle(text) {
  const cleaned = text.replace(/[^\w\s]/g, ' ').trim();
  const words = cleaned.split(/\s+/).slice(0, 6);
  const title = words.join(' ').substring(0, 50);
  
  // Proper title case formatting
  return title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function generateSimpleId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint for Railway
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { createPool } = await import('mysql2/promise');
    const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
    
    if (connectionString) {
      const url = new URL(connectionString);
      const pool = createPool({
        host: url.hostname,
        port: url.port ? parseInt(url.port) : 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1),
        acquireTimeout: 10000
      });
      
      const [rows] = await pool.execute('SELECT 1 as test');
      await pool.end();
      
      res.json({ 
        status: 'ok', 
        auth: 'better-auth working',
        database: 'connected',
        tables_check: 'run /api/check-db for details'
      });
    } else {
      res.json({ 
        status: 'ok', 
        auth: 'better-auth working',
        database: 'no connection string'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      auth: 'better-auth working',
      database: 'connection failed',
      error: error.message
    });
  }
});

// Database check endpoint
app.get('/api/check-db', async (req, res) => {
  try {
    const { createPool } = await import('mysql2/promise');
    const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
    
    if (!connectionString) {
      return res.json({ error: 'No database connection string' });
    }
    
    const url = new URL(connectionString);
    const pool = createPool({
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1)
    });
    
    // Check if tables exist
    const [tables] = await pool.execute("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    const checks = {};
    for (const tableName of ['user', 'account', 'session', 'verification']) {
      if (tableNames.includes(tableName)) {
        const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
        const [count] = await pool.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        checks[tableName] = {
          exists: true,
          columns: columns.map(col => col.Field),
          count: count[0].count
        };
      } else {
        checks[tableName] = { exists: false };
      }
    }
    
    await pool.end();
    
    res.json({
      database: 'connected',
      tables: checks,
      allTables: tableNames
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Database check failed',
      message: error.message
    });
  }
});

// User cleanup/reset endpoint for debugging
app.post('/api/reset-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const { createPool } = await import('mysql2/promise');
    const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
    
    if (!connectionString) {
      return res.status(500).json({ error: 'No database connection' });
    }
    
    const url = new URL(connectionString);
    const pool = createPool({
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1)
    });

    // Check if user exists
    const [users] = await pool.execute('SELECT id, email, name FROM user WHERE email = ?', [email]);
    
    if (users.length === 0) {
      await pool.end();
      return res.json({ message: 'User not found', email });
    }

    const user = users[0];
    
    // Check account records
    const [accounts] = await pool.execute('SELECT * FROM account WHERE userId = ?', [user.id]);
    
    // Check session records
    const [sessions] = await pool.execute('SELECT * FROM session WHERE userId = ?', [user.id]);

    // Delete all related records for clean slate
    await pool.execute('DELETE FROM session WHERE userId = ?', [user.id]);
    await pool.execute('DELETE FROM account WHERE userId = ?', [user.id]);
    await pool.execute('DELETE FROM user WHERE id = ?', [user.id]);
    
    await pool.end();

    res.json({ 
      message: 'User and all related records deleted successfully', 
      email,
      deletedRecords: {
        user: 1,
        accounts: accounts.length,
        sessions: sessions.length
      }
    });
    
  } catch (error) {
    console.error('❌ User reset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Shared database pool for reuse
let sharedDbPool = null;

async function getDbPool() {
  if (!sharedDbPool) {
    const { createPool } = await import('mysql2/promise');
    const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('No database connection string available');
    }
    
    const url = new URL(connectionString);
    sharedDbPool = createPool({
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      // Production optimizations
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 30000,
      timeout: 30000,
      reconnect: true,
      idleTimeout: 300000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return sharedDbPool;
}

// Save brain dump tasks to database with optimal scheduling
app.post('/api/brain-dump/save-tasks', async (req, res) => {
  try {
    const { extractedTasks, dailySchedule, userId } = req.body;

    if (!extractedTasks || !userId) {
      return res.status(400).json({ error: 'extractedTasks and userId are required' });
    }

    const pool = await getDbPool();
    const savedTasks = [];
    const savedEvents = [];

    // Begin transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Save tasks to macro_tasks table
      for (const task of extractedTasks) {
        const taskId = task.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert into macro_tasks
        await connection.execute(
          `INSERT INTO macro_tasks (
            id, title, description, userId, createdBy, priority, estimatedHours, 
            status, category, tags, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'not_started', ?, ?, NOW())`,
          [
            taskId,
            task.title,
            task.description,
            userId,
            userId,
            task.priority,
            task.estimatedHours,
            task.category,
            JSON.stringify({
              tags: task.tags || [],
              microTasks: task.microTasks || [],
              energyLevel: task.energyLevel,
              focusType: task.focusType,
              optimalTimeSlot: task.optimalTimeSlot,
              suggestedDay: task.suggestedDay
            })
          ]
        );

        savedTasks.push({
          id: taskId,
          ...task
        });

        // Create calendar event for optimal time slot if specified
        if (task.optimalTimeSlot && dailySchedule?.timeBlocks) {
          const timeBlock = dailySchedule.timeBlocks.find(block => block.taskId === task.id);
          if (timeBlock) {
            const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const today = new Date();
            const [startTime, endTime] = parseTimeSlot(timeBlock.time);
            
            await connection.execute(
              `INSERT INTO calendar_events (
                id, userId, title, description, startTime, endTime, type, taskId, 
                color, createdAt
              ) VALUES (?, ?, ?, ?, ?, ?, 'task', ?, '#6366f1', NOW())`,
              [
                eventId,
                userId,
                `🎯 ${task.title}`,
                `${task.description}\n\nRationale: ${timeBlock.rationale}`,
                formatDateTime(today, startTime),
                formatDateTime(today, endTime),
                taskId
              ]
            );

            savedEvents.push({
              id: eventId,
              taskId: taskId,
              timeSlot: timeBlock.time,
              rationale: timeBlock.rationale
            });
          }
        }
      }

      // Save brain dump record
      const brainDumpId = `dump-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await connection.execute(
        `INSERT INTO brain_dumps (
          id, userId, rawContent, processedContent, processingStatus, 
          aiModel, processedAt, createdAt
        ) VALUES (?, ?, ?, ?, 'completed', 'ai-scheduler', NOW(), NOW())`,
        [
          brainDumpId,
          userId,
          req.body.originalContent || '',
          JSON.stringify({
            extractedTasks,
            dailySchedule,
            savedAt: new Date().toISOString()
          })
        ]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Tasks and schedule saved successfully',
        data: {
          brainDumpId,
          savedTasks,
          savedEvents,
          dailySchedule,
          totalTasksCreated: savedTasks.length,
          totalEventsCreated: savedEvents.length
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Brain dump save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for calendar event creation
function parseTimeSlot(timeSlot) {
  const [start, end] = timeSlot.split(' - ');
  return [parseTime(start), parseTime(end)];
}

function parseTime(timeStr) {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  return { hours: hour24, minutes: minutes || 0 };
}

function formatDateTime(date, time) {
  const newDate = new Date(date);
  newDate.setHours(time.hours, time.minutes, 0, 0);
  return newDate.toISOString().slice(0, 19).replace('T', ' ');
}

// Time logs API endpoint
app.post('/api/time-logs', async (req, res) => {
  try {
    const { taskId, userId, startTime, endTime, duration, type, description, isBillable, hourlyRate, earnings } = req.body;

    if (!userId || !duration) {
      return res.status(400).json({ error: 'userId and duration are required' });
    }

    const pool = await getDbPool();

    // Generate UUID for time log
    const timeLogId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert time log
    await pool.execute(
      `INSERT INTO time_logs (id, taskId, userId, startTime, endTime, duration, type, description, isBillable, hourlyRate, earnings, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [timeLogId, taskId, userId, startTime, endTime, duration, type || 'work', description, isBillable || false, hourlyRate, earnings]
    );

    res.json({ 
      success: true, 
      id: timeLogId,
      message: 'Time log saved successfully',
      data: {
        id: timeLogId,
        taskId,
        userId,
        duration,
        type,
        description,
        earnings
      }
    });
    
  } catch (error) {
    console.error('❌ Time log save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Database initialization endpoint (for production)
app.post('/api/init-db', async (req, res) => {
  try {
    const { createPool } = await import('mysql2/promise');
    
    const connectionString = process.env.DATABASE_URL || 
      process.env.VITE_DATABASE_URL || 
      "mysql://root:password@localhost:3306/vebtask";

    const url = new URL(connectionString);
    const dbConfig = {
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
    };

    const pool = createPool(dbConfig);

    console.log('🔄 Initializing database tables...');
    
    // Drop existing tables in correct order (reverse foreign key dependency)
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('DROP TABLE IF EXISTS verification');
    await pool.execute('DROP TABLE IF EXISTS session');  
    await pool.execute('DROP TABLE IF EXISTS account');
    await pool.execute('DROP TABLE IF EXISTS user');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Create user table
    await pool.execute(`
      CREATE TABLE user (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        emailVerified BOOLEAN DEFAULT FALSE,
        name VARCHAR(255),
        image VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create session table
    await pool.execute(`
      CREATE TABLE session (
        id VARCHAR(255) PRIMARY KEY,
        expiresAt TIMESTAMP NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        userId VARCHAR(36) NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    // Create account table
    await pool.execute(`
      CREATE TABLE account (
        id VARCHAR(36) PRIMARY KEY,
        accountId VARCHAR(255) NOT NULL,
        providerId VARCHAR(255) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt TIMESTAMP NULL,
        refreshTokenExpiresAt TIMESTAMP NULL,
        scope TEXT,
        password VARCHAR(255),
        salt VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
        UNIQUE KEY unique_provider_account (providerId, accountId)
      )
    `);

    // Create verification table
    await pool.execute(`
      CREATE TABLE verification (
        id VARCHAR(36) PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.end();

    console.log('✅ Database initialized successfully');
    res.json({ success: true, message: 'Database initialized successfully' });
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the React app for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  // Skip API routes - they should return JSON, not HTML
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found', path: req.path });
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔐 Auth endpoints available at /api/auth/*`);
  console.log(`📱 React app available at /`);
});