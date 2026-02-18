/**
 * DCG Admin Dashboard - CRM Dashboard
 * Perfect Venue-style Customer Relationship Management
 */

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import api from "services/api";
import logger from "services/logger";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";

function CRMDashboard() {
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    customer_type: "family",
    name: "",
    email: "",
    phone: "",
    booking_number: "",
    facility_id: "",
    notes: "",
  });

  useEffect(() => {
    loadCustomers();
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== "all") params.customer_type = filterType;
      if (searchTerm) params.search = searchTerm;
      const response = await api.getCrmCustomers(params);
      setCustomers(response.customers || []);
    } catch (error) {
      logger.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.getCrmAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      logger.error("Error loading analytics:", error);
    }
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        customer_type: customer.customer_type,
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        booking_number: customer.booking_number || "",
        facility_id: customer.facility_id || "",
        notes: customer.notes || "",
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        customer_type: "family",
        name: "",
        email: "",
        phone: "",
        booking_number: "",
        facility_id: "",
        notes: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async () => {
    try {
      if (editingCustomer) {
        await api.updateCrmCustomer(editingCustomer.id, formData);
      } else {
        await api.createCrmCustomer(formData);
      }
      handleCloseDialog();
      loadCustomers();
      loadAnalytics();
    } catch (error) {
      logger.error("Error saving customer:", error);
      alert("Failed to save customer");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "warning";
      case "suspended":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          {/* Analytics Cards */}
          {analytics && (
            <>
              <Grid item xs={12} md={4}>
                <Card>
                  <MDBox p={3}>
                    <MDTypography variant="h6" color="text">
                      Total Customers
                    </MDTypography>
                    <MDTypography variant="h3">{analytics.totals.customers}</MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <MDBox p={3}>
                    <MDTypography variant="h6" color="text">
                      Active Subscriptions
                    </MDTypography>
                    <MDTypography variant="h3">{analytics.totals.activeSubscriptions}</MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <MDBox p={3}>
                    <MDTypography variant="h6" color="text">
                      Lifetime Value
                    </MDTypography>
                    <MDTypography variant="h3">
                      ${analytics.totals.lifetimeValue.toFixed(2)}
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
            </>
          )}

          {/* Customer List */}
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
                  Customer Relationship Management
                </MDTypography>
                <MDButton variant="contained" color="white" onClick={() => handleOpenDialog()}>
                  <AddIcon /> Add Customer
                </MDButton>
              </MDBox>

              <MDBox pt={3} px={2}>
                {/* Search and Filter */}
                <MDBox mb={3} display="flex" gap={2} alignItems="center">
                  <TextField
                    label="Search customers..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1 }}
                    InputProps={{
                      endAdornment: <SearchIcon />,
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Customer Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Customer Type"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="inmate">Inmate</MenuItem>
                      <MenuItem value="family">Family</MenuItem>
                      <MenuItem value="facility">Facility</MenuItem>
                    </Select>
                  </FormControl>
                </MDBox>

                {/* Customer Table */}
                {loading ? (
                  <MDTypography variant="body2">Loading customers...</MDTypography>
                ) : customers.length === 0 ? (
                  <MDTypography variant="body2">No customers found</MDTypography>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Contact</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Messages</TableCell>
                          <TableCell>Calls</TableCell>
                          <TableCell>LTV</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <MDTypography variant="body2" fontWeight="medium">
                                {customer.name}
                              </MDTypography>
                              {customer.booking_number && (
                                <MDTypography variant="caption" color="text">
                                  Booking: {customer.booking_number}
                                </MDTypography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip label={customer.customer_type} size="small" color="primary" />
                            </TableCell>
                            <TableCell>
                              {customer.email && (
                                <MDTypography variant="caption" display="block">
                                  {customer.email}
                                </MDTypography>
                              )}
                              {customer.phone && (
                                <MDTypography variant="caption" display="block">
                                  {customer.phone}
                                </MDTypography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={customer.status}
                                color={getStatusColor(customer.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{customer.total_messages}</TableCell>
                            <TableCell>{customer.total_calls}</TableCell>
                            <TableCell>${customer.lifetime_value.toFixed(2)}</TableCell>
                            <TableCell>
                              <IconButton size="small" color="info">
                                <VisibilityIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenDialog(customer)}
                              >
                                <EditIcon />
                              </IconButton>
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

      {/* Customer Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCustomer ? "Edit Customer" : "Create Customer"}</DialogTitle>
        <DialogContent>
          <MDBox pt={2} display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Customer Type</InputLabel>
              <Select
                value={formData.customer_type}
                label="Customer Type"
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
              >
                <MenuItem value="inmate">Inmate</MenuItem>
                <MenuItem value="family">Family</MenuItem>
                <MenuItem value="facility">Facility</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            {formData.customer_type === "inmate" && (
              <TextField
                label="Booking Number"
                fullWidth
                value={formData.booking_number}
                onChange={(e) => setFormData({ ...formData, booking_number: e.target.value })}
              />
            )}
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleSaveCustomer} color="info" disabled={!formData.name}>
            {editingCustomer ? "Update" : "Create"}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default CRMDashboard;
