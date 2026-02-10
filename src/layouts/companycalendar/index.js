/**
 * DCG Admin Dashboard - Company Calendar Component
 * Material-UI calendar view with daily activity tracking
 */

import { useState, useEffect } from "react";
import api from "services/api";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Icon from "@mui/material/Icon";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function CompanyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetails, setDayDetails] = useState(null);
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    event_type: "meeting",
    location: "",
    notes: "",
    created_by: "admin@directconnectglobal.com",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMonthData();
  }, [currentDate]);

  const fetchMonthData = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await api.get(`/calendar/month/${year}/${month}`);
      setMonthData(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch calendar data");
      setLoading(false);
    }
  };

  const fetchDayDetails = async (date) => {
    try {
      const data = await api.get(`/calendar/day/${date}`);
      setDayDetails(data);
      setSelectedDay(date);
    } catch (err) {
      setError("Failed to fetch day details");
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date) => {
    fetchDayDetails(date);
  };

  const handleCreateEvent = async () => {
    try {
      await api.post("/calendar/events", newEvent);
      setShowEventDialog(false);
      setNewEvent({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        event_type: "meeting",
        location: "",
        notes: "",
        created_by: "admin@directconnectglobal.com",
      });
      fetchMonthData();
      if (selectedDay) fetchDayDetails(selectedDay);
    } catch (err) {
      setError("Failed to create event");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "success",
      in_progress: "info",
      pending: "warning",
      failed: "error",
      blocked: "error",
      pass: "success",
      success: "success",
    };
    return colors[status] || "default";
  };

  const renderCalendarGrid = () => {
    if (!monthData) return null;

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const firstDayOfWeek = monthData.days[0].dayOfWeek;

    return (
      <Grid container spacing={1}>
        {/* Week day headers */}
        {weekDays.map((day) => (
          <Grid item xs={12 / 7} key={day}>
            <MDBox textAlign="center" p={1}>
              <MDTypography variant="caption" fontWeight="bold">
                {day}
              </MDTypography>
            </MDBox>
          </Grid>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <Grid item xs={12 / 7} key={`empty-${index}`}>
            <MDBox height="100px" />
          </Grid>
        ))}

        {/* Calendar days */}
        {monthData.days.map((day) => (
          <Grid item xs={12 / 7} key={day.date}>
            <Card
              sx={{
                height: "100px",
                cursor: "pointer",
                "&:hover": { bgcolor: "grey.100" },
                bgcolor: day.date === selectedDay ? "info.light" : "white",
              }}
              onClick={() => handleDayClick(day.date)}
            >
              <MDBox p={1}>
                <MDTypography variant="caption" fontWeight="bold">
                  {new Date(day.date).getDate()}
                </MDTypography>

                <MDBox mt={0.5}>
                  {day.summary.completed > 0 && (
                    <Chip
                      label={`✓ ${day.summary.completed}`}
                      size="small"
                      color="success"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  )}
                  {day.summary.inProgress > 0 && (
                    <Chip
                      label={`⟳ ${day.summary.inProgress}`}
                      size="small"
                      color="info"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  )}
                  {day.summary.scheduled > 0 && (
                    <Chip
                      label={`📅 ${day.summary.scheduled}`}
                      size="small"
                      color="warning"
                      sx={{ mb: 0.5 }}
                    />
                  )}
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3} display="flex" justifyContent="space-between" alignItems="center">
                <MDBox>
                  <MDTypography variant="h4">
                    {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </MDTypography>
                  {monthData && (
                    <MDTypography variant="caption" color="text">
                      {monthData.totalCompleted} completed • {monthData.totalInProgress} in progress
                      • {monthData.totalEvents} events
                    </MDTypography>
                  )}
                </MDBox>
                <MDBox display="flex" gap={2}>
                  <IconButton onClick={handlePreviousMonth}>
                    <Icon>chevron_left</Icon>
                  </IconButton>
                  <MDButton color="info" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </MDButton>
                  <IconButton onClick={handleNextMonth}>
                    <Icon>chevron_right</Icon>
                  </IconButton>
                  <MDButton color="success" onClick={() => setShowEventDialog(true)}>
                    <Icon sx={{ mr: 1 }}>add</Icon>
                    New Event
                  </MDButton>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          {/* Calendar Grid */}
          <Grid item xs={12} md={8}>
            <Card>
              <MDBox p={3}>{renderCalendarGrid()}</MDBox>
            </Card>
          </Grid>

          {/* Day Details Sidebar */}
          <Grid item xs={12} md={4}>
            {dayDetails ? (
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={2}>
                    {new Date(dayDetails.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </MDTypography>

                  {/* Wins Section */}
                  <MDBox mb={3}>
                    <MDTypography variant="h6" color="success" mb={1}>
                      ✓ Wins ({dayDetails.wins.length})
                    </MDTypography>
                    {dayDetails.wins.length === 0 ? (
                      <MDTypography variant="caption" color="text">
                        No completed items
                      </MDTypography>
                    ) : (
                      dayDetails.wins.map((item) => (
                        <MDBox
                          key={item.id}
                          p={1}
                          mb={1}
                          sx={{ bgcolor: "grey.100", borderRadius: 1, cursor: "pointer" }}
                          onClick={() => setSelectedWorkItem(item)}
                        >
                          <MDTypography variant="caption" fontWeight="bold">
                            {item.title}
                          </MDTypography>
                          <MDBox display="flex" gap={0.5} mt={0.5}>
                            <Chip label={item.type} size="small" />
                            <Chip
                              label={item.status}
                              size="small"
                              color={getStatusColor(item.status)}
                            />
                          </MDBox>
                        </MDBox>
                      ))
                    )}
                  </MDBox>

                  {/* Needs Section */}
                  <MDBox mb={3}>
                    <MDTypography variant="h6" color="warning" mb={1}>
                      ⚠ Needs ({dayDetails.needs.length})
                    </MDTypography>
                    {dayDetails.needs.length === 0 ? (
                      <MDTypography variant="caption" color="text">
                        No pending items
                      </MDTypography>
                    ) : (
                      dayDetails.needs.map((item) => (
                        <MDBox
                          key={item.id}
                          p={1}
                          mb={1}
                          sx={{ bgcolor: "grey.100", borderRadius: 1, cursor: "pointer" }}
                          onClick={() => setSelectedWorkItem(item)}
                        >
                          <MDTypography variant="caption" fontWeight="bold">
                            {item.title}
                          </MDTypography>
                          <MDBox display="flex" gap={0.5} mt={0.5}>
                            <Chip label={item.type} size="small" />
                            <Chip
                              label={item.status}
                              size="small"
                              color={getStatusColor(item.status)}
                            />
                          </MDBox>
                        </MDBox>
                      ))
                    )}
                  </MDBox>

                  {/* Events Section */}
                  <MDBox>
                    <MDTypography variant="h6" color="info" mb={1}>
                      📅 Events ({dayDetails.events.length})
                    </MDTypography>
                    {dayDetails.events.length === 0 ? (
                      <MDTypography variant="caption" color="text">
                        No scheduled events
                      </MDTypography>
                    ) : (
                      dayDetails.events.map((event) => (
                        <MDBox
                          key={event.id}
                          p={1}
                          mb={1}
                          sx={{ bgcolor: "grey.100", borderRadius: 1 }}
                        >
                          <MDTypography variant="caption" fontWeight="bold">
                            {event.title}
                          </MDTypography>
                          <MDTypography variant="caption" display="block">
                            {event.event_time} • {event.event_type}
                          </MDTypography>
                        </MDBox>
                      ))
                    )}
                  </MDBox>
                </MDBox>
              </Card>
            ) : (
              <Card>
                <MDBox p={3} textAlign="center">
                  <Icon fontSize="large" color="disabled">
                    calendar_today
                  </Icon>
                  <MDTypography variant="caption" display="block" mt={2}>
                    Click on a day to view details
                  </MDTypography>
                </MDBox>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* New Event Dialog */}
        <Dialog
          open={showEventDialog}
          onClose={() => setShowEventDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Event</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Time"
                  type="time"
                  value={newEvent.event_time}
                  onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Event Type"
                  value={newEvent.event_type}
                  onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                >
                  <MenuItem value="meeting">Meeting</MenuItem>
                  <MenuItem value="deadline">Deadline</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <MDButton onClick={() => setShowEventDialog(false)}>Cancel</MDButton>
            <MDButton color="success" onClick={handleCreateEvent}>
              Create Event
            </MDButton>
          </DialogActions>
        </Dialog>

        {/* Enhanced Work Item Details Dialog */}
        <Dialog
          open={!!selectedWorkItem}
          onClose={() => setSelectedWorkItem(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { maxHeight: "90vh" } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <MDBox display="flex" alignItems="center" justifyContent="space-between">
              <MDBox display="flex" alignItems="center" gap={1}>
                <Icon color="info">
                  {selectedWorkItem?.type === "commit"
                    ? "code"
                    : selectedWorkItem?.type === "deployment"
                    ? "rocket_launch"
                    : selectedWorkItem?.type === "gap_analysis"
                    ? "search"
                    : selectedWorkItem?.type === "file"
                    ? "description"
                    : "work"}
                </Icon>
                <MDTypography variant="h6">Work Item Details</MDTypography>
              </MDBox>
              <Chip
                label={selectedWorkItem?.status || "unknown"}
                color={getStatusColor(selectedWorkItem?.status)}
                size="small"
              />
            </MDBox>
          </DialogTitle>
          <DialogContent dividers>
            {selectedWorkItem && (
              <MDBox>
                {/* Title */}
                <MDTypography variant="h5" mb={2} sx={{ wordBreak: "break-word" }}>
                  {selectedWorkItem.title}
                </MDTypography>

                {/* Quick Info Row */}
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={6} sm={3}>
                    <MDTypography variant="caption" color="text" fontWeight="bold">
                      Type
                    </MDTypography>
                    <Chip label={selectedWorkItem.type} size="small" sx={{ ml: 1 }} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <MDTypography variant="caption" color="text" fontWeight="bold">
                      Source
                    </MDTypography>
                    <MDTypography variant="body2">{selectedWorkItem.source}</MDTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="caption" color="text" fontWeight="bold">
                      Timestamp
                    </MDTypography>
                    <MDTypography variant="body2">
                      {new Date(selectedWorkItem.timestamp).toLocaleString()}
                    </MDTypography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* What Changed Section */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
                    <MDBox display="flex" alignItems="center" gap={1}>
                      <Icon color="primary">edit_note</Icon>
                      <MDTypography variant="subtitle1" fontWeight="bold">
                        What Changed
                      </MDTypography>
                    </MDBox>
                  </AccordionSummary>
                  <AccordionDetails>
                    <MDTypography variant="body2" mb={2}>
                      {selectedWorkItem.metadata?.fullMessage ||
                        selectedWorkItem.description ||
                        "No description available"}
                    </MDTypography>
                    {selectedWorkItem.metadata?.filesChanged?.length > 0 && (
                      <MDBox>
                        <MDTypography variant="caption" color="text" fontWeight="bold">
                          Files Modified (
                          {selectedWorkItem.metadata.filesCount ||
                            selectedWorkItem.metadata.filesChanged.length}
                          )
                        </MDTypography>
                        <Box
                          sx={{
                            bgcolor: "grey.100",
                            p: 1.5,
                            borderRadius: 1,
                            mt: 1,
                            maxHeight: 150,
                            overflow: "auto",
                          }}
                        >
                          {selectedWorkItem.metadata.filesChanged.map((file, idx) => (
                            <MDTypography
                              key={idx}
                              variant="caption"
                              display="block"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {file}
                            </MDTypography>
                          ))}
                        </Box>
                      </MDBox>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Technical Details Section (for commits/deployments) */}
                {(selectedWorkItem.type === "commit" ||
                  selectedWorkItem.metadata?.hash ||
                  selectedWorkItem.metadata?.deploymentId) && (
                  <Accordion>
                    <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
                      <MDBox display="flex" alignItems="center" gap={1}>
                        <Icon color="secondary">terminal</Icon>
                        <MDTypography variant="subtitle1" fontWeight="bold">
                          Technical Details
                        </MDTypography>
                      </MDBox>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {selectedWorkItem.metadata?.hash && (
                          <Grid item xs={12} sm={6}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Commit Hash
                            </MDTypography>
                            <MDTypography
                              variant="body2"
                              sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                            >
                              {selectedWorkItem.metadata.hash}
                            </MDTypography>
                          </Grid>
                        )}
                        {selectedWorkItem.metadata?.author && (
                          <Grid item xs={12} sm={6}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Author
                            </MDTypography>
                            <MDTypography variant="body2">
                              {selectedWorkItem.metadata.author}
                              {selectedWorkItem.metadata.authorEmail &&
                                ` <${selectedWorkItem.metadata.authorEmail}>`}
                            </MDTypography>
                          </Grid>
                        )}
                        {selectedWorkItem.metadata?.branch && (
                          <Grid item xs={12} sm={6}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Branch
                            </MDTypography>
                            <Chip
                              label={selectedWorkItem.metadata.branch}
                              size="small"
                              color="info"
                            />
                          </Grid>
                        )}
                        {selectedWorkItem.metadata?.prNumber && (
                          <Grid item xs={12} sm={6}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Pull Request
                            </MDTypography>
                            <MDTypography variant="body2">
                              #{selectedWorkItem.metadata.prNumber}
                            </MDTypography>
                          </Grid>
                        )}
                        {selectedWorkItem.metadata?.deploymentId && (
                          <Grid item xs={12} sm={6}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Deployment ID
                            </MDTypography>
                            <MDTypography variant="body2" sx={{ fontFamily: "monospace" }}>
                              {selectedWorkItem.metadata.deploymentId}
                            </MDTypography>
                          </Grid>
                        )}
                        {selectedWorkItem.metadata?.deployedBy && (
                          <Grid item xs={12} sm={6}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Deployed By
                            </MDTypography>
                            <MDTypography variant="body2">
                              {selectedWorkItem.metadata.deployedBy}
                            </MDTypography>
                          </Grid>
                        )}
                        {selectedWorkItem.metadata?.environment && (
                          <Grid item xs={12} sm={6}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Environment
                            </MDTypography>
                            <Chip
                              label={selectedWorkItem.metadata.environment}
                              size="small"
                              color={
                                selectedWorkItem.metadata.environment === "production"
                                  ? "success"
                                  : "warning"
                              }
                            />
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Impact Section (for gap analysis or deployments) */}
                {(selectedWorkItem.type === "gap_analysis" ||
                  selectedWorkItem.metadata?.severity ||
                  selectedWorkItem.metadata?.gapsFound) && (
                  <Accordion>
                    <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
                      <MDBox display="flex" alignItems="center" gap={1}>
                        <Icon color="warning">assessment</Icon>
                        <MDTypography variant="subtitle1" fontWeight="bold">
                          Impact & Analysis
                        </MDTypography>
                      </MDBox>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {selectedWorkItem.metadata?.severity && (
                          <Grid item xs={6}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Severity
                            </MDTypography>
                            <Chip
                              label={selectedWorkItem.metadata.severity}
                              size="small"
                              color={
                                selectedWorkItem.metadata.severity === "critical"
                                  ? "error"
                                  : selectedWorkItem.metadata.severity === "high"
                                  ? "warning"
                                  : "info"
                              }
                            />
                          </Grid>
                        )}
                        {selectedWorkItem.metadata?.gapsFound !== undefined && (
                          <Grid item xs={6}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Gaps Found
                            </MDTypography>
                            <MDTypography
                              variant="h6"
                              color={
                                selectedWorkItem.metadata.gapsFound > 0 ? "warning" : "success"
                              }
                            >
                              {selectedWorkItem.metadata.gapsFound}
                            </MDTypography>
                          </Grid>
                        )}
                        {selectedWorkItem.metadata?.action && (
                          <Grid item xs={12}>
                            <MDTypography variant="caption" color="text" fontWeight="bold">
                              Action Taken
                            </MDTypography>
                            <MDTypography variant="body2">
                              {selectedWorkItem.metadata.action}
                            </MDTypography>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Raw Metadata Section (collapsed by default) */}
                <Accordion>
                  <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
                    <MDBox display="flex" alignItems="center" gap={1}>
                      <Icon color="disabled">data_object</Icon>
                      <MDTypography variant="subtitle1" fontWeight="bold" color="text">
                        Raw Metadata
                      </MDTypography>
                    </MDBox>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box
                      sx={{
                        bgcolor: "grey.100",
                        p: 2,
                        borderRadius: 1,
                        overflow: "auto",
                        maxHeight: 200,
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {JSON.stringify(selectedWorkItem.metadata || {}, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </MDBox>
            )}
          </DialogContent>
          <DialogActions>
            <MDButton onClick={() => setSelectedWorkItem(null)}>Close</MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default CompanyCalendar;
