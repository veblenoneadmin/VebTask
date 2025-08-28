import { useState } from 'react';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Clock,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  FileText,
  TrendingUp,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'potential';
  totalProjects: number;
  totalHours: number;
  totalEarnings: number;
  hourlyRate: number;
  lastActivity: string;
  contactPerson: string;
  industry: string;
  notes: string;
  priority: 'high' | 'medium' | 'low';
}

const mockClients: Client[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    company: 'TechCorp Solutions LLC',
    email: 'contact@techcorp.com',
    phone: '+1 (555) 123-4567',
    address: '123 Tech Street, San Francisco, CA 94105',
    status: 'active',
    totalProjects: 8,
    totalHours: 320,
    totalEarnings: 28500,
    hourlyRate: 95,
    lastActivity: '2024-01-15',
    contactPerson: 'John Smith',
    industry: 'Technology',
    notes: 'Long-term strategic partner, prefers agile methodology',
    priority: 'high'
  },
  {
    id: '2',
    name: 'GlobalBank Inc.',
    company: 'GlobalBank Financial Services',
    email: 'projects@globalbank.com',
    phone: '+1 (555) 987-6543',
    address: '456 Financial Ave, New York, NY 10001',
    status: 'active',
    totalProjects: 3,
    totalHours: 180,
    totalEarnings: 17100,
    hourlyRate: 95,
    lastActivity: '2024-01-14',
    contactPerson: 'Sarah Johnson',
    industry: 'Finance',
    notes: 'High security requirements, quarterly reviews',
    priority: 'high'
  },
  {
    id: '3',
    name: 'StartupXYZ',
    company: 'StartupXYZ Inc.',
    email: 'hello@startupxyz.com',
    phone: '+1 (555) 456-7890',
    address: '789 Innovation Blvd, Austin, TX 73301',
    status: 'active',
    totalProjects: 2,
    totalHours: 95,
    totalEarnings: 8075,
    hourlyRate: 85,
    lastActivity: '2024-01-13',
    contactPerson: 'Mike Chen',
    industry: 'Startup',
    notes: 'Fast-paced environment, equity + cash compensation',
    priority: 'medium'
  },
  {
    id: '4',
    name: 'DataDriven LLC',
    company: 'DataDriven Analytics',
    email: 'team@datadriven.com',
    phone: '+1 (555) 321-0987',
    address: '321 Data Way, Seattle, WA 98101',
    status: 'inactive',
    totalProjects: 1,
    totalHours: 45,
    totalEarnings: 4275,
    hourlyRate: 95,
    lastActivity: '2023-12-20',
    contactPerson: 'Lisa Wang',
    industry: 'Analytics',
    notes: 'Project completed, may have future opportunities',
    priority: 'low'
  },
  {
    id: '5',
    name: 'Creative Agency Pro',
    company: 'Creative Agency Pro Ltd.',
    email: 'creative@agency.pro',
    phone: '+1 (555) 654-3210',
    address: '654 Creative Lane, Los Angeles, CA 90210',
    status: 'potential',
    totalProjects: 0,
    totalHours: 0,
    totalEarnings: 0,
    hourlyRate: 90,
    lastActivity: '2024-01-10',
    contactPerson: 'Alex Rivera',
    industry: 'Creative',
    notes: 'Potential client from referral, interested in web redesign',
    priority: 'medium'
  }
];

export function Clients() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || client.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success bg-success/10 border-success/20';
      case 'inactive': return 'text-muted-foreground bg-muted/10 border-border';
      case 'potential': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-error bg-error/10 border-error/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'low': return 'text-info bg-info/10 border-info/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const clientStats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    totalRevenue: clients.reduce((sum, client) => sum + client.totalEarnings, 0),
    avgHourlyRate: clients.length > 0 
      ? Math.round(clients.reduce((sum, client) => sum + client.hourlyRate, 0) / clients.length)
      : 0
  };

  console.log(session);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Clients</h1>
          <p className="text-muted-foreground mt-2">Manage your client relationships and contacts</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-surface-elevated rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-3 py-1 rounded text-sm font-medium transition-colors",
                viewMode === 'grid' 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1 rounded text-sm font-medium transition-colors",
                viewMode === 'list' 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              List
            </button>
          </div>
          <Button className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientStats.totalClients}</p>
                <p className="text-sm text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-success flex items-center justify-center shadow-glow mr-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientStats.activeClients}</p>
                <p className="text-sm text-muted-foreground">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-info flex items-center justify-center shadow-glow mr-4">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${clientStats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-warning flex items-center justify-center shadow-glow mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${clientStats.avgHourlyRate}</p>
                <p className="text-sm text-muted-foreground">Avg. Rate/Hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass shadow-elevation">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="potential">Potential</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <Button size="sm" variant="outline" className="glass-surface">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="glass shadow-elevation hover:shadow-elevation-hover transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={cn("text-xs capitalize", getStatusColor(client.status))}>
                      {client.status}
                    </Badge>
                    <Badge className={cn("text-xs capitalize", getPriorityColor(client.priority))}>
                      {client.priority}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{client.address}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-sm font-semibold">{client.totalProjects}</p>
                    <p className="text-xs text-muted-foreground">Projects</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{client.totalHours}h</p>
                    <p className="text-xs text-muted-foreground">Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-success">${client.totalEarnings.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Last activity: {new Date(client.lastActivity).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="glass-surface">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="glass-surface text-error hover:bg-error/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass shadow-elevation">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Clients ({filteredClients.length})</h2>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Client</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Industry</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Projects</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Revenue</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Rate</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-surface-elevated/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{client.contactPerson}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{client.industry}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{client.totalProjects}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-success">
                          ${client.totalEarnings.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">${client.hourlyRate}/hr</span>
                      </td>
                      <td className="p-4">
                        <Badge className={cn("text-xs capitalize", getStatusColor(client.status))}>
                          {client.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" className="glass-surface">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="glass-surface text-error hover:bg-error/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No clients found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                    ? 'Try adjusting your filters or search term'
                    : 'Add your first client to get started'
                  }
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}