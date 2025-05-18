import React, { useState, useEffect } from 'react';

export default function UserDetailsForm({ onSubmit, onCancel, initialData = {}, userProfile, isEditing, popupMode = false }) {
  const [name, setName] = useState(initialData.name || '');
  const [dob, setDob] = useState(initialData.dob || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [phoneNumber, setPhoneNumber] = useState(initialData.phoneNumber || '');
  const [additionalPhoneNumber, setAdditionalPhoneNumber] = useState(initialData.additionalPhoneNumber || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, dob, address, phoneNumber, additionalPhoneNumber });
  };

  return (
    <div className={popupMode ? "user-details-form" : "user-details-forms"}>
      <div className="user-profile-header">
        {userProfile && userProfile.picture && (
          <img src={userProfile.picture} alt="User Profile" className="user-profile-picture" />
        )}
        {userProfile && userProfile.name && (
          <h2 className="user-profile-name">Welcome {userProfile.name}</h2>
        )}
      </div>
      <h3>Additional User Details</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="dob">Date of Birth:</label>
          <input
            type="date"
            id="dob"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </div>
        <div>
          <p>Address:</p>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="phoneNumber">Contact Number:</label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="additionalPhoneNumber">Secondary Number:</label>
          <input
            type="tel"
            id="additionalPhoneNumber"
            value={additionalPhoneNumber}
            onChange={(e) => setAdditionalPhoneNumber(e.target.value)}
          />
        </div>
        <div>
          <button type="submit">Save Details</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
