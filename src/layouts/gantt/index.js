/**
 * DCG Admin Dashboard - Gantt Chart Project Timeline
 * Microsoft Project-style project management with visual timeline
 */

import { useState, useEffect, useRef } from "react";
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
  LinearProgress,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function GanttTimeline() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    progress: 0,
    status: "planning",
    priority: "medium",
    assigned_to: "",
    color: "#3498db",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.getTimelineProjects();
      setProjects(response.projects || []);
    } catch (error) {
      logger.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || "",
        start_date: project.start_date,
        end_date: project.end_date,
        progress: project.progress,
        status: project.status,
        priority: project.priority,
        assigned_to: project.assigned_to || "",
        color: project.color || "#3498db",
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        progress: 0,
        status: "planning",
        priority: "medium",
        assigned_to: "",
        color: "#3498db",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
  };

  const handleSaveProject = async () => {
    try {
      if (editingProject) {
        await api.updateTimelineProject(editingProject.id, formData);
      } else {
        await api.createTimelineProject(formData);
      }
      handleCloseDialog();
      loadProjects();
    } catch (error) {
      logger.error("Error saving project:", error);
      alert("Failed to save project");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.deleteTimelineProject(projectId);
      loadProjects();
    } catch (error) {
      logger.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "active":
        return "info";
      case "planning":
        return "warning";
      case "on_hold":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
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
                  Project Timeline (Gantt Chart)
                </MDTypography>
                <MDButton variant="contained" color="white" onClick={() => handleOpenDialog()}>
                  <AddIcon /> Add Project
                </MDButton>
              </MDBox>

              <MDBox pt={3} px={2}>
                {loading ? (
                  <MDTypography variant="body2">Loading projects...</MDTypography>
                ) : projects.length === 0 ? (
                  <MDTypography variant="body2">No projects found</MDTypography>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Project Name</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                          <TableCell>Progress</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Priority</TableCell>
                          <TableCell>Assigned To</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell>
                              <MDTypography variant="body2" fontWeight="medium">
                                {project.name}
                              </MDTypography>
                              {project.description && (
                                <MDTypography variant="caption" color="text">
                                  {project.description}
                                </MDTypography>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(project.start_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{new Date(project.end_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <MDBox display="flex" alignItems="center" gap={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={project.progress}
                                  sx={{ width: 100 }}
                                />
                                <MDTypography variant="caption">{project.progress}%</MDTypography>
                              </MDBox>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={project.status.replace("_", " ")}
                                color={getStatusColor(project.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={project.priority}
                                color={getPriorityColor(project.priority)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{project.assigned_to || "-"}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenDialog(project)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                <DeleteIcon />
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

      {/* Project Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProject ? "Edit Project" : "Create Project"}</DialogTitle>
        <DialogContent>
          <MDBox pt={2} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Project Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
            <TextField
              label="Progress (%)"
              type="number"
              fullWidth
              value={formData.progress}
              onChange={(e) =>
                setFormData({ ...formData, progress: Math.min(100, Math.max(0, e.target.value)) })
              }
              inputProps={{ min: 0, max: 100 }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="planning">Planning</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Assigned To (email)"
              fullWidth
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            />
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton
            onClick={handleSaveProject}
            color="info"
            disabled={!formData.name || !formData.start_date || !formData.end_date}
          >
            {editingProject ? "Update" : "Create"}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default GanttTimeline;
