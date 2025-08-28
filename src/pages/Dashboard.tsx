import React from 'react';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Clock, 
  CheckSquare, 
  DollarSign, 
  TrendingUp,
  Timer,
  Target,
  Users,
  Calendar,
  Brain,
  Zap,
  Building2,
  Activity,
  ArrowRight
} from 'lucide-react';

export function Dashboard() {
  const { data: session } = useSession();

  const userName = session?.user?.email?.split('@')[0]?.replace(/[^a-zA-Z]/g, '') || 'User';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  
  const stats = [
    {
      title: "Hours Today",
      value: "6.5",
      change: "+2.1 vs yesterday",
      icon: Clock,
      color: "success",
      bgGradient: "bg-gradient-success"
    },
    {
      title: "Tasks Completed",
      value: "12",
      change: "+3 vs yesterday", 
      icon: CheckSquare,
      color: "primary",
      bgGradient: "bg-gradient-primary"
    },
    {
      title: "Active Projects",
      value: "5",
      change: "2 due this week",
      icon: Building2,
      color: "warning",
      bgGradient: "bg-gradient-warning"
    },
    {
      title: "Productivity Score",
      value: "94%",
      change: "+5% this week",
      icon: TrendingUp,
      color: "info",
      bgGradient: "bg-gradient-primary"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: "Completed task: Website Redesign Review",
      time: "2 minutes ago",
      duration: "45 min",
      project: "Client Portal",
      billable: true
    },
    {
      id: 2,
      action: "Started break",
      time: "47 minutes ago", 
      duration: "15 min",
      project: null,
      billable: false
    },
    {
      id: 3,
      action: "Processed brain dump: Daily Planning",
      time: "1 hour ago",
      duration: "8 min", 
      project: "Personal",
      billable: false
    },
    {
      id: 4,
      action: "Completed task: API Integration Testing",
      time: "2 hours ago",
      duration: "1h 23min",
      project: "E-commerce Platform", 
      billable: true
    }
  ];

  const quickActions = [
    { name: 'Start Timer', icon: Timer, href: '/timer', color: 'success' },
    { name: 'Brain Dump', icon: Brain, href: '/brain-dump', color: 'primary' },
    { name: 'Add Task', icon: CheckSquare, href: '/tasks', color: 'warning' },
    { name: 'Calendar', icon: Calendar, href: '/calendar', color: 'info' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Good morning, {displayName}! 👋</h1>
          <p className="text-muted-foreground mt-2">Ready to tackle today's challenges? You have 8 tasks scheduled.</p>
        </div>
        <Card className="glass p-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center animate-pulse-glow">
              <Timer className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">Currently Working On</p>
              <p className="text-lg font-bold text-success">UX Research Analysis</p>
              <p className="text-xs text-muted-foreground">Running for 23 minutes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="glass p-6 hover:shadow-elevation transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-xs text-success mt-1">{stat.change}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${stat.bgGradient} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated/50">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                        <span className="text-xs text-muted-foreground">• {activity.duration}</span>
                        {activity.project && (
                          <Badge variant="outline" className="text-xs">
                            {activity.project}
                          </Badge>
                        )}
                        {activity.billable && (
                          <Badge variant="default" className="text-xs bg-success/20 text-success border-success/30">
                            Billable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.name}
                      variant="ghost"
                      className="w-full justify-start h-12 text-left hover:bg-surface-elevated"
                      onClick={() => window.location.href = action.href}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {action.name}
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Button>
                  );
                })}
              </div>

              {/* Today's Focus */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <Target className="mr-2 h-4 w-4" />
                  Today's Focus
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-gradient-primary/10 border border-primary/20">
                    <p className="text-sm font-medium">Complete Dashboard Design</p>
                    <p className="text-xs text-muted-foreground">Due in 2 hours</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-elevated/50">
                    <p className="text-sm font-medium">Review Client Feedback</p>
                    <p className="text-xs text-muted-foreground">Scheduled for 3:00 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Time Tracking Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Time Distribution Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-gradient-success"></div>
                  <span className="text-sm font-medium">Development</span>
                </div>
                <span className="text-sm font-bold">4.5h</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-gradient-primary"></div>
                  <span className="text-sm font-medium">Meetings</span>
                </div>
                <span className="text-sm font-bold">1.5h</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-gradient-warning"></div>
                  <span className="text-sm font-medium">Planning</span>
                </div>
                <span className="text-sm font-bold">0.5h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Team Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                  JD
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">Working on Mobile App UI</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-success flex items-center justify-center text-white text-xs font-bold">
                  SM
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sarah Miller</p>
                  <p className="text-xs text-muted-foreground">Code review - Backend API</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-warning flex items-center justify-center text-white text-xs font-bold">
                  MJ
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Mike Johnson</p>
                  <p className="text-xs text-muted-foreground">Client meeting preparation</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-muted"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}