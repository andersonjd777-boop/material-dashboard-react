/**
 * Call Logs - Rolling log of all calls to DCG phone number
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhoneIcon from "@mui/icons-material/Phone";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import api from "services/api";

function CallLogs() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [daysFilter, setDaysFilter] = useState("all");
  const intervalRef = useRef(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getCallLogs(daysFilter);
      setCalls(response?.calls || []);
    } catch (error) {
      console.error("Failed to fetch call logs:", error);
    }
    setLoading(false);
  }, [daysFilter]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchCalls, 10000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchCalls]);

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const filterButtons = [
    { value: "1", label: "Today" },
    { value: "3", label: "3 Days" },
    { value: "7", label: "7 Days" },
    { value: "14", label: "14 Days" },
    { value: "all", label: "All" },
  ];

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
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                <MDBox display="flex" alignItems="center">
                  <PhoneIcon sx={{ mr: 1, color: "white" }} />
                  <MDTypography variant="h6" color="white">
                    Call Logs
                  </MDTypography>
                  {autoRefresh && (
                    <Chip
                      label="Live"
                      size="small"
                      sx={{ ml: 2, bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                    />
                  )}
                </MDBox>
                <MDBox display="flex" alignItems="center" flexWrap="wrap" gap={0.5}>
                  {filterButtons.map((btn) => (
                    <MDButton
                      key={btn.value}
                      variant={daysFilter === btn.value ? "contained" : "outlined"}
                      color="white"
                      size="small"
                      onClick={() => setDaysFilter(btn.value)}
                    >
                      {btn.label}
                    </MDButton>
                  ))}
                  <IconButton onClick={() => setAutoRefresh(!autoRefresh)}>
                    {autoRefresh ? (
                      <PauseIcon sx={{ color: "white" }} />
                    ) : (
                      <PlayArrowIcon sx={{ color: "white" }} />
                    )}
                  </IconButton>
                  <IconButton onClick={() => fetchCalls()}>
                    <RefreshIcon sx={{ color: "white" }} />
                  </IconButton>
                </MDBox>
              </MDBox>
              <MDBox pt={3} px={2} pb={2}>
                {loading && calls.length === 0 ? (
                  <MDTypography variant="body2" color="text" textAlign="center" py={4}>
                    Loading call logs...
                  </MDTypography>
                ) : calls.length === 0 ? (
                  <MDTypography variant="body2" color="text" textAlign="center" py={4}>
                    No calls found for selected period.
                  </MDTypography>
                ) : (
                  <MDBox sx={{ overflowX: "auto" }}>
                    {/* Header Row */}
                    <MDBox
                      display="flex"
                      sx={{
                        borderBottom: "2px solid #e0e0e0",
                        pb: 1,
                        mb: 1,
                        minWidth: "700px",
                      }}
                    >
                      <MDBox flex="2" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Time
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="2" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Caller ID
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="1.5" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Booking #
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="2" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Station/Context
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="1" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Duration
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                    {/* Data Rows */}
                    {calls.map((call, index) => (
                      <MDBox
                        key={call.uniqueid || index}
                        display="flex"
                        sx={{
                          py: 1,
                          borderBottom: "1px solid #f0f0f0",
                          minWidth: "700px",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                        }}
                      >
                        <MDBox flex="2" px={1}>
                          <MDTypography variant="body2" color="text">
                            {new Date(call.calldate).toLocaleString()}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="2" px={1}>
                          <MDTypography variant="body2" color="text">
                            {call.src || "Unknown"}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="1.5" px={1}>
                          <MDTypography
                            variant="body2"
                            color={call.booking_number === "6611234" ? "error" : "text"}
                            fontWeight={call.booking_number === "6611234" ? "bold" : "regular"}
                            sx={
                              call.booking_number === "6611234"
                                ? { color: "#f44336 !important" }
                                : {}
                            }
                          >
                            {call.booking_number || "—"}
                            {call.booking_number === "6611234" && " ⚠️"}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="2" px={1}>
                          <MDTypography variant="body2" color="text">
                            {call.dcontext === "radio-player"
                              ? call.lastdata?.replace("radio/", "") || "radio"
                              : call.dcontext || "-"}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="1" px={1}>
                          <MDTypography variant="body2" color="text">
                            {formatDuration(call.duration)}
                          </MDTypography>
                        </MDBox>
                      </MDBox>
                    ))}
                  </MDBox>
                )}
                <MDBox mt={2}>
                  <MDTypography variant="caption" color="text">
                    Showing {calls.length} calls
                  </MDTypography>
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

export default CallLogs;
