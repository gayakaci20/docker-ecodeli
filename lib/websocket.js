import { useState, useEffect } from 'react'

class WebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 1000
    this.listeners = new Map()
    this.isConnected = false
    this.userId = null
    this.token = null
  }

  connect(userId, token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    this.userId = userId
    this.token = token

    try {
      // Use secure WebSocket in production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/websocket?token=${token}&userId=${userId}`
      
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.isConnected = false
        this.emit('disconnected')
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }

    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      this.scheduleReconnect()
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected')
      this.ws = null
    }
    this.isConnected = false
    this.userId = null
    this.token = null
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      if (this.userId && this.token) {
        this.connect(this.userId, this.token)
      }
    }, delay)
  }

  handleMessage(data) {
    const { type, payload } = data

    switch (type) {
      case 'notification':
        this.emit('notification', payload)
        break
      case 'package_update':
        this.emit('packageUpdate', payload)
        break
      case 'booking_update':
        this.emit('bookingUpdate', payload)
        break
      case 'payment_update':
        this.emit('paymentUpdate', payload)
        break
      case 'message':
        this.emit('message', payload)
        break
      case 'match_found':
        this.emit('matchFound', payload)
        break
      default:
        console.log('Unknown message type:', type, payload)
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in WebSocket event callback:', error)
        }
      })
    }
  }

  // Utility methods
  isConnectedToServer() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN
  }

  getConnectionState() {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'closed'
      default:
        return 'unknown'
    }
  }
}

// Create a singleton instance
const wsManager = new WebSocketManager()

// React hook for using WebSocket in components
export const useWebSocket = () => {
  const [connectionState, setConnectionState] = useState('disconnected')
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const handleConnectionChange = () => {
      setConnectionState(wsManager.getConnectionState())
    }

    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep last 50 notifications
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title || 'EcoDeli Notification', {
          body: notification.message,
          icon: '/LOGO_.png',
          tag: notification.id
        })
      }
    }

    wsManager.on('connected', handleConnectionChange)
    wsManager.on('disconnected', handleConnectionChange)
    wsManager.on('notification', handleNotification)

    return () => {
      wsManager.off('connected', handleConnectionChange)
      wsManager.off('disconnected', handleConnectionChange)
      wsManager.off('notification', handleNotification)
    }
  }, [])

  const connect = (userId, token) => {
    wsManager.connect(userId, token)
  }

  const disconnect = () => {
    wsManager.disconnect()
  }

  const sendMessage = (type, payload) => {
    wsManager.send(type, payload)
  }

  const subscribe = (event, callback) => {
    wsManager.on(event, callback)
    return () => wsManager.off(event, callback)
  }

  return {
    connectionState,
    notifications,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    isConnected: connectionState === 'connected'
  }
}

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

// Notification utilities
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/LOGO_.png',
      ...options
    })
  }
}

export default wsManager 