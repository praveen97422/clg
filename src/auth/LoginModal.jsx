import { useAuth } from './AuthContext';
import { signInWithGoogle } from '../firebase';
import { BsGoogle } from 'react-icons/bs';
import { useState } from 'react';
import UserDetailsForm from './UserDetailsForm';
import '../styles/UserDetailsPopup.css'; // Use the new CSS file for user details popup styles
import '../styles/LoginModal.css'; // Use the new CSS file for login modal styles

export default function LoginModal({ onClose }) {
  const { login, updateUserProfile } = useAuth();
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      const userData = {
        name: user.displayName,
        email: user.email,
        picture: user.photoURL
      };
      const loggedInUser = await login(userData);
      // Check if user details are stored, if not show details form
      const profile = loggedInUser.profile || {};
      const hasAnyDetails =
        (profile.dob && profile.dob.trim() !== "") ||
        (profile.address && profile.address.trim() !== "") ||
        (profile.phoneNumber && profile.phoneNumber.trim() !== "");
      if (!hasAnyDetails) {
        setTempUserData(userData);
        setShowDetailsForm(true);
        // Do not call onClose here to keep popup open
      } else {
        onClose();
        // Refresh the page after successful login
        window.location.reload();
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  

  const handleDetailsSubmit = async (details) => {
    try {
      console.log('Submitting user details:', details);
      await updateUserProfile(details);
      console.log('User details updated successfully');
      setShowDetailsForm(false);
      onClose();
    } catch (error) {
      console.error('Failed to update user details:', error);
    }
  };

  const handleDetailsCancel = () => {
    setShowDetailsForm(false);
    onClose();
  };

  if (showDetailsForm) {
    return (
      <div className="user-details-popup-overlay">
        <div className="user-details-popup-content">
          <UserDetailsForm
            onSubmit={handleDetailsSubmit}
            onCancel={handleDetailsCancel}
            className="user-details-form"
            userProfile={tempUserData}
            // isEditing={editMode}
            
          />
        </div>
      </div>
    );
  }

  return (
    <div className="login-modal">
      <div className="modal-contents" >
        <h2>Login with Google</h2>
        <button onClick={handleGoogleLogin} className="google-login-btn">
          <BsGoogle />
          Continue with Google
        </button>
        <div >
          <button onClick={onClose} className="modal-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
