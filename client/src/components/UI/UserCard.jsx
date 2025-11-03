import React from 'react';

const UserCard = ({ user }) => {
  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body p-6">
        <div className="flex items-center gap-4">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{user.username}</h3>
            <p className="text-sm text-base-content/60">Team Member</p>
            <div className="badge badge-success badge-sm mt-1">Online</div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Joined:</span>
            <span>{new Date(user.joinedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Role:</span>
            <span>Collaborator</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;