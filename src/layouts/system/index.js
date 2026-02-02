/**
 * DCG Admin Dashboard - System Health Monitor
 * Real-time status of all DCG services and infrastructure
 */

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import api from "services/api";

function System() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState(null);
  const [server, setServer] = useState(null);
  const [pm2, setPm2] = useState([]);
  const [asterisk, setAsterisk] = useState(null);

  useEffect(() => {
    fetchAll();
    const i = setInterval(fetchAll, 30000);
    return () => clearInterval(i);
  }, []);

  const fetchAll = async () => {
    try {
      const [h, s, p, a] = await Promise.all([
        api.getHealthCheck().catch(() => null),
        api.getServerMetrics().catch(() => null),
        api.getPM2Status().catch(() => ({ data: [] })),
        api.getAsteriskStatus().catch(() => null),
      ]);
      setHealth(h);
      setServer(s?.data);
      setPm2(p?.data || []);
      setAsterisk(a?.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };
  const getColor = (s) =>
    s === "healthy" || s === "online" || s === "active"
      ? "success"
      : s === "warning"
      ? "warning"
      : "error";
  const parsePercent = (s) => parseInt(s?.replace("%", "") || "0");

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center" minHeight="60vh">
          <CircularProgress color="info" />
        </MDBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDBox>
            <MDTypography variant="h4">System Health</MDTypography>
            <MDTypography variant="caption" color="text">
              Last updated:{" "}
              {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "N/A"}
            </MDTypography>
          </MDBox>
          <MDButton color="info" onClick={handleRefresh} disabled={refreshing}>
            <Icon sx={{ mr: 1 }}>{refreshing ? "sync" : "refresh"}</Icon> Refresh
          </MDButton>
        </MDBox>

        {/* Overall Status */}
        <Card sx={{ mb: 3, p: 3 }}>
          <MDBox display="flex" alignItems="center" gap={2}>
            <Icon color={getColor(health?.overall)} sx={{ fontSize: 40 }}>
              {health?.overall === "healthy"
                ? "check_circle"
                : health?.overall === "warning"
                ? "warning"
                : "error"}
            </Icon>
            <MDBox>
              <MDTypography variant="h5" textTransform="capitalize">
                {health?.overall || "Unknown"}
              </MDTypography>
              <MDTypography variant="caption">Overall system status</MDTypography>
            </MDBox>
          </MDBox>
        </Card>

        <Grid container spacing={3}>
          {/* Service Health Checks */}
          <Grid item xs={12} md={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Service Health
                </MDTypography>
                {health?.checks &&
                  Object.entries(health.checks).map(([name, check]) => (
                    <MDBox
                      key={name}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1.5}
                      borderBottom="1px solid #eee"
                    >
                      <MDBox display="flex" alignItems="center" gap={1}>
                        <Icon color={getColor(check.status)}>
                          {check.status === "healthy" ? "check_circle" : "warning"}
                        </Icon>
                        <MDTypography variant="button" textTransform="capitalize">
                          {name}
                        </MDTypography>
                      </MDBox>
                      <Chip
                        label={check.message}
                        color={getColor(check.status)}
                        size="small"
                        variant="outlined"
                      />
                    </MDBox>
                  ))}
              </MDBox>
            </Card>
          </Grid>

          {/* Server Resources */}
          <Grid item xs={12} md={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Server Resources
                </MDTypography>
                {server ? (
                  <>
                    <MDBox mb={2}>
                      <MDBox display="flex" justifyContent="space-between">
                        <MDTypography variant="caption">Memory</MDTypography>
                        <MDTypography variant="caption">{server.memory?.percentUsed}</MDTypography>
                      </MDBox>
                      <LinearProgress
                        variant="determinate"
                        value={parsePercent(server.memory?.percentUsed)}
                        color={parsePercent(server.memory?.percentUsed) > 80 ? "error" : "info"}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <MDTypography variant="caption" color="text">
                        {server.memory?.used} / {server.memory?.total}
                      </MDTypography>
                    </MDBox>
                    <MDBox mb={2}>
                      <MDBox display="flex" justifyContent="space-between">
                        <MDTypography variant="caption">Disk</MDTypography>
                        <MDTypography variant="caption">{server.disk?.percentUsed}</MDTypography>
                      </MDBox>
                      <LinearProgress
                        variant="determinate"
                        value={parsePercent(server.disk?.percentUsed)}
                        color={parsePercent(server.disk?.percentUsed) > 80 ? "error" : "info"}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <MDTypography variant="caption" color="text">
                        {server.disk?.used} / {server.disk?.total}
                      </MDTypography>
                    </MDBox>
                    <MDBox display="flex" justifyContent="space-between" py={1}>
                      <MDTypography variant="button">CPU Load (1m)</MDTypography>
                      <MDTypography variant="button" fontWeight="medium">
                        {server.cpu?.loadAverage?.["1min"]}
                      </MDTypography>
                    </MDBox>
                    <MDBox display="flex" justifyContent="space-between" py={1}>
                      <MDTypography variant="button">Uptime</MDTypography>
                      <MDTypography variant="button" fontWeight="medium">
                        {server.uptime}
                      </MDTypography>
                    </MDBox>
                  </>
                ) : (
                  <MDTypography variant="caption">Unable to fetch server metrics</MDTypography>
                )}
              </MDBox>
            </Card>
          </Grid>

          {/* PM2 Processes */}
          <Grid item xs={12} md={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  PM2 Processes
                </MDTypography>
                {pm2.length > 0 ? (
                  pm2.map((p) => (
                    <MDBox
                      key={p.name}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1.5}
                      borderBottom="1px solid #eee"
                    >
                      <MDBox>
                        <MDTypography variant="button" fontWeight="medium">
                          {p.name}
                        </MDTypography>
                        <MDTypography variant="caption" display="block">
                          PID: {p.pid} | Mem: {p.memory} | CPU: {p.cpu}
                        </MDTypography>
                      </MDBox>
                      <Chip label={p.status} color={getColor(p.status)} size="small" />
                    </MDBox>
                  ))
                ) : (
                  <MDTypography variant="caption">No processes running</MDTypography>
                )}
              </MDBox>
            </Card>
          </Grid>

          {/* Asterisk Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Asterisk PBX
                </MDTypography>
                <MDBox display="flex" alignItems="center" gap={2} mb={2}>
                  <Chip label={asterisk?.status || "unknown"} color={getColor(asterisk?.status)} />
                  <MDTypography variant="caption">
                    Active Channels: {asterisk?.activeChannels || 0}
                  </MDTypography>
                </MDBox>
                {asterisk?.peers?.slice(0, 5).map((p, i) => (
                  <MDTypography
                    key={i}
                    variant="caption"
                    display="block"
                    sx={{ fontFamily: "monospace" }}
                  >
                    {p}
                  </MDTypography>
                ))}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default System;
