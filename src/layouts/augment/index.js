/**
 * Augment Control Panel - Unified Dashboard
 *
 * Master control panel for all DCG automation systems:
 * - Auto-Healer (bug detection and fixing)
 * - Auto-Developer (feature development)
 * - Compliance Officer (regulatory monitoring)
 * - Gap Checker (design vs. reality validation)
 */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "services/api";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function AugmentControl() {
  const [systems, setSystems] = useState({
    autoHealer: { enabled: false, status: "loading", bugs: 0, mode: "monitor" },
    autoDeveloper: { enabled: false, status: "loading", tasks: 0 },
    compliance: { enabled: true, status: "loading", score: 0, issues: 0 },
    gapChecker: { enabled: false, status: "coming_soon", gaps: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authorization on mount
  useEffect(() => {
    checkAuthorization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthorization = async () => {
    try {
      const data = await api.get("/auth/check-augment-access");
      setAuthorized(data.authorized === true);
      setCheckingAuth(false);

      if (data.authorized) {
        fetchAllStatus();
      }
    } catch (error) {
      setAuthorized(false);
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (!authorized) return;

    fetchAllStatus();
    const interval = setInterval(fetchAllStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [authorized]);

  const fetchAllStatus = async () => {
    try {
      const [healerData, devData, complianceData, gapData] = await Promise.all([
        api
          .get("/auto-healer/status")
          .catch(() => ({ enabled: false, bugs_detected: 0, mode: "monitor" })),
        api
          .get("/auto-developer/status")
          .catch(() => ({ enabled: false, stats: { tasks_pending: 0 } })),
        api
          .get("/compliance/dashboard")
          .catch(() => ({ stats: { compliance_score: 0, critical_issues: 0 } })),
        api.get("/gap-checker/status").catch(() => ({ gaps: [], pending_suggestions: 0 })),
      ]);

      setSystems({
        autoHealer: {
          enabled: healerData.enabled || false,
          status: "operational",
          bugs: healerData.bugs_detected || 0,
          mode: healerData.mode || "monitor",
        },
        autoDeveloper: {
          enabled: devData.enabled || false,
          status: "operational",
          tasks: devData.stats?.tasks_pending || 0,
        },
        compliance: {
          enabled: true,
          status: "operational",
          score: complianceData.stats?.compliance_score || 0,
          issues: complianceData.stats?.critical_issues || 0,
        },
        gapChecker: {
          enabled: true,
          status: "operational",
          gaps: gapData.gaps?.reduce((sum, g) => sum + g.count, 0) || 0,
          critical: gapData.gaps?.reduce((sum, g) => sum + g.critical, 0) || 0,
          pendingSuggestions: gapData.pending_suggestions || 0,
        },
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching system status:", error);
      setLoading(false);
    }
  };

  const toggleSystem = async (system) => {
    if (system === "autoHealer") {
      // Auto-Healer uses mode changes instead of enable/disable
      return;
    }

    if (system === "autoDeveloper") {
      try {
        const newEnabled = !systems.autoDeveloper.enabled;
        await api.post("/auto-developer/toggle", { enabled: newEnabled });
        fetchAllStatus();
      } catch (error) {
        /* toggle failed */
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      case "coming_soon":
        return "info";
      default:
        return "secondary";
    }
  };

  const SystemCard = ({ title, icon, system, systemKey, description }) => (
    <Card sx={{ height: "100%" }}>
      <MDBox p={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDBox display="flex" alignItems="center">
            <MDBox
              display="flex"
              justifyContent="center"
              alignItems="center"
              width="3rem"
              height="3rem"
              borderRadius="md"
              bgColor="info"
              color="white"
              mr={2}
            >
              <Icon fontSize="medium">{icon}</Icon>
            </MDBox>
            <MDTypography variant="h6">{title}</MDTypography>
          </MDBox>
          {system.status !== "coming_soon" && systemKey !== "compliance" && (
            <Switch
              checked={system.enabled}
              onChange={() => toggleSystem(systemKey)}
              disabled={systemKey === "autoHealer"}
            />
          )}
        </MDBox>

        <MDTypography variant="body2" color="text" mb={2}>
          {description}
        </MDTypography>

        <MDBox display="flex" gap={1} mb={2}>
          <Chip
            label={
              system.status === "coming_soon"
                ? "Coming Soon"
                : system.enabled
                ? "Enabled"
                : "Disabled"
            }
            color={system.enabled ? "success" : "default"}
            size="small"
          />
          <Chip
            label={system.status.charAt(0).toUpperCase() + system.status.slice(1)}
            color={getStatusColor(system.status)}
            size="small"
          />
        </MDBox>

        {/* System-specific metrics */}
        {systemKey === "autoHealer" && (
          <MDBox>
            <MDTypography variant="caption" color="text">
              Mode: <strong>{system.mode}</strong>
            </MDTypography>
            <br />
            <MDTypography variant="caption" color="text">
              Bugs Detected: <strong>{system.bugs}</strong>
            </MDTypography>
          </MDBox>
        )}

        {systemKey === "autoDeveloper" && (
          <MDBox>
            <MDTypography variant="caption" color="text">
              Pending Tasks: <strong>{system.tasks}</strong>
            </MDTypography>
          </MDBox>
        )}

        {systemKey === "compliance" && (
          <MDBox>
            <MDTypography variant="caption" color="text">
              Compliance Score: <strong>{system.score}%</strong>
            </MDTypography>
            <br />
            <MDTypography variant="caption" color="text">
              Critical Issues: <strong>{system.issues}</strong>
            </MDTypography>
          </MDBox>
        )}

        {systemKey === "gapChecker" && (
          <MDBox>
            <MDTypography variant="caption" color="text">
              Total Gaps: <strong>{system.gaps}</strong>
            </MDTypography>
            <br />
            <MDTypography variant="caption" color="error">
              Critical: <strong>{system.critical}</strong>
            </MDTypography>
            <br />
            <MDTypography variant="caption" color="text">
              Pending Suggestions: <strong>{system.pendingSuggestions}</strong>
            </MDTypography>
          </MDBox>
        )}

        {/* Action buttons */}
        {system.status !== "coming_soon" && (
          <MDBox mt={2}>
            <MDButton
              variant="outlined"
              color="info"
              size="small"
              fullWidth
              component="a"
              href={
                systemKey === "gapChecker"
                  ? "/gap-checker"
                  : `/${systemKey.toLowerCase().replace("auto", "auto")}`
              }
            >
              View Details
            </MDButton>
          </MDBox>
        )}
      </MDBox>
    </Card>
  );

  SystemCard.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    system: PropTypes.shape({
      status: PropTypes.string,
      enabled: PropTypes.bool,
      mode: PropTypes.string,
      bugs: PropTypes.number,
      tasks: PropTypes.number,
      score: PropTypes.number,
      issues: PropTypes.number,
      gaps: PropTypes.number,
      critical: PropTypes.number,
      pendingSuggestions: PropTypes.number,
    }).isRequired,
    systemKey: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  };

  // Show loading state while checking authorization
  if (checkingAuth) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox p={3} textAlign="center">
                  <MDTypography variant="h6">Checking authorization...</MDTypography>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Show access denied if not authorized
  if (!authorized) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox p={3}>
                  <Alert severity="error">
                    <MDTypography variant="h6" mb={1}>
                      Access Denied
                    </MDTypography>
                    <MDTypography variant="body2">
                      You do not have permission to access the Augment Control Panel. This area is
                      restricted to authorized administrators only.
                    </MDTypography>
                    <MDTypography variant="body2" mt={2}>
                      Contact: josh@directconnectglobal.com
                    </MDTypography>
                  </Alert>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox p={3}>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center">
                    <MDBox>
                      <MDTypography variant="h4" fontWeight="medium">
                        Augment Control Panel
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        Unified control center for all DCG automation systems
                      </MDTypography>
                    </MDBox>
                    <MDButton
                      variant="gradient"
                      color="info"
                      onClick={fetchAllStatus}
                      disabled={loading}
                    >
                      <Icon>refresh</Icon>&nbsp;Refresh All
                    </MDButton>
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>

        {/* System Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <SystemCard
              title="Auto-Healer"
              icon="healing"
              system={systems.autoHealer}
              systemKey="autoHealer"
              description="Automatically detects and fixes bugs in the DCG system"
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <SystemCard
              title="Auto-Developer"
              icon="smart_toy"
              system={systems.autoDeveloper}
              systemKey="autoDeveloper"
              description="Automated feature development using Augment Agent"
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <SystemCard
              title="Compliance Officer"
              icon="gavel"
              system={systems.compliance}
              systemKey="compliance"
              description="Monitors regulatory requirements and ensures compliance"
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <SystemCard
              title="Gap Checker"
              icon="fact_check"
              system={systems.gapChecker}
              systemKey="gapChecker"
              description="Validates design intent vs. actual implementation"
            />
          </Grid>
        </Grid>

        {/* System Overview */}
        <MDBox mt={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={2}>
                    System Overview
                  </MDTypography>
                  <MDTypography variant="body2" color="text">
                    The DCG Augment Control Panel provides centralized management of all automation
                    systems. Each system operates independently but can be coordinated through this
                    interface.
                  </MDTypography>
                  <MDBox mt={2}>
                    <MDTypography variant="caption" color="text">
                      <strong>Auto-Healer:</strong> Monitors for bugs and can automatically fix them
                      based on the selected mode (monitor, auto-fix, aggressive).
                    </MDTypography>
                    <br />
                    <MDTypography variant="caption" color="text">
                      <strong>Auto-Developer:</strong> Handles feature development tasks using
                      Augment Agent with human approval workflow.
                    </MDTypography>
                    <br />
                    <MDTypography variant="caption" color="text">
                      <strong>Compliance Officer:</strong> Continuously monitors regulatory sources
                      and generates compliance recommendations.
                    </MDTypography>
                    <br />
                    <MDTypography variant="caption" color="text">
                      <strong>Gap Checker:</strong> Compares design documentation against actual
                      implementation to identify discrepancies.
                    </MDTypography>
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AugmentControl;
