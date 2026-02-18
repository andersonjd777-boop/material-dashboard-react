/**
 * DCG Admin Dashboard - Sign In
 * Three login methods: Google OAuth, Email Code, Email + Password
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Divider from "@mui/material/Divider";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";

// Auth context
import { useAuth } from "context/AuthContext";

// Images
import bgImage from "assets/images/bg-sign-in-basic.jpeg";

// Google Client ID (same as backend)
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "667159154939-rl6hcrit2ulve1qe3bf8afn48sde2q7c.apps.googleusercontent.com";

function SignIn() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithCode, sendLoginCode, loading, error } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // OTP state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState(1); // 1 = enter email, 2 = enter code
  const [otpSending, setOtpSending] = useState(false);

  // Google Sign-In
  const handleGoogleCallback = useCallback(
    async (response) => {
      setLocalError("");
      setSuccessMsg("");

      if (response.credential) {
        const result = await loginWithGoogle(response.credential);
        if (result.success) {
          navigate("/dashboard");
        } else {
          setLocalError(result.message || "Google login failed");
        }
      }
    },
    [loginWithGoogle, navigate]
  );

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          context: "signin",
        });
        window.google.accounts.id.renderButton(document.getElementById("google-signin-btn"), {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
          shape: "rectangular",
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      const existing = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existing) existing.remove();
    };
  }, [handleGoogleCallback]);

  // Email + Password login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMsg("");

    if (!email || !password) {
      setLocalError("Please enter email and password");
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setLocalError(result.message || "Login failed");
    }
  };

  // OTP: Send code
  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    setLocalError("");
    setSuccessMsg("");

    if (!otpEmail) {
      setLocalError("Please enter your DCG email address");
      return;
    }

    if (!otpEmail.toLowerCase().endsWith("@directconnectglobal.com")) {
      setLocalError("Only @directconnectglobal.com emails are allowed");
      return;
    }

    setOtpSending(true);
    try {
      const result = await sendLoginCode(otpEmail);
      if (result.success) {
        setOtpStep(2);
        setSuccessMsg("Verification code sent! Check your email.");
      } else {
        setLocalError(result.message || "Failed to send code");
      }
    } catch (err) {
      setLocalError("Failed to send code. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  // OTP: Verify code
  const handleVerifyCode = async (e) => {
    if (e) e.preventDefault();
    setLocalError("");
    setSuccessMsg("");

    if (!otpCode || otpCode.length !== 6) {
      setLocalError("Please enter the 6-digit code from your email");
      return;
    }

    const result = await loginWithCode(otpEmail, otpCode);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setLocalError(result.message || "Invalid code");
    }
  };

  // OTP: Go back to email step
  const handleOtpBack = () => {
    setOtpStep(1);
    setOtpCode("");
    setLocalError("");
    setSuccessMsg("");
  };

  // Clear errors when switching tabs
  const switchTab = (tab) => {
    setActiveTab(tab);
    setLocalError("");
    setSuccessMsg("");
  };

  return (
    <BasicLayout image={bgImage}>
      <Card sx={{ minWidth: 360, maxWidth: 440 }}>
        <MDBox
          variant="gradient"
          bgColor="dark"
          borderRadius="lg"
          coloredShadow="dark"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            DCG Admin
          </MDTypography>
          <MDTypography variant="body2" color="white" mt={1}>
            Direct Connect Global
          </MDTypography>
        </MDBox>

        <MDBox pt={3} pb={3} px={3}>
          {/* Google Sign-In Button */}
          <MDBox mb={2} display="flex" justifyContent="center">
            <div id="google-signin-btn" style={{ width: "100%" }} />
          </MDBox>

          <MDBox my={1}>
            <Divider>
              <MDTypography variant="caption" color="text" fontWeight="medium">
                OR
              </MDTypography>
            </Divider>
          </MDBox>

          {/* Toggle: Email Code | Password */}
          <MDBox mb={2}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <MDButton
                  variant={activeTab === 0 ? "gradient" : "outlined"}
                  color="dark"
                  fullWidth
                  onClick={() => switchTab(0)}
                  sx={{ fontSize: "0.8rem", py: 0.8 }}
                >
                  Email Code
                </MDButton>
              </Grid>
              <Grid item xs={6}>
                <MDButton
                  variant={activeTab === 1 ? "gradient" : "outlined"}
                  color="dark"
                  fullWidth
                  onClick={() => switchTab(1)}
                  sx={{ fontSize: "0.8rem", py: 0.8 }}
                >
                  Password
                </MDButton>
              </Grid>
            </Grid>
          </MDBox>

          {/* Error / Success messages */}
          {(localError || error) && (
            <Alert severity="error" sx={{ mb: 2, fontSize: "0.85rem" }}>
              {localError || error}
            </Alert>
          )}
          {successMsg && (
            <Alert severity="success" sx={{ mb: 2, fontSize: "0.85rem" }}>
              {successMsg}
            </Alert>
          )}

          {/* Tab 0: Email Code Login */}
          {activeTab === 0 && (
            <MDBox>
              {otpStep === 1 ? (
                <MDBox component="form" role="form" onSubmit={handleSendCode}>
                  <MDBox mb={2}>
                    <MDInput
                      type="email"
                      label="DCG Email"
                      fullWidth
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="you@directconnectglobal.com"
                      disabled={otpSending}
                    />
                  </MDBox>
                  <MDBox mt={3} mb={1}>
                    <MDButton
                      variant="gradient"
                      color="dark"
                      fullWidth
                      type="submit"
                      disabled={otpSending || loading}
                    >
                      {otpSending ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        "Send Login Code"
                      )}
                    </MDButton>
                  </MDBox>
                </MDBox>
              ) : (
                <MDBox component="form" role="form" onSubmit={handleVerifyCode}>
                  <MDBox mb={1}>
                    <MDTypography variant="caption" color="text">
                      Code sent to <strong>{otpEmail}</strong>
                    </MDTypography>
                  </MDBox>
                  <MDBox mb={2}>
                    <MDInput
                      type="text"
                      label="6-Digit Code"
                      fullWidth
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      inputProps={{
                        maxLength: 6,
                        style: { letterSpacing: "4px", fontSize: "1.2rem" },
                      }}
                      disabled={loading}
                      autoFocus
                    />
                  </MDBox>
                  <MDBox mt={3} mb={1}>
                    <MDButton
                      variant="gradient"
                      color="dark"
                      fullWidth
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        "Verify & Sign In"
                      )}
                    </MDButton>
                  </MDBox>
                  <MDBox mt={1} display="flex" justifyContent="space-between">
                    <MDTypography
                      variant="caption"
                      color="info"
                      sx={{ cursor: "pointer" }}
                      onClick={handleOtpBack}
                    >
                      ← Back
                    </MDTypography>
                    <MDTypography
                      variant="caption"
                      color="info"
                      sx={{ cursor: "pointer" }}
                      onClick={handleSendCode}
                    >
                      Resend code
                    </MDTypography>
                  </MDBox>
                </MDBox>
              )}
            </MDBox>
          )}

          {/* Tab 1: Password Login */}
          {activeTab === 1 && (
            <MDBox component="form" role="form" onSubmit={handlePasswordSubmit}>
              <MDBox mb={2}>
                <MDInput
                  type="email"
                  label="Email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </MDBox>
              <MDBox mb={2}>
                <MDInput
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </MDBox>
              <MDBox mt={3} mb={1}>
                <MDButton
                  variant="gradient"
                  color="dark"
                  fullWidth
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : "Sign In"}
                </MDButton>
              </MDBox>
            </MDBox>
          )}

          <MDBox mt={2} mb={1} textAlign="center">
            <MDTypography variant="caption" color="text">
              Employee access only — @directconnectglobal.com
            </MDTypography>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default SignIn;
