import React from 'react';
import PropTypes from 'prop-types';

export default function StatusFeed({ statuses, onFollow, onAddReaction, onViewStatus, currentUser, isLoading }) {
  return (
    <div className="public-feed">
      <h2>Public Status Feed</h2>
      {statuses.length > 0 ? (
        <ul>
          {statuses.map(([accountId, message], index) => (
            <li key={index} className="feed-item">
              <div className="feed-header">
                <strong>{accountId}</strong>
                {currentUser && accountId !== currentUser.accountId && (
                  <button 
                    onClick={() => onFollow(accountId)}
                    disabled={isLoading}
                    className="follow-btn"
                  >
                    Follow
                  </button>
                )}
              </div>
              <p 
                className="status-message"
                onClick={() => onViewStatus(accountId)}
              >
                {message}
              </p>
              <div className="reactions">
                <button 
                  onClick={() => onAddReaction(accountId, 'like')}
                  disabled={isLoading || !currentUser}
                >
                  👍 Like
                </button>
                <button 
                  onClick={() => onAddReaction(accountId, 'love')}
                  disabled={isLoading || !currentUser}
                >
                  ❤️ Love
                </button>
                <button 
                  onClick={() => onAddReaction(accountId, 'laugh')}
                  disabled={isLoading || !currentUser}
                >
                  😂 Laugh
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No public statuses available.</p>
      )}
    </div>
  );
}

StatusFeed.propTypes = {
  statuses: PropTypes.arrayOf(PropTypes.array).isRequired,
  onFollow: PropTypes.func.isRequired,
  onAddReaction: PropTypes.func.isRequired,
  onViewStatus: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired,
  }),
  isLoading: PropTypes.bool,
};

StatusFeed.defaultProps = {
  currentUser: null,
  isLoading: false,
};