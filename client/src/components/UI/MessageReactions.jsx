import React, { useState, useEffect } from 'react';

const MessageReactions = ({ reactions, currentUserId, onReactionClick, onReactionsClick }) => {
  const [reactionDetails, setReactionDetails] = useState({});
  const [hoveredReaction, setHoveredReaction] = useState(null);

  useEffect(() => {
    if (!reactions) return;

    const details = {};
    
    // Group reactions by emoji
    Object.entries(reactions).forEach(([userId, reaction]) => {
      if (!details[reaction]) {
        details[reaction] = {
          count: 0,
          users: [],
          currentUserReacted: false
        };
      }
      details[reaction].count++;
      details[reaction].users.push(userId);
      
      // Check if current user reacted
      if (userId === currentUserId) {
        details[reaction].currentUserReacted = true;
      }
    });

    setReactionDetails(details);
  }, [reactions, currentUserId]);

  if (!reactions || Object.keys(reactions).length === 0) {
    return null;
  }

  const getReactionTooltip = (reaction, details) => {
    if (!details) return reaction;
    
    const { count, currentUserReacted } = details;
    
    if (count === 1 && currentUserReacted) {
      return 'You reacted with ' + reaction;
    } else if (count === 1) {
      return `1 person reacted with ${reaction}`;
    } else if (currentUserReacted) {
      return `You and ${count - 1} others reacted with ${reaction}`;
    } else {
      return `${count} people reacted with ${reaction}`;
    }
  };

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(reactionDetails).map(([reaction, details]) => {
        const hasReacted = details.currentUserReacted;
        
        return (
          <div key={reaction} className="relative">
            <button
              className={`btn btn-xs ${
                hasReacted ? 'btn-primary' : 'btn-ghost'
              } rounded-full px-2 py-1 min-h-0 h-auto transition-all hover:scale-105 group`}
              onClick={() => onReactionClick(reaction)}
              onMouseEnter={() => setHoveredReaction(reaction)}
              onMouseLeave={() => setHoveredReaction(null)}
            >
              <span className="text-xs mr-1">{reaction}</span>
              <span 
                className="text-xs cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onReactionsClick && onReactionsClick(reaction, details.users);
                }}
                title="Click to see who reacted"
              >
                {details.count}
              </span>
            </button>
            
            {/* Tooltip */}
            {hoveredReaction === reaction && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  {getReactionTooltip(reaction, details)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageReactions;