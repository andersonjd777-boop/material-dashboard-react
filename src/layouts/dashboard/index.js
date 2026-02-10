/**
 * DCG Admin Dashboard - Overview
 * Real-time metrics and system status for Direct Connect Global
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

import api from "services/api";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stripeMetrics, setStripeMetrics] = useState(null);
  const [serverMetrics, setServerMetrics] = useState(null);
  const [pm2Status, setPm2Status] = useState(null);
  const [healthCheck, setHealthCheck] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  // Polling configuration
  const BASE_INTERVAL = 30000; // 30 seconds
  const MAX_INTERVAL = 300000; // 5 minutes
  const intervalRef = useRef(BASE_INTERVAL);
  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchAllData = useCallback(async () => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const [stripe, server, pm2, health, proj] = await Promise.all([
        api.getStripeMetrics().catch(() => null),
        api.getServerMetrics().catch(() => null),
        api.getPM2Status().catch(() => null),
        api.getHealthCheck().catch(() => null),
        api.getProjects().catch(() => ({ projects: [] })),
      ]);
      setStripeMetrics(stripe?.data);
      setServerMetrics(server?.data);
      setPm2Status(pm2?.data);
      setHealthCheck(health);
      setProjects(proj?.projects || []);
      setLoading(false);
      setError(null);
      // Reset interval on success
      intervalRef.current = BASE_INTERVAL;
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err.message);
      setLoading(false);
      // Exponential backoff on failure (double interval, cap at MAX_INTERVAL)
      intervalRef.current = Math.min(intervalRef.current * 2, MAX_INTERVAL);
    }
  }, []);

  // Schedule next poll
  const scheduleNextPoll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchAllData().then(scheduleNextPoll);
    }, intervalRef.current);
  }, [fetchAllData]);

  useEffect(() => {
    fetchAllData().then(scheduleNextPoll);

    // Visibility-aware polling: pause when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (abortControllerRef.current) abortControllerRef.current.abort();
      } else {
        // Immediately fetch and resume polling when tab becomes visible
        intervalRef.current = BASE_INTERVAL;
        fetchAllData().then(scheduleNextPoll);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchAllData, scheduleNextPoll]);

  const getHealthColor = (status) => {
    if (status === "healthy") return "success";
    if (status === "warning") return "warning";
    return "error";
  };

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
        {/* Key Metrics */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="attach_money"
                title="Monthly Revenue"
                count={`$${stripeMetrics?.mrr || "0"}`}
                percentage={{ color: "success", amount: "MRR", label: "recurring" }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="info"
                icon="subscriptions"
                title="Active Subscriptions"
                count={stripeMetrics?.activeSubscriptions || 0}
                percentage={{ color: "info", amount: "", label: "Stripe" }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="people"
                title="Total Customers"
                count={stripeMetrics?.totalCustomers || 0}
                percentage={{ color: "primary", amount: "", label: "in Stripe" }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="trending_up"
                title="30-Day Revenue"
                count={`$${stripeMetrics?.revenue30d || "0"}`}
                percentage={{ color: "success", amount: "", label: "last 30 days" }}
              />
            </MDBox>
          </Grid>
        </Grid>

        {/* System Health & Server Status */}
        <MDBox mt={4}>
          <Grid container spacing={3}>
            {/* System Health */}
            <Grid item xs={12} md={6}>
              <Card>
                <MDBox p={3}>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <MDTypography variant="h6">System Health</MDTypography>
                    <Chip
                      label={healthCheck?.overall || "unknown"}
                      color={getHealthColor(healthCheck?.overall)}
                      size="small"
                    />
                  </MDBox>
                  {healthCheck?.checks &&
                    Object.entries(healthCheck.checks).map(([key, val]) => (
                      <MDBox
                        key={key}
                        display="flex"
                        justifyContent="space-between"
                        py={1}
                        borderBottom="1px solid #eee"
                      >
                        <MDTypography
                          variant="button"
                          fontWeight="medium"
                          textTransform="capitalize"
                        >
                          {key}
                        </MDTypography>
                        <Chip
                          label={val.message}
                          color={getHealthColor(val.status)}
                          size="small"
                          variant="outlined"
                        />
                      </MDBox>
                    ))}
                </MDBox>
              </Card>
            </Grid>

            {/* Server Metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={2}>
                    Server Status
                  </MDTypography>
                  {serverMetrics ? (
                    <>
                      <MDBox display="flex" justifyContent="space-between" py={1}>
                        <MDTypography variant="button">Hostname</MDTypography>
                        <MDTypography variant="button" fontWeight="medium">
                          {serverMetrics.hostname}
                        </MDTypography>
                      </MDBox>
                      <MDBox display="flex" justifyContent="space-between" py={1}>
                        <MDTypography variant="button">Uptime</MDTypography>
                        <MDTypography variant="button" fontWeight="medium">
                          {serverMetrics.uptime}
                        </MDTypography>
                      </MDBox>
                      <MDBox display="flex" justifyContent="space-between" py={1}>
                        <MDTypography variant="button">Memory Used</MDTypography>
                        <MDTypography variant="button" fontWeight="medium">
                          {serverMetrics.memory?.percentUsed}
                        </MDTypography>
                      </MDBox>
                      <MDBox display="flex" justifyContent="space-between" py={1}>
                        <MDTypography variant="button">CPU Load (1m)</MDTypography>
                        <MDTypography variant="button" fontWeight="medium">
                          {serverMetrics.cpu?.loadAverage?.["1min"]}
                        </MDTypography>
                      </MDBox>
                      <MDBox display="flex" justifyContent="space-between" py={1}>
                        <MDTypography variant="button">Disk Used</MDTypography>
                        <MDTypography variant="button" fontWeight="medium">
                          {serverMetrics.disk?.percentUsed}
                        </MDTypography>
                      </MDBox>
                    </>
                  ) : (
                    <MDTypography variant="button" color="text">
                      Unable to fetch server metrics
                    </MDTypography>
                  )}
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>

        {/* PM2 Processes & Projects */}
        <MDBox mt={4}>
          <Grid container spacing={3}>
            {/* PM2 Status */}
            <Grid item xs={12} md={6}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={2}>
                    Running Services (PM2)
                  </MDTypography>
                  {pm2Status && pm2Status.length > 0 ? (
                    pm2Status.map((proc) => (
                      <MDBox
                        key={proc.name}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        py={1}
                        borderBottom="1px solid #eee"
                      >
                        <MDBox>
                          <MDTypography variant="button" fontWeight="medium">
                            {proc.name}
                          </MDTypography>
                          <MDTypography variant="caption" display="block" color="text">
                            PID: {proc.pid} | Memory: {proc.memory} | Uptime: {proc.uptime}
                          </MDTypography>
                        </MDBox>
                        <Chip
                          label={proc.status}
                          color={proc.status === "online" ? "success" : "error"}
                          size="small"
                        />
                      </MDBox>
                    ))
                  ) : (
                    <MDTypography variant="button" color="text">
                      No PM2 processes found
                    </MDTypography>
                  )}
                </MDBox>
              </Card>
            </Grid>

            {/* Active Projects */}
            <Grid item xs={12} md={6}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={2}>
                    Active Projects
                  </MDTypography>
                  {projects.length > 0 ? (
                    projects.slice(0, 4).map((proj) => (
                      <MDBox key={proj.id} py={1} borderBottom="1px solid #eee">
                        <MDBox display="flex" justifyContent="space-between" alignItems="center">
                          <MDTypography variant="button" fontWeight="medium">
                            {proj.name}
                          </MDTypography>
                          <Chip
                            label={proj.status?.replace("_", " ")}
                            color={
                              proj.status === "completed"
                                ? "success"
                                : proj.status === "in_progress"
                                ? "info"
                                : "default"
                            }
                            size="small"
                          />
                        </MDBox>
                        <MDTypography variant="caption" color="text">
                          {proj.milestones?.filter((m) => m.done).length || 0}/
                          {proj.milestones?.length || 0} milestones | {proj.assignee}
                        </MDTypography>
                      </MDBox>
                    ))
                  ) : (
                    <MDTypography variant="button" color="text">
                      No projects found
                    </MDTypography>
                  )}
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

export default Dashboard;
