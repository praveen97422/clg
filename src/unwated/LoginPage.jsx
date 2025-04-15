// import { useAuth } from './AuthContext';
// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { signInWithGoogle } from '../firebase';

// export default function LoginPage() {
//   const { isAuthenticated, login } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate('/');
//     }
//   }, [isAuthenticated, navigate]);

//   const handleGoogleLogin = async () => {
//     try {
//       const user = await signInWithGoogle();
//       login({
//         name: user.displayName,
//         email: user.email,
//         picture: user.photoURL
//       });
//     } catch (error) {
//       console.error('Login error:', error);
//     }
//   };

//   return (
//     <div className="login-container">
//       <h2>Login with Google</h2>
//       <button onClick={handleGoogleLogin} className="google-login-btn">
//         Sign in with Google
//       </button>
//     </div>
//   );
// }
