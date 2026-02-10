/**
 * DCG Auto-Developer Dashboard Component
 * Intelligent development automation control panel
 */

import { useState, useEffect, useCallback } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import api from "services/api";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

function AutoDeveloper() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState({
    min_priority_score: 60,
    max_tasks_per_run: 3,
    auto_update_status: true,
  });

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.get("/auto-developer/status");
      setStatus(data);
      setConfig(data.config);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.get("/auto-developer/logs", { lines: 50 });
      setLogs(data.logs || []);
    } catch (err) {
      /* logs fetch failed */
    }
  }, []);

  // Toggle enabled/disabled
  const toggleEnabled = async () => {
    try {
      const newEnabled = !status.enabled;
      await api.post("/auto-developer/toggle", { enabled: newEnabled });
      fetchStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  // Update configuration
  const updateConfig = async () => {
    try {
      await api.post("/auto-developer/config", config);
      fetchStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  // Trigger manual run
  const triggerRun = async () => {
    try {
      await api.post("/auto-developer/trigger");
      setTimeout(fetchStatus, 2000);
      setTimeout(fetchLogs, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStatus(), fetchLogs()]);
    setLoading(false);
  }, [fetchStatus, fetchLogs]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress color="info" />
        </MDBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {error && (
          <MDBox mb={3}>
            <Alert severity="error">{error}</Alert>
          </MDBox>
        )}

        {/* Header Card */}
        <MDBox mb={3}>
          <Card>
            <MDBox p={3}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center">
                <MDBox>
                  <MDTypography variant="h4" fontWeight="medium">
                    Auto-Developer Control Panel
                  </MDTypography>
                  <MDTypography variant="button" color="text" fontWeight="regular">
                    Intelligent development automation system
                  </MDTypography>
                </MDBox>
                <MDBox>
                  <MDButton
                    variant="outlined"
                    color="info"
                    size="small"
                    iconOnly
                    onClick={refreshAll}
                  >
                    <RefreshIcon />
                  </MDButton>
                </MDBox>
              </MDBox>
            </MDBox>
          </Card>
        </MDBox>

        {/* Status Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" fontWeight="medium" mb={1}>
                  Status
                </MDTypography>
                <Chip
                  label={status?.enabled ? "ENABLED" : "DISABLED"}
                  color={status?.enabled ? "success" : "default"}
                  icon={<SmartToyIcon />}
                />
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" fontWeight="medium" mb={1}>
                  Last Run
                </MDTypography>
                <MDTypography variant="button" color="text">
                  {status?.state?.last_run
                    ? new Date(status.state.last_run).toLocaleString()
                    : "Never"}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" fontWeight="medium" mb={1}>
                  Tasks Processed
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold">
                  {status?.state?.tasks_processed || 0}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" fontWeight="medium" mb={1}>
                  Queue Size
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold">
                  {status?.queue_size || 0}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Controls Card */}
        <MDBox mb={3}>
          <Card>
            <MDBox p={3}>
              <MDTypography variant="h5" fontWeight="medium" mb={2}>
                Controls
              </MDTypography>
              <MDBox display="flex" gap={2}>
                <MDButton
                  variant="gradient"
                  color={status?.enabled ? "error" : "success"}
                  onClick={toggleEnabled}
                >
                  {status?.enabled ? "Disable" : "Enable"} Auto-Developer
                </MDButton>
                <MDButton
                  variant="gradient"
                  color="info"
                  onClick={triggerRun}
                  startIcon={<PlayArrowIcon />}
                >
                  Trigger Manual Run
                </MDButton>
              </MDBox>
            </MDBox>
          </Card>
        </MDBox>

        {/* Configuration Card */}
        <MDBox mb={3}>
          <Card>
            <MDBox p={3}>
              <MDTypography variant="h5" fontWeight="medium" mb={3}>
                Configuration
              </MDTypography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Minimum Priority Score"
                    value={config.min_priority_score}
                    onChange={(e) =>
                      setConfig({ ...config, min_priority_score: parseInt(e.target.value) })
                    }
                    inputProps={{ min: 0, max: 100 }}
                    helperText="Tasks below this score will be skipped"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Tasks Per Run"
                    value={config.max_tasks_per_run}
                    onChange={(e) =>
                      setConfig({ ...config, max_tasks_per_run: parseInt(e.target.value) })
                    }
                    inputProps={{ min: 1, max: 10 }}
                    helperText="Maximum tasks to process in each cycle"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.auto_update_status}
                        onChange={(e) =>
                          setConfig({ ...config, auto_update_status: e.target.checked })
                        }
                      />
                    }
                    label="Auto-Update Task Status"
                  />
                  <MDTypography variant="caption" color="text" display="block">
                    Automatically update task status to &quot;in_progress&quot;
                  </MDTypography>
                </Grid>
                <Grid item xs={12}>
                  <MDButton variant="gradient" color="info" onClick={updateConfig}>
                    Save Configuration
                  </MDButton>
                </Grid>
              </Grid>
            </MDBox>
          </Card>
        </MDBox>

        {/* Logs Card */}
        <Card>
          <MDBox p={3}>
            <MDTypography variant="h5" fontWeight="medium" mb={2}>
              Recent Activity Logs
            </MDTypography>
            <Divider />
            <MDBox
              mt={2}
              sx={{
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
                padding: "15px",
                borderRadius: "8px",
                maxHeight: "400px",
                overflowY: "auto",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              {logs.length === 0 ? (
                <MDTypography variant="button" color="text">
                  No logs available
                </MDTypography>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: "4px" }}>
                    {log}
                  </div>
                ))
              )}
            </MDBox>
          </MDBox>
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AutoDeveloper;
