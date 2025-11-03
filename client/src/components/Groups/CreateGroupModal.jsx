import React, { useState } from 'react';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreateGroup(formData);
      setFormData({ name: '', description: '', isPrivate: false });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Create New Group</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              className="input input-bordered w-full"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              placeholder="Group description (optional)"
              className="textarea textarea-bordered w-full"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Private Group</span>
              <input
                type="checkbox"
                className="toggle"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
              />
            </label>
            <label className="label">
              <span className="label-text-alt">
                Private groups require approval to join
              </span>
            </label>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;