import { useState, useEffect } from 'react';
import { useSession } from '../lib/auth-client';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ClientDashboard } from './ClientDashboard';
import { widgetService } from '../lib/widgets/WidgetService';
import { defaultDashboardLayouts, widgetDataFetchers } from '../lib/widgets/widgetRegistry';
import { 
  Timer,
  Calendar,
  Brain,
  Zap,
  Activity,
  Plus,
  Settings,
  LayoutGrid,
  CheckSquare
} from 'lucide-react';

export function Dashboard() {
  const { data: session } = useSession();
  const [widgets, setWidgets] = useState<any[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Get user's role from organization membership
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [orgId, setOrgId] = useState<string>('default');
  
  // If user is a CLIENT, show the client-specific dashboard
  if (userRole === 'CLIENT') {
    return <ClientDashboard />;
  }

  const userName = session?.user?.email?.split('@')[0]?.replace(/[^a-zA-Z]/g, '') || 'User';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  
  // Fetch user's organization and role
  useEffect(() => {
    const fetchUserOrgInfo = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/organizations?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.organizations && data.organizations.length > 0) {
            const org = data.organizations[0]; // Use first organization
            setOrgId(org.id);
            setUserRole(org.role || 'ADMIN');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user organization info:', error);
      }
    };

    if (session?.user?.id) {
      fetchUserOrgInfo();
    }
  }, [session]);

  // Initialize dashboard widgets
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Use layout based on user role
        const defaultLayout = userRole === 'ADMIN' || userRole === 'OWNER' 
          ? defaultDashboardLayouts.standard 
          : userRole === 'STAFF'
          ? defaultDashboardLayouts.minimal
          : defaultDashboardLayouts.minimal;
        setWidgets(defaultLayout);
        
        // Load initial data for all widgets
        await loadWidgetData(defaultLayout);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user && orgId !== 'default') {
      initializeDashboard();
    }
  }, [session, userRole, orgId]);

  // Load data for widgets
  const loadWidgetData = async (widgetInstances: any[]) => {
    if (!session?.user?.id) return;

    const data: Record<string, any> = {};
    
    for (const instance of widgetInstances) {
      try {
        const fetcher = (widgetDataFetchers as any)[instance.widgetId];
        if (fetcher) {
          data[instance.instanceId] = await fetcher(orgId, session.user.id);
        }
      } catch (error) {
        console.error(`Failed to load data for widget ${instance.widgetId}:`, error);
        data[instance.instanceId] = { error: 'Failed to load data' };
      }
    }
    
    setWidgetData(data);
  };

  const handleWidgetRefresh = async (instanceId: string, widgetId: string) => {
    if (!session?.user?.id) return;
    const fetcher = (widgetDataFetchers as any)[widgetId];
    
    if (fetcher) {
      try {
        const newData = await fetcher(orgId, session.user.id);
        setWidgetData(prev => ({
          ...prev,
          [instanceId]: newData
        }));
      } catch (error) {
        console.error(`Failed to refresh widget ${widgetId}:`, error);
      }
    }
  };

  const renderWidget = (instance: any) => {
    const widget = widgetService.getWidget(instance.widgetId);
    if (!widget) return null;

    const WidgetComponent = widget.component;
    const data = widgetData[instance.instanceId];
    const hasError = data?.error;
    
    return (
      <div
        key={instance.instanceId}
        className={`${getGridSizeClass(instance.position)} h-fit`}
        style={{
          gridColumn: `${instance.position.x + 1} / span ${instance.position.width}`,
          gridRow: `${instance.position.y + 1} / span ${instance.position.height}`
        }}
      >
        <WidgetComponent
          config={widget.defaultConfig}
          data={data}
          loading={!data && !hasError}
          error={hasError ? data.error : null}
          onRefresh={() => handleWidgetRefresh(instance.instanceId, instance.widgetId)}
          orgId={orgId}
          userId={session?.user?.id || ''}
        />
      </div>
    );
  };

  const getGridSizeClass = (position: any) => {
    return `col-span-${position.width} row-span-${position.height}`;
  };
  
  const quickActions = [
    { name: 'Start Timer', icon: Timer, href: '/timer', color: 'success' },
    { name: 'Brain Dump', icon: Brain, href: '/brain-dump', color: 'primary' },
    { name: 'Add Task', icon: CheckSquare, href: '/tasks', color: 'warning' },
    { name: 'Calendar', icon: Calendar, href: '/calendar', color: 'info' },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Good morning, {displayName}! 👋</h1>
            <p className="text-muted-foreground mt-2">Loading your dashboard...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header with Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Good morning, {displayName}! 👋</h1>
          <p className="text-muted-foreground mt-2">Here's your personalized dashboard with live data.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center space-x-2"
          >
            {isEditMode ? <Settings className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            <span>{isEditMode ? 'Save Layout' : 'Edit Layout'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadWidgetData(widgets)}
            className="flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>Refresh All</span>
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <Card className="glass p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex space-x-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.name}
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = action.href}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{action.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {widgets.length} widgets active
          </Badge>
        </div>
      </Card>

      {/* Dynamic Widget Grid */}
      <div className="grid grid-cols-4 gap-6 auto-rows-min">
        {widgets.map(renderWidget)}
        
        {isEditMode && (
          <Card className="glass border-2 border-dashed border-primary/50 flex items-center justify-center p-8 col-span-1 row-span-1">
            <Button variant="ghost" className="flex flex-col items-center space-y-2 text-muted-foreground">
              <Plus className="h-8 w-8" />
              <span className="text-sm">Add Widget</span>
            </Button>
          </Card>
        )}
      </div>

      {widgets.length === 0 && !loading && (
        <Card className="glass text-center p-12">
          <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No widgets configured</h3>
          <p className="text-muted-foreground mb-4">Add your first widget to get started with your personalized dashboard.</p>
          <Button onClick={() => setIsEditMode(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </Card>
      )}
    </div>
  );
}