import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RoleRedirect() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Navigate to={`/${user.role}/dashboard`} replace />;
}
