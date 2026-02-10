/**
 * Gap Checker Dashboard Component
 *
 * Displays identified gaps between design intent and actual implementation.
 * Allows viewing gap details, approving/rejecting suggestions, and triggering analysis.
 */

import { useState, useEffect } from "react";
import api from "services/api";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function GapChecker() {
  const [gaps, setGaps] = useState([]);
  const [filteredGaps, setFilteredGaps] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGap, setSelectedGap] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [filterTab, setFilterTab] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authorization on mount
  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const data = await api.get("/auth/check-augment-access");
      setAuthorized(data.authorized === true);
      setCheckingAuth(false);

      if (data.authorized) {
        fetchStatus();
        fetchGaps();
      }
    } catch (error) {
      setAuthorized(false);
      setCheckingAuth(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const data = await api.get("/gap-checker/status");
      setStatus(data);
    } catch (err) {
      /* status fetch failed */
    }
  };

  const fetchGaps = async () => {
    try {
      setLoading(true);
      const data = await api.get("/gap-checker/gaps", { limit: 100 });
      setGaps(data.gaps || []);
      setFilteredGaps(data.gaps || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to load gaps");
      setLoading(false);
    }
  };

  const fetchGapDetails = async (gapId) => {
    try {
      const data = await api.get(`/gap-checker/gaps/${gapId}`);
      setSelectedGap(data);
      setDetailsOpen(true);
    } catch (err) {
      /* gap details fetch failed */
    }
  };

  const handleFilterChange = (event, newValue) => {
    setFilterTab(newValue);

    if (newValue === 0) {
      // All gaps
      setFilteredGaps(gaps);
    } else if (newValue === 1) {
      // Critical/High only
      setFilteredGaps(gaps.filter((g) => g.severity === "critical" || g.severity === "high"));
    } else if (newValue === 2) {
      // Open only
      setFilteredGaps(gaps.filter((g) => g.status === "open"));
    } else if (newValue === 3) {
      // Resolved
      setFilteredGaps(gaps.filter((g) => g.status === "resolved"));
    }
  };

  const handleApproveSuggestion = async (suggestionId, approve) => {
    try {
      const endpoint = approve ? "approve" : "reject";
      await api.post(`/gap-checker/suggestions/${suggestionId}/${endpoint}`, {
        notes: approvalNotes,
      });

      setApprovalDialogOpen(false);
      setApprovalNotes("");
      // Refresh gap details
      if (selectedGap) {
        fetchGapDetails(selectedGap.gap.id);
      }
    } catch (err) {
      /* suggestion update failed */
    }
  };

  const triggerAnalysis = async () => {
    try {
      await api.post("/gap-checker/analyze", {});
      alert("Gap analysis triggered successfully");
    } catch (err) {
      /* analysis trigger failed */
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

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "error";
      case "acknowledged":
        return "warning";
      case "in_progress":
        return "info";
      case "resolved":
        return "success";
      case "wont_fix":
        return "default";
      default:
        return "default";
    }
  };

  // Loading state
  if (checkingAuth) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox p={3}>
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

  // Access denied
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
                      You do not have permission to access the Gap Checker. This area is restricted
                      to authorized administrators only.
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
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <MDTypography variant="h4">Gap Checker</MDTypography>
              <MDButton variant="gradient" color="info" onClick={triggerAnalysis}>
                Trigger Analysis
              </MDButton>
            </MDBox>
          </Grid>

          {/* Status Cards */}
          {status && (
            <>
              <Grid item xs={12} md={3}>
                <Card>
                  <MDBox p={2}>
                    <MDTypography variant="h6" color="text">
                      Total Gaps
                    </MDTypography>
                    <MDTypography variant="h3">
                      {status.gaps.reduce((sum, g) => sum + g.count, 0)}
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <MDBox p={2}>
                    <MDTypography variant="h6" color="error">
                      Critical
                    </MDTypography>
                    <MDTypography variant="h3">
                      {status.gaps.reduce((sum, g) => sum + g.critical, 0)}
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <MDBox p={2}>
                    <MDTypography variant="h6" color="warning">
                      High Priority
                    </MDTypography>
                    <MDTypography variant="h3">
                      {status.gaps.reduce((sum, g) => sum + g.high, 0)}
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <MDBox p={2}>
                    <MDTypography variant="h6" color="info">
                      Pending Suggestions
                    </MDTypography>
                    <MDTypography variant="h3">{status.pending_suggestions}</MDTypography>
                  </MDBox>
                </Card>
              </Grid>
            </>
          )}

          {/* Filters */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={2}>
                <Tabs value={filterTab} onChange={handleFilterChange}>
                  <Tab label="All Gaps" />
                  <Tab label="Critical/High" />
                  <Tab label="Open" />
                  <Tab label="Resolved" />
                </Tabs>
              </MDBox>
            </Card>
          </Grid>

          {/* Gaps Table */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Identified Gaps
                </MDTypography>
                {loading ? (
                  <MDTypography variant="body2">Loading...</MDTypography>
                ) : error ? (
                  <Alert severity="error">{error}</Alert>
                ) : filteredGaps.length === 0 ? (
                  <Alert severity="info">No gaps found</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Severity</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Title</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Discovered</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredGaps.map((gap) => (
                          <TableRow key={gap.id}>
                            <TableCell sx={{ width: "10%" }}>
                              <Chip
                                label={gap.severity.toUpperCase()}
                                color={getSeverityColor(gap.severity)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                width: "15%",
                                color: "text.primary",
                                fontWeight: 500,
                                textTransform: "capitalize",
                              }}
                            >
                              {gap.gap_type ? gap.gap_type.replace(/_/g, " ") : "N/A"}
                            </TableCell>
                            <TableCell
                              sx={{ width: "30%", color: "text.primary", fontWeight: 500 }}
                            >
                              {gap.title}
                            </TableCell>
                            <TableCell sx={{ width: "12%" }}>
                              <Chip
                                label={gap.status.toUpperCase()}
                                color={getStatusColor(gap.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ width: "15%", color: "text.primary" }}>
                              {new Date(gap.discovered_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell sx={{ width: "18%" }}>
                              <MDButton
                                variant="text"
                                color="info"
                                size="small"
                                onClick={() => fetchGapDetails(gap.id)}
                              >
                                View Details
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
        </Grid>

        {/* Gap Details Dialog */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
          {selectedGap && (
            <>
              <DialogTitle>
                <MDBox display="flex" justifyContent="space-between" alignItems="center">
                  <MDTypography variant="h5">{selectedGap.gap.title}</MDTypography>
                  <Chip
                    label={selectedGap.gap.severity.toUpperCase()}
                    color={getSeverityColor(selectedGap.gap.severity)}
                  />
                </MDBox>
              </DialogTitle>
              <DialogContent>
                <MDBox mb={2}>
                  <MDTypography variant="h6" mb={1}>
                    Description
                  </MDTypography>
                  <MDTypography variant="body2">{selectedGap.gap.description}</MDTypography>
                </MDBox>

                <MDBox mb={2}>
                  <MDTypography variant="h6" mb={1}>
                    Design Intent
                  </MDTypography>
                  <MDTypography variant="body2">{selectedGap.gap.design_intent}</MDTypography>
                </MDBox>

                <MDBox mb={2}>
                  <MDTypography variant="h6" mb={1}>
                    Actual Behavior
                  </MDTypography>
                  <MDTypography variant="body2">{selectedGap.gap.actual_behavior}</MDTypography>
                </MDBox>

                <MDBox mb={2}>
                  <MDTypography variant="h6" mb={1}>
                    Impact Assessment
                  </MDTypography>
                  <MDTypography variant="body2">{selectedGap.gap.impact_assessment}</MDTypography>
                </MDBox>

                {selectedGap.gap.affected_components &&
                  selectedGap.gap.affected_components.length > 0 && (
                    <MDBox mb={2}>
                      <MDTypography variant="h6" mb={1}>
                        Affected Components
                      </MDTypography>
                      {selectedGap.gap.affected_components.map((comp, idx) => (
                        <Chip key={idx} label={comp} size="small" sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </MDBox>
                  )}

                {selectedGap.gap.source_references &&
                  selectedGap.gap.source_references.length > 0 && (
                    <MDBox mb={2}>
                      <MDTypography variant="h6" mb={1}>
                        Source References
                      </MDTypography>
                      {selectedGap.gap.source_references.map((ref, idx) => (
                        <MDBox key={idx} mb={1} p={1} bgcolor="grey.100" borderRadius={1}>
                          <MDTypography variant="caption" fontWeight="bold">
                            {ref.source}
                          </MDTypography>
                          <MDTypography variant="caption" display="block">
                            {ref.quote}
                          </MDTypography>
                          {ref.line_number && (
                            <MDTypography variant="caption" display="block">
                              Line: {ref.line_number}
                            </MDTypography>
                          )}
                          {ref.url && (
                            <MDTypography variant="caption" display="block">
                              <a href={ref.url} target="_blank" rel="noopener noreferrer">
                                {ref.url}
                              </a>
                            </MDTypography>
                          )}
                        </MDBox>
                      ))}
                    </MDBox>
                  )}

                {selectedGap.suggestions && selectedGap.suggestions.length > 0 && (
                  <MDBox mb={2}>
                    <MDTypography variant="h6" mb={1}>
                      Suggestions
                    </MDTypography>
                    {selectedGap.suggestions.map((suggestion) => (
                      <Card key={suggestion.id} sx={{ mb: 2, p: 2 }}>
                        <MDBox
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <MDTypography variant="subtitle1">{suggestion.title}</MDTypography>
                          <Chip
                            label={suggestion.status.toUpperCase()}
                            color={suggestion.status === "approved" ? "success" : "default"}
                            size="small"
                          />
                        </MDBox>
                        <MDTypography variant="body2" mb={1}>
                          {suggestion.description}
                        </MDTypography>
                        <MDTypography variant="caption" display="block" mb={1}>
                          Effort: {suggestion.estimated_effort} | Priority: {suggestion.priority}/10
                        </MDTypography>
                        {suggestion.status === "pending" && (
                          <MDBox mt={1}>
                            <MDButton
                              variant="gradient"
                              color="success"
                              size="small"
                              onClick={() => {
                                setSelectedSuggestion(suggestion);
                                setApprovalDialogOpen(true);
                              }}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </MDButton>
                            <MDButton
                              variant="gradient"
                              color="error"
                              size="small"
                              onClick={() => {
                                setSelectedSuggestion(suggestion);
                                setApprovalDialogOpen(true);
                              }}
                            >
                              Reject
                            </MDButton>
                          </MDBox>
                        )}
                      </Card>
                    ))}
                  </MDBox>
                )}
              </DialogContent>
              <DialogActions>
                <MDButton onClick={() => setDetailsOpen(false)}>Close</MDButton>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Approval Dialog */}
        <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)}>
          <DialogTitle>Approve/Reject Suggestion</DialogTitle>
          <DialogContent>
            <TextField
              label="Notes"
              multiline
              rows={4}
              fullWidth
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <MDButton onClick={() => setApprovalDialogOpen(false)}>Cancel</MDButton>
            <MDButton
              color="error"
              onClick={() => handleApproveSuggestion(selectedSuggestion?.id, false)}
            >
              Reject
            </MDButton>
            <MDButton
              color="success"
              onClick={() => handleApproveSuggestion(selectedSuggestion?.id, true)}
            >
              Approve
            </MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default GapChecker;
