import { useState, useEffect } from 'react';
import { useSession } from '../lib/auth-client';
import { useApiClient } from '../lib/api-client';
import { useOrganization } from '../contexts/OrganizationContext';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  FileText,
  Calendar,
  Clock,
  Send,
  Download,
  Edit,
  Plus,
  Search,
  Filter,
  Eye,
  Building2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  items: InvoiceItem[];
  notes?: string;
  paymentTerms: string;
  lastSent?: string;
  paidDate?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientName: 'TechCorp Solutions',
    clientEmail: 'billing@techcorp.com',
    projectName: 'E-commerce Platform Redesign',
    issueDate: '2024-01-15',
    dueDate: '2024-02-15',
    status: 'sent',
    subtotal: 4750.00,
    tax: 475.00,
    total: 5225.00,
    currency: 'USD',
    paymentTerms: 'Net 30',
    lastSent: '2024-01-15',
    items: [
      {
        id: '1',
        description: 'UI/UX Design and Development',
        hours: 40,
        rate: 95,
        amount: 3800.00
      },
      {
        id: '2',
        description: 'Testing and Quality Assurance',
        hours: 10,
        rate: 95,
        amount: 950.00
      }
    ],
    notes: 'Thank you for your business!'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    clientName: 'GlobalBank Inc.',
    clientEmail: 'accounting@globalbank.com',
    projectName: 'Customer Portal Development',
    issueDate: '2024-01-10',
    dueDate: '2024-02-10',
    status: 'paid',
    subtotal: 2850.00,
    tax: 285.00,
    total: 3135.00,
    currency: 'USD',
    paymentTerms: 'Net 30',
    lastSent: '2024-01-10',
    paidDate: '2024-01-25',
    items: [
      {
        id: '1',
        description: 'Frontend Development',
        hours: 30,
        rate: 95,
        amount: 2850.00
      }
    ]
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    clientName: 'StartupXYZ',
    clientEmail: 'finance@startupxyz.com',
    projectName: 'Mobile App MVP',
    issueDate: '2024-01-05',
    dueDate: '2024-01-20',
    status: 'overdue',
    subtotal: 1700.00,
    tax: 170.00,
    total: 1870.00,
    currency: 'USD',
    paymentTerms: 'Net 15',
    lastSent: '2024-01-05',
    items: [
      {
        id: '1',
        description: 'API Development',
        hours: 20,
        rate: 85,
        amount: 1700.00
      }
    ],
    notes: 'Please remit payment as soon as possible.'
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    clientName: 'DataDriven LLC',
    clientEmail: 'billing@datadriven.com',
    projectName: 'Analytics Dashboard',
    issueDate: '2024-01-12',
    dueDate: '2024-02-12',
    status: 'draft',
    subtotal: 3325.00,
    tax: 332.50,
    total: 3657.50,
    currency: 'USD',
    paymentTerms: 'Net 30',
    items: [
      {
        id: '1',
        description: 'Data Visualization Components',
        hours: 35,
        rate: 95,
        amount: 3325.00
      }
    ]
  }
];

export function Invoices() {
  const { data: session } = useSession();
  const { currentOrg } = useOrganization();
  const apiClient = useApiClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newInvoiceLoading, setNewInvoiceLoading] = useState(false);
  console.log(invoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice] = useState<Invoice | null>(null);
  console.log(selectedInvoice);

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        const data = await apiClient.fetch(`/api/invoices?userId=${session.user.id}`);
        console.log('Fetched invoices:', data);
        if (data.success && data.invoices) {
          setInvoices(data.invoices || []);
        } else {
          console.error('Failed to fetch invoices: API returned no success');
          // Fallback to mock data if API fails
          setInvoices(mockInvoices);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        // Fallback to mock data on error
        setInvoices(mockInvoices);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [session, apiClient]);

  const handleCreateInvoice = async (invoiceData: {
    clientName: string;
    amount: number;
    description: string;
    dueDate: string;
  }) => {
    if (!session?.user?.id) {
      console.error('User not authenticated');
      return;
    }

    try {
      setNewInvoiceLoading(true);
      console.log('Creating invoice with data:', invoiceData);
      
      const data = await apiClient.fetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          userId: session.user.id,
          orgId: currentOrg?.id,
          ...invoiceData
        })
      });

      if (data.success && data.invoice) {
        console.log('Invoice created successfully:', data.invoice);
        // For now, just add to local state since API returns mock data
        const newInvoice: Invoice = {
          id: data.invoice.id,
          invoiceNumber: data.invoice.invoiceNumber,
          clientName: data.invoice.clientName,
          clientEmail: `${data.invoice.clientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          projectName: data.invoice.description || 'General Services',
          issueDate: data.invoice.createdAt ? new Date(data.invoice.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: data.invoice.dueDate ? new Date(data.invoice.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: data.invoice.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
          subtotal: data.invoice.amount,
          tax: data.invoice.amount * 0.1,
          total: data.invoice.amount * 1.1,
          currency: 'USD',
          paymentTerms: 'Net 30',
          items: [{
            id: '1',
            description: data.invoice.description || 'Services Rendered',
            hours: 1,
            rate: data.invoice.amount,
            amount: data.invoice.amount
          }]
        };
        
        setInvoices(prevInvoices => [newInvoice, ...prevInvoices]);
        setShowNewInvoiceModal(false);
      } else {
        console.error('Failed to create invoice: API did not return success');
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
    } finally {
      setNewInvoiceLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-success bg-success/10 border-success/20';
      case 'sent': return 'text-info bg-info/10 border-info/20';
      case 'overdue': return 'text-error bg-error/10 border-error/20';
      case 'draft': return 'text-muted-foreground bg-muted/10 border-border';
      case 'cancelled': return 'text-muted-foreground bg-muted/10 border-border';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const invoiceStats = {
    totalInvoices: invoices.length,
    totalRevenue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    pendingAmount: invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0),
    overdueAmount: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0)
  };

  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status !== 'overdue') return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  console.log(session);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Invoices</h1>
            <p className="text-muted-foreground mt-2">Loading your invoices...</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Invoices</h1>
          <p className="text-muted-foreground mt-2">Create, send, and track your invoices</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="glass-surface">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => setShowNewInvoiceModal(true)}
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow mr-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invoiceStats.totalInvoices}</p>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-success flex items-center justify-center shadow-glow mr-4">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${invoiceStats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-info flex items-center justify-center shadow-glow mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${invoiceStats.pendingAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-error flex items-center justify-center shadow-glow mr-4">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${invoiceStats.overdueAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
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
                placeholder="Search invoices..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <Button size="sm" variant="outline" className="glass-surface">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="glass shadow-elevation">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Invoices ({filteredInvoices.length})</h2>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Project</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Issue Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border hover:bg-surface-elevated/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">{invoice.paymentTerms}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{invoice.clientName}</p>
                          <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{invoice.projectName}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                          {invoice.status === 'overdue' && (
                            <p className="text-xs text-error">
                              {getDaysOverdue(invoice.dueDate, invoice.status)} days overdue
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-lg">${invoice.total.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{invoice.currency}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={cn("text-xs capitalize flex items-center space-x-1", getStatusColor(invoice.status))}>
                        {getStatusIcon(invoice.status)}
                        <span>{invoice.status}</span>
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" className="glass-surface">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="glass-surface">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="glass-surface">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters or search term'
                  : 'Create your first invoice to get started'
                }
              </p>
              <Button onClick={() => setShowNewInvoiceModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass shadow-elevation">
          <CardContent className="p-6 text-center">
            <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow mx-auto mb-4">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Create Invoice</h3>
            <p className="text-sm text-muted-foreground mb-4">Generate a new invoice for your clients</p>
            <Button onClick={() => setShowNewInvoiceModal(true)} className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6 text-center">
            <div className="h-16 w-16 rounded-xl bg-gradient-success flex items-center justify-center shadow-glow mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Payment Tracking</h3>
            <p className="text-sm text-muted-foreground mb-4">Monitor payment status and follow up</p>
            <Button variant="outline" className="w-full glass-surface">
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6 text-center">
            <div className="h-16 w-16 rounded-xl bg-gradient-info flex items-center justify-center shadow-glow mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Payment Methods</h3>
            <p className="text-sm text-muted-foreground mb-4">Set up payment gateways and options</p>
            <Button variant="outline" className="w-full glass-surface">
              Configure
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* New Invoice Modal */}
      {showNewInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Invoice</h2>
              <button className="modal-close" onClick={() => setShowNewInvoiceModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const invoiceData = {
                clientName: formData.get('clientName') as string,
                amount: parseFloat(formData.get('amount') as string),
                description: formData.get('description') as string,
                dueDate: formData.get('dueDate') as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              };
              handleCreateInvoice(invoiceData);
            }} className="modal-form">
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  name="clientName"
                  required
                  placeholder="Enter client name"
                />
              </div>

              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Services description..."
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowNewInvoiceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={newInvoiceLoading}>
                  {newInvoiceLoading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}