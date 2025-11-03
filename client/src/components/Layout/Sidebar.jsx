import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import CreateGroupModal from '../Groups/CreateGroupModal';
import { useTheme } from '../../hooks/useTheme';
import FileOverview from '../UI/FileOverview';


const Sidebar = ({ currentUser, onEnterGroupChat, messages = [] }) => {
  const { socket, userCount, onlineUsers } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showFileOverview, setShowFileOverview] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);


  useEffect(() => {
    if (socket) {
      
      socket.emit('groups:get:all');
      
      socket.on('groups:all', (allGroups) => {
        console.log(' Received groups:', allGroups);
        setGroups(allGroups);
      });

      socket.on('group:new', (newGroup) => {
        console.log('New group received:', newGroup.name);
        setGroups(prev => {
          const exists = prev.some(g => g.groupId === newGroup.groupId);
          if (!exists) {
            return [newGroup, ...prev];
          }
          return prev;
        });
      });

      socket.on('group:updated', (updatedGroup) => {
        console.log('Group updated:', updatedGroup.name);
        setGroups(prev => prev.map(g => 
          g.groupId === updatedGroup.groupId ? updatedGroup : g
        ));
      });

      return () => {
        socket.off('groups:all');
        socket.off('group:new');
        socket.off('group:updated');
      };
    }
  }, [socket]);

  const handleCreateGroup = (groupData) => {
    if (!socket) {
      alert('Not connected to server');
      return;
    }

    socket.emit('group:create', {
      ...groupData,
      createdBy: currentUser
    });
    setShowCreateGroup(false);
  };

  const handleJoinGroup = (group) => {
    if (!socket) return;

    if (group.isPrivate) {
      // Show group details modal for private groups
      setSelectedGroup(group);
    } else {
      // Auto-join public groups
      if (window.confirm(`Join public group "${group.name}"?`)) {
        socket.emit('group:join', {
          groupId: group.groupId,
          user: currentUser
        });
        
        // If user is already member, enter group chat immediately
        if (isUserMember(group)) {
          onEnterGroupChat(group);
        }
      }
    }
  };

  const handleJoinPrivateGroup = () => {
    if (!socket || !selectedGroup) return;

    socket.emit('group:join', {
      groupId: selectedGroup.groupId,
      user: currentUser
    });
    
    setSelectedGroup(null);
  };

  const isUserMember = (group) => {
    return group.members.includes(currentUser.userId);
  };

  const handleGroupClick = (group) => {
    if (isUserMember(group)) {
      
      onEnterGroupChat(group);
    } else {
      
      handleJoinGroup(group);
    }
  };

 
  const fileCount = messages.filter(msg => msg.type === 'file').length;

  return (
    <div className="space-y-6 sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* Online Users & Groups Tabs */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-4">
          <div className="tabs tabs-boxed">
            <button 
              className={`tab flex-1 ${activeTab === 'users' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Users ({userCount})
            </button>
            <button 
              className={`tab flex-1 ${activeTab === 'groups' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
               Groups ({groups.length})
            </button>
          </div>

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <div className="space-y-3 mt-4">
              {onlineUsers.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {onlineUsers.map((user) => (
                    <div key={user.userId} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      user.userId === currentUser.userId ? 'bg-primary/20' : 'hover:bg-base-200'
                    }`}>
                      <div className="avatar placeholder">
                        <div className={`${
                          user.isOnline ? 'bg-primary text-primary-content' : 'bg-gray-400 text-gray-800'
                        } rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold`}>
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.username}
                          {user.userId === currentUser.userId && ' (You)'}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            user.isOnline ? 'bg-success' : 'bg-gray-400'
                          }`}></div>
                          <p className="text-xs text-base-content/60">
                            {user.isOnline ? 'Online' : `Offline - Last seen ${new Date(user.lastSeen).toLocaleTimeString()}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-base-content/60">
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}

          {/* Groups Tab Content */}
          {activeTab === 'groups' && (
            <div className="space-y-3 mt-4">
              <div className="text-center">
                <button 
                  className="btn btn-primary btn-sm w-full mb-4"
                  onClick={() => setShowCreateGroup(true)}
                >
                  + Create Group
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <div 
                      key={group.groupId} 
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        isUserMember(group) 
                          ? 'bg-success/20 border border-success/30 hover:bg-success/30' 
                          : 'bg-base-200 hover:bg-base-300'
                      }`}
                      onClick={() => handleGroupClick(group)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="avatar placeholder mt-1">
                          <div className={`${
                            group.isPrivate ? 'bg-accent text-accent-content' : 'bg-secondary text-secondary-content'
                          } rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold`}>
                            {group.isPrivate ? '🔒' : '🏠'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{group.name}</p>
                            {isUserMember(group) && (
                              <span className="badge badge-success badge-xs">Member</span>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                              {group.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-base-content/50">
                              {group.isPrivate ? 'Private' : 'Public'} • {group.memberCount || group.members?.length || 0} members
                            </p>
                            <p className="text-xs text-base-content/40">
                              {new Date(group.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {isUserMember(group) && (
                            <p className="text-xs text-success mt-1">
                               open chat
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-base-content/60">
                    <p>No groups yet</p>
                    <p className="text-sm">Create the first group!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions  */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-6">
          <h3 className="card-title text-lg">⚡ Quick Actions</h3>
          <div className="space-y-2 mt-4">
            <button 
              className="btn btn-outline btn-sm w-full justify-start gap-2 relative"
              onClick={() => setShowFileOverview(true)}
            >
              <span>📁</span>
              Shared Files
              {fileCount > 0 && (
                <span className="badge badge-primary badge-xs absolute -top-1 -right-1">
                  {fileCount}
                </span>
              )}
            </button>
            <button 
              className="btn btn-outline btn-sm w-full justify-start gap-2"
              onClick={() => setShowCreateGroup(true)}
            >
              <span>👥</span>
              Create Group
            </button>
            <button 
              className="btn btn-outline btn-sm w-full justify-start gap-2"
              onClick={toggleTheme}
            >
              <span>mode</span>
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </div>

      {/*  Profile Card */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-6">
          <h3 className="card-title text-lg"> Your Profile</h3>
          <div className="flex items-center gap-3 mt-4">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-bold">{currentUser.username}</p>
              <p className="text-sm text-base-content/60">{currentUser.email}</p>
              <div className="badge badge-success badge-sm mt-1">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* File Overview Modal */}
      <FileOverview
        messages={messages}
        currentUser={currentUser}
        isOpen={showFileOverview}
        onClose={() => setShowFileOverview(false)}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* Group Details Modal */}
      {selectedGroup && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">
              {selectedGroup.isPrivate ? '🔒' : '🏠'} {selectedGroup.name}
            </h3>
            
            {selectedGroup.description && (
              <p className="text-sm text-base-content/70 mb-4">
                {selectedGroup.description}
              </p>
            )}
            
            <div className="space-y-2 mb-4">
              <p className="text-sm">
                <strong>Type:</strong> {selectedGroup.isPrivate ? 'Private Group' : 'Public Group'}
              </p>
              <p className="text-sm">
                <strong>Members:</strong> {selectedGroup.memberCount || selectedGroup.members?.length || 0}
              </p>
              <p className="text-sm">
                <strong>Created:</strong> {new Date(selectedGroup.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm">
                <strong>Created by:</strong> {selectedGroup.createdBy?.username}
              </p>
            </div>

            {selectedGroup.isPrivate ? (
              <div className="alert alert-warning mb-4">
                <span>This is a private group. Your join request will be sent to the group admins for approval.</span>
              </div>
            ) : (
              <div className="alert alert-info mb-4">
                <span>This is a public group.</span>
              </div>
            )}

            <div className="modal-action">
              <button 
                className="btn btn-ghost"
                onClick={() => setSelectedGroup(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleJoinPrivateGroup}
              >
                {selectedGroup.isPrivate ? 'Request to Join' : 'Join Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;