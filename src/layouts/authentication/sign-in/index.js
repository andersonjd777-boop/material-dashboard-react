/**
 * DCG Admin Dashboard - Sign In
 * Employee authentication for Direct Connect Global
 */

import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

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

// Validation schema
const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// Rate limiting constants
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60000; // 1 minute

function SignIn() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLocked, setIsLocked] = useState(false);

  // Rate limiting refs (persist across renders without causing re-renders)
  const attemptCount = useRef(0);
  const lockoutTimer = useRef(null);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLocalError("");
      setFieldErrors({});

      // Rate limiting check
      if (isLocked) {
        setLocalError("Too many failed attempts. Please wait 1 minute before trying again.");
        return;
      }

      // Yup validation
      try {
        await loginSchema.validate({ email, password }, { abortEarly: false });
      } catch (validationError) {
        const errors = {};
        validationError.inner.forEach((err) => {
          errors[err.path] = err.message;
        });
        setFieldErrors(errors);
        return;
      }

      const result = await login(email, password, rememberMe);
      if (result.success) {
        attemptCount.current = 0;
        navigate("/dashboard");
      } else {
        attemptCount.current += 1;
        setLocalError(result.message || "Login failed");

        // Lock out after MAX_ATTEMPTS
        if (attemptCount.current >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLocalError(`Too many failed attempts (${MAX_ATTEMPTS}). Please wait 1 minute.`);
          lockoutTimer.current = setTimeout(() => {
            setIsLocked(false);
            attemptCount.current = 0;
            setLocalError("");
          }, LOCKOUT_DURATION_MS);
        }
      }
    },
    [email, password, rememberMe, isLocked, login, navigate]
  );

  return (
    <BasicLayout image={bgImage}>
      <Card>
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
        <MDBox pt={4} pb={3} px={3}>
          {(localError || error) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {localError || error}
            </Alert>
          )}
          <MDBox component="form" role="form" onSubmit={handleSubmit}>
            <MDBox mb={2}>
              <MDInput
                type="email"
                label="Email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isLocked}
                error={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <MDTypography variant="caption" color="error" ml={1}>
                  {fieldErrors.email}
                </MDTypography>
              )}
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type={showPassword ? "text" : "password"}
                label="Password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || isLocked}
                error={!!fieldErrors.password}
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
              {fieldErrors.password && (
                <MDTypography variant="caption" color="error" ml={1}>
                  {fieldErrors.password}
                </MDTypography>
              )}
            </MDBox>
            <MDBox display="flex" alignItems="center" ml={-1}>
              <Switch checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
              <MDTypography
                variant="button"
                fontWeight="regular"
                color="text"
                onClick={() => setRememberMe(!rememberMe)}
                sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
              >
                &nbsp;&nbsp;Remember me
              </MDTypography>
            </MDBox>
            <MDBox mt={4} mb={1}>
              <MDButton
                variant="gradient"
                color="dark"
                fullWidth
                type="submit"
                disabled={loading || isLocked}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Sign In"}
              </MDButton>
            </MDBox>
            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="caption" color="text">
                Employee access only. Contact IT for credentials.
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default SignIn;
