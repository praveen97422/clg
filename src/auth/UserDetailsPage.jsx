import React, { useState, useEffect } from "react";
import UserDetailsForm from "./UserDetailsForm.jsx";
import { useAuth } from "./AuthContext.jsx";
import axios from "axios";
import { BASE_URL } from "../apiConfig.js";
import "../styles/UserDetailsPage.css";

export default function UserDetailsPage() {
  const { user, isAuthenticated } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Renamed class names to avoid CSS collisions
  const containerClass = "udp-container";
  const viewClass = "udp-view";
  const profilePicClass = "udp-profile-pic";
  const editButtonClass = "udp-edit-button";

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      if (!user || !user.token) {
        setError("User authentication error");
        setLoading(false);
        return;
      }
      const token = user.token;
      const response = await axios.get(`${BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Set the fetched user details
      if (response.data && response.data.user) {
        setUserDetails(response.data.user);
      } else {
        setError("No user details found");
      }
    } catch (err) {
      setError("Error fetching user details");
    } finally {
      setLoading(false);
    }
  };
    

  

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserDetails();
    }
  }, [isAuthenticated]);

  

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
  };


  const handleSubmit = async (updatedData) => {
    try {
      if (!user || !user.token) {
        setError("User authentication error");
        return;
        }
      const token = user.token;
      const response = await axios.put(`${BASE_URL}/user/profile`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUserDetails(response.data.user);
        setEditMode(false);
      } else {
        setError("Failed to update user details");
      }
    } catch (err) {
      setError("Error updating user details");
    }
  };

  if (!isAuthenticated) {
    return <p>Please login to view your profile.</p>;
  }

  if (loading) {
    return <p>Loading user details...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!userDetails) {
    return <p>No user details found.</p>;
  }

  return (
    <div className={editMode ? containerClass + " udp-container-popup" : containerClass}>
      {!editMode ? (
        <div className={viewClass}>
          {userDetails.picture && (
            <img
              src={userDetails.picture}
              alt="User Profile"
              className={profilePicClass}
            />
          )}
          {/* userDetails && userDetails.name && */}
          <h2>USER DETAILS</h2>
          <p>
            <strong>Name:</strong>{" "} {userDetails.name || "Not provided"}
          </p>
          <p>
            <strong>Date of Birth:</strong>{" "}
            {userDetails.dob
              ? new Date(userDetails.dob).toLocaleDateString()
              : "Not provided"}
          </p>
          <p>
            <strong>Address:</strong> {userDetails.address || "Not provided"}
          </p>
          <p>
            <strong>Contact Number:</strong>{" "}
            {userDetails.phoneNumber || "Not provided"}
          </p>
          <p>
            <strong>Secondary Number:</strong>{" "}
            {userDetails.additionalPhoneNumber || "Not provided"}
          </p>
          <button className={editButtonClass} onClick={handleEditClick}>Edit</button>
        </div>
      ) : (
        <UserDetailsForm
          initialData={{
            name: userDetails.name || "",
            dob: userDetails.dob
              ? new Date(userDetails.dob).toISOString().split("T")[0]
              : "",
            address: userDetails.address || "",
            phoneNumber: userDetails.phoneNumber || "",
            additionalPhoneNumber: userDetails.additionalPhoneNumber || "",
          }}
          userProfile={userDetails}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={editMode}
          popupMode={true}
        />
      )}
    </div>
  );
}

