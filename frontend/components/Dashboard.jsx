import React from 'react';
import PropTypes from 'prop-types';

export default function Dashboard({ stats }) {
  return (
    <div className="dashboard-section">
      <h2>Your Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Statuses</h3>
          <p className="stat-value">{stats.statusCount}</p>
        </div>
        <div className="stat-card">
          <h3>Followers</h3>
          <p className="stat-value">{stats.followerCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Views</h3>
          <p className="stat-value">{stats.viewCount}</p>
        </div>
      </div>
    </div>
  );
}

Dashboard.propTypes = {
  stats: PropTypes.shape({
    statusCount: PropTypes.number.isRequired,
    followerCount: PropTypes.number.isRequired,
    viewCount: PropTypes.number.isRequired,
  }).isRequired,
};