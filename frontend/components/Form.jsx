import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function Form({ onSubmit, currentUser, maxLength, isPublic, onPrivacyChange, expiresInHours, onExpirationChange }) {
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
          <textarea
            id="message"
            value={message}
            onChange={handleChange}
            placeholder="What's your status?"
            aria-describedby="message-help"
            rows="4"
            cols="50"
          />
          <div id="message-help" aria-live="polite">
            <small>{remaining} characters remaining</small>
          </div>
        </div>
        <div className="options-group">
          <div className="option">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => onPrivacyChange && onPrivacyChange(e.target.checked)}
              />
              Make status public
            </label>
          </div>
          <div className="option">
            <label htmlFor="expiration">Auto-expire in hours (0 = never):</label>
            <input
              type="number"
              id="expiration"
              min="0"
              value={expiresInHours || 0}
              onChange={onExpirationChange}
            />
          </div>
        </div>
        <button type="submit" disabled={message.trim().length === 0}>
          Update Status
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
  maxLength: PropTypes.number,
  isPublic: PropTypes.bool,
  onPrivacyChange: PropTypes.func,
  expiresInHours: PropTypes.number,
  onExpirationChange: PropTypes.func,
};

Form.defaultProps = {
  currentUser: { accountId: 'guest' },
  maxLength: 1000,
  isPublic: true,
  onPrivacyChange: null,
  expiresInHours: 0,
  onExpirationChange: null,
};