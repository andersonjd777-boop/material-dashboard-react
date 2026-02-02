import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

function BellTab() {
    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <MDBox mb={3}>
                    <MDTypography variant="h4" color="text">
                        Bell (Asterisk & Telecom)
                    </MDTypography>
                    <MDTypography variant="body2" color="text">
                        PBX Status & Call Routing
                    </MDTypography>
                </MDBox>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6} lg={3}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                color="warning"
                                icon="phone_in_talk"
                                title="Active Calls"
                                count="12"
                                percentage={{
                                    color: "success",
                                    amount: "Peak: 45",
                                    label: "Today",
                                }}
                            />
                        </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6} lg={3}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                color="warning"
                                icon="router"
                                title="Asterisk Uptime"
                                count="14d 2h"
                                percentage={{
                                    color: "success",
                                    amount: "Stable",
                                    label: "v20.16",
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

export default BellTab;
