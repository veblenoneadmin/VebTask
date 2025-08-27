import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useClerkAuth';

const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is signed in, redirect to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // User is not signed in, redirect to login
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth status
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    </div>
  );
};

export default AuthRedirect;