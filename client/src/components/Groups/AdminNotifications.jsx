import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';

const AdminNotifications = ({ currentUser }) => {
  const { socket } = useSocket();
  const [joinRequests, setJoinRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!socket) {
      console.log('No socket connection in AdminNotifications');
      return;
    }

    console.log('AdminNotifications mounted for user:', currentUser.username);

    
    setSocketConnected(socket.connected);

    const handleConnect = () => {
      console.log('Socket connected in AdminNotifications');
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log(' Socket disconnected in AdminNotifications');
      setSocketConnected(false);
    };

    const handleJoinRequest = (request) => {
      console.log('group:join:request EVENT RECEIVED!', request);
      
      setJoinRequests(prev => {
        const exists = prev.some(req => req.requestId === request.requestId);
        if (!exists) {
          console.log('Adding new request to state');
          return [request, ...prev];
        }
        return prev;
      });
      
      // Show browser notification 
      if (Notification.permission === 'granted') {
        new Notification(`Join Request - ${request.groupName}`, {
          body: `${request.username} wants to join your group`,
          icon: '/favicon.ico'
        });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('group:join:request', handleJoinRequest);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('group:join:request', handleJoinRequest);
    };
  }, [socket, currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
  const handleApprove = (request) => {
    console.log('ADMIN: Approving request:', request);
    socket.emit('group:approve', {
      requestId: request.requestId,
      groupId: request.groupId,
      userId: request.userId,
      approvedBy: currentUser
    });
    setJoinRequests(prev => prev.filter(req => req.requestId !== request.requestId));
  };

  const handleDecline = (request) => {
    console.log(' ADMIN: Declining request:', request);
    socket.emit('group:decline', {
      requestId: request.requestId,
      groupId: request.groupId,
      userId: request.userId,
      declinedBy: currentUser
    });
    setJoinRequests(prev => prev.filter(req => req.requestId !== request.requestId));
  };

  const clearAllRequests = () => {
    setJoinRequests([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button 
        className="btn btn-ghost btn-circle relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <div className="indicator">
          <span className="text-2xl">🔔</span>
          {joinRequests.length > 0 && (
            <span className="badge badge-xs badge-primary indicator-item">
              {joinRequests.length}
            </span>
          )}
        </div>
      </button>
      
      {/* Notification Dropdown  */}
      {showNotifications && (
        <div className="absolute top-full right-0 mt-3 z-[100] card card-compact w-96 bg-base-100 shadow-xl border-2 border-primary">
          <div className="card-body">
            <div className="flex justify-between items-center mb-2">
              <h3 className="card-title text-lg">Group Join Requests</h3>
              <div className="flex gap-2 items-center">
                <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-success' : 'bg-error'}`}></div>
                <button 
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={() => setShowNotifications(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/*Clean UI */}
            
            {joinRequests.length === 0 ? (
              <div className="text-center py-4 text-base-content/60">
                <p>No pending requests</p>
                <p className="text-xs mt-1">You'll be notified when users request to join your groups</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {joinRequests.map((request) => (
                  <div key={request.requestId} className="p-3 border rounded-lg bg-base-200">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                          {request.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{request.username}</p>
                        <p className="text-sm text-base-content/60">
                          wants to join <strong className="text-primary">"{request.groupName}"</strong>
                        </p>
                        <p className="text-xs text-base-content/50 mt-1">
                          {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(request)}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn btn-error btn-sm"
                        onClick={() => handleDecline(request)}
                      >
                         Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {joinRequests.length > 0 && (
              <div className="card-actions justify-end mt-3">
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={clearAllRequests}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;