import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function MerchantDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [contracts, setContracts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'MERCHANT')) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, loading, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch contracts
      const token = localStorage.getItem('token');
      const contractsRes = await fetch('/api/contracts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        setContracts(contractsData.contracts || []);
      }

      // Fetch documents
      const documentsRes = await fetch('/api/documents');
      if (documentsRes.ok) {
        const documentsData = await documentsRes.json();
        setDocuments(documentsData);
      }

      // Fetch payments
      const paymentsRes = await fetch('/api/payments');
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      // Fetch notifications
      const notificationsRes = await fetch('/api/notifications?limit=5');
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.notifications || []);
      }

      // Calculate analytics
      const totalRevenue = payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
      const monthlyRevenue = payments
        .filter(p => p.status === 'COMPLETED' && new Date(p.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + p.amount, 0);

      setAnalytics({
        totalRevenue,
        monthlyRevenue,
        totalContracts: contracts.length,
        activeContracts: contracts.filter(c => c.status === 'SIGNED').length,
        totalDocuments: documents.length,
        totalPayments: payments.length
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContract = () => {
    router.push('/contracts/create');
  };

  const handleGenerateInvoice = () => {
    router.push('/documents/create?type=invoice');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Merchant Dashboard
              </h1>
              <p className="text-gray-600">Welcome back, {user?.firstName}! Manage your business operations</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleCreateContract}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Contract
              </button>
              <button
                onClick={handleGenerateInvoice}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">€{analytics.totalRevenue?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.activeContracts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">€{analytics.monthlyRevenue?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalDocuments || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '🏢' },
                { id: 'contracts', name: 'Contracts', icon: '📋' },
                { id: 'analytics', name: 'Analytics', icon: '📊' },
                { id: 'documents', name: 'Documents', icon: '📄' },
                { id: 'payments', name: 'Payments', icon: '💰' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h3>
                  <div className="space-y-3">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div key={notification.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No recent notifications</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={handleCreateContract}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">📋</div>
                      <h4 className="font-medium text-gray-900">Create Contract</h4>
                      <p className="text-sm text-gray-500">Draft a new business contract</p>
                    </button>
                    
                    <button
                      onClick={handleGenerateInvoice}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">🧾</div>
                      <h4 className="font-medium text-gray-900">Generate Invoice</h4>
                      <p className="text-sm text-gray-500">Create and send invoices</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">📊</div>
                      <h4 className="font-medium text-gray-900">View Analytics</h4>
                      <p className="text-sm text-gray-500">Business performance insights</p>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Payment #{payment.id.slice(-8)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                          <p className="text-sm font-bold text-gray-900 mt-1">€{payment.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Contract Management</h3>
                  <button
                    onClick={handleCreateContract}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    New Contract
                  </button>
                </div>
                
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Contract Management Coming Soon</h4>
                  <p className="text-gray-500 mb-6">
                    Full contract management system is being developed. You'll be able to create, manage, and track all your business contracts here.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✨ Digital contract creation and templates</p>
                    <p>✨ Electronic signature integration</p>
                    <p>✨ Contract lifecycle management</p>
                    <p>✨ Automated renewal notifications</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Business Analytics</h3>
                
                {/* Revenue Chart Placeholder */}
                <div className="bg-gray-50 rounded-lg p-8 mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Revenue Overview</h4>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📈</div>
                      <p className="text-gray-500">Revenue chart coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg border">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Average Deal Size</h5>
                    <p className="text-2xl font-bold text-gray-900">
                      €{payments.length > 0 ? (analytics.totalRevenue / payments.length).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</h5>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Customer Retention</h5>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Growth Rate</h5>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Document Management</h3>
                  <button
                    onClick={handleGenerateInvoice}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Generate Document
                  </button>
                </div>
                
                <div className="space-y-4">
                  {documents.length > 0 ? (
                    documents.map((document) => (
                      <div key={document.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{document.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Created: {new Date(document.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              document.type === 'INVOICE' ? 'bg-green-100 text-green-800' :
                              document.type === 'CONTRACT' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {document.type}
                            </span>
                            <div className="mt-2">
                              <a
                                href={document.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No documents yet</p>
                      <button
                        onClick={handleGenerateInvoice}
                        className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                      >
                        Generate First Document
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Payment History</h3>
                <div className="space-y-4">
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Payment #{payment.id.slice(-8)}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Method: {payment.paymentMethod}
                            </p>
                            {payment.transactionId && (
                              <p className="text-sm text-gray-600">
                                Transaction: {payment.transactionId}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                            <p className="text-lg font-bold text-gray-900 mt-2">
                              €{payment.amount} {payment.currency?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No payment history</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 