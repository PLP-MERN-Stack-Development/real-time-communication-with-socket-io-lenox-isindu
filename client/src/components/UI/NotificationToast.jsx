import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';

const NotificationToast = () => {
  const [notifications, setNotifications] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      console.log(' Notification received:', data);
      const newNotification = {
        id: Date.now(),
        type: data.type || 'info',
        message: data.message,
        timestamp: new Date()
      };
      
      setNotifications(prev => [...prev, newNotification]);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="toast toast-top toast-end z-50">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`alert ${
            notification.type === 'success' ? 'alert-success' :
            notification.type === 'warning' ? 'alert-warning' :
            notification.type === 'error' ? 'alert-error' : 'alert-info'
          } shadow-lg mb-2 animate-in slide-in-from-right`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <span>{notification.message}</span>
            </div>
            <button 
              className="btn btn-ghost btn-xs"
              onClick={() => removeNotification(notification.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;