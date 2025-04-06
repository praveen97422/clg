import { useAuth } from './AuthContext';
import { signInWithGoogle } from '../firebase';

export default function LoginModal({ onClose }) {
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      login({
        name: user.displayName,
        email: user.email,
        picture: user.photoURL
      });
      onClose();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="login-modal">
      <div className="modal-content">
        <h2>Login with Google</h2>
        <button onClick={handleGoogleLogin} className="google-login-btn">
          Sign in with Google
        </button>
        <button onClick={onClose} className="modal-close-btn">
          Close
        </button>
      </div>
    </div>
  );
}
