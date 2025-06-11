import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Info, Package, Calendar, CreditCard } from 'lucide-react'
import { useWebSocket, requestNotificationPermission } from '../lib/websocket'

export default function NotificationCenter({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const { notifications, connect, disconnect, isConnected, subscribe } = useWebSocket()

  useEffect(() => {
    if (user) {
      // Connect to WebSocket when user is available
      const token = localStorage.getItem('token')
      if (token) {
        connect(user.id, token)
        
        // Request notification permission
        requestNotificationPermission()
      }
    }

    return () => {
      disconnect()
    }
  }, [user, connect, disconnect])

  useEffect(() => {
    // Subscribe to real-time events
    const unsubscribePackage = subscribe('packageUpdate', (data) => {
      showToast({
        id: Date.now(),
        type: 'package',
        title: 'Package Update',
        message: `Your package "${data.title}" status changed to ${data.status}`,
        timestamp: new Date().toISOString()
      })
    })

    const unsubscribeBooking = subscribe('bookingUpdate', (data) => {
      showToast({
        id: Date.now(),
        type: 'booking',
        title: 'Booking Update',
        message: `Your booking for "${data.serviceName}" has been ${data.status.toLowerCase()}`,
        timestamp: new Date().toISOString()
      })
    })

    const unsubscribePayment = subscribe('paymentUpdate', (data) => {
      showToast({
        id: Date.now(),
        type: 'payment',
        title: 'Payment Update',
        message: `Payment of €${data.amount} has been ${data.status.toLowerCase()}`,
        timestamp: new Date().toISOString()
      })
    })

    const unsubscribeMatch = subscribe('matchFound', (data) => {
      showToast({
        id: Date.now(),
        type: 'match',
        title: 'Match Found!',
        message: `A carrier has been found for your package "${data.packageTitle}"`,
        timestamp: new Date().toISOString()
      })
    })

    return () => {
      unsubscribePackage()
      unsubscribeBooking()
      unsubscribePayment()
      unsubscribeMatch()
    }
  }, [subscribe])

  const showToast = (notification) => {
    setToasts(prev => [notification, ...prev])
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(notification.id)
    }, 5000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'package':
        return <Package className="w-5 h-5" />
      case 'booking':
        return <Calendar className="w-5 h-5" />
      case 'payment':
        return <CreditCard className="w-5 h-5" />
      case 'match':
        return <Check className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'package':
        return 'text-blue-600 bg-blue-100'
      case 'booking':
        return 'text-purple-600 bg-purple-100'
      case 'payment':
        return 'text-green-600 bg-green-100'
      case 'match':
        return 'text-emerald-600 bg-emerald-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {/* Connection indicator */}
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </button>

        {/* Notification Panel */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out"
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${getNotificationColor(toast.type)}`}>
                {getNotificationIcon(toast.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {toast.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
} 