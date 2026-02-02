/**
=========================================================
* Material Dashboard 2 React - v2.1.0
=========================================================
*/

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { useState, useEffect } from "react";

function WorkCalendar() {
    const [dates, setDates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Function to fetch calendar dates
    useEffect(() => {
        // In a real app we'd fetch from API:
        // fetch('/api/work-calendar/dates').then(...)

        // Mock data for initial render
        setDates([
            { calendar_date: '2026-02-01', summary: 'Audit & Gap Analysis Completed', completion_percentage: 100 },
            { calendar_date: '2026-01-31', summary: 'Stability Fixes Started', completion_percentage: 50 },
            { calendar_date: '2025-12-21', summary: 'Initial System Audit', completion_percentage: 100 }
        ]);
        setLoading(false);
    }, []);

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
                                <MDButton variant="outlined" color="white" size="small">
                                    Sync Now
                                </MDButton>
                            </MDBox>
                            <MDBox pt={3} pb={3} px={3}>
                                <MDTypography variant="body2" fontWeight="regular" color="text">
                                    History of DCG development work starting Oct 1, 2025.
                                </MDTypography>

                                <MDBox mt={4}>
                                    {loading ? (
                                        <MDTypography>Loading calendar...</MDTypography>
                                    ) : (
                                        <Grid container spacing={2}>
                                            {dates.map((day) => (
                                                <Grid item xs={12} md={4} key={day.calendar_date}>
                                                    <Card sx={{ border: "1px solid #ddd", p: 2 }}>
                                                        <MDTypography variant="h6">{day.calendar_date}</MDTypography>
                                                        <MDTypography variant="body2" color="text" mb={2}>
                                                            {day.summary}
                                                        </MDTypography>
                                                        <MDBox display="flex" alignItems="center">
                                                            <MDBox
                                                                width="100%"
                                                                height="6px"
                                                                bgColor="grey-200"
                                                                borderRadius="section"
                                                                mr={1}
                                                            >
                                                                <MDBox
                                                                    width={`${day.completion_percentage}%`}
                                                                    height="100%"
                                                                    bgColor="success"
                                                                    borderRadius="section"
                                                                />
                                                            </MDBox>
                                                            <MDTypography variant="caption">{day.completion_percentage}%</MDTypography>
                                                        </MDBox>
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
