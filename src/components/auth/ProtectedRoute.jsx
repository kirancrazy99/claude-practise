import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { accessToken } = useAuth();
  return accessToken ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
