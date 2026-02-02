/**
=========================================================
* Material Dashboard 2 React - v2.1.0
=========================================================
*/

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import api from "services/api";
import { useState, useEffect } from "react";

function WorkCalendar() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateDetails, setDateDetails] = useState(null);

  // Function to fetch calendar dates
  const fetchDates = async () => {
    try {
      setLoading(true);
      const response = await api.getWorkCalendarDates();
      setDates(response.dates || []);
    } catch (error) {
      console.error("Failed to fetch calendar dates:", error);
      // Fallback to empty array on error
      setDates([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch date details when a date is selected
  const fetchDateDetails = async (date) => {
    try {
      const response = await api.getWorkCalendarDate(date);
      setDateDetails(response);
    } catch (error) {
      console.error("Failed to fetch date details:", error);
    }
  };

  // Trigger sync
  const handleSync = async () => {
    try {
      setSyncing(true);
      await api.triggerWorkCalendarSync();
      // Refetch dates after sync
      await fetchDates();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDates();
  }, []);

  // Get item type badge color
  const getTypeColor = (type) => {
    switch (type) {
      case "auto_healer_test":
        return "error";
      case "gap_analysis":
        return "warning";
      case "deployment":
        return "success";
      case "cron_job":
        return "info";
      default:
        return "default";
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
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  Work Documentation Calendar
                </MDTypography>
                <MDButton
                  variant="outlined"
                  color="white"
                  size="small"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? "Syncing..." : "Sync Now"}
                </MDButton>
              </MDBox>
              <MDBox pt={3} pb={3} px={3}>
                <MDTypography variant="body2" fontWeight="regular" color="text">
                  History of DCG development work including automated system activity.
                </MDTypography>

                <MDBox mt={4}>
                  {loading ? (
                    <MDTypography>Loading calendar...</MDTypography>
                  ) : dates.length === 0 ? (
                    <MDTypography variant="body2" color="text">
                      No calendar entries yet. Automated systems will log activity here.
                    </MDTypography>
                  ) : (
                    <Grid container spacing={2}>
                      {dates.map((day) => (
                        <Grid item xs={12} md={4} key={day.calendar_date || day.id}>
                          <Card
                            sx={{
                              border: "1px solid #ddd",
                              p: 2,
                              cursor: "pointer",
                              "&:hover": { borderColor: "#1976d2" },
                              background:
                                day.total_items > 0
                                  ? "linear-gradient(195deg, #f8f9fa, #fff)"
                                  : "#fafafa",
                            }}
                            onClick={() => setSelectedDate(day.calendar_date)}
                          >
                            <MDBox
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <MDTypography variant="h6">{day.calendar_date}</MDTypography>
                              {day.total_items > 0 && (
                                <Chip
                                  label={`${day.total_items} items`}
                                  size="small"
                                  color="primary"
                                />
                              )}
                            </MDBox>
                            <MDTypography variant="body2" color="text" mb={1}>
                              {day.total_items > 0
                                ? `${day.completed_items || 0}/${day.total_items} completed`
                                : day.summary || "No activity logged"}
                            </MDTypography>
                            {day.total_items > 0 && (
                              <MDBox display="flex" alignItems="center">
                                <MDBox
                                  width="100%"
                                  height="6px"
                                  bgColor="grey-200"
                                  borderRadius="section"
                                  mr={1}
                                >
                                  <MDBox
                                    width={`${day.completion_percentage || 0}%`}
                                    height="100%"
                                    bgColor="success"
                                    borderRadius="section"
                                  />
                                </MDBox>
                                <MDTypography variant="caption">
                                  {day.completion_percentage || 0}%
                                </MDTypography>
                              </MDBox>
                            )}
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
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

export default WorkCalendar;
