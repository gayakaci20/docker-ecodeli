import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function ProviderDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SERVICE_PROVIDER')) {
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
      
      // Fetch provider's services
      const servicesRes = await fetch('/api/services');
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        // Filter services by provider (when provider field is added to API)
        setServices(servicesData);
      }

      // Fetch provider's bookings
      const bookingsRes = await fetch('/api/bookings');
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }

      // Fetch provider's payments
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

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateService = () => {
    router.push('/services/create');
  };

  const handleViewBooking = (bookingId) => {
    router.push(`/bookings/${bookingId}`);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.status === 'ACTIVE').length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
    completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
    totalEarnings: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
    monthlyEarnings: payments
      .filter(p => p.status === 'COMPLETED' && new Date(p.createdAt).getMonth() === new Date().getMonth())
      .reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Provider Dashboard
              </h1>
              <p className="text-gray-600">Welcome back, {user?.firstName}! Manage your services and bookings</p>
            </div>
            <button
              onClick={handleCreateService}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Service
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeServices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.monthlyEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '🏠' },
                { id: 'services', name: 'My Services', icon: '🛠️' },
                { id: 'bookings', name: 'Bookings', icon: '📅' },
                { id: 'earnings', name: 'Earnings', icon: '💰' },
                { id: 'reviews', name: 'Reviews', icon: '⭐' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
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
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
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
                      onClick={handleCreateService}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">➕</div>
                      <h4 className="font-medium text-gray-900">Add New Service</h4>
                      <p className="text-sm text-gray-500">Create a new service offering</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">📅</div>
                      <h4 className="font-medium text-gray-900">View Bookings</h4>
                      <p className="text-sm text-gray-500">Manage your appointments</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('earnings')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">💰</div>
                      <h4 className="font-medium text-gray-900">Check Earnings</h4>
                      <p className="text-sm text-gray-500">View your income</p>
                    </button>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h3>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {booking.service?.name || 'Service'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(booking.scheduledAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                          <p className="text-sm font-bold text-gray-900 mt-1">€{booking.totalAmount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">My Services</h3>
                  <button
                    onClick={handleCreateService}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Add Service
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-purple-600">€{service.price}</span>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-2">⭐</span>
                          <span>{service.averageRating ? service.averageRating.toFixed(1) : 'New'}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700">
                          Edit
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {services.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛠️</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Services Yet</h4>
                    <p className="text-gray-500 mb-6">Start by creating your first service offering</p>
                    <button
                      onClick={handleCreateService}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                    >
                      Create Your First Service
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Booking Management</h3>
                <div className="space-y-4">
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{booking.service?.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Customer: {booking.customer?.firstName} {booking.customer?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Scheduled: {new Date(booking.scheduledAt).toLocaleString()}
                            </p>
                            {booking.address && (
                              <p className="text-sm text-gray-600">Address: {booking.address}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                            <p className="text-lg font-bold text-gray-900 mt-2">€{booking.totalAmount}</p>
                          </div>
                        </div>
                        {booking.notes && (
                          <p className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded">
                            Notes: {booking.notes}
                          </p>
                        )}
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => handleViewBooking(booking.id)}
                            className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                          >
                            View Details
                          </button>
                          {booking.status === 'PENDING' && (
                            <>
                              <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                                Accept
                              </button>
                              <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No bookings yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Earnings Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Total Earnings</h4>
                    <p className="text-3xl font-bold text-gray-900">€{stats.totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">This Month</h4>
                    <p className="text-3xl font-bold text-gray-900">€{stats.monthlyEarnings.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Average per Job</h4>
                    <p className="text-3xl font-bold text-gray-900">
                      €{stats.completedBookings > 0 ? (stats.totalEarnings / stats.completedBookings).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Payment History</h4>
                  {payments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            Payment #{payment.id.slice(-8)}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
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
                          <p className="text-lg font-bold text-gray-900 mt-2">€{payment.amount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Customer Reviews</h3>
                
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⭐</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Reviews Coming Soon</h4>
                  <p className="text-gray-500 mb-6">
                    Customer review system is being developed. You'll be able to view and respond to customer feedback here.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✨ View customer ratings and reviews</p>
                    <p>✨ Respond to customer feedback</p>
                    <p>✨ Track your service quality metrics</p>
                    <p>✨ Build your reputation score</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 