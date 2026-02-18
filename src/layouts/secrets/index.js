/**
 * DCG Admin Dashboard - Secrets Manager
 * Encrypted storage for API keys, credentials, and sensitive data
 */

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import api from "services/api";
import logger from "services/logger";

const CATEGORIES = [
  { value: "api_keys", label: "API Keys", color: "info" },
  { value: "database", label: "Database", color: "warning" },
  { value: "ssh", label: "SSH/Server", color: "error" },
  { value: "stripe", label: "Stripe", color: "success" },
  { value: "twilio", label: "Twilio", color: "primary" },
  { value: "siteground", label: "SiteGround", color: "secondary" },
  { value: "infrastructure", label: "Infrastructure", color: "warning" },
  { value: "dashboard", label: "Dashboard", color: "info" },
  { value: "team", label: "Team", color: "primary" },
  { value: "general", label: "General", color: "dark" },
];

function Secrets() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    category: "general",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [copySuccess, setCopySuccess] = useState(null);

  useEffect(() => {
    fetchSecrets();
  }, []);

  const fetchSecrets = async () => {
    try {
      const res = await api.getSecrets();
      setSecrets(res.secrets || []);
    } catch (err) {
      logger.error("Failed to fetch secrets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.key || !formData.value) return;
    setSaving(true);
    try {
      await api.saveSecret(formData);
      setDialogOpen(false);
      setFormData({ key: "", value: "", category: "general", description: "" });
      fetchSecrets();
    } catch (err) {
      logger.error("Failed to save secret:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Delete secret "${key}"?`)) return;
    try {
      await api.deleteSecret(key);
      fetchSecrets();
    } catch (err) {
      logger.error("Failed to delete:", err);
    }
  };

  const getCategoryInfo = (cat) =>
    CATEGORIES.find((c) => c.value === cat) || { value: cat, label: cat, color: "default" };

  const handleReveal = async (key) => {
    if (revealedSecrets[key]) {
      // Hide if already revealed
      setRevealedSecrets((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      return;
    }
    try {
      const res = await api.revealSecret(key);
      if (res.success) {
        setRevealedSecrets((prev) => ({ ...prev, [key]: res.value }));
        // Auto-hide after 30 seconds
        setTimeout(() => {
          setRevealedSecrets((prev) => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        }, 30000);
      }
    } catch (err) {
      logger.error("Failed to reveal secret:", err);
    }
  };

  const handleCopy = async (key) => {
    const value = revealedSecrets[key];
    if (!value) {
      // Reveal first, then copy
      try {
        const res = await api.revealSecret(key);
        if (res.success) {
          await navigator.clipboard.writeText(res.value);
          setCopySuccess(key);
          setTimeout(() => setCopySuccess(null), 2000);
        }
      } catch (err) {
        logger.error("Failed to copy:", err);
      }
    } else {
      await navigator.clipboard.writeText(value);
      setCopySuccess(key);
      setTimeout(() => setCopySuccess(null), 2000);
    }
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
          <MDTypography variant="h4">Secrets Manager</MDTypography>
          <MDButton color="info" onClick={() => setDialogOpen(true)}>
            <Icon sx={{ mr: 1 }}>add</Icon> Add Secret
          </MDButton>
        </MDBox>

        <Card>
          <MDBox p={3}>
            {secrets.length === 0 ? (
              <MDTypography variant="body2" color="text" textAlign="center" py={4}>
                No secrets stored yet. Click &quot;Add Secret&quot; to get started.
              </MDTypography>
            ) : (
              <Grid container spacing={2}>
                {secrets.map((secret) => {
                  const catInfo = getCategoryInfo(secret.category);
                  const isRevealed = !!revealedSecrets[secret.key];
                  const isCopied = copySuccess === secret.key;
                  return (
                    <Grid item xs={12} md={6} key={secret.key}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <MDBox
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <MDBox flex={1} mr={1}>
                            <MDBox display="flex" alignItems="center" gap={1} mb={0.5}>
                              <MDTypography variant="button" fontWeight="bold">
                                {secret.key}
                              </MDTypography>
                              <Chip label={catInfo.label} color={catInfo.color} size="small" />
                            </MDBox>
                            <MDTypography variant="caption" color="text" display="block">
                              {secret.description || "No description"}
                            </MDTypography>
                            <MDBox
                              sx={{
                                mt: 1,
                                p: 1,
                                bgcolor: isRevealed ? "grey.100" : "transparent",
                                borderRadius: 1,
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                                wordBreak: "break-all",
                              }}
                            >
                              {isRevealed ? revealedSecrets[secret.key] : secret.maskedValue}
                            </MDBox>
                          </MDBox>
                          <MDBox display="flex" flexDirection="column" gap={0.5}>
                            <IconButton
                              size="small"
                              color={isRevealed ? "warning" : "info"}
                              onClick={() => handleReveal(secret.key)}
                              title={isRevealed ? "Hide" : "Reveal"}
                            >
                              <Icon>{isRevealed ? "visibility_off" : "visibility"}</Icon>
                            </IconButton>
                            <IconButton
                              size="small"
                              color={isCopied ? "success" : "secondary"}
                              onClick={() => handleCopy(secret.key)}
                              title="Copy to clipboard"
                            >
                              <Icon>{isCopied ? "check" : "content_copy"}</Icon>
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(secret.key)}
                              title="Delete"
                            >
                              <Icon>delete</Icon>
                            </IconButton>
                          </MDBox>
                        </MDBox>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </MDBox>
        </Card>
      </MDBox>

      {/* Add Secret Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Secret</DialogTitle>
        <DialogContent>
          <MDBox pt={2} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Key Name"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              fullWidth
              required
              placeholder="e.g., OPENAI_API_KEY"
            />
            <TextField
              label="Value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              fullWidth
              required
              type="password"
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton color="secondary" onClick={() => setDialogOpen(false)}>
            Cancel
          </MDButton>
          <MDButton
            color="info"
            onClick={handleSave}
            disabled={saving || !formData.key || !formData.value}
          >
            {saving ? <CircularProgress size={20} /> : "Save Secret"}
          </MDButton>
        </DialogActions>
      </Dialog>
      <Footer />
    </DashboardLayout>
  );
}

export default Secrets;
