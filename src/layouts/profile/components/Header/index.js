import { useState, useEffect } from "react";
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";

function Header({ children }) {
  const [user, setUser] = useState({ name: "", email: "", role: "" });

  useEffect(() => {
    // Get user from localStorage
    const userData = JSON.parse(localStorage.getItem("dcg_admin_user") || "{}");
    const email = userData.email || "";
    const name = email.split("@")[0].replace(/[._]/g, " ");
    const formattedName = name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Determine role from email
    let role = "Team Member";
    if (email.includes("josh")) role = "CTO";
    else if (email.includes("mary")) role = "CEO";
    else if (email.includes("brandon")) role = "Founder";
    else if (email.includes("admin")) role = "Administrator";

    setUser({ name: formattedName || "DCG User", email, role });
  }, []);

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MDBox position="relative" mb={5}>
      <MDBox
        display="flex"
        alignItems="center"
        position="relative"
        minHeight="12rem"
        borderRadius="xl"
        sx={{
          background: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)",
          overflow: "hidden",
        }}
      >
        <MDBox position="absolute" top={20} left={30}>
          <MDTypography variant="h4" color="white" fontWeight="bold">
            Direct Connect Global
          </MDTypography>
          <MDTypography variant="body2" color="white" sx={{ opacity: 0.8 }}>
            Admin Dashboard
          </MDTypography>
        </MDBox>
      </MDBox>
      <Card
        sx={{
          position: "relative",
          mt: -6,
          mx: 3,
          py: 2,
          px: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <MDAvatar
              bgColor="info"
              size="xl"
              shadow="sm"
              sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
            >
              {getInitials(user.name)}
            </MDAvatar>
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium">
                {user.name}
              </MDTypography>
              <MDTypography variant="button" color="text" fontWeight="regular">
                {user.role}
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ ml: "auto" }}>
            <MDBox display="flex" gap={2} justifyContent="flex-end">
              <MDBox textAlign="center">
                <Icon color="info">email</Icon>
                <MDTypography variant="caption" display="block" color="text">
                  {user.email}
                </MDTypography>
              </MDBox>
            </MDBox>
          </Grid>
        </Grid>
        {children}
      </Card>
    </MDBox>
  );
}

Header.defaultProps = {
  children: "",
};

Header.propTypes = {
  children: PropTypes.node,
};

export default Header;
