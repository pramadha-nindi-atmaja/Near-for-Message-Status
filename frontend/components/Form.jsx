import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function Form({ onSubmit, currentUser }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      userId: currentUser?.accountId || 'guest',
      message: message
    });
    setMessage('');
  };

  return (
    <div className="status-form">
      <h3>Add or update your status message!</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <input
            type="text"
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <button type="submit">Update</button>
      </form>
    </div>
  );
}

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired
  })
};

Form.defaultProps = {
  currentUser: { accountId: 'guest' }
};