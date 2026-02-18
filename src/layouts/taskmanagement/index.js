/**
 * DCG Admin Dashboard - Task Management
 * iOS Actions-style task management system
 */

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
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
  Chip,
  IconButton,
  Checkbox,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CommentIcon from "@mui/icons-material/Comment";

function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assigned_to: "",
    due_date: "",
  });

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? { status: filter } : {};
      const response = await api.getTasks(params);
      setTasks(response.tasks || []);
    } catch (error) {
      logger.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to || "",
        due_date: task.due_date || "",
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        assigned_to: "",
        due_date: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
  };

  const handleSaveTask = async () => {
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
      } else {
        await api.createTask(formData);
      }
      handleCloseDialog();
      loadTasks();
    } catch (error) {
      logger.error("Error saving task:", error);
      alert("Failed to save task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.deleteTask(taskId);
      loadTasks();
    } catch (error) {
      logger.error("Error deleting task:", error);
      alert("Failed to delete task");
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.completeTask(taskId);
      loadTasks();
    } catch (error) {
      logger.error("Error completing task:", error);
      alert("Failed to complete task");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "info";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
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
                  Task Management
                </MDTypography>
                <MDButton variant="contained" color="white" onClick={() => handleOpenDialog()}>
                  <AddIcon /> Add Task
                </MDButton>
              </MDBox>

              <MDBox pt={3} px={2}>
                {/* Filter Tabs */}
                <MDBox mb={3} display="flex" gap={2}>
                  {["all", "pending", "in_progress", "completed"].map((status) => (
                    <MDButton
                      key={status}
                      variant={filter === status ? "gradient" : "outlined"}
                      color="info"
                      size="small"
                      onClick={() => setFilter(status)}
                    >
                      {status.replace("_", " ").toUpperCase()}
                    </MDButton>
                  ))}
                </MDBox>

                {/* Task List */}
                {loading ? (
                  <MDTypography variant="body2">Loading tasks...</MDTypography>
                ) : tasks.length === 0 ? (
                  <MDTypography variant="body2">No tasks found</MDTypography>
                ) : (
                  <Grid container spacing={2}>
                    {tasks.map((task) => (
                      <Grid item xs={12} key={task.id}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <MDBox display="flex" justifyContent="space-between" alignItems="start">
                            <MDBox flex={1}>
                              <MDBox display="flex" alignItems="center" gap={1} mb={1}>
                                <MDTypography variant="h6">{task.title}</MDTypography>
                                <Chip
                                  label={task.priority}
                                  color={getPriorityColor(task.priority)}
                                  size="small"
                                />
                                <Chip
                                  label={task.status.replace("_", " ")}
                                  color={getStatusColor(task.status)}
                                  size="small"
                                />
                              </MDBox>
                              {task.description && (
                                <MDTypography variant="body2" color="text">
                                  {task.description}
                                </MDTypography>
                              )}
                              <MDBox mt={1} display="flex" gap={2}>
                                {task.assigned_to && (
                                  <MDTypography variant="caption" color="text">
                                    Assigned to: {task.assigned_to}
                                  </MDTypography>
                                )}
                                {task.due_date && (
                                  <MDTypography variant="caption" color="text">
                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                  </MDTypography>
                                )}
                              </MDBox>
                            </MDBox>
                            <MDBox display="flex" gap={1}>
                              {task.status !== "completed" && (
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleCompleteTask(task.id)}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenDialog(task)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </MDBox>
                          </MDBox>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
        <DialogContent>
          <MDBox pt={2} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
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
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Assigned To (email)"
              fullWidth
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            />
            <TextField
              label="Due Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleSaveTask} color="info" disabled={!formData.title}>
            {editingTask ? "Update" : "Create"}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default TaskManagement;
