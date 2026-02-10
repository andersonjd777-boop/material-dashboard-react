/**
 * DCG Admin Dashboard - Protected Route
 * Wraps routes that require authentication and optional role-based access
 */

import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "context/AuthContext";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import CircularProgress from "@mui/material/CircularProgress";

function ProtectedRoute({ children, requiredRoles }) {
  const { isAuthenticated, loading, user } = useAuth();
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

  // Role-based access control
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user?.role || "viewer";
    if (!requiredRoles.includes(userRole)) {
      return (
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <MDTypography variant="h5" color="error">
            Access Denied — Insufficient permissions
          </MDTypography>
        </MDBox>
      );
    }
  }

  return children;
}

ProtectedRoute.defaultProps = {
  requiredRoles: null,
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
