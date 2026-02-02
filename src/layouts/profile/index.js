import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";
import Header from "layouts/profile/components/Header";
import PlatformSettings from "layouts/profile/components/PlatformSettings";

function Overview() {
  const [user, setUser] = useState({ name: "", email: "", role: "" });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("dcg_admin_user") || "{}");
    const email = userData.email || "";
    const name = email.split("@")[0].replace(/[._]/g, " ");
    const formattedName = name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    let role = "Team Member";
    if (email.includes("josh")) role = "CTO";
    else if (email.includes("mary")) role = "CEO";
    else if (email.includes("brandon")) role = "Founder";
    else if (email.includes("admin")) role = "Administrator";

    setUser({ name: formattedName || "DCG User", email, role });
  }, []);

  const quickLinks = [
    { icon: "dashboard", title: "Dashboard", route: "/dashboard", color: "info" },
    { icon: "email", title: "Email Hub", route: "/email", color: "primary" },
    { icon: "payments", title: "Subscriptions", route: "/subscriptions", color: "success" },
    { icon: "settings", title: "Settings", route: "/settings", color: "warning" },
  ];

  const teamMembers = [
    { name: "Brandon Anderson", role: "Founder" },
    { name: "Mary Anderson", role: "CEO" },
    { name: "Joshua Anderson", role: "CTO" },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      <Header>
        <MDBox mt={5} mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} xl={4}>
              <PlatformSettings />
            </Grid>
            <Grid item xs={12} md={6} xl={4} sx={{ display: "flex" }}>
              <Divider orientation="vertical" sx={{ ml: -2, mr: 1 }} />
              <ProfileInfoCard
                title="Account Information"
                description="Direct Connect Global - Turning jail payphones into smart devices."
                info={{
                  fullName: user.name,
                  role: user.role,
                  email: user.email,
                  company: "Direct Connect Global",
                }}
                social={[
                  {
                    link: "https://directconnectglobal.com",
                    icon: <LanguageIcon />,
                    color: "slack",
                  },
                  {
                    link: "https://linkedin.com",
                    icon: <LinkedInIcon />,
                    color: "linkedin",
                  },
                ]}
                action={{ route: "", tooltip: "Edit Profile" }}
                shadow={false}
              />
              <Divider orientation="vertical" sx={{ mx: 0 }} />
            </Grid>
            <Grid item xs={12} xl={4}>
              <Card sx={{ height: "100%", boxShadow: "none" }}>
                <MDBox p={2}>
                  <MDTypography variant="h6" fontWeight="medium" mb={2}>
                    DCG Team
                  </MDTypography>
                  <MDBox display="flex" flexDirection="column" gap={2}>
                    {teamMembers.map((member) => (
                      <MDBox key={member.name} display="flex" alignItems="center" gap={2}>
                        <MDBox
                          width={40}
                          height={40}
                          borderRadius="lg"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          sx={{ bgcolor: "info.main", color: "white" }}
                        >
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </MDBox>
                        <MDBox>
                          <MDTypography variant="button" fontWeight="medium">
                            {member.name}
                          </MDTypography>
                          <MDTypography variant="caption" color="text" display="block">
                            {member.role}
                          </MDTypography>
                        </MDBox>
                      </MDBox>
                    ))}
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
        <MDBox pt={2} px={2} lineHeight={1.25}>
          <MDTypography variant="h6" fontWeight="medium">
            Quick Access
          </MDTypography>
          <MDBox mb={1}>
            <MDTypography variant="button" color="text">
              Navigate to key dashboard areas
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox p={2}>
          <Grid container spacing={3}>
            {quickLinks.map((link) => (
              <Grid item xs={6} md={3} key={link.title}>
                <Card
                  sx={{ p: 2, cursor: "pointer", "&:hover": { transform: "translateY(-4px)" } }}
                  onClick={() => (window.location.href = link.route)}
                >
                  <MDBox display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <MDBox
                      width={50}
                      height={50}
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      sx={{ bgcolor: `${link.color}.main`, color: "white" }}
                    >
                      <Icon fontSize="medium">{link.icon}</Icon>
                    </MDBox>
                    <MDTypography variant="button" fontWeight="medium">
                      {link.title}
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
            ))}
          </Grid>
        </MDBox>
      </Header>
      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
