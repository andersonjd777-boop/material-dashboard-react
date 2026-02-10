/**
 * DCG Admin Dashboard - Error Boundary Component
 * Catches React component errors and reports them to OpenReplay
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { trackError, trackEvent } from "services/openreplay";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to OpenReplay
    trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || "AppErrorBoundary",
    });

    // Track the error event
    trackEvent("error:react_component_crash", {
      errorMessage: error.message,
      errorName: error.name,
      componentStack: errorInfo.componentStack?.slice(0, 500), // Truncate for payload size
      boundaryName: this.props.name || "AppErrorBoundary",
      timestamp: new Date().toISOString(),
    });

    // Update state with error info
    this.setState({
      errorInfo,
      eventId: Date.now().toString(36),
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Caught error:", error);
      console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    }

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh" p={3}>
          <Card sx={{ maxWidth: 500, p: 4, textAlign: "center" }}>
            <MDBox mb={3}>
              <Icon sx={{ fontSize: 64, color: "error.main" }}>error_outline</Icon>
            </MDBox>

            <MDTypography variant="h4" fontWeight="bold" mb={2}>
              Something went wrong
            </MDTypography>

            <MDTypography variant="body1" color="text" mb={3}>
              We encountered an unexpected error. Our team has been notified and is working on a
              fix.
            </MDTypography>

            {window.location.hostname === "localhost" && this.state.error && (
              <MDBox
                sx={{
                  backgroundColor: "#ffebee",
                  borderRadius: 1,
                  p: 2,
                  mb: 3,
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: 200,
                }}
              >
                <MDTypography variant="caption" component="pre" sx={{ fontFamily: "monospace" }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </MDTypography>
              </MDBox>
            )}

            <MDTypography variant="caption" color="text" display="block" mb={3}>
              Error ID: {this.state.eventId}
            </MDTypography>

            <MDBox display="flex" gap={2} justifyContent="center">
              <Button variant="contained" color="primary" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant="outlined" color="secondary" onClick={this.handleGoHome}>
                Go to Dashboard
              </Button>
              <Button variant="text" color="inherit" onClick={this.handleReload}>
                Reload Page
              </Button>
            </MDBox>
          </Card>
        </MDBox>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string,
  fallback: PropTypes.func,
  onError: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  name: "AppErrorBoundary",
  fallback: null,
  onError: null,
};

export default ErrorBoundary;
