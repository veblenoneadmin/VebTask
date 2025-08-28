import { useBetterAuth } from '@/hooks/useBetterAuth';
import { signOut } from '@/lib/auth-client';

function Index() {
  const { user } = useBetterAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-border/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">VebTask</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name || user?.email}!
            </span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-error hover:bg-error/80 text-error-foreground rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 rounded-xl border border-border/20 shadow-elevation">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                🎉 VebTask Dashboard
              </h2>
              <p className="text-muted-foreground mb-8">
                Beautiful design restored with working authentication!
              </p>
              
              <div className="bg-surface-elevated p-6 rounded-lg border border-border/20">
                <h3 className="text-lg font-semibold text-foreground mb-4">Session Information</h3>
                <div className="space-y-2 text-left">
                  <p><strong>User ID:</strong> {user?.id}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Name:</strong> {user?.name || 'Not set'}</p>
                  <p><strong>Email Verified:</strong> {user?.emailVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-success p-4 rounded-lg text-white">
                  <h4 className="font-medium">📋 Tasks</h4>
                  <p className="text-sm opacity-90">Task management system</p>
                </div>
                <div className="bg-gradient-primary p-4 rounded-lg text-white">
                  <h4 className="font-medium">⏰ Time Tracking</h4>
                  <p className="text-sm opacity-90">Track time spent on tasks</p>
                </div>
                <div className="bg-gradient-warning p-4 rounded-lg text-black">
                  <h4 className="font-medium">📊 Reports</h4>
                  <p className="text-sm opacity-80">Generate productivity reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Index;