import React from 'react';
import PropTypes from 'prop-types';

export default function NotificationsPanel({ notifications, onClear, isLoading }) {
  return (
    <div className="notifications-section">
      <div className="section-header">
        <h2>Notifications</h2>
        {notifications.length > 0 && (
          <button onClick={onClear} disabled={isLoading}>
            Clear All
          </button>
        )}
      </div>
      {notifications.length > 0 ? (
        <ul>
          {notifications.map((notification, index) => (
            <li key={index} className="notification-item">
              <p>{notification}</p>
              <small>{new Date().toLocaleString()}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No notifications.</p>
      )}
    </div>
  );
}

NotificationsPanel.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClear: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

NotificationsPanel.defaultProps = {
  isLoading: false,
};