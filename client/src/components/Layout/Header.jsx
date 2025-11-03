import React from 'react';
import StatusIndicator from '../UI/StatusIndicator';
import AdminNotifications from '../Groups/AdminNotifications';

const Header = ({ currentUser, onLogout }) => {
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  console.log('Header rendered for user:', currentUser?.username);

  return (
    <div className="navbar bg-base-100 shadow-lg px-6">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="text-2xl">💬</div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PingHub
            </h1>
            <p className="text-xs text-base-content/60">Professional Team Chat</p>
          </div>
        </div>
      </div>
      
      <div className="flex-none gap-4">
        {/* ---- */}
        <div className="text-xs text-gray-500 hidden">
          User: {currentUser?.username} | ID: {currentUser?.userId}
        </div>
        
        {/* Admin Notifications  */}
        <AdminNotifications currentUser={currentUser} />
        
        <StatusIndicator />
        
        {/* User menu */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            <li className="menu-title">
              <span>Hello, {currentUser.username}</span>
            </li>
            <li><a>Profile Settings</a></li>
            <li><a>Notification Preferences</a></li>
            <li className="divider my-1"></li>
            <li>
              <button onClick={handleLogout} className="text-error">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;