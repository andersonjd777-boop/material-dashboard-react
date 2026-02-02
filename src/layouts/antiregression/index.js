/**
 * Anti-Regression Dashboard Component
 * Displays regression events, pending approvals, and system status
 */

import { useState, useEffect } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";

const API_BASE = process.env.REACT_APP_API_URL || "https://dashboard.directconnectglobal.com";

function AntiRegression() {
  const [status, setStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, dashboardRes, approvalsRes] = await Promise.all([
        fetch(`${API_BASE}/api/anti-regression/status`),
        fetch(`${API_BASE}/api/anti-regression/dashboard`),
        fetch(`${API_BASE}/api/anti-regression/approvals/pending`),
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (dashboardRes.ok) setDashboard(await dashboardRes.json());
      if (approvalsRes.ok) {
        const data = await approvalsRes.json();
        setPendingApprovals(data.approvals || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/anti-regression/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approver_email: "admin@directconnectglobal.com" }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert("Failed to approve: " + err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      const res = await fetch(`${API_BASE}/api/anti-regression/reject/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejector_email: "admin@directconnectglobal.com", reason }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert("Failed to reject: " + err.message);
    }
  };

  const triggerScan = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/anti-regression/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        alert("Scan triggered successfully");
        fetchData();
      }
    } catch (err) {
      alert("Failed to trigger scan: " + err.message);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "success";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
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
            {/* Header */}
            <Grid item xs={12}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center">
                <MDTypography variant="h4">Anti-Regression Bot</MDTypography>
                <MDButton color="info" onClick={triggerScan}>
                  <Icon sx={{ mr: 1 }}>radar</Icon>
                  Trigger Scan
                </MDButton>
              </MDBox>
            </Grid>

            {/* Status Cards */}
            <Grid item xs={12} md={3}>
              <Card>
                <MDBox p={2} textAlign="center">
                  <MDTypography variant="h2" color="info">
                    {status?.stats?.eventsToday || 0}
                  </MDTypography>
                  <MDTypography variant="caption">Events Today</MDTypography>
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <MDBox p={2} textAlign="center">
                  <MDTypography variant="h2" color="warning">
                    {status?.stats?.pendingApprovals || 0}
                  </MDTypography>
                  <MDTypography variant="caption">Pending Approvals</MDTypography>
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <MDBox p={2} textAlign="center">
                  <MDTypography variant="h2" color="success">
                    {status?.stats?.activeMonitors || 0}
                  </MDTypography>
                  <MDTypography variant="caption">Active Monitors</MDTypography>
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <MDBox p={2} textAlign="center">
                  <MDTypography variant="h2" color="error">
                    {status?.stats?.regressionsDetected || 0}
                  </MDTypography>
                  <MDTypography variant="caption">Regressions Detected</MDTypography>
                </MDBox>
              </Card>
            </Grid>

            {/* Pending Approvals */}
            <Grid item xs={12}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={2}>
                    <Icon sx={{ mr: 1 }}>pending_actions</Icon>
                    Pending Approvals
                  </MDTypography>
                  {pendingApprovals.length === 0 ? (
                    <MDTypography color="text" variant="body2">
                      No pending approvals
                    </MDTypography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Event</TableCell>
                            <TableCell>Risk</TableCell>
                            <TableCell>Source</TableCell>
                            <TableCell>Requested</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingApprovals.map((approval) => (
                            <TableRow key={approval.id}>
                              <TableCell>
                                <MDTypography variant="button">{approval.event_title}</MDTypography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`${approval.risk_level} (${approval.risk_score})`}
                                  color={getRiskColor(approval.risk_level)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{approval.source_system}</TableCell>
                              <TableCell>
                                {new Date(approval.requested_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <MDButton
                                  color="success"
                                  size="small"
                                  onClick={() => handleApprove(approval.id)}
                                  sx={{ mr: 1 }}
                                >
                                  Approve
                                </MDButton>
                                <MDButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleReject(approval.id)}
                                >
                                  Reject
                                </MDButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </MDBox>
              </Card>
            </Grid>

            {/* Recent Events */}
            <Grid item xs={12}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={2}>
                    <Icon sx={{ mr: 1 }}>history</Icon>
                    Recent Events
                  </MDTypography>
                  {dashboard?.recentEvents?.length === 0 ? (
                    <MDTypography color="text" variant="body2">
                      No recent events
                    </MDTypography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Risk</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Detected</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(dashboard?.recentEvents || []).map((event) => (
                            <TableRow key={event.id}>
                              <TableCell>
                                <MDTypography variant="button">{event.title}</MDTypography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={event.risk_level}
                                  color={getRiskColor(event.risk_level)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip label={event.status} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>{new Date(event.detected_at).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
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

export default AntiRegression;
