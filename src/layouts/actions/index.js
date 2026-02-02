/**
 * DCG Admin Dashboard - Quick Actions
 * Admin tools for service management, security, and maintenance
 */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import api from "services/api";

function Actions() {
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [storageInfo, setStorageInfo] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({});

  useEffect(() => {
    fetchServiceStatus();
    fetchStorageInfo();
  }, []);

  const fetchServiceStatus = async () => {
    try {
      const [whisper, asterisk, pm2] = await Promise.all([
        api.getWhisperStatus().catch(() => ({ running: false })),
        api.getAsteriskActionStatus().catch(() => ({ running: false })),
        api.getPM2ActionStatus().catch(() => ({ processes: [] })),
      ]);
      setServiceStatus({ whisper, asterisk, pm2 });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      const data = await api.getStorageInfo();
      setStorageInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  const executeAction = async (actionKey, apiCall, requiresConfirm = false) => {
    if (requiresConfirm && !confirmDialog.confirmed) {
      setConfirmDialog({ open: true, action: actionKey, apiCall });
      return;
    }

    setLoading((prev) => ({ ...prev, [actionKey]: true }));
    try {
      const result = await apiCall();
      setResults((prev) => ({ ...prev, [actionKey]: result }));
      setSnackbar({
        open: true,
        message: result.message || "Action completed successfully",
        severity: "success",
      });
      if (actionKey.includes("service")) fetchServiceStatus();
      if (actionKey.includes("storage")) fetchStorageInfo();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Action failed", severity: "error" });
    } finally {
      setLoading((prev) => ({ ...prev, [actionKey]: false }));
      setConfirmDialog({ open: false, action: null });
    }
  };

  const handleConfirm = () => {
    if (confirmDialog.action && confirmDialog.apiCall) {
      setConfirmDialog((prev) => ({ ...prev, confirmed: true }));
      executeAction(confirmDialog.action, confirmDialog.apiCall, false);
    }
  };

  const ActionCard = ({
    title,
    description,
    icon,
    color,
    onClick,
    isLoading,
    status,
    adminOnly,
  }) => (
    <Card sx={{ height: "100%", cursor: "pointer", "&:hover": { boxShadow: 6 } }} onClick={onClick}>
      <MDBox p={2} display="flex" flexDirection="column" height="100%">
        <MDBox display="flex" alignItems="center" mb={1}>
          <MDBox
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="3rem"
            height="3rem"
            borderRadius="lg"
            bgColor={color}
            color="white"
            mr={2}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : <Icon>{icon}</Icon>}
          </MDBox>
          <MDBox>
            <MDTypography variant="h6" fontWeight="medium">
              {title}
            </MDTypography>
            {status && (
              <Chip
                label={status}
                size="small"
                color={status === "active" || status === "running" ? "success" : "error"}
                sx={{ ml: 1 }}
              />
            )}
          </MDBox>
        </MDBox>
        <MDTypography variant="caption" color="text">
          {description}
        </MDTypography>
        {adminOnly && (
          <Chip
            label="Admin Only"
            size="small"
            color="warning"
            sx={{ mt: 1, width: "fit-content" }}
          />
        )}
      </MDBox>
    </Card>
  );

  const SectionHeader = ({ title, icon }) => (
    <MDBox display="flex" alignItems="center" mb={2} mt={3}>
      <Icon color="info" sx={{ mr: 1 }}>
        {icon}
      </Icon>
      <MDTypography variant="h5" fontWeight="bold">
        {title}
      </MDTypography>
    </MDBox>
  );

  ActionCard.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    status: PropTypes.string,
    adminOnly: PropTypes.bool,
  };

  ActionCard.defaultProps = {
    isLoading: false,
    status: null,
    adminOnly: false,
  };

  SectionHeader.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  };

  // Smart result analyzer that explains terminal output in plain language
  const ResultAnalysis = ({ actionKey, result }) => {
    const getAnalysis = () => {
      // Whisper status
      if (actionKey === "whisper-status") {
        if (result.running) {
          const pids = result.details?.pids || [];
          return {
            status: "success",
            summary: "Whisper ASR is running and healthy",
            details: [
              "✅ Speech recognition service is active",
              `✅ Process ID${pids.length > 1 ? "s" : ""}: ${pids.join(", ") || "Running"}`,
              "✅ Ready to transcribe voice commands from callers",
            ],
          };
        }
        return {
          status: "error",
          summary: "Whisper ASR is not running",
          details: [
            "❌ Speech recognition is offline",
            "⚠️ Voice commands will not be transcribed",
            "💡 Try clicking 'Restart Whisper' to fix",
          ],
        };
      }

      // Whisper restart
      if (actionKey === "whisper-restart") {
        return {
          status: result.success ? "success" : "error",
          summary: result.success ? "Whisper restarted successfully" : "Failed to restart Whisper",
          details: result.success
            ? ["✅ Service restarted", "✅ Speech recognition back online"]
            : ["❌ Restart failed", "💡 Check server logs for details"],
        };
      }

      // Asterisk status
      if (actionKey === "asterisk-status") {
        if (result.running || result.status === "active") {
          return {
            status: "success",
            summary: "Asterisk PBX is running",
            details: [
              "✅ Phone system is operational",
              `✅ ${result.channels || 0} active channels`,
              "✅ Ready to handle incoming calls",
            ],
          };
        }
        return {
          status: "error",
          summary: "Asterisk PBX is not running",
          details: [
            "❌ Phone system is offline",
            "⚠️ Incoming calls will not connect",
            "💡 Try clicking 'Restart Asterisk' to fix",
          ],
        };
      }

      // PM2 status
      if (actionKey === "pm2-status") {
        const processes = result.processes || [];
        const online = processes.filter((p) => p.status === "online").length;
        const errored = processes.filter((p) => p.status === "errored").length;
        return {
          status: errored > 0 ? "warning" : "success",
          summary: `${online} process${online !== 1 ? "es" : ""} online${
            errored > 0 ? `, ${errored} errored` : ""
          }`,
          details: processes.map(
            (p) =>
              `${p.status === "online" ? "✅" : "❌"} ${p.name}: ${p.status} (PID: ${
                p.pid || "N/A"
              }, Restarts: ${p.restarts || 0})`
          ),
        };
      }

      // Failed logins
      if (actionKey === "failed-logins") {
        const count = result.attempts?.length || result.count || 0;
        return {
          status: count > 5 ? "warning" : "success",
          summary: `${count} failed login attempt${count !== 1 ? "s" : ""} detected`,
          details:
            count > 0
              ? [
                  `⚠️ ${count} unsuccessful login attempts`,
                  "📋 Review the attempts for suspicious activity",
                  count > 10 ? "🚨 High number of failures - possible brute force" : "",
                ].filter(Boolean)
              : ["✅ No recent failed login attempts", "✅ System security looks good"],
        };
      }

      // Security logs
      if (actionKey === "security-logs") {
        const logs = result.logs || [];
        return {
          status: "info",
          summary: `${logs.length} security event${logs.length !== 1 ? "s" : ""} found`,
          details:
            logs.length > 0
              ? logs
                  .slice(0, 5)
                  .map((log) => `📝 ${log.event || log.message || JSON.stringify(log)}`)
              : ["✅ No recent security events"],
        };
      }

      // Disk usage
      if (actionKey === "disk-usage") {
        const usage = result.usage || [];
        // Handle array format: [{size: "20G", path: "/"}]
        if (Array.isArray(usage)) {
          return {
            status: "info",
            summary: "Disk usage breakdown by directory",
            details: usage.map((item) => `📁 ${item.path}: ${item.size}`),
          };
        }
        // Fallback for object format
        return {
          status: "info",
          summary: "Disk usage breakdown",
          details: Object.entries(usage)
            .filter(([key]) => key !== "success")
            .map(([dir, size]) => `📁 ${dir}: ${size}`),
        };
      }

      // Storage info
      if (actionKey === "storage-info") {
        const root = result.rootDisk || {};
        const vol = result.additionalVolume || {};
        return {
          status: "info",
          summary: "Storage allocation details",
          details: [
            `💾 Root Disk: ${root.used || "?"} / ${root.size || "?"} (${root.percentUsed || "?"})`,
            `💾 Extra Volume: ${vol.used || "?"} / ${vol.size || "?"} (${vol.percentUsed || "?"})`,
            parseInt(root.percentUsed) > 80
              ? "⚠️ Root disk getting full!"
              : "✅ Storage levels healthy",
          ],
        };
      }

      // Purge logs
      if (actionKey === "purge-logs") {
        return {
          status: result.success ? "success" : "error",
          summary: result.success ? "Old logs purged successfully" : "Failed to purge logs",
          details: result.success
            ? [
                `🗑️ Removed ${result.filesDeleted || "old"} log files`,
                `💾 Freed ${result.spaceFreed || "some"} disk space`,
                "✅ System cleaned up",
              ]
            : ["❌ Purge failed", `Error: ${result.error || "Unknown"}`],
        };
      }

      // Clean temp
      if (actionKey === "clean-temp") {
        return {
          status: result.success ? "success" : "error",
          summary: result.success ? "Temp files cleaned" : "Failed to clean temp files",
          details: result.success
            ? ["🧹 Temporary files removed", "💾 Storage space recovered"]
            : ["❌ Cleanup failed"],
        };
      }

      // Default fallback
      return {
        status: result.success !== false ? "info" : "error",
        summary: result.message || "Action completed",
        details: [`Raw output: ${JSON.stringify(result, null, 2)}`],
      };
    };

    const analysis = getAnalysis();
    const bgColor =
      analysis.status === "success"
        ? "#e8f5e9"
        : analysis.status === "error"
        ? "#ffebee"
        : analysis.status === "warning"
        ? "#fff3e0"
        : "#e3f2fd";

    return (
      <MDBox sx={{ backgroundColor: bgColor, borderRadius: 2, p: 2 }}>
        <MDTypography variant="body1" fontWeight="medium" mb={1}>
          {analysis.summary}
        </MDTypography>
        {analysis.details.map((detail, idx) => (
          <MDTypography
            key={idx}
            variant="body2"
            color="text"
            sx={{ ml: 1, mb: 0.5, fontFamily: "monospace", fontSize: "13px" }}
          >
            {detail}
          </MDTypography>
        ))}
      </MDBox>
    );
  };

  ResultAnalysis.propTypes = {
    actionKey: PropTypes.string.isRequired,
    result: PropTypes.object.isRequired,
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDTypography variant="h4" fontWeight="bold">
            Quick Actions
          </MDTypography>
          <MDButton
            variant="outlined"
            color="info"
            onClick={() => {
              fetchServiceStatus();
              fetchStorageInfo();
            }}
          >
            <Icon sx={{ mr: 1 }}>refresh</Icon> Refresh Status
          </MDButton>
        </MDBox>

        {/* Service Management */}
        <SectionHeader title="Service Management" icon="settings" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Check Whisper"
              description="Check if Whisper ASR speech recognition is running"
              icon="mic"
              color="info"
              status={serviceStatus.whisper?.status}
              onClick={() => executeAction("whisper-status", () => api.getWhisperStatus())}
              isLoading={loading["whisper-status"]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Restart Whisper"
              description="Restart the Whisper ASR service"
              icon="restart_alt"
              color="warning"
              adminOnly
              onClick={() => executeAction("whisper-restart", () => api.restartWhisper(), true)}
              isLoading={loading["whisper-restart"]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Check Asterisk"
              description="Check Asterisk PBX phone system status"
              icon="phone"
              color="info"
              status={serviceStatus.asterisk?.status}
              onClick={() => executeAction("asterisk-status", () => api.getAsteriskActionStatus())}
              isLoading={loading["asterisk-status"]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Restart Asterisk"
              description="Restart the Asterisk PBX service"
              icon="restart_alt"
              color="error"
              adminOnly
              onClick={() => executeAction("asterisk-restart", () => api.restartAsterisk(), true)}
              isLoading={loading["asterisk-restart"]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="PM2 Status"
              description="View all Node.js process statuses"
              icon="memory"
              color="success"
              onClick={() => executeAction("pm2-status", () => api.getPM2ActionStatus())}
              isLoading={loading["pm2-status"]}
            />
          </Grid>
        </Grid>

        {/* Security & Monitoring */}
        <SectionHeader title="Security & Monitoring" icon="security" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Failed Logins"
              description="View flagged failed login attempts"
              icon="warning"
              color="error"
              onClick={() => executeAction("failed-logins", () => api.getFailedLogins())}
              isLoading={loading["failed-logins"]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Security Logs"
              description="View recent security event logs"
              icon="description"
              color="info"
              onClick={() => executeAction("security-logs", () => api.getSecurityLogs())}
              isLoading={loading["security-logs"]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Clear Logs"
              description="Clear security event logs (backs up first)"
              icon="delete_sweep"
              color="warning"
              adminOnly
              onClick={() => executeAction("clear-logs", () => api.clearSecurityLogs(), true)}
              isLoading={loading["clear-logs"]}
            />
          </Grid>
        </Grid>

        {/* Server Maintenance */}
        <SectionHeader title="Server Maintenance" icon="build" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Purge Old Logs"
              description="Delete log files older than 30 days"
              icon="cleaning_services"
              color="warning"
              adminOnly
              onClick={() => executeAction("purge-logs", () => api.purgeLogs(), true)}
              isLoading={loading["purge-logs"]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Clean Temp Files"
              description="Remove temporary files from VPS"
              icon="folder_delete"
              color="warning"
              adminOnly
              onClick={() => executeAction("clean-temp", () => api.cleanTemp(), true)}
              isLoading={loading["clean-temp"]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Disk Usage"
              description="View disk usage breakdown by directory"
              icon="pie_chart"
              color="info"
              onClick={() => executeAction("disk-usage", () => api.getDiskUsage())}
              isLoading={loading["disk-usage"]}
            />
          </Grid>
        </Grid>

        {/* Storage Management */}
        <SectionHeader title="Storage Management" icon="storage" />
        {storageInfo && (
          <MDBox mb={3}>
            <Card>
              <MDBox p={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <MDTypography variant="h6">Root Disk (25GB)</MDTypography>
                    <MDTypography variant="body2">
                      Used: {storageInfo.rootDisk?.used} / {storageInfo.rootDisk?.size} (
                      {storageInfo.rootDisk?.percentUsed})
                    </MDTypography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDTypography variant="h6">Additional Volume (25GB)</MDTypography>
                    <MDTypography variant="body2">
                      Used: {storageInfo.additionalVolume?.used} /{" "}
                      {storageInfo.additionalVolume?.size} (
                      {storageInfo.additionalVolume?.percentUsed})
                    </MDTypography>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </MDBox>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Storage Info"
              description="View storage allocation details"
              icon="inventory"
              color="info"
              onClick={() => executeAction("storage-info", () => api.getStorageInfo())}
              isLoading={loading["storage-info"]}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ActionCard
              title="Move Large Files"
              description="Move old files to additional volume"
              icon="drive_file_move"
              color="warning"
              adminOnly
              onClick={() => executeAction("move-files", () => api.moveLargeFiles(), true)}
              isLoading={loading["move-files"]}
            />
          </Grid>
        </Grid>

        {/* Action Result Analysis */}
        {Object.keys(results).length > 0 && (
          <>
            <SectionHeader title="Action Result Analysis" icon="analytics" />
            <Card>
              <MDBox p={3}>
                {Object.entries(results).map(([actionKey, result]) => (
                  <MDBox key={actionKey} mb={3} pb={2} borderBottom="1px solid #eee">
                    <MDBox display="flex" alignItems="center" mb={1}>
                      <Icon color={result.success !== false ? "success" : "error"} sx={{ mr: 1 }}>
                        {result.success !== false ? "check_circle" : "error"}
                      </Icon>
                      <MDTypography variant="h6" fontWeight="bold" textTransform="capitalize">
                        {actionKey.replace(/-/g, " ")}
                      </MDTypography>
                    </MDBox>
                    <ResultAnalysis actionKey={actionKey} result={result} />
                  </MDBox>
                ))}
              </MDBox>
            </Card>
          </>
        )}
      </MDBox>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <MDTypography>
            Are you sure you want to perform this action? This may affect running services.
          </MDTypography>
        </DialogContent>
        <DialogActions>
          <MDButton
            onClick={() => setConfirmDialog({ open: false, action: null })}
            color="secondary"
          >
            Cancel
          </MDButton>
          <MDButton onClick={handleConfirm} color="error" variant="contained">
            Confirm
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </DashboardLayout>
  );
}

export default Actions;
