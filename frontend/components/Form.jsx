import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function Form({ onSubmit, currentUser, maxLength }) {
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    // enforce maxLength while typing
    const next = e.target.value.slice(0, maxLength);
    setMessage(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return; // avoid submitting empty/whitespace-only messages

    onSubmit({
      userId: currentUser?.accountId || 'guest',
      message: trimmed
    });
    setMessage('');
  };

  const remaining = maxLength - message.length;

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
            onChange={handleChange}
            placeholder="What's your status?"
            aria-describedby="message-help"
          />
          <div id="message-help" aria-live="polite">
            <small>{remaining} characters remaining</small>
          </div>
        </div>
        <button type="submit" disabled={message.trim().length === 0}>
          Update
        </button>
      </form>
    </div>
  );
}

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired
  }),
  maxLength: PropTypes.number
};

Form.defaultProps = {
  currentUser: { accountId: 'guest' },
  maxLength: 280
};