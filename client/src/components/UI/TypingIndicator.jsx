import React from 'react';

const TypingIndicator = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex items-end gap-2">
        <div className="avatar placeholder">
          <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            {typingUsers[0]?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
        <div className="bg-base-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-base-300">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
      <span className="text-sm text-base-content/60">
        {typingUsers.length === 1 
          ? `${typingUsers[0]} is typing...`
          : `${typingUsers.length} people are typing...`
        }
      </span>
    </div>
  );
};

export default TypingIndicator;