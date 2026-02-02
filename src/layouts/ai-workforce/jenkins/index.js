/**
 * AI Workforce - Jenkins Dashboard
 * Displays Server Health, Deployment Status, and recent Logs.
 */
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

function JenkinsTab() {
    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <MDBox mb={3}>
                    <MDTypography variant="h4" color="text">
                        Jenkins (CTO & DevOps)
                    </MDTypography>
                    <MDTypography variant="body2" color="text">
                        Managing Infrastructure: 157.245.185.88
                    </MDTypography>
                </MDBox>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6} lg={4}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                color="dark"
                                icon="dns"
                                title="Server Uptime"
                                count="99.9%"
                                percentage={{
                                    color: "success",
                                    amount: "+1%",
                                    label: "than last week",
                                }}
                            />
                        </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6} lg={4}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                color="info"
                                icon="rocket_launch"
                                title="Last Deploy"
                                count="2m ago"
                                percentage={{
                                    color: "success",
                                    amount: "Success",
                                    label: "v1.2.4",
                                }}
                            />
                        </MDBox>
                    </Grid>
                </Grid>
            </MDBox>
            <Footer />
        </DashboardLayout>
    );
}

export default JenkinsTab;
