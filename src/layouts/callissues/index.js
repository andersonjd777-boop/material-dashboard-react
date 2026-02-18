/**
 * Call Issues Dashboard - Monitor telephony system issues in real-time
 */
import { useState, useEffect, useCallback, useRef } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import api from "services/api";
import logger from "services/logger";

const SEVERITY_COLORS = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "secondary",
  info: "default",
};
const CATEGORY_LABELS = {
  speech_recognition: "Speech",
  call_quality: "Quality",
  agi_error: "AGI Error",
  auth_failure: "Auth",
  call_rejection: "Rejected",
  delivery_failure: "Delivery",
  system_error: "System",
  performance: "Perf",
};

function CallIssues() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hoursFilter, setHoursFilter] = useState(24);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, issuesRes] = await Promise.all([
        api.getCallIssueStats(hoursFilter),
        api.getCallIssues({ hours: hoursFilter, category: categoryFilter, limit: 100 }),
      ]);
      setStats(statsRes?.stats || null);
      setIssues(issuesRes?.issues || []);
    } catch (error) {
      logger.error("Failed to fetch call issues:", error);
    }
    setLoading(false);
  }, [hoursFilter, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    if (autoRefresh) intervalRef.current = setInterval(fetchData, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  const handleResolve = async (id) => {
    try {
      await api.resolveCallIssue(id);
      fetchData();
    } catch (e) {
      logger.error(e);
    }
  };

  const filterBtns = [
    { v: 1, l: "1h" },
    { v: 6, l: "6h" },
    { v: 24, l: "24h" },
    { v: 72, l: "3d" },
    { v: 168, l: "7d" },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          {stats && (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card>
                    <MDBox p={2} textAlign="center">
                      <MDTypography variant="h3" color="error">
                        {stats.unresolved || 0}
                      </MDTypography>
                      <MDTypography variant="caption">Unresolved</MDTypography>
                    </MDBox>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <MDBox p={2} textAlign="center">
                      <MDTypography variant="h3">{stats.total || 0}</MDTypography>
                      <MDTypography variant="caption">Total ({hoursFilter}h)</MDTypography>
                    </MDBox>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <MDBox p={2} textAlign="center">
                      <MDTypography variant="h3" color="warning">
                        {(stats.by_severity?.critical || 0) + (stats.by_severity?.high || 0)}
                      </MDTypography>
                      <MDTypography variant="caption">Critical/High</MDTypography>
                    </MDBox>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <MDBox p={2} textAlign="center">
                      <MDTypography variant="h3" color="info">
                        {stats.by_category?.speech_recognition || 0}
                      </MDTypography>
                      <MDTypography variant="caption">Speech Failures</MDTypography>
                    </MDBox>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          )}
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="error"
                borderRadius="lg"
                coloredShadow="error"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                <MDBox display="flex" alignItems="center">
                  <ErrorIcon sx={{ mr: 1, color: "white" }} />
                  <MDTypography variant="h6" color="white">
                    Call Issues Monitor
                  </MDTypography>
                  {autoRefresh && (
                    <Chip
                      label="Live"
                      size="small"
                      sx={{ ml: 2, bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                    />
                  )}
                </MDBox>
                <MDBox display="flex" alignItems="center" gap={0.5}>
                  {filterBtns.map((b) => (
                    <MDButton
                      key={b.v}
                      size="small"
                      color="white"
                      variant={hoursFilter === b.v ? "contained" : "outlined"}
                      onClick={() => setHoursFilter(b.v)}
                    >
                      {b.l}
                    </MDButton>
                  ))}
                  <IconButton onClick={() => setAutoRefresh(!autoRefresh)}>
                    {autoRefresh ? (
                      <PauseIcon sx={{ color: "white" }} />
                    ) : (
                      <PlayArrowIcon sx={{ color: "white" }} />
                    )}
                  </IconButton>
                  <IconButton onClick={fetchData}>
                    <RefreshIcon sx={{ color: "white" }} />
                  </IconButton>
                </MDBox>
              </MDBox>
              <MDBox pt={3} px={2} pb={2}>
                {loading && issues.length === 0 ? (
                  <MDTypography variant="body2" textAlign="center" py={4}>
                    Loading...
                  </MDTypography>
                ) : issues.length === 0 ? (
                  <MDBox textAlign="center" py={4}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                    <MDTypography variant="body2">
                      No issues in the last {hoursFilter} hours
                    </MDTypography>
                  </MDBox>
                ) : (
                  <MDBox sx={{ overflowX: "auto" }}>
                    <MDBox
                      display="flex"
                      sx={{ borderBottom: "2px solid #e0e0e0", pb: 1, mb: 1, minWidth: "700px" }}
                    >
                      <MDBox flex="2" px={1}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Time
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="1.5" px={1}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Category
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="1" px={1}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Severity
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="3" px={1}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Message
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="1" px={1}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Action
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                    {issues.map((issue) => (
                      <MDBox
                        key={issue.id}
                        display="flex"
                        sx={{
                          py: 1,
                          borderBottom: "1px solid #f0f0f0",
                          minWidth: "700px",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                          opacity: issue.resolved ? 0.5 : 1,
                        }}
                      >
                        <MDBox flex="2" px={1}>
                          <MDTypography variant="body2">
                            {new Date(issue.timestamp).toLocaleString()}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="1.5" px={1}>
                          <Chip
                            label={CATEGORY_LABELS[issue.category] || issue.category}
                            size="small"
                            onClick={() =>
                              setCategoryFilter(
                                categoryFilter === issue.category ? null : issue.category
                              )
                            }
                            color={categoryFilter === issue.category ? "primary" : "default"}
                          />
                        </MDBox>
                        <MDBox flex="1" px={1}>
                          <Chip
                            label={issue.severity}
                            size="small"
                            color={SEVERITY_COLORS[issue.severity] || "default"}
                          />
                        </MDBox>
                        <MDBox flex="3" px={1}>
                          <MDTypography variant="body2" sx={{ wordBreak: "break-word" }}>
                            {issue.message}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="1" px={1}>
                          {!issue.resolved ? (
                            <MDButton
                              size="small"
                              color="success"
                              onClick={() => handleResolve(issue.id)}
                            >
                              Resolve
                            </MDButton>
                          ) : (
                            <CheckCircleIcon color="success" />
                          )}
                        </MDBox>
                      </MDBox>
                    ))}
                  </MDBox>
                )}
                <MDBox mt={2} display="flex" justifyContent="space-between">
                  <MDTypography variant="caption">Showing {issues.length} issues</MDTypography>
                  {categoryFilter && (
                    <MDButton size="small" onClick={() => setCategoryFilter(null)}>
                      Clear Filter
                    </MDButton>
                  )}
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

export default CallIssues;
