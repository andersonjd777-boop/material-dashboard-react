/**
 * Auto-Healer Dashboard - Monitor and manage DCG phone system auto-healing
 */

import { useState, useEffect, useCallback } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import RefreshIcon from "@mui/icons-material/Refresh";
import BugReportIcon from "@mui/icons-material/BugReport";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

function AutoHealer() {
  const [status, setStatus] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logType, setLogType] = useState("scan");

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/auto-healer/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  }, []);

  const fetchBugs = useCallback(async () => {
    try {
      const response = await fetch("/api/auto-healer/bugs");
      const data = await response.json();
      setBugs(data);
    } catch (error) {
      console.error("Failed to fetch bugs:", error);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/auto-healer/logs/${logType}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  }, [logType]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStatus(), fetchBugs(), fetchLogs()]);
    setLoading(false);
  }, [fetchStatus, fetchBugs, fetchLogs]);

  const changeMode = async (newMode) => {
    try {
      await fetch("/api/auto-healer/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      await fetchStatus();
    } catch (error) {
      console.error("Failed to change mode:", error);
    }
  };

  const triggerScan = async () => {
    try {
      await fetch("/api/auto-healer/trigger", { method: "POST" });
      setTimeout(refreshAll, 3000);
    } catch (error) {
      console.error("Failed to trigger scan:", error);
    }
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  useEffect(() => {
    fetchLogs();
  }, [logType, fetchLogs]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "error";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "info";
      case "LOW":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (statusValue) => {
    return statusValue === "HEALTHY" ? "success" : "warning";
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          {/* Status Card */}
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <MDBox p={2}>
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <MDTypography variant="h6">System Status</MDTypography>
                  <HealthAndSafetyIcon color={status ? getStatusColor(status.status) : "default"} />
                </MDBox>
                {status && (
                  <>
                    <Chip
                      label={status.status}
                      color={getStatusColor(status.status)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <MDTypography variant="caption" display="block">
                      Mode: {status.mode}
                    </MDTypography>
                    <MDTypography variant="caption" display="block">
                      Last Update: {new Date(status.timestamp).toLocaleString()}
                    </MDTypography>
                  </>
                )}
              </MDBox>
            </Card>
          </Grid>

          {/* Bugs Card */}
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <MDBox p={2}>
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <MDTypography variant="h6">Bugs</MDTypography>
                  <BugReportIcon color="error" />
                </MDBox>
                {status && (
                  <>
                    <MDTypography variant="h4" fontWeight="bold">
                      {status.bugs.total}
                    </MDTypography>
                    <MDTypography variant="caption" display="block">
                      Critical: {status.bugs.critical} | High: {status.bugs.high}
                    </MDTypography>
                    <MDTypography variant="caption" display="block" color="success">
                      Fixed: {status.bugs.fixed}
                    </MDTypography>
                  </>
                )}
              </MDBox>
            </Card>
          </Grid>

          {/* Metrics Card */}
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" mb={2}>
                  Metrics
                </MDTypography>
                {status && status.metrics && (
                  <>
                    <MDTypography variant="caption" display="block">
                      Call Success: {status.metrics.call_success_rate}%
                    </MDTypography>
                    <MDTypography variant="caption" display="block">
                      Message Delivery: {status.metrics.message_delivery_rate}%
                    </MDTypography>
                    <MDTypography
                      variant="caption"
                      display="block"
                      color={status.metrics.user_repeat_rate > 30 ? "error" : "success"}
                    >
                      User Repeat Rate: {status.metrics.user_repeat_rate}%
                    </MDTypography>
                  </>
                )}
              </MDBox>
            </Card>
          </Grid>

          {/* Actions Card */}
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" mb={2}>
                  Actions
                </MDTypography>
                <MDButton
                  variant="outlined"
                  color="info"
                  size="small"
                  fullWidth
                  onClick={refreshAll}
                  disabled={loading}
                  sx={{ mb: 1 }}
                >
                  <RefreshIcon sx={{ mr: 1 }} /> Refresh
                </MDButton>
                <MDButton
                  variant="outlined"
                  color="success"
                  size="small"
                  fullWidth
                  onClick={triggerScan}
                  sx={{ mb: 1 }}
                >
                  <PlayArrowIcon sx={{ mr: 1 }} /> Trigger Scan
                </MDButton>
                <FormControl fullWidth size="small">
                  <InputLabel>Mode</InputLabel>
                  <Select
                    value={status?.mode || "MONITORING"}
                    label="Mode"
                    onChange={(e) => changeMode(e.target.value)}
                  >
                    <MenuItem value="SCANNER">Scanner</MenuItem>
                    <MenuItem value="FIXER">Fixer</MenuItem>
                    <MenuItem value="COMBINED">Combined</MenuItem>
                    <MenuItem value="MONITORING">Monitoring</MenuItem>
                  </Select>
                </FormControl>
              </MDBox>
            </Card>
          </Grid>

          {/* Detected Bugs Table */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Detected Bugs
                </MDTypography>
                {bugs.length === 0 ? (
                  <MDTypography variant="body2" color="text">
                    No bugs detected. System is healthy! 🎉
                  </MDTypography>
                ) : (
                  <MDBox>
                    {bugs.map((bug) => (
                      <Card key={bug.id} sx={{ mb: 2, p: 2 }}>
                        <MDBox
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <MDTypography variant="h6">{bug.bug_type}</MDTypography>
                          <Chip
                            label={bug.severity}
                            color={getSeverityColor(bug.severity)}
                            size="small"
                          />
                        </MDBox>
                        <MDTypography variant="body2" mb={1}>
                          {bug.description}
                        </MDTypography>
                        <MDTypography variant="caption" display="block" color="text">
                          Location: {bug.location}
                        </MDTypography>
                        <MDTypography variant="caption" display="block" color="text">
                          Detected: {new Date(bug.detected_at).toLocaleString()}
                        </MDTypography>
                      </Card>
                    ))}
                  </MDBox>
                )}
              </MDBox>
            </Card>
          </Grid>

          {/* Logs Viewer */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <MDTypography variant="h6">Logs</MDTypography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Log Type</InputLabel>
                    <Select
                      value={logType}
                      label="Log Type"
                      onChange={(e) => setLogType(e.target.value)}
                    >
                      <MenuItem value="scan">Scan</MenuItem>
                      <MenuItem value="fix">Fix</MenuItem>
                      <MenuItem value="regression">Regression</MenuItem>
                      <MenuItem value="cron">Cron</MenuItem>
                    </Select>
                  </FormControl>
                </MDBox>
                <MDBox
                  sx={{
                    backgroundColor: "#1a1a1a",
                    color: "#00ff00",
                    p: 2,
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  {logs.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AutoHealer;
