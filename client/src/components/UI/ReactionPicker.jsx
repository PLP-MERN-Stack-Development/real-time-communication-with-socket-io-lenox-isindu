import React, { useState } from 'react';

const ReactionPicker = ({ onSelectReaction, position = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏'];

  const handleReactionSelect = (reaction) => {
    onSelectReaction(reaction);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        😊
      </button>
      
      {isOpen && (
        <div 
          className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 bg-base-100 border border-base-300 rounded-2xl shadow-lg p-2 z-50 flex gap-1`}
          onMouseLeave={() => setIsOpen(false)}
        >
          {reactions.map((reaction) => (
            <button
              key={reaction}
              className="btn btn-ghost btn-xs text-lg hover:scale-125 transition-transform duration-150"
              onClick={() => handleReactionSelect(reaction)}
            >
              {reaction}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;