/**
 * DCG Admin Dashboard - Project Tracking
 * Track DCG initiatives, milestones, and team assignments
 */

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import api from "services/api";
import logger from "services/logger";

const PRIORITY_COLORS = { high: "error", medium: "warning", low: "info" };
const STATUS_COLORS = {
  completed: "success",
  in_progress: "info",
  planning: "warning",
  blocked: "error",
};

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning",
    priority: "medium",
    assignedTo: "",
    milestones: [],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.getProjects();
      setProjects(res.projects || []);
    } catch (err) {
      logger.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = async (projectId, milestoneIndex) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const updatedMilestones = [...project.milestones];
    updatedMilestones[milestoneIndex].done = !updatedMilestones[milestoneIndex].done;
    try {
      await api.updateProject(projectId, { milestones: updatedMilestones });
      fetchProjects();
    } catch (err) {
      logger.error("Failed to update:", err);
    }
  };

  const getProgress = (milestones) => {
    if (!milestones || milestones.length === 0) return 0;
    return Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100);
  };

  const handleOpenDialog = () => {
    setFormData({
      name: "",
      description: "",
      status: "planning",
      priority: "medium",
      assignedTo: "",
      milestones: [],
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCreateProject = async () => {
    try {
      if (!formData.name) {
        alert("Project name is required");
        return;
      }

      await api.createProject(formData);
      handleCloseDialog();
      fetchProjects();
    } catch (error) {
      logger.error("Error creating project:", error);
      alert("Failed to create project: " + (error.response?.data?.error || error.message));
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center" minHeight="60vh">
          <CircularProgress color="info" />
        </MDBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDTypography variant="h4">Project Tracking</MDTypography>
          <MDBox display="flex" alignItems="center" gap={2}>
            <MDTypography variant="button" color="text">
              {projects.length} active projects
            </MDTypography>
            <MDButton variant="gradient" color="info" onClick={handleOpenDialog}>
              <Icon>add</Icon>&nbsp; Create Project
            </MDButton>
          </MDBox>
        </MDBox>

        <Grid container spacing={3}>
          {projects.map((project) => {
            const progress = getProgress(project.milestones);
            return (
              <Grid item xs={12} lg={6} key={project.id}>
                <Card>
                  <MDBox p={3}>
                    {/* Header */}
                    <MDBox
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <MDBox>
                        <MDTypography variant="h6">{project.name}</MDTypography>
                        <MDTypography variant="caption" color="text">
                          {project.description}
                        </MDTypography>
                      </MDBox>
                      <MDBox display="flex" gap={1}>
                        <Chip
                          label={project.priority}
                          color={PRIORITY_COLORS[project.priority] || "default"}
                          size="small"
                        />
                        <Chip
                          label={project.status?.replace("_", " ")}
                          color={STATUS_COLORS[project.status] || "default"}
                          size="small"
                          variant="outlined"
                        />
                      </MDBox>
                    </MDBox>

                    {/* Assignee */}
                    <MDBox display="flex" alignItems="center" gap={1} mb={2}>
                      <Icon fontSize="small" color="action">
                        person
                      </Icon>
                      <MDTypography variant="button">
                        {project.assigned_to || project.assignee}
                      </MDTypography>
                    </MDBox>

                    {/* Cost Estimate */}
                    {project.estimated_hours > 0 && (
                      <MDBox display="flex" alignItems="center" gap={1} mb={2}>
                        <Icon fontSize="small" color="action">
                          attach_money
                        </Icon>
                        <MDTypography variant="button">
                          {project.estimated_hours} hours × $350/hr = $
                          {(project.estimated_hours * 350).toLocaleString()}
                        </MDTypography>
                      </MDBox>
                    )}

                    {/* Progress */}
                    <MDBox mb={2}>
                      <MDBox display="flex" justifyContent="space-between" mb={0.5}>
                        <MDTypography variant="caption">Progress</MDTypography>
                        <MDTypography variant="caption" fontWeight="medium">
                          {progress}%
                        </MDTypography>
                      </MDBox>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        color={progress === 100 ? "success" : "info"}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </MDBox>

                    {/* Milestones */}
                    <MDTypography variant="button" fontWeight="medium" mb={1} display="block">
                      Milestones
                    </MDTypography>
                    {project.milestones?.map((milestone, idx) => (
                      <MDBox
                        key={idx}
                        display="flex"
                        alignItems="center"
                        py={0.5}
                        sx={{ borderBottom: "1px solid #eee" }}
                      >
                        <Checkbox
                          checked={milestone.done}
                          onChange={() => toggleMilestone(project.id, idx)}
                          size="small"
                        />
                        <MDTypography
                          variant="button"
                          sx={{
                            textDecoration: milestone.done ? "line-through" : "none",
                            color: milestone.done ? "#888" : "inherit",
                          }}
                        >
                          {milestone.name}
                        </MDTypography>
                      </MDBox>
                    ))}

                    {/* Footer */}
                    <MDBox
                      display="flex"
                      justifyContent="space-between"
                      mt={2}
                      pt={2}
                      borderTop="1px solid #eee"
                    >
                      <MDTypography variant="caption" color="text">
                        Updated: {new Date(project.updatedAt).toLocaleDateString()}
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </MDBox>
      <Footer />

      {/* Create Project Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <MDBox pt={2} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Project Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
            />
            <TextField
              select
              label="Status"
              fullWidth
              value={formData.status}
              onChange={(e) => handleFormChange("status", e.target.value)}
            >
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </TextField>
            <TextField
              select
              label="Priority"
              fullWidth
              value={formData.priority}
              onChange={(e) => handleFormChange("priority", e.target.value)}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField
              label="Assigned To"
              fullWidth
              placeholder="Josh, Mary, Brandon"
              value={formData.assignedTo}
              onChange={(e) => handleFormChange("assignedTo", e.target.value)}
            />
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleCreateProject} color="info" disabled={!formData.name}>
            Create Project
          </MDButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default Projects;
