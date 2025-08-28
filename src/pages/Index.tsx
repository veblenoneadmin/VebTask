import UnifiedDashboard from '@/components/Dashboard/UnifiedDashboard';
import { useAuth } from '@/hooks/useBetterAuth';

const Index = () => {
  const { user, loading } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">VebTask</h1>
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return <UnifiedDashboard />;
};

export default Index;
