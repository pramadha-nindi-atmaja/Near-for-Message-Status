import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function ProfileForm({ profile, onSave, isLoading }) {
  const [name, setName] = useState(profile.name || '');
  const [bio, setBio] = useState(profile.bio || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, bio });
  };

  return (
    <div className="profile-form">
      <h3>User Profile</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="bio">Bio:</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            rows="3"
          />
        </div>
        <button type="submit" disabled={isLoading}>
          Save Profile
        </button>
      </form>
    </div>
  );
}

ProfileForm.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    bio: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

ProfileForm.defaultProps = {
  profile: { name: '', bio: '' },
  isLoading: false,
};