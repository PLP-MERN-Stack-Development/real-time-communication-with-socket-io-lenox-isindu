import React from 'react';
import { useSocket } from '../../hooks/useSocket';

const StatusIndicator = () => {
  const { isConnected, userCount } = useSocket();

  return (
    <div className="flex items-center gap-4">
      <div className={`badge gap-2 ${isConnected ? 'badge-success' : 'badge-error'}`}>
        {isConnected ? '🟢 Live' : '🔴 Offline'}
      </div>
      <div className="badge badge-primary gap-2">
        👥 {userCount} Online
      </div>
    </div>
  );
};

export default StatusIndicator;