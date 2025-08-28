import { useState } from 'react';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Receipt,
  DollarSign,
  Calendar,
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Car,
  Coffee,
  Laptop,
  Home,
  Plane,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  PieChart,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'reimbursed' | 'rejected';
  isRecurring: boolean;
  isTaxDeductible: boolean;
  receipt?: string;
  vendor: string;
  paymentMethod: string;
  projectId?: string;
  clientId?: string;
  tags: string[];
  notes?: string;
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    title: 'MacBook Pro 16-inch',
    description: 'New laptop for development work',
    amount: 2399.00,
    currency: 'USD',
    category: 'Equipment',
    date: '2024-01-15',
    status: 'approved',
    isRecurring: false,
    isTaxDeductible: true,
    vendor: 'Apple Store',
    paymentMethod: 'Company Card',
    tags: ['hardware', 'development', 'essential'],
    notes: 'Replacing old laptop that crashed'
  },
  {
    id: '2',
    title: 'Client Lunch Meeting',
    description: 'Business lunch with TechCorp Solutions',
    amount: 89.50,
    currency: 'USD',
    category: 'Meals & Entertainment',
    date: '2024-01-14',
    status: 'reimbursed',
    isRecurring: false,
    isTaxDeductible: true,
    vendor: 'The Italian Place',
    paymentMethod: 'Personal Card',
    clientId: '1',
    tags: ['client', 'meeting', 'business'],
    notes: 'Discussed Q1 project milestones'
  },
  {
    id: '3',
    title: 'Office Internet',
    description: 'Monthly internet service for home office',
    amount: 79.99,
    currency: 'USD',
    category: 'Utilities',
    date: '2024-01-01',
    status: 'approved',
    isRecurring: true,
    isTaxDeductible: true,
    vendor: 'Xfinity',
    paymentMethod: 'Auto-pay',
    tags: ['recurring', 'office', 'essential']
  },
  {
    id: '4',
    title: 'Flight to Client Meeting',
    description: 'Round-trip flight to New York for GlobalBank project',
    amount: 485.00,
    currency: 'USD',
    category: 'Travel',
    date: '2024-01-10',
    status: 'pending',
    isRecurring: false,
    isTaxDeductible: true,
    vendor: 'Delta Airlines',
    paymentMethod: 'Personal Card',
    clientId: '2',
    tags: ['travel', 'client', 'project'],
    notes: 'Attending project kickoff meeting'
  },
  {
    id: '5',
    title: 'Software Subscriptions',
    description: 'Adobe Creative Suite monthly subscription',
    amount: 52.99,
    currency: 'USD',
    category: 'Software',
    date: '2024-01-08',
    status: 'approved',
    isRecurring: true,
    isTaxDeductible: true,
    vendor: 'Adobe',
    paymentMethod: 'Company Card',
    tags: ['software', 'recurring', 'design']
  },
  {
    id: '6',
    title: 'Office Supplies',
    description: 'Pens, notebooks, and desk organizers',
    amount: 47.25,
    currency: 'USD',
    category: 'Office Supplies',
    date: '2024-01-12',
    status: 'rejected',
    isRecurring: false,
    isTaxDeductible: false,
    vendor: 'Staples',
    paymentMethod: 'Personal Card',
    tags: ['office', 'supplies'],
    notes: 'Rejected: Personal items included in purchase'
  }
];

const expenseCategories = [
  { name: 'Equipment', icon: <Laptop className="h-4 w-4" />, color: 'bg-blue-500' },
  { name: 'Travel', icon: <Plane className="h-4 w-4" />, color: 'bg-purple-500' },
  { name: 'Meals & Entertainment', icon: <Coffee className="h-4 w-4" />, color: 'bg-orange-500' },
  { name: 'Utilities', icon: <Home className="h-4 w-4" />, color: 'bg-green-500' },
  { name: 'Software', icon: <Briefcase className="h-4 w-4" />, color: 'bg-indigo-500' },
  { name: 'Office Supplies', icon: <ShoppingBag className="h-4 w-4" />, color: 'bg-pink-500' },
  { name: 'Transportation', icon: <Car className="h-4 w-4" />, color: 'bg-yellow-500' },
];

export function Expenses() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-success bg-success/10 border-success/20';
      case 'reimbursed': return 'text-info bg-info/10 border-info/20';
      case 'pending': return 'text-warning bg-warning/10 border-warning/20';
      case 'rejected': return 'text-error bg-error/10 border-error/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = expenseCategories.find(cat => cat.name === category);
    return categoryData ? categoryData.icon : <Receipt className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const categoryData = expenseCategories.find(cat => cat.name === category);
    return categoryData ? categoryData.color : 'bg-gray-500';
  };

  const expenseStats = {
    totalExpenses: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    approvedExpenses: filteredExpenses.filter(exp => exp.status === 'approved').reduce((sum, exp) => sum + exp.amount, 0),
    pendingExpenses: filteredExpenses.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0),
    taxDeductible: filteredExpenses.filter(exp => exp.isTaxDeductible).reduce((sum, exp) => sum + exp.amount, 0)
  };

  const categoryBreakdown = expenseCategories.map(category => ({
    ...category,
    amount: filteredExpenses
      .filter(expense => expense.category === category.name)
      .reduce((sum, expense) => sum + expense.amount, 0),
    count: filteredExpenses.filter(expense => expense.category === category.name).length
  })).filter(category => category.amount > 0);

  console.log(session);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Expenses</h1>
          <p className="text-muted-foreground mt-2">Track and manage your business expenses</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="glass-surface">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" className="glass-surface">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow mr-4">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${expenseStats.totalExpenses.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
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
                <p className="text-2xl font-bold">${expenseStats.approvedExpenses.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-warning flex items-center justify-center shadow-glow mr-4">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${expenseStats.pendingExpenses.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-info flex items-center justify-center shadow-glow mr-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${expenseStats.taxDeductible.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Tax Deductible</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Filters */}
          <Card className="glass shadow-elevation">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Date Range */}
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value as any)}
                  className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  {expenseCategories.map((category) => (
                    <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="reimbursed">Reimbursed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card className="glass shadow-elevation">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Expense Records ({filteredExpenses.length})</h2>
                <Button size="sm" variant="outline" className="glass-surface">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3 p-6">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 glass-surface rounded-lg hover:bg-surface-elevated/50 transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-glow", getCategoryColor(expense.category))}>
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold truncate">{expense.title}</h3>
                          {expense.isRecurring && (
                            <Badge variant="outline" className="text-xs">Recurring</Badge>
                          )}
                          {expense.isTaxDeductible && (
                            <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                              Tax Deductible
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-1">{expense.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Tag className="h-3 w-3" />
                            <span>{expense.category}</span>
                          </span>
                          <span>{expense.vendor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">${expense.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{expense.paymentMethod}</p>
                      </div>
                      <Badge className={cn("text-xs capitalize", getStatusColor(expense.status))}>
                        {expense.status}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" className="glass-surface">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="glass-surface text-error hover:bg-error/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredExpenses.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                      ? 'Try adjusting your filters or search term'
                      : 'Add your first expense to get started'
                    }
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category Breakdown */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <h3 className="font-semibold flex items-center">
                <PieChart className="h-4 w-4 mr-2" />
                Category Breakdown
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryBreakdown.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-2 glass-surface rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={cn("w-3 h-3 rounded-full", category.color)} />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${category.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{category.count} items</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <h3 className="font-semibold">Recent Activity</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center space-x-3 p-2 glass-surface rounded-lg">
                  <div className={cn("w-2 h-8 rounded-full", getCategoryColor(expense.category))} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{expense.title}</p>
                    <p className="text-xs text-muted-foreground">
                      ${expense.amount.toFixed(2)} • {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass shadow-elevation">
            <CardHeader className="pb-4">
              <h3 className="font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Receipt className="h-4 w-4 mr-2" />
                Scan Receipt
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Tax Summary
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}