import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchPayments();
  }, [filter]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/payments' : `/api/payments?status=${filter}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        setError('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Error fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: paymentId,
          status: newStatus
        }),
      });

      if (response.ok) {
        fetchPayments(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      setError('Error updating payment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card': return '💳';
      case 'paypal': return '🅿️';
      case 'stripe': return '💳';
      default: return '💰';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Payments</h1>
          <p className="mt-2 text-gray-600">Manage your payment transactions</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'all', label: 'All Payments' },
              { key: 'PENDING', label: 'Pending' },
              { key: 'COMPLETED', label: 'Completed' },
              { key: 'FAILED', label: 'Failed' },
              { key: 'REFUNDED', label: 'Refunded' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Payments List */}
        <div className="space-y-6">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You don't have any payments yet. Complete a match to make your first payment!"
                  : `No payments with status "${filter}" found.`
                }
              </p>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      €{payment.amount}
                    </span>
                    <span className="text-sm text-gray-500">
                      {payment.currency}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <span>{getPaymentMethodIcon(payment.paymentMethod)}</span>
                      <span className="text-sm text-gray-600 capitalize">
                        {payment.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Information */}
                <div className="border rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Match Details</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Package Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-600">📦 Package</h4>
                      <p className="text-sm font-medium">{payment.match.package.title}</p>
                      <div className="text-sm text-gray-600">
                        <p><strong>From:</strong> {payment.match.package.pickupAddress}</p>
                        <p><strong>To:</strong> {payment.match.package.deliveryAddress}</p>
                        <p><strong>Owner:</strong> {payment.match.package.user.firstName} {payment.match.package.user.lastName}</p>
                      </div>
                    </div>

                    {/* Ride Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-600">🚗 Ride</h4>
                      <div className="text-sm text-gray-600">
                        <p><strong>From:</strong> {payment.match.ride.startLocation}</p>
                        <p><strong>To:</strong> {payment.match.ride.endLocation}</p>
                        <p><strong>Departure:</strong> {new Date(payment.match.ride.departureTime).toLocaleString()}</p>
                        <p><strong>Driver:</strong> {payment.match.ride.user.firstName} {payment.match.ride.user.lastName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                {(payment.transactionId || payment.paymentIntentId) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Transaction Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {payment.transactionId && (
                        <p><strong>Transaction ID:</strong> {payment.transactionId}</p>
                      )}
                      {payment.paymentIntentId && (
                        <p><strong>Payment Intent ID:</strong> {payment.paymentIntentId}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {payment.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'COMPLETED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'FAILED')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Mark as Failed
                      </button>
                    </>
                  )}

                  {payment.status === 'COMPLETED' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Enter refund reason (optional):');
                        if (reason !== null) { // User didn't cancel
                          updatePaymentStatus(payment.id, 'REFUNDED');
                        }
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Request Refund
                    </button>
                  )}

                  <button
                    onClick={() => router.push(`/messages?conversationWith=${
                      payment.match.package.userId === user?.id 
                        ? payment.match.ride.userId 
                        : payment.match.package.userId
                    }`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Contact Other Party
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Summary */}
        {payments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {payments.filter(p => p.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {payments.filter(p => p.status === 'PENDING').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {payments.filter(p => p.status === 'FAILED').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  €{payments
                    .filter(p => p.status === 'COMPLETED')
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 