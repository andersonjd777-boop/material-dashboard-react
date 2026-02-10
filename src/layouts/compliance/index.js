/**
 * DCG Compliance Officer Dashboard
 *
 * React component for compliance monitoring and approval workflow
 *
 * Author: DCG System
 * Date: 2025-12-21
 */

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import api from "services/api";
import { useAuth } from "context/AuthContext";

function ComplianceOfficer() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.get("/compliance/dashboard");

      if (data.status === "success") {
        setStats(data.stats);
        setRequirements(data.recent_requirements);
        setRecommendations(data.pending_recommendations);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Trigger compliance monitoring
  const triggerMonitoring = async () => {
    try {
      const data = await api.post("/compliance/monitor");

      if (data.status === "success") {
        setSuccess("Compliance monitoring started");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError("Failed to start monitoring");
    }
  };

  // Approve recommendation
  const approveRecommendation = async () => {
    try {
      const data = await api.post(
        `/compliance/recommendations/${selectedRecommendation.id}/approve`,
        {
          approver_email: user?.email || "unknown",
          approval_notes: approvalNotes,
        }
      );

      if (data.status === "success") {
        setSuccess("Recommendation approved");
        setApprovalDialog(false);
        setApprovalNotes("");
        fetchDashboardData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to approve recommendation");
    }
  };

  // Reject recommendation
  const rejectRecommendation = async () => {
    if (!rejectionReason.trim()) {
      setError("Rejection reason is required");
      return;
    }

    try {
      const data = await api.post(
        `/compliance/recommendations/${selectedRecommendation.id}/reject`,
        {
          approver_email: user?.email || "unknown",
          rejection_reason: rejectionReason,
        }
      );

      if (data.status === "success") {
        setSuccess("Recommendation rejected");
        setApprovalDialog(false);
        setRejectionReason("");
        fetchDashboardData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to reject recommendation");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox
          pt={6}
          pb={3}
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </MDBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        {/* Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Header */}
        <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4">Compliance Officer</MDTypography>
          <MDButton variant="gradient" color="info" onClick={triggerMonitoring}>
            <Icon>refresh</Icon>&nbsp; Run Monitoring
          </MDButton>
        </MDBox>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <MDTypography variant="h6" color="text">
                  Compliance Score
                </MDTypography>
                <MDTypography variant="h3" color="success">
                  {stats?.compliance_score}%
                </MDTypography>
                <MDTypography variant="caption" color="text">
                  {stats?.compliant} of {stats?.total_requirements} compliant
                </MDTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <MDTypography variant="h6" color="text">
                  Critical Issues
                </MDTypography>
                <MDTypography variant="h3" color="error">
                  {stats?.critical_issues}
                </MDTypography>
                <MDTypography variant="caption" color="text">
                  Require immediate attention
                </MDTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <MDTypography variant="h6" color="text">
                  Pending Approvals
                </MDTypography>
                <MDTypography variant="h3" color="warning">
                  {stats?.pending_approvals}
                </MDTypography>
                <MDTypography variant="caption" color="text">
                  Awaiting review
                </MDTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <MDTypography variant="h6" color="text">
                  In Progress
                </MDTypography>
                <MDTypography variant="h3" color="info">
                  {stats?.in_progress}
                </MDTypography>
                <MDTypography variant="caption" color="text">
                  Being implemented
                </MDTypography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Pending Recommendations */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <MDTypography variant="h5" mb={2}>
              Pending Recommendations
            </MDTypography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Priority</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Requirement</TableCell>
                    <TableCell>Can Automate</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recommendations.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <Chip
                          label={rec.priority}
                          color={getPriorityColor(rec.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{rec.recommendation_type}</TableCell>
                      <TableCell>{rec.title}</TableCell>
                      <TableCell>{rec.requirement_title}</TableCell>
                      <TableCell>
                        {rec.can_automate ? (
                          <Chip label="Yes" color="success" size="small" />
                        ) : (
                          <Chip label="No" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setSelectedRecommendation(rec);
                            setApprovalDialog(true);
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recommendations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <MDTypography variant="body2" color="text">
                          No pending recommendations
                        </MDTypography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Recent Requirements */}
        <Card>
          <CardContent>
            <MDTypography variant="h5" mb={2}>
              Recent Requirements
            </MDTypography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Severity</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Discovered</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requirements.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <Chip
                          label={req.severity}
                          color={getSeverityColor(req.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{req.category}</TableCell>
                      <TableCell>{req.title}</TableCell>
                      <TableCell>{req.source_name}</TableCell>
                      <TableCell>
                        <Chip label={req.compliance_status} size="small" />
                      </TableCell>
                      <TableCell>{new Date(req.discovered_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {requirements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <MDTypography variant="body2" color="text">
                          No requirements found
                        </MDTypography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog
          open={approvalDialog}
          onClose={() => setApprovalDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Review Recommendation</DialogTitle>
          <DialogContent>
            {selectedRecommendation && (
              <>
                <MDTypography variant="h6" mb={1}>
                  {selectedRecommendation.title}
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={2}>
                  {selectedRecommendation.description}
                </MDTypography>

                <Grid container spacing={2} mb={2}>
                  <Grid item xs={6}>
                    <MDTypography variant="caption" color="text">
                      Priority:
                    </MDTypography>
                    <Chip
                      label={selectedRecommendation.priority}
                      color={getPriorityColor(selectedRecommendation.priority)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <MDTypography variant="caption" color="text">
                      Type:
                    </MDTypography>
                    <Chip label={selectedRecommendation.recommendation_type} size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <MDTypography variant="caption" color="text">
                      Can Automate:
                    </MDTypography>
                    <Chip
                      label={selectedRecommendation.can_automate ? "Yes" : "No"}
                      color={selectedRecommendation.can_automate ? "success" : "default"}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <MDTypography variant="caption" color="text">
                      Estimated Effort:
                    </MDTypography>
                    <Chip label={selectedRecommendation.estimated_effort} size="small" />
                  </Grid>
                </Grid>

                <MDTypography variant="subtitle2" mb={1}>
                  Implementation Details:
                </MDTypography>
                <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.100" }}>
                  <MDTypography variant="body2" style={{ whiteSpace: "pre-wrap" }}>
                    {selectedRecommendation.implementation_details}
                  </MDTypography>
                </Paper>

                <MDTypography variant="subtitle2" mb={1}>
                  Impact Assessment:
                </MDTypography>
                <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.100" }}>
                  <MDTypography variant="body2">
                    {selectedRecommendation.impact_assessment}
                  </MDTypography>
                </Paper>

                <MDTypography variant="subtitle2" mb={1}>
                  Risk if Ignored:
                </MDTypography>
                <Paper sx={{ p: 2, mb: 2, bgcolor: "warning.light" }}>
                  <MDTypography variant="body2">
                    {selectedRecommendation.risk_if_ignored}
                  </MDTypography>
                </Paper>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Approval Notes (optional)"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Rejection Reason (required if rejecting)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
            <Button onClick={rejectRecommendation} color="error" variant="outlined">
              Reject
            </Button>
            <Button onClick={approveRecommendation} color="success" variant="contained">
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </MDBox>
    </DashboardLayout>
  );
}

export default ComplianceOfficer;
