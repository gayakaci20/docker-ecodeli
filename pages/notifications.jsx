import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchNotifications();
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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.append('unreadOnly', 'true');
      } else if (filter !== 'all') {
        params.append('type', filter);
      }
      
      const response = await fetch(`/api/notifications?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notificationId,
          read: true
        }),
      });

      if (response.ok) {
        fetchNotifications(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Error marking notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });

      if (response.ok) {
        fetchNotifications(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Error marking all notifications as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNotifications(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Error deleting notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_MESSAGE': return '💬';
      case 'MATCH_CREATED': return '🤝';
      case 'MATCH_ACCEPTED': return '✅';
      case 'MATCH_REJECTED': return '❌';
      case 'PAYMENT_SUCCESS': return '💰';
      case 'PAYMENT_FAILED': return '❌';
      case 'PACKAGE_DELIVERED': return '📦';
      case 'RIDE_COMPLETED': return '🚗';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'NEW_MESSAGE': return 'bg-blue-50 border-blue-200';
      case 'MATCH_CREATED': return 'bg-green-50 border-green-200';
      case 'MATCH_ACCEPTED': return 'bg-green-50 border-green-200';
      case 'MATCH_REJECTED': return 'bg-red-50 border-red-200';
      case 'PAYMENT_SUCCESS': return 'bg-green-50 border-green-200';
      case 'PAYMENT_FAILED': return 'bg-red-50 border-red-200';
      case 'PACKAGE_DELIVERED': return 'bg-blue-50 border-blue-200';
      case 'RIDE_COMPLETED': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-2 text-gray-600">
              Stay updated with your activities
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Mark All as Read
            </button>
          )}
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
              { key: 'all', label: 'All Notifications' },
              { key: 'unread', label: 'Unread' },
              { key: 'NEW_MESSAGE', label: 'Messages' },
              { key: 'MATCH_CREATED', label: 'Matches' },
              { key: 'PAYMENT_SUCCESS', label: 'Payments' }
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

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You don't have any notifications yet."
                  : filter === 'unread'
                  ? "You don't have any unread notifications."
                  : `No notifications of type "${filter}" found.`
                }
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  notification.read 
                    ? 'bg-white border-gray-200' 
                    : `${getNotificationColor(notification.type)} border-l-4`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {notification.type.replace('_', ' ')}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Action based on notification type */}
                {notification.type === 'NEW_MESSAGE' && notification.relatedEntityId && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => router.push('/messages')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Message →
                    </button>
                  </div>
                )}

                {(notification.type === 'MATCH_CREATED' || notification.type === 'MATCH_ACCEPTED') && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => router.push('/matches')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Matches →
                    </button>
                  </div>
                )}

                {(notification.type === 'PAYMENT_SUCCESS' || notification.type === 'PAYMENT_FAILED') && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => router.push('/payments')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Payments →
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Notification Stats */}
        {notifications.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {notifications.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {unreadCount}
                </div>
                <div className="text-sm text-gray-600">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.read).length}
                </div>
                <div className="text-sm text-gray-600">Read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {notifications.filter(n => n.type === 'NEW_MESSAGE').length}
                </div>
                <div className="text-sm text-gray-600">Messages</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 