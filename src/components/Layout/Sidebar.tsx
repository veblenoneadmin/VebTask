import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSession, signOut } from '../../lib/auth-client';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { hasAdminAccess } from '../../config/internal';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  Calendar, 
  Brain,
  Settings, 
  LogOut,
  BarChart3,
  Timer,
  Building2,
  Users,
  FileText,
  DollarSign,
  Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Navigation items - for now we'll show all features to see the layout
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Brain Dump', href: '/brain-dump', icon: Brain },
  { name: 'Timer', href: '/timer', icon: Timer },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Projects', href: '/projects', icon: Building2 },
  { name: 'Time Logs', href: '/timesheets', icon: Clock },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Expenses', href: '/expenses', icon: DollarSign },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Administration', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<string>('CLIENT');
  
  // Fetch user role when session is available
  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/organizations');
          if (response.ok) {
            const data = await response.json();
            if (data.organizations && data.organizations.length > 0) {
              setUserRole(data.organizations[0].role || 'CLIENT');
            }
          }
        } catch (error) {
          console.error('Failed to fetch user role:', error);
        }
      }
    };
    
    if (session) {
      fetchUserRole();
    }
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout fails
      window.location.href = '/login';
    }
  };

  // Get user initials
  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 glass-surface border-r border-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <img src="/veblen-logo.png" alt="VebTask Logo" className="h-10 w-10 object-contain rounded-lg" />
            <div>
              <h1 className="text-lg font-bold gradient-text">VebTask</h1>
              <p className="text-xs text-muted-foreground">Veblen Internal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation
            .filter(item => {
              // Show admin navigation only to admins/owners
              if (item.name === 'Administration') {
                return hasAdminAccess(userRole);
              }
              return true;
            })
            .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                  "hover:bg-surface-elevated hover:text-foreground",
                  isActive 
                    ? "bg-gradient-primary text-white shadow-lg glow-primary" 
                    : "text-muted-foreground hover:bg-surface-elevated/80"
                )}
              >
                <Icon className={cn(
                  "mr-3 h-5 w-5 transition-transform duration-200", 
                  isActive && "text-white",
                  !isActive && "group-hover:scale-110"
                )} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-surface-elevated">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-primary text-white font-medium">
                {session?.user?.email ? getInitials(session.user.email) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.email?.split('@')[0] || 'User'}
                </p>
                <Badge variant="outline" className="text-xs capitalize">
                  {userRole.toLowerCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 w-8 p-0 hover:bg-error/10 hover:text-error"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;