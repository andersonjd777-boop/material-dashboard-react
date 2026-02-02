/**
 * Flagging Dashboard - Monitor problematic calls and inappropriate prompts
 */

import { useState, useEffect, useCallback } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import api from "services/api";

function Flagging() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getFlaggedContent(filter);
      setFlags(response.data?.flags || []);
    } catch (error) {
      console.error("Failed to fetch flags:", error);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleResolve = async (flagId) => {
    try {
      await api.resolveFlaggedContent(flagId);
      fetchFlags();
    } catch (error) {
      console.error("Failed to resolve flag:", error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "phone_call":
        return "Phone Call";
      case "employee_prompt":
        return "Employee Prompt";
      case "user_speech":
        return "User Speech";
      default:
        return type;
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
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
              >
                <MDBox display="flex" alignItems="center">
                  <WarningIcon sx={{ mr: 1, color: "white" }} />
                  <MDTypography variant="h6" color="white">
                    Flagged Content Monitor
                  </MDTypography>
                </MDBox>
                <MDBox>
                  <MDButton
                    variant={filter === "all" ? "contained" : "outlined"}
                    color="white"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => setFilter("all")}
                  >
                    All
                  </MDButton>
                  <MDButton
                    variant={filter === "unresolved" ? "contained" : "outlined"}
                    color="white"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => setFilter("unresolved")}
                  >
                    Unresolved
                  </MDButton>
                  <IconButton color="white" onClick={() => fetchFlags()}>
                    <RefreshIcon sx={{ color: "white" }} />
                  </IconButton>
                </MDBox>
              </MDBox>
              <MDBox pt={3} px={2} pb={2}>
                {loading ? (
                  <MDTypography variant="body2" color="text" textAlign="center" py={4}>
                    Loading flagged content...
                  </MDTypography>
                ) : flags.length === 0 ? (
                  <MDBox textAlign="center" py={4}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                    <MDTypography variant="h6" color="success">
                      No flagged content found
                    </MDTypography>
                    <MDTypography variant="body2" color="text">
                      All calls and prompts are within acceptable guidelines.
                    </MDTypography>
                  </MDBox>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Time</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>Content Preview</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {flags.map((flag) => (
                          <TableRow key={flag.id}>
                            <TableCell>{new Date(flag.timestamp).toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip label={getTypeLabel(flag.type)} size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={flag.severity}
                                color={getSeverityColor(flag.severity)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell
                              sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {flag.content_preview}
                            </TableCell>
                            <TableCell>{flag.reason}</TableCell>
                            <TableCell>
                              <Tooltip title="View Details">
                                <IconButton size="small">
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Mark Resolved">
                                <IconButton size="small" onClick={() => handleResolve(flag.id)}>
                                  <CheckCircleIcon color="success" />
                                </IconButton>
                              </Tooltip>
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
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Flagging;
