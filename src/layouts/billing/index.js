/**
 * DCG Billing - Subscription Plans and Pricing
 */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import api from "services/api";
import logger from "services/logger";

// Plan colors for visual variety
const PLAN_COLORS = ["secondary", "info", "success", "warning", "primary", "error"];

function getPlanColor(index) {
  return PLAN_COLORS[index % PLAN_COLORS.length];
}

function PlanCard({ plan, color }) {
  // Get monthly price (prefer 1-month interval)
  const monthlyPrice = plan.prices.find((p) => p.interval === "month" && p.interval_count === 1);
  const threeMonthPrice = plan.prices.find((p) => p.interval === "month" && p.interval_count === 3);
  const yearlyPrice = plan.prices.find((p) => p.interval === "year");

  const displayPrice = monthlyPrice || threeMonthPrice || yearlyPrice || { amount: 0 };

  return (
    <Card sx={{ height: "100%", position: "relative" }}>
      <MDBox p={3}>
        <MDTypography variant="h5" fontWeight="medium" color={color}>
          {plan.name}
        </MDTypography>
        <MDBox mt={1} mb={2}>
          <MDTypography variant="h3" fontWeight="bold">
            {displayPrice.amount === 0 ? "Free" : `$${displayPrice.amount}`}
            {displayPrice.amount > 0 && (
              <MDTypography variant="button" color="text" fontWeight="regular">
                /{displayPrice.interval || "month"}
              </MDTypography>
            )}
          </MDTypography>
          {threeMonthPrice && monthlyPrice && (
            <MDTypography variant="caption" color="success" fontWeight="medium">
              Save 10% with 3-month plan: ${threeMonthPrice.amount}/3mo
            </MDTypography>
          )}
        </MDBox>
        <MDTypography variant="body2" color="text" mb={2}>
          {plan.description}
        </MDTypography>
        <MDBox>
          <MDBox display="flex" alignItems="center" mb={0.5}>
            <Icon sx={{ color: "success.main", mr: 1, fontSize: 16 }}>check</Icon>
            <MDTypography variant="button" color="text">
              Active Stripe Product
            </MDTypography>
          </MDBox>
          {plan.prices.length > 1 && (
            <MDBox display="flex" alignItems="center" mb={0.5}>
              <Icon sx={{ color: "success.main", mr: 1, fontSize: 16 }}>check</Icon>
              <MDTypography variant="button" color="text">
                {plan.prices.length} pricing options available
              </MDTypography>
            </MDBox>
          )}
        </MDBox>
      </MDBox>
    </Card>
  );
}

PlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    active: PropTypes.bool,
    prices: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        amount: PropTypes.number,
        currency: PropTypes.string,
        interval: PropTypes.string,
        interval_count: PropTypes.number,
      })
    ),
  }).isRequired,
  color: PropTypes.string.isRequired,
};

function Billing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const response = await api.getSubscriptionPlans();
        if (response.success && response.plans) {
          setPlans(response.plans);
        }
      } catch (err) {
        logger.error("Error loading subscription plans:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="success"
                borderRadius="lg"
                coloredShadow="success"
              >
                <MDTypography variant="h6" color="white">
                  DCG Subscription Plans (Live from Stripe)
                </MDTypography>
              </MDBox>
              <MDBox p={3}>
                {loading && (
                  <MDTypography variant="body2" color="text" textAlign="center">
                    Loading subscription plans...
                  </MDTypography>
                )}
                {error && (
                  <MDTypography variant="body2" color="error" textAlign="center">
                    Error loading plans: {error}
                  </MDTypography>
                )}
                {!loading && !error && plans.length === 0 && (
                  <MDTypography variant="body2" color="text" textAlign="center">
                    No subscription plans found
                  </MDTypography>
                )}
                {!loading && !error && plans.length > 0 && (
                  <Grid container spacing={3}>
                    {plans.map((plan, index) => (
                      <Grid item xs={12} md={6} lg={4} key={plan.id}>
                        <PlanCard plan={plan} color={getPlanColor(index)} />
                      </Grid>
                    ))}
                  </Grid>
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

export default Billing;
