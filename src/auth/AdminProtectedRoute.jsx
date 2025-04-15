import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AdminProtectedRoute({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.email !== 'havyajewellery@gmail.com') {
    return <Navigate to="/" replace />;
  }

  return children;
}
