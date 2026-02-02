import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

function LedgerTab() {
    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <MDBox mb={3}>
                    <MDTypography variant="h4" color="text">
                        Ledger (Finance & Accounting)
                    </MDTypography>
                    <MDTypography variant="body2" color="text">
                        Budget Tracking & Stripe Analytics
                    </MDTypography>
                </MDBox>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6} lg={3}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                color="success"
                                icon="store"
                                title="Monthly Revenue"
                                count="$42,500"
                                percentage={{
                                    color: "success",
                                    amount: "+5%",
                                    label: "growth",
                                }}
                            />
                        </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6} lg={3}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                color="primary"
                                icon="account_balance_wallet"
                                title="Stripe Balance"
                                count="$12,450"
                                percentage={{
                                    color: "secondary",
                                    amount: "Settled",
                                    label: "Today",
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

export default LedgerTab;
