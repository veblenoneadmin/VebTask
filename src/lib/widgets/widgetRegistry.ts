import { widgetService } from './WidgetService';
import { Widget } from './WidgetInterface';

// Import widget components
import { StatWidget } from '../../components/widgets/StatWidget';
import { ActiveTimersWidget } from '../../components/widgets/ActiveTimersWidget';
import { RecentTasksWidget } from '../../components/widgets/RecentTasksWidget';

// Define all available widgets
const widgets: Widget[] = [
  // Statistics Widgets
  {
    id: 'tasks-completed-today',
    name: 'Tasks Completed Today',
    description: 'Number of tasks completed today',
    category: 'statistics',
    component: StatWidget,
    defaultConfig: {
      title: 'Completed Today',
      size: 'small',
      color: 'green',
      icon: 'check-circle',
      refreshInterval: 300 // 5 minutes
    },
    isConfigurable: true,
    permissions: ['view_tasks']
  },
  {
    id: 'total-time-today',
    name: 'Total Time Today',
    description: 'Total time tracked today',
    category: 'statistics',
    component: StatWidget,
    defaultConfig: {
      title: 'Time Today',
      size: 'small',
      color: 'blue',
      icon: 'clock',
      refreshInterval: 60 // 1 minute
    },
    isConfigurable: true,
    permissions: ['view_time_logs']
  },
  {
    id: 'active-projects',
    name: 'Active Projects',
    description: 'Number of active projects',
    category: 'statistics',
    component: StatWidget,
    defaultConfig: {
      title: 'Active Projects',
      size: 'small',
      color: 'purple',
      icon: 'folder',
      refreshInterval: 1800 // 30 minutes
    },
    isConfigurable: true,
    permissions: ['view_projects']
  },
  {
    id: 'team-members',
    name: 'Team Members',
    description: 'Number of team members in organization',
    category: 'statistics',
    component: StatWidget,
    defaultConfig: {
      title: 'Team Members',
      size: 'small',
      color: 'orange',
      icon: 'users',
      refreshInterval: 3600 // 1 hour
    },
    isConfigurable: true,
    permissions: ['view_members']
  },
  
  // Time Tracking Widgets
  {
    id: 'active-timers',
    name: 'Active Timers',
    description: 'Currently running time trackers',
    category: 'overview',
    component: ActiveTimersWidget,
    defaultConfig: {
      title: 'Active Timers',
      size: 'medium',
      color: 'blue',
      icon: 'timer',
      refreshInterval: 5 // 5 seconds for real-time updates
    },
    isConfigurable: true,
    permissions: ['view_time_logs', 'manage_time_logs']
  },
  
  // Task Management Widgets
  {
    id: 'recent-tasks',
    name: 'Recent Tasks',
    description: 'Recently worked on or due tasks',
    category: 'lists',
    component: RecentTasksWidget,
    defaultConfig: {
      title: 'Recent Tasks',
      size: 'medium',
      color: 'indigo',
      icon: 'list',
      refreshInterval: 300 // 5 minutes
    },
    isConfigurable: true,
    permissions: ['view_tasks']
  },
  
  // Weekly Overview
  {
    id: 'weekly-hours',
    name: 'Weekly Hours',
    description: 'Total hours tracked this week',
    category: 'statistics',
    component: StatWidget,
    defaultConfig: {
      title: 'This Week',
      size: 'small',
      color: 'teal',
      icon: 'calendar',
      refreshInterval: 1800 // 30 minutes
    },
    isConfigurable: true,
    permissions: ['view_time_logs']
  },
  
  // Productivity Stats
  {
    id: 'productivity-score',
    name: 'Productivity Score',
    description: 'Weekly productivity score based on completed tasks',
    category: 'statistics',
    component: StatWidget,
    defaultConfig: {
      title: 'Productivity',
      size: 'small',
      color: 'pink',
      icon: 'trending-up',
      refreshInterval: 3600 // 1 hour
    },
    isConfigurable: true,
    permissions: ['view_tasks', 'view_time_logs']
  },
  
  // Overdue Tasks
  {
    id: 'overdue-tasks',
    name: 'Overdue Tasks',
    description: 'Number of overdue tasks',
    category: 'statistics',
    component: StatWidget,
    defaultConfig: {
      title: 'Overdue',
      size: 'small',
      color: 'red',
      icon: 'alert-triangle',
      refreshInterval: 600 // 10 minutes
    },
    isConfigurable: true,
    permissions: ['view_tasks']
  }
];

// Register all widgets
export function initializeWidgets() {
  widgets.forEach(widget => {
    widgetService.registerWidget(widget);
  });
  
  console.log(`✅ Registered ${widgets.length} dashboard widgets`);
}

// Default dashboard layouts for new users
export const defaultDashboardLayouts = {
  // Standard layout for most users
  standard: [
    { widgetId: 'active-timers', instanceId: 'timer-1', position: { x: 0, y: 0, width: 2, height: 2 } },
    { widgetId: 'tasks-completed-today', instanceId: 'completed-1', position: { x: 2, y: 0, width: 1, height: 1 } },
    { widgetId: 'total-time-today', instanceId: 'time-1', position: { x: 3, y: 0, width: 1, height: 1 } },
    { widgetId: 'recent-tasks', instanceId: 'tasks-1', position: { x: 0, y: 2, width: 2, height: 2 } },
    { widgetId: 'active-projects', instanceId: 'projects-1', position: { x: 2, y: 1, width: 1, height: 1 } },
    { widgetId: 'weekly-hours', instanceId: 'weekly-1', position: { x: 3, y: 1, width: 1, height: 1 } },
  ],
  
  // Minimal layout for clients or limited users
  minimal: [
    { widgetId: 'active-timers', instanceId: 'timer-1', position: { x: 0, y: 0, width: 2, height: 2 } },
    { widgetId: 'recent-tasks', instanceId: 'tasks-1', position: { x: 2, y: 0, width: 2, height: 2 } },
  ],
  
  // Manager layout with team overview
  manager: [
    { widgetId: 'team-members', instanceId: 'team-1', position: { x: 0, y: 0, width: 1, height: 1 } },
    { widgetId: 'active-projects', instanceId: 'projects-1', position: { x: 1, y: 0, width: 1, height: 1 } },
    { widgetId: 'productivity-score', instanceId: 'productivity-1', position: { x: 2, y: 0, width: 1, height: 1 } },
    { widgetId: 'overdue-tasks', instanceId: 'overdue-1', position: { x: 3, y: 0, width: 1, height: 1 } },
    { widgetId: 'active-timers', instanceId: 'timer-1', position: { x: 0, y: 1, width: 2, height: 2 } },
    { widgetId: 'recent-tasks', instanceId: 'tasks-1', position: { x: 2, y: 1, width: 2, height: 2 } },
  ]
};

// Widget data fetchers - these would connect to your actual APIs
export const widgetDataFetchers = {
  'tasks-completed-today': async (orgId: string, userId: string) => {
    try {
      const response = await fetch(`/api/stats/tasks-completed-today?orgId=${orgId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      return {
        value: data.count || 0,
        label: 'Completed Today',
        trend: data.trend ? {
          value: data.trend.percentage,
          direction: data.trend.direction,
          label: 'vs yesterday'
        } : undefined,
        format: 'number'
      };
    } catch (error) {
      console.error('Failed to fetch tasks completed today:', error);
      return { value: 0, label: 'Completed Today', format: 'number' };
    }
  },
  
  'total-time-today': async (orgId: string, userId: string) => {
    try {
      const response = await fetch(`/api/stats/time-today?orgId=${orgId}&userId=${userId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      return {
        value: data.seconds || 0,
        label: 'Today',
        format: 'duration',
        trend: data.trend ? {
          value: data.trend.percentage,
          direction: data.trend.direction,
          label: 'vs yesterday'
        } : undefined
      };
    } catch (error) {
      console.error('Failed to fetch time today:', error);
      return { value: 0, label: 'Today', format: 'duration' };
    }
  },
  
  'active-timers': async (orgId: string, userId: string) => {
    try {
      const response = await fetch(`/api/timers/active?orgId=${orgId}&userId=${userId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      return {
        timers: data.timers || [],
        totalActiveTime: data.totalActiveTime || 0
      };
    } catch (error) {
      console.error('Failed to fetch active timers:', error);
      return { timers: [], totalActiveTime: 0 };
    }
  },
  
  'recent-tasks': async (orgId: string, userId: string) => {
    try {
      const response = await fetch(`/api/tasks/recent?orgId=${orgId}&limit=10`, {
        credentials: 'include'
      });
      const data = await response.json();
      return {
        tasks: data.tasks || [],
        totalTasks: data.total || 0
      };
    } catch (error) {
      console.error('Failed to fetch recent tasks:', error);
      return { tasks: [], totalTasks: 0 };
    }
  }
  
  // Add more data fetchers for other widgets...
};