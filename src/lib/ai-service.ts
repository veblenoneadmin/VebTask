// AI service for brain dump processing using OpenRouter/GPT
import { generateId } from './utils';

// Mock OpenRouter API - in production, replace with actual API calls
export class AIService {
  private static apiKey = process.env.VITE_OPENROUTER_API_KEY;
  private static baseURL = 'https://openrouter.ai/api/v1';

  static async processBrainDump(content: string): Promise<ProcessedBrainDump> {
    try {
      // For now, simulate AI processing with intelligent parsing
      // In production, this would call OpenRouter/GPT API
      return this.simulateAIProcessing(content);
      
      /* Production code would look like:
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: this.getSystemPrompt()
          }, {
            role: 'user', 
            content: content
          }],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
      */
    } catch (error) {
      console.error('AI processing error:', error);
      throw new Error('Failed to process brain dump with AI');
    }
  }

  private static simulateAIProcessing(content: string): ProcessedBrainDump {
    // Intelligent parsing logic that mimics AI processing
    const lines = content.split('\n').filter(line => line.trim());
    const tasks: ExtractedTask[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 5) return; // Skip very short lines
      
      // Detect task-like content
      if (this.isTaskLike(trimmedLine)) {
        const priority = this.determinePriority(trimmedLine);
        const estimatedTime = this.estimateTime(trimmedLine);
        const category = this.categorizeTask(trimmedLine);
        
        tasks.push({
          id: generateId(),
          title: this.extractTitle(trimmedLine),
          description: trimmedLine,
          priority,
          estimatedHours: estimatedTime,
          category,
          tags: this.extractTags(trimmedLine),
          microTasks: this.generateMicroTasks(trimmedLine)
        });
      }
    });

    // If no tasks detected, create one from the entire content
    if (tasks.length === 0) {
      tasks.push({
        id: generateId(),
        title: this.extractTitle(content.substring(0, 50)),
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
      summary: this.generateSummary(tasks),
      processingTimestamp: new Date().toISOString(),
      aiModel: 'gpt-3.5-turbo-simulated'
    };
  }

  private static isTaskLike(text: string): boolean {
    const taskIndicators = [
      'need to', 'have to', 'should', 'must', 'create', 'build', 'implement',
      'fix', 'update', 'review', 'test', 'deploy', 'setup', 'configure',
      'design', 'research', 'analyze', 'write', 'document', 'plan'
    ];
    
    const lowerText = text.toLowerCase();
    return taskIndicators.some(indicator => lowerText.includes(indicator));
  }

  private static determinePriority(text: string): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    const highWords = ['important', 'priority', 'soon', 'deadline'];
    
    const lowerText = text.toLowerCase();
    
    if (urgentWords.some(word => lowerText.includes(word))) return 'urgent';
    if (highWords.some(word => lowerText.includes(word))) return 'high';
    if (lowerText.includes('low priority') || lowerText.includes('when time')) return 'low';
    
    return 'medium';
  }

  private static estimateTime(text: string): number {
    const timeMatches = text.match(/(\d+)\s*(hour|hr|minute|min)/gi);
    if (timeMatches) {
      const match = timeMatches[0];
      const value = parseInt(match.match(/\d+/)?.[0] || '0');
      const unit = match.toLowerCase();
      
      if (unit.includes('hour') || unit.includes('hr')) {
        return value;
      } else if (unit.includes('minute') || unit.includes('min')) {
        return Math.max(0.25, value / 60);
      }
    }
    
    // Estimate based on complexity indicators
    const complexWords = ['integration', 'system', 'architecture', 'database', 'api'];
    const simpleWords = ['update', 'fix', 'change', 'add'];
    
    const lowerText = text.toLowerCase();
    
    if (complexWords.some(word => lowerText.includes(word))) {
      return Math.random() * 6 + 4; // 4-10 hours
    } else if (simpleWords.some(word => lowerText.includes(word))) {
      return Math.random() * 2 + 0.5; // 0.5-2.5 hours  
    }
    
    return Math.random() * 4 + 1; // 1-5 hours default
  }

  private static categorizeTask(text: string): string {
    const categories = {
      'development': ['code', 'implement', 'build', 'develop', 'programming'],
      'design': ['design', 'ui', 'ux', 'mockup', 'wireframe'],
      'testing': ['test', 'qa', 'debug', 'fix', 'bug'],
      'research': ['research', 'analyze', 'investigate', 'study'],
      'documentation': ['document', 'write', 'readme', 'docs'],
      'meeting': ['meeting', 'call', 'discussion', 'standup'],
      'deployment': ['deploy', 'release', 'publish', 'launch']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  private static extractTitle(text: string): string {
    // Extract meaningful title from text
    const cleaned = text.replace(/[^\w\s]/g, ' ').trim();
    const words = cleaned.split(/\s+/).slice(0, 6); // First 6 words
    return words.join(' ').substring(0, 50);
  }

  private static extractTags(text: string): string[] {
    const tags = [];
    const lowerText = text.toLowerCase();
    
    // Extract technology tags
    const techTags = ['react', 'node', 'python', 'api', 'database', 'frontend', 'backend'];
    techTags.forEach(tag => {
      if (lowerText.includes(tag)) tags.push(tag);
    });
    
    // Extract priority tags
    if (lowerText.includes('urgent')) tags.push('urgent');
    if (lowerText.includes('client')) tags.push('client');
    
    return tags;
  }

  private static generateMicroTasks(text: string): string[] {
    // Generate suggested micro-tasks based on the main task
    const microTasks = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('implement') || lowerText.includes('build')) {
      microTasks.push('Plan implementation approach');
      microTasks.push('Set up development environment');
      microTasks.push('Write initial code structure');
      microTasks.push('Test implementation');
    } else if (lowerText.includes('fix') || lowerText.includes('bug')) {
      microTasks.push('Reproduce the issue');
      microTasks.push('Identify root cause');
      microTasks.push('Implement fix');
      microTasks.push('Verify fix works');
    } else if (lowerText.includes('research')) {
      microTasks.push('Define research scope');
      microTasks.push('Gather information');
      microTasks.push('Analyze findings');
      microTasks.push('Document results');
    }
    
    return microTasks;
  }

  private static generateSummary(tasks: ExtractedTask[]): string {
    if (tasks.length === 0) return 'No actionable tasks identified.';
    
    const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    const categories = [...new Set(tasks.map(task => task.category))];
    const priorities = tasks.map(task => task.priority);
    const urgentCount = priorities.filter(p => p === 'urgent').length;
    const highCount = priorities.filter(p => p === 'high').length;
    
    return `Identified ${tasks.length} actionable tasks across ${categories.length} categories. ` +
           `Estimated total time: ${Math.round(totalHours * 10) / 10} hours. ` +
           `Priority breakdown: ${urgentCount} urgent, ${highCount} high priority tasks.`;
  }

  private static getSystemPrompt(): string {
    return `You are an AI assistant specialized in analyzing brain dumps and extracting actionable tasks. 

Your job is to:
1. Parse unstructured text/thoughts into organized, actionable tasks
2. Assign appropriate priorities (urgent, high, medium, low)
3. Estimate time requirements in hours
4. Categorize tasks by type (development, design, testing, etc.)
5. Extract relevant tags and keywords
6. Break complex tasks into micro-tasks when appropriate

Return a JSON object with this structure:
{
  "originalContent": "...",
  "extractedTasks": [{
    "id": "unique-id",
    "title": "Clear task title (max 50 chars)",
    "description": "Detailed description",
    "priority": "urgent|high|medium|low",
    "estimatedHours": 2.5,
    "category": "development|design|testing|research|documentation|meeting|deployment|general",
    "tags": ["tag1", "tag2"],
    "microTasks": ["subtask 1", "subtask 2"]
  }],
  "summary": "Brief summary of identified tasks",
  "processingTimestamp": "ISO timestamp",
  "aiModel": "gpt-3.5-turbo"
}

Be practical and actionable in your task extraction.`;
  }
}

// TypeScript interfaces
export interface ExtractedTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  category: string;
  tags: string[];
  microTasks: string[];
}

export interface ProcessedBrainDump {
  originalContent: string;
  extractedTasks: ExtractedTask[];
  summary: string;
  processingTimestamp: string;
  aiModel: string;
}