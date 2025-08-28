import { useState } from 'react';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  DollarSign,
  Clock,
  Users,
  FileText,
  Target,
  Activity,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ReportData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  hoursTracked: number;
  projectsCompleted: number;
  clientsActive: number;
  invoicesSent: number;
  averageHourlyRate: number;
}

const mockReportData: ReportData[] = [
  {
    period: '2024-01',
    revenue: 15750,
    expenses: 3200,
    profit: 12550,
    hoursTracked: 168,
    projectsCompleted: 3,
    clientsActive: 5,
    invoicesSent: 8,
    averageHourlyRate: 94
  },
  {
    period: '2023-12',
    revenue: 18200,
    expenses: 2800,
    profit: 15400,
    hoursTracked: 195,
    projectsCompleted: 4,
    clientsActive: 6,
    invoicesSent: 12,
    averageHourlyRate: 93
  },
  {
    period: '2023-11',
    revenue: 12400,
    expenses: 2950,
    profit: 9450,
    hoursTracked: 145,
    projectsCompleted: 2,
    clientsActive: 4,
    invoicesSent: 6,
    averageHourlyRate: 86
  },
  {
    period: '2023-10',
    revenue: 21300,
    expenses: 4100,
    profit: 17200,
    hoursTracked: 225,
    projectsCompleted: 5,
    clientsActive: 7,
    invoicesSent: 15,
    averageHourlyRate: 95
  }
];

const projectPerformance = [
  { name: 'E-commerce Platform', completion: 85, budget: 95000, spent: 78500, status: 'on-track' },
  { name: 'Customer Portal', completion: 100, budget: 45000, spent: 42000, status: 'completed' },
  { name: 'Mobile App MVP', completion: 60, budget: 35000, spent: 28000, status: 'on-track' },
  { name: 'Analytics Dashboard', completion: 30, budget: 55000, spent: 45000, status: 'over-budget' },
  { name: 'Marketing Website', completion: 95, budget: 25000, spent: 24500, status: 'on-track' }
];

const clientMetrics = [
  { name: 'TechCorp Solutions', revenue: 28500, hours: 320, projects: 8, satisfaction: 4.9 },
  { name: 'GlobalBank Inc.', revenue: 17100, hours: 180, projects: 3, satisfaction: 4.8 },
  { name: 'StartupXYZ', revenue: 8075, hours: 95, projects: 2, satisfaction: 4.6 },
  { name: 'DataDriven LLC', revenue: 4275, hours: 45, projects: 1, satisfaction: 4.7 },
  { name: 'Creative Agency Pro', revenue: 0, hours: 0, projects: 0, satisfaction: 0 }
];

export function Reports() {
  const { data: session } = useSession();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'financial' | 'projects' | 'clients'>('overview');

  const currentData = mockReportData[0];
  const previousData = mockReportData[1];

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowth(currentData.revenue, previousData.revenue);
  const profitGrowth = calculateGrowth(currentData.profit, previousData.profit);
  const hoursGrowth = calculateGrowth(currentData.hoursTracked, previousData.hoursTracked);

  console.log(session);

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10 border-success/20';
      case 'on-track': return 'text-info bg-info/10 border-info/20';
      case 'over-budget': return 'text-error bg-error/10 border-error/20';
      case 'delayed': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline" className="glass-surface">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="glass-surface">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center space-x-1 bg-surface-elevated rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
          { key: 'financial', label: 'Financial', icon: <DollarSign className="h-4 w-4" /> },
          { key: 'projects', label: 'Projects', icon: <Target className="h-4 w-4" /> },
          { key: 'clients', label: 'Clients', icon: <Users className="h-4 w-4" /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedReport(tab.key as any)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              selectedReport === tab.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass shadow-elevation">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold">${currentData.revenue.toLocaleString()}</p>
                    <div className={cn("flex items-center text-sm", revenueGrowth >= 0 ? "text-success" : "text-error")}>
                      {revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {Math.abs(revenueGrowth).toFixed(1)}% vs last month
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass shadow-elevation">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                    <p className="text-2xl font-bold">${currentData.profit.toLocaleString()}</p>
                    <div className={cn("flex items-center text-sm", profitGrowth >= 0 ? "text-success" : "text-error")}>
                      {profitGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {Math.abs(profitGrowth).toFixed(1)}% vs last month
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-success flex items-center justify-center shadow-glow">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass shadow-elevation">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hours Tracked</p>
                    <p className="text-2xl font-bold">{currentData.hoursTracked}h</p>
                    <div className={cn("flex items-center text-sm", hoursGrowth >= 0 ? "text-success" : "text-error")}>
                      {hoursGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {Math.abs(hoursGrowth).toFixed(1)}% vs last month
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-info flex items-center justify-center shadow-glow">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass shadow-elevation">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg. Hourly Rate</p>
                    <p className="text-2xl font-bold">${currentData.averageHourlyRate}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Zap className="h-4 w-4 mr-1" />
                      Per hour rate
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-warning flex items-center justify-center shadow-glow">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass shadow-elevation">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Revenue Trend
                </h3>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Revenue chart visualization</p>
                    <p className="text-sm">Integration with chart library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass shadow-elevation">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Expense Breakdown
                </h3>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4" />
                    <p>Expense breakdown chart</p>
                    <p className="text-sm">Integration with chart library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Financial Report */}
      {selectedReport === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="glass shadow-elevation">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Financial Performance</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockReportData.map((data) => (
                      <div key={data.period} className="flex items-center justify-between p-4 glass-surface rounded-lg">
                        <div>
                          <p className="font-semibold">{new Date(data.period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.hoursTracked}h tracked • {data.invoicesSent} invoices sent
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-success">${data.revenue.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">${data.profit.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Profit</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="glass shadow-elevation">
                <CardHeader>
                  <h3 className="font-semibold">Quick Stats</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Projects Completed</span>
                    <span className="font-semibold">{currentData.projectsCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Clients</span>
                    <span className="font-semibold">{currentData.clientsActive}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Expenses</span>
                    <span className="font-semibold">${currentData.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Profit Margin</span>
                    <span className="font-semibold text-success">
                      {((currentData.profit / currentData.revenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Projects Report */}
      {selectedReport === 'projects' && (
        <div className="space-y-6">
          <Card className="glass shadow-elevation">
            <CardHeader>
              <h3 className="text-lg font-semibold">Project Performance</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectPerformance.map((project) => (
                  <div key={project.name} className="p-4 glass-surface rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${project.spent.toLocaleString()} of ${project.budget.toLocaleString()} budget
                        </p>
                      </div>
                      <Badge className={cn("text-xs capitalize", getProjectStatusColor(project.status))}>
                        {project.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{project.completion}%</span>
                      </div>
                      <div className="w-full bg-muted/20 rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all",
                            project.status === 'completed' ? "bg-success" : 
                            project.status === 'over-budget' ? "bg-error" : "bg-primary"
                          )}
                          style={{ width: `${project.completion}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Budget Usage</span>
                        <span className={cn(
                          project.spent > project.budget ? "text-error" : "text-muted-foreground"
                        )}>
                          {((project.spent / project.budget) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted/20 rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all",
                            project.spent > project.budget ? "bg-error" : "bg-info"
                          )}
                          style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clients Report */}
      {selectedReport === 'clients' && (
        <div className="space-y-6">
          <Card className="glass shadow-elevation">
            <CardHeader>
              <h3 className="text-lg font-semibold">Client Performance</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Client</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Revenue</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Hours</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Projects</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientMetrics.map((client) => (
                      <tr key={client.name} className="border-b border-border hover:bg-surface-elevated/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-medium">{client.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-success">
                            ${client.revenue.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{client.hours}h</span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{client.projects}</span>
                        </td>
                        <td className="p-4">
                          {client.satisfaction > 0 ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "h-4 w-4 text-xs",
                                      i < Math.floor(client.satisfaction) ? "text-warning" : "text-muted-foreground"
                                    )}
                                  >
                                    ★
                                  </div>
                                ))}
                              </div>
                              <span className="text-sm font-medium">{client.satisfaction}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No data</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Items */}
      <Card className="glass shadow-elevation">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
            Action Items
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 glass-surface rounded-lg">
              <div className="h-2 w-2 bg-error rounded-full" />
              <span className="text-sm">Follow up on overdue invoices (${mockReportData[0].revenue * 0.15} pending)</span>
            </div>
            <div className="flex items-center space-x-3 p-3 glass-surface rounded-lg">
              <div className="h-2 w-2 bg-warning rounded-full" />
              <span className="text-sm">Review over-budget projects and adjust scope</span>
            </div>
            <div className="flex items-center space-x-3 p-3 glass-surface rounded-lg">
              <div className="h-2 w-2 bg-info rounded-full" />
              <span className="text-sm">Prepare monthly financial report for stakeholders</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}