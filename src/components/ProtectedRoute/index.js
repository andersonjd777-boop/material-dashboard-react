/**
 * DCG Admin Dashboard - Protected Route
 * Wraps routes that require authentication
 */

import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "context/AuthContext";
import MDBox from "components/MDBox";
import CircularProgress from "@mui/material/CircularProgress";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </MDBox>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/authentication/sign-in" state={{ from: location }} replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
