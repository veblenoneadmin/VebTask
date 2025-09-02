import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

// Import new route modules
import authRoutes from './src/routes/auth.js';
import organizationRoutes from './src/routes/organizations.js';
import memberRoutes from './src/routes/members.js';
import inviteRoutes from './src/routes/invites.js';
import wizardRoutes from './src/routes/wizard.js';

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
app.use('/api/auth', (req, res, next) => {
  console.log(`🔐 Auth ${req.method} ${req.originalUrl}`, {
    path: req.path,
    fullUrl: req.url,
    query: req.query,
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
// Create the handler once
const authHandler = toNodeHandler(auth);

// Handle the /api/auth root path
app.get("/api/auth", (req, res) => {
  res.json({
    status: "ok",
    message: "Better Auth API",
    endpoints: [
      "/api/auth/sign-in/social",
      "/api/auth/callback/google",
      "/api/auth/get-session",
      "/api/auth/sign-out"
    ]
  });
});

// Use a catch-all route for Better Auth sub-paths
app.all("/api/auth/*", (req, res) => {
  // Better Auth's toNodeHandler expects to handle the request/response directly
  return authHandler(req, res);
});

// ==================== USER AUTHENTICATION MIDDLEWARE ====================

// Middleware to extract user from Better Auth session
app.use('/api', async (req, res, next) => {
  try {
    // Skip auth for public endpoints
    const publicEndpoints = [
      '/api/auth/',
      '/api/invites/accept',
      '/api/invites/',
      '/api/ai/',
      '/test'
    ];

    const isPublicEndpoint = publicEndpoints.some(endpoint => req.path.startsWith(endpoint));
    if (isPublicEndpoint) {
      return next();
    }

    // Try to get user from Better Auth session
    const request = {
      headers: req.headers,
      method: req.method,
      url: req.url
    };

    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user) {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image
        };
      }
    } catch (authError) {
      // Session might be expired or invalid, continue without user
      console.log('⚠️  Auth session check failed:', authError.message);
    }

    next();
  } catch (error) {
    console.error('❌ User auth middleware error:', error);
    next();
  }
});

// ==================== NEW API ROUTES ====================

// Organization management routes
app.use('/api/organizations', organizationRoutes);

// Member management routes (nested under organizations)
app.use('/api/organizations', memberRoutes);

// Invite system routes
app.use('/api', inviteRoutes);

// Wizard/onboarding routes
app.use('/api/wizard', wizardRoutes);

// Additional custom auth routes (password reset, etc.)
// Note: Better Auth routes are handled above
app.use('/api/auth', authRoutes);

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
    
    // Use whisper-1 by default for maximum compatibility
    let selectedModel = 'whisper-1';
    
    // Allow explicit model selection if requested
    if (req.body.model && ['gpt-4o-transcribe', 'gpt-4o-mini-transcribe', 'whisper-1'].includes(req.body.model)) {
      selectedModel = req.body.model;
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
    
    // Build transcription parameters - simplified for whisper-1 focus
    const transcriptionParams = {
      file: audioFile,
      model: selectedModel,
      response_format: 'json'
    };
    
    // Add language if specified
    if (req.body.language && req.body.language !== 'auto') {
      transcriptionParams.language = req.body.language;
    }
    
    // Add prompt for context if provided
    if (req.body.prompt) {
      transcriptionParams.prompt = req.body.prompt;
    }
    
    // GPT-4o specific features (if model is available)
    if (selectedModel.includes('gpt-4o')) {
      if (req.body.chunkingStrategy) {
        transcriptionParams.chunking_strategy = req.body.chunkingStrategy;
      } else {
        transcriptionParams.chunking_strategy = 'auto';
      }
      
      if (req.body.includeLogProbs) {
        transcriptionParams.include = ['logprobs'];
      }
      
      if (req.body.temperature !== undefined) {
        transcriptionParams.temperature = Math.max(0, Math.min(1, req.body.temperature));
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
    
    // Simple error handling - let client handle fallback to browser speech recognition
    let errorMessage = 'Transcription failed';
    let statusCode = 500;
    
    if (error.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message?.includes('model') || error.message?.includes('gpt-4o')) {
      errorMessage = 'Requested model not available. Using whisper-1 as fallback.';
      statusCode = 503;
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

// Auth configuration endpoint
app.get('/api/auth-config', (req, res) => {
  res.json({
    googleOAuthEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    emailVerificationEnabled: true
  });
});

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

    // Handle null values properly
    const safeTaskId = taskId || null;
    const safeStartTime = startTime || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const safeEndTime = endTime || null;
    const safeType = type || 'work';
    const safeDescription = description || null;
    const safeIsBillable = isBillable || false;
    const safeHourlyRate = hourlyRate || null;
    const safeEarnings = earnings || null;

    // Insert time log
    await pool.execute(
      `INSERT INTO time_logs (id, taskId, userId, startTime, endTime, duration, type, description, isBillable, hourlyRate, earnings, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [timeLogId, safeTaskId, userId, safeStartTime, safeEndTime, duration, safeType, safeDescription, safeIsBillable, safeHourlyRate, safeEarnings]
    );

    res.json({ 
      success: true, 
      id: timeLogId,
      message: 'Time log saved successfully',
      data: {
        id: timeLogId,
        taskId: safeTaskId,
        userId,
        startTime: safeStartTime,
        endTime: safeEndTime,
        duration,
        type: safeType,
        description: safeDescription,
        isBillable: safeIsBillable,
        hourlyRate: safeHourlyRate,
        earnings: safeEarnings
      }
    });
    
  } catch (error) {
    console.error('❌ Time log save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's tasks endpoint
app.get('/api/tasks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    const pool = await getDbPool();
    
    let query = `
      SELECT id, title, description, priority, estimatedHours, actualHours, 
             status, category, tags, dueDate, completedAt, createdAt, updatedAt
      FROM macro_tasks 
      WHERE userId = ?
    `;
    const params = [userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [tasks] = await pool.execute(query, params);
    
    // Parse JSON tags for each task
    const formattedTasks = tasks.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : {}
    }));
    
    res.json({
      success: true,
      tasks: formattedTasks,
      count: formattedTasks.length
    });
    
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update task status endpoint
app.patch('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, actualHours, completedAt } = req.body;

    const pool = await getDbPool();
    
    let query = 'UPDATE macro_tasks SET updatedAt = NOW()';
    const params = [];
    
    if (status) {
      query += ', status = ?';
      params.push(status);
      
      if (status === 'completed' && !completedAt) {
        query += ', completedAt = NOW()';
      }
    }
    
    if (actualHours !== undefined) {
      query += ', actualHours = ?';
      params.push(actualHours);
    }
    
    if (completedAt) {
      query += ', completedAt = ?';
      params.push(completedAt);
    }
    
    query += ' WHERE id = ?';
    params.push(taskId);
    
    const [result] = await pool.execute(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({
      success: true,
      message: 'Task updated successfully',
      taskId
    });
    
  } catch (error) {
    console.error('❌ Update task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's brain dump history
app.get('/api/brain-dumps/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const pool = await getDbPool();
    
    const [dumps] = await pool.execute(`
      SELECT id, rawContent, processingStatus, aiModel, processedAt, createdAt,
             JSON_LENGTH(processedContent, '$.extractedTasks') as taskCount
      FROM brain_dumps 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      brainDumps: dumps,
      count: dumps.length
    });
    
  } catch (error) {
    console.error('❌ Get brain dumps error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CALENDAR API ENDPOINTS ====================

// Get calendar events for a user
app.get('/api/calendar/events/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, type, limit = 100 } = req.query;

    const pool = await getDbPool();
    
    let query = `
      SELECT ce.*, mt.title as taskTitle, mt.description as taskDescription
      FROM calendar_events ce
      LEFT JOIN macro_tasks mt ON ce.taskId = mt.id
      WHERE ce.userId = ?
    `;
    const params = [userId];
    
    if (startDate && endDate) {
      query += ' AND ce.startTime BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (type) {
      query += ' AND ce.type = ?';
      params.push(type);
    }
    
    query += ` ORDER BY ce.startTime ASC LIMIT ${parseInt(limit) || 100}`;
    
    const [events] = await pool.execute(query, params);
    
    // Parse JSON fields and format response
    const formattedEvents = events.map(event => {
      let recurringPattern = null;
      let attendees = [];
      
      // Safe JSON parsing
      try {
        recurringPattern = event.recurringPattern && event.recurringPattern !== '' 
          ? JSON.parse(event.recurringPattern) 
          : null;
      } catch (e) {
        console.warn('Failed to parse recurringPattern:', event.recurringPattern);
        recurringPattern = null;
      }
      
      try {
        attendees = event.attendees && event.attendees !== '' 
          ? JSON.parse(event.attendees) 
          : [];
      } catch (e) {
        console.warn('Failed to parse attendees:', event.attendees);
        attendees = [];
      }
      
      return {
        ...event,
        recurringPattern,
        attendees,
        startTime: new Date(event.startTime).toISOString(),
        endTime: new Date(event.endTime).toISOString()
      };
    });
    
    res.json({
      success: true,
      events: formattedEvents,
      count: formattedEvents.length
    });
    
  } catch (error) {
    console.error('❌ Get calendar events error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new calendar event
app.post('/api/calendar/events', async (req, res) => {
  try {
    const { 
      userId, title, description, startTime, endTime, type, taskId, 
      color, location, attendees, isRecurring, recurringPattern, status 
    } = req.body;

    if (!userId || !title || !startTime || !endTime) {
      return res.status(400).json({ error: 'userId, title, startTime, and endTime are required' });
    }

    const pool = await getDbPool();
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Format datetime for MySQL
    const formatDateTime = (dt) => dt.toISOString().slice(0, 19).replace('T', ' ');
    
    await pool.execute(`
      INSERT INTO calendar_events (
        id, userId, title, description, startTime, endTime, type, taskId,
        color, location, attendees, isRecurring, recurringPattern, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      eventId, userId, title, description || null, 
      formatDateTime(start), formatDateTime(end),
      type || 'personal', taskId || null, color || '#6366f1',
      location || null, attendees ? JSON.stringify(attendees) : null,
      isRecurring || false, recurringPattern ? JSON.stringify(recurringPattern) : null,
      status || 'scheduled'
    ]);
    
    // If it's a recurring event, create recurring instances
    if (isRecurring && recurringPattern) {
      await createRecurringEvents(pool, eventId, {
        userId, title, description, type, taskId, color, location, attendees, status
      }, start, end, recurringPattern);
    }
    
    res.json({
      success: true,
      message: 'Calendar event created successfully',
      eventId,
      isRecurring: isRecurring || false
    });
    
  } catch (error) {
    console.error('❌ Create calendar event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a calendar event
app.patch('/api/calendar/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      title, description, startTime, endTime, type, color, 
      location, attendees, status, updateRecurring 
    } = req.body;

    const pool = await getDbPool();
    
    let query = 'UPDATE calendar_events SET updatedAt = NOW()';
    const params = [];
    
    if (title) {
      query += ', title = ?';
      params.push(title);
    }
    
    if (description !== undefined) {
      query += ', description = ?';
      params.push(description);
    }
    
    if (startTime) {
      const start = new Date(startTime);
      query += ', startTime = ?';
      params.push(start.toISOString().slice(0, 19).replace('T', ' '));
    }
    
    if (endTime) {
      const end = new Date(endTime);
      query += ', endTime = ?';
      params.push(end.toISOString().slice(0, 19).replace('T', ' '));
    }
    
    if (type) {
      query += ', type = ?';
      params.push(type);
    }
    
    if (color) {
      query += ', color = ?';
      params.push(color);
    }
    
    if (location !== undefined) {
      query += ', location = ?';
      params.push(location);
    }
    
    if (attendees) {
      query += ', attendees = ?';
      params.push(JSON.stringify(attendees));
    }
    
    if (status) {
      query += ', status = ?';
      params.push(status);
    }
    
    query += ' WHERE id = ?';
    params.push(eventId);
    
    const [result] = await pool.execute(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Handle recurring event updates
    if (updateRecurring) {
      // Get the original event to find related recurring events
      const [events] = await pool.execute(
        'SELECT * FROM calendar_events WHERE id = ?', 
        [eventId]
      );
      
      if (events.length > 0 && events[0].isRecurring) {
        // Update all future instances of this recurring event
        await pool.execute(`
          UPDATE calendar_events 
          SET ${query.replace('WHERE id = ?', 'WHERE recurringPattern = ? AND startTime > ?')}
        `, [...params.slice(0, -1), events[0].recurringPattern, new Date()]);
      }
    }
    
    res.json({
      success: true,
      message: 'Calendar event updated successfully',
      eventId
    });
    
  } catch (error) {
    console.error('❌ Update calendar event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a calendar event
app.delete('/api/calendar/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { deleteRecurring } = req.query;

    const pool = await getDbPool();
    
    if (deleteRecurring === 'true') {
      // Get the event to check if it's recurring
      const [events] = await pool.execute(
        'SELECT recurringPattern FROM calendar_events WHERE id = ?', 
        [eventId]
      );
      
      if (events.length > 0 && events[0].recurringPattern) {
        // Delete all instances of this recurring event
        await pool.execute(
          'DELETE FROM calendar_events WHERE recurringPattern = ?', 
          [events[0].recurringPattern]
        );
      } else {
        // Just delete this single event
        await pool.execute('DELETE FROM calendar_events WHERE id = ?', [eventId]);
      }
    } else {
      // Delete only this single event
      const [result] = await pool.execute('DELETE FROM calendar_events WHERE id = ?', [eventId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
    }
    
    res.json({
      success: true,
      message: 'Calendar event deleted successfully',
      eventId
    });
    
  } catch (error) {
    console.error('❌ Delete calendar event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get calendar overview/stats for a user
app.get('/api/calendar/overview/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    const pool = await getDbPool();
    
    // Get stats for the specified month/year or current month
    const targetDate = month && year 
      ? new Date(parseInt(year), parseInt(month) - 1, 1)
      : new Date();
    
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
    
    // Get event counts by type
    const [eventStats] = await pool.execute(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM calendar_events 
      WHERE userId = ? AND startTime BETWEEN ? AND ?
      GROUP BY type
    `, [userId, startOfMonth, endOfMonth]);
    
    // Get daily event counts for the month
    const [dailyStats] = await pool.execute(`
      SELECT 
        DATE(startTime) as date,
        COUNT(*) as eventCount,
        GROUP_CONCAT(DISTINCT type) as types
      FROM calendar_events 
      WHERE userId = ? AND startTime BETWEEN ? AND ?
      GROUP BY DATE(startTime)
      ORDER BY date
    `, [userId, startOfMonth, endOfMonth]);
    
    // Get upcoming events (next 7 days)
    const [upcomingEvents] = await pool.execute(`
      SELECT id, title, startTime, endTime, type, color, location
      FROM calendar_events 
      WHERE userId = ? AND startTime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
      AND status != 'cancelled'
      ORDER BY startTime ASC
      LIMIT 10
    `, [userId]);
    
    res.json({
      success: true,
      overview: {
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
        eventStats: eventStats.reduce((acc, stat) => ({
          ...acc,
          [stat.type]: { count: stat.count, completed: stat.completed }
        }), {}),
        dailyStats,
        upcomingEvents: upcomingEvents.map(event => ({
          ...event,
          startTime: new Date(event.startTime).toISOString(),
          endTime: new Date(event.endTime).toISOString()
        })),
        totalEvents: eventStats.reduce((sum, stat) => sum + stat.count, 0)
      }
    });
    
  } catch (error) {
    console.error('❌ Get calendar overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create recurring events
async function createRecurringEvents(pool, parentEventId, eventData, startDate, endDate, pattern) {
  const { frequency, interval, endDate: patternEndDate, daysOfWeek } = pattern;
  
  if (!frequency || !interval) return;
  
  const maxRecurrences = 52; // Limit to 1 year of recurrences
  const patternEnd = patternEndDate ? new Date(patternEndDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  
  let currentStart = new Date(startDate);
  let currentEnd = new Date(endDate);
  let count = 0;
  
  while (count < maxRecurrences && currentStart <= patternEnd) {
    // Calculate next occurrence based on frequency
    switch (frequency) {
      case 'daily':
        currentStart.setDate(currentStart.getDate() + interval);
        currentEnd.setDate(currentEnd.getDate() + interval);
        break;
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          // Handle specific days of week
          const nextDay = getNextWeekday(currentStart, daysOfWeek, interval);
          const daysDiff = (nextDay.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000);
          currentEnd.setDate(currentEnd.getDate() + daysDiff);
          currentStart = nextDay;
        } else {
          currentStart.setDate(currentStart.getDate() + (7 * interval));
          currentEnd.setDate(currentEnd.getDate() + (7 * interval));
        }
        break;
      case 'monthly':
        currentStart.setMonth(currentStart.getMonth() + interval);
        currentEnd.setMonth(currentEnd.getMonth() + interval);
        break;
      default:
        return; // Unknown frequency
    }
    
    if (currentStart > patternEnd) break;
    
    // Create the recurring event instance
    const recurringEventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-r${count}`;
    
    await pool.execute(`
      INSERT INTO calendar_events (
        id, userId, title, description, startTime, endTime, type, taskId,
        color, location, attendees, isRecurring, recurringPattern, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      recurringEventId, eventData.userId, eventData.title, eventData.description,
      currentStart.toISOString().slice(0, 19).replace('T', ' '),
      currentEnd.toISOString().slice(0, 19).replace('T', ' '),
      eventData.type, eventData.taskId, eventData.color,
      eventData.location, eventData.attendees ? JSON.stringify(eventData.attendees) : null,
      true, JSON.stringify({ ...pattern, parentEventId }),
      eventData.status
    ]);
    
    count++;
  }
}

// Helper function to get next weekday for weekly recurring events
function getNextWeekday(currentDate, daysOfWeek, weekInterval) {
  const current = new Date(currentDate);
  const currentDay = current.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Find next day in the daysOfWeek array
  const sortedDays = daysOfWeek.sort((a, b) => a - b);
  let nextDay = sortedDays.find(day => day > currentDay);
  
  if (!nextDay) {
    // No more days this week, go to first day of next week cycle
    nextDay = sortedDays[0];
    current.setDate(current.getDate() + (7 * weekInterval) + (nextDay - currentDay));
  } else {
    current.setDate(current.getDate() + (nextDay - currentDay));
  }
  
  return current;
}

// Database initialization endpoint (for production) - Complete schema
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

    console.log('🔄 Initializing complete database schema...');
    
    // Drop existing tables in correct order (reverse foreign key dependency)
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('DROP TABLE IF EXISTS calendar_events');
    await pool.execute('DROP TABLE IF EXISTS time_logs');
    await pool.execute('DROP TABLE IF EXISTS macro_tasks');
    await pool.execute('DROP TABLE IF EXISTS brain_dumps');
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

    // Create brain_dumps table for storing processed brain dump data
    await pool.execute(`
      CREATE TABLE brain_dumps (
        id VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        rawContent TEXT NOT NULL,
        processedContent JSON,
        processingStatus ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        aiModel VARCHAR(100),
        processedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
        INDEX idx_user_created (userId, createdAt),
        INDEX idx_status (processingStatus)
      )
    `);

    // Create macro_tasks table for storing extracted tasks from brain dumps
    await pool.execute(`
      CREATE TABLE macro_tasks (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        userId VARCHAR(36) NOT NULL,
        createdBy VARCHAR(36) NOT NULL,
        priority ENUM('Urgent', 'High', 'Medium', 'Low') DEFAULT 'Medium',
        estimatedHours DECIMAL(5,2) DEFAULT 0,
        actualHours DECIMAL(5,2) DEFAULT 0,
        status ENUM('not_started', 'in_progress', 'completed', 'cancelled') DEFAULT 'not_started',
        category VARCHAR(100) DEFAULT 'General',
        tags JSON,
        dueDate TIMESTAMP NULL,
        completedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES user(id) ON DELETE CASCADE,
        INDEX idx_user_status (userId, status),
        INDEX idx_priority (priority),
        INDEX idx_due_date (dueDate),
        FULLTEXT idx_search (title, description)
      )
    `);

    // Create time_logs table for tracking time spent on tasks
    await pool.execute(`
      CREATE TABLE time_logs (
        id VARCHAR(50) PRIMARY KEY,
        taskId VARCHAR(50),
        userId VARCHAR(36) NOT NULL,
        startTime TIMESTAMP NOT NULL,
        endTime TIMESTAMP NULL,
        duration INT NOT NULL COMMENT 'Duration in seconds',
        type ENUM('work', 'break', 'meeting', 'research', 'other') DEFAULT 'work',
        description TEXT,
        isBillable BOOLEAN DEFAULT FALSE,
        hourlyRate DECIMAL(10,2) NULL,
        earnings DECIMAL(10,2) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (taskId) REFERENCES macro_tasks(id) ON DELETE SET NULL,
        INDEX idx_user_date (userId, startTime),
        INDEX idx_task (taskId),
        INDEX idx_billable (isBillable)
      )
    `);

    // Create calendar_events table for scheduling tasks and events
    await pool.execute(`
      CREATE TABLE calendar_events (
        id VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        startTime TIMESTAMP NOT NULL,
        endTime TIMESTAMP NOT NULL,
        type ENUM('task', 'meeting', 'reminder', 'break', 'personal') DEFAULT 'task',
        taskId VARCHAR(50) NULL,
        color VARCHAR(20) DEFAULT '#6366f1',
        isRecurring BOOLEAN DEFAULT FALSE,
        recurringPattern JSON NULL,
        status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (taskId) REFERENCES macro_tasks(id) ON DELETE SET NULL,
        INDEX idx_user_time (userId, startTime, endTime),
        INDEX idx_task (taskId),
        INDEX idx_type (type)
      )
    `);

    await pool.end();

    console.log('✅ Complete database schema initialized successfully');
    res.json({ 
      success: true, 
      message: 'Complete database schema initialized successfully',
      tables: [
        'user', 'session', 'account', 'verification',
        'brain_dumps', 'macro_tasks', 'time_logs', 'calendar_events'
      ]
    });
    
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