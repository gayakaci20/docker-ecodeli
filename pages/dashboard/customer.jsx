import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function CustomerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [storageBoxes, setStorageBoxes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'CUSTOMER')) {
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
      const token = localStorage.getItem('token');
      
      // Fetch services
      const servicesRes = await fetch('/api/services');
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.slice(0, 6)); // Show top 6 services
      }

      // Fetch user's packages
      const packagesRes = await fetch('/api/packages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
      }

      // Fetch user's bookings
      const bookingsRes = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }

      // Fetch user's payments
      const paymentsRes = await fetch('/api/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      // Fetch available storage boxes
      const storageRes = await fetch('/api/storage-boxes');
      if (storageRes.ok) {
        const storageData = await storageRes.json();
        setStorageBoxes(storageData.slice(0, 4)); // Show top 4 boxes
      }

      // Fetch notifications
      const notificationsRes = await fetch('/api/notifications?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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

  const handleBookService = (serviceId) => {
    router.push(`/services/book/${serviceId}`);
  };

  const handleRentBox = (boxId) => {
    router.push(`/storage/rent/${boxId}`);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const stats = {
    totalPackages: packages.length,
    packagesInTransit: packages.filter(p => ['MATCHED', 'IN_TRANSIT'].includes(p.status)).length,
    packagesDelivered: packages.filter(p => p.status === 'DELIVERED').length,
    totalBookings: bookings.length,
    activeBookings: bookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
    completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
    totalSpent: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600">Manage your packages, services and bookings</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/exp')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Send Package
              </button>
            <button
              onClick={() => router.push('/services/browse')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Services
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Packages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPackages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">{stats.packagesInTransit}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.totalSpent.toFixed(2)}</p>
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
                { id: 'packages', name: 'My Packages', icon: '📦' },
                { id: 'services', name: 'Browse Services', icon: '🛍️' },
                { id: 'bookings', name: 'My Bookings', icon: '📅' },
                { id: 'storage', name: 'Storage Boxes', icon: '🗃️' },
                { id: 'payments', name: 'Payment History', icon: '💳' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
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
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => router.push('/exp')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">📦</div>
                      <h4 className="font-medium text-gray-900">Send Package</h4>
                      <p className="text-sm text-gray-500">Create new package</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('packages')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">🔍</div>
                      <h4 className="font-medium text-gray-900">Track Packages</h4>
                      <p className="text-sm text-gray-500">View package status</p>
                    </button>
                    
                    <button
                      onClick={() => router.push('/services/browse')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">🛍️</div>
                      <h4 className="font-medium text-gray-900">Browse Services</h4>
                      <p className="text-sm text-gray-500">Find and book services</p>
                    </button>
                    
                    <button
                      onClick={() => router.push('/storage/browse')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="text-2xl mb-2">🗃️</div>
                      <h4 className="font-medium text-gray-900">Rent Storage</h4>
                      <p className="text-sm text-gray-500">Find storage boxes</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* My Packages Tab */}
            {activeTab === 'packages' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">My Packages</h3>
                  <button
                    onClick={() => router.push('/exp')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Send New Package
                  </button>
                </div>
                <div className="space-y-4">
                  {packages.length > 0 ? (
                    packages.map((pkg) => (
                      <div key={pkg.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{pkg.title}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p><strong>From:</strong> {pkg.pickupAddress}</p>
                                <p><strong>To:</strong> {pkg.deliveryAddress}</p>
                              </div>
                              <div>
                                {pkg.weight && <p><strong>Weight:</strong> {pkg.weight}kg</p>}
                                {pkg.price && <p><strong>Price:</strong> €{pkg.price}</p>}
                                <p><strong>Created:</strong> {new Date(pkg.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              pkg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              pkg.status === 'MATCHED' ? 'bg-blue-100 text-blue-800' :
                              pkg.status === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-800' :
                              pkg.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {pkg.status}
                            </span>
                            <button
                              onClick={() => router.push(`/packages/track?id=${pkg.id}`)}
                              className="text-green-600 hover:text-green-700 font-medium text-sm"
                            >
                              Track Package →
                            </button>
                          </div>
                        </div>
                        {pkg.description && (
                          <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded">
                            {pkg.description}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-gray-500 mb-4">No packages yet</p>
                      <button
                        onClick={() => router.push('/exp')}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                      >
                        Send Your First Package
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Available Services</h3>
                  <button
                    onClick={() => router.push('/services/browse')}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <span className="text-lg font-bold text-green-600">€{service.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-2">⭐</span>
                          <span>{service.averageRating ? service.averageRating.toFixed(1) : 'New'}</span>
                        </div>
                        <button
                          onClick={() => handleBookService(service.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">My Bookings</h3>
                <div className="space-y-4">
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{booking.service?.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Provider: {booking.service?.provider?.firstName} {booking.service?.provider?.lastName}
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
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No bookings yet</p>
                      <button
                        onClick={() => setActiveTab('services')}
                        className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                      >
                        Browse Services
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Available Storage Boxes</h3>
                  <button
                    onClick={() => router.push('/storage/browse')}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {storageBoxes.map((box) => (
                    <div key={box.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">{box.name}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          box.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {box.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Location: {box.location}</p>
                      <p className="text-sm text-gray-600 mb-4">Size: {box.size}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">€{box.pricePerDay}/day</span>
                        {box.status === 'AVAILABLE' && (
                          <button
                            onClick={() => handleRentBox(box.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                          >
                            Rent Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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