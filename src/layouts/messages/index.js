/**
 * DCG Admin Dashboard - Unified Messages Page
 * Displays all message threads with inbox-style interface
 */

import { useState, useEffect, useRef } from "react";
import {
  Card,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Icon,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import api from "services/api";

function Messages() {
  // State
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // New Thread / Inmate Search State
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [inmateSearch, setInmateSearch] = useState("");
  const [inmateResults, setInmateResults] = useState([]);
  const [searchingInmates, setSearchingInmates] = useState(false);
  const [selectedInmate, setSelectedInmate] = useState(null);
  const [initialMessage, setInitialMessage] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);

  // Dimensions
  const sidebarWidth = "300px";
  const messageListWidth = "calc(100% - 300px)";

  useEffect(() => {
    fetchThreads();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.connection_id);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await api.getMessageThreads();
      setThreads(res.threads || []);
    } catch (err) {
      console.error("Error fetching threads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (connectionId) => {
    try {
      setLoadingMessages(true);
      const res = await api.getThreadMessages(connectionId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.getMessageStats();
      setStats(res.stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    setComposeOpen(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    try {
      setSending(true);
      await api.sendMessage({
        connectionId: selectedThread.connection_id,
        messageType: "text",
        messageContent: newMessage.trim(),
      });
      setNewMessage("");
      await fetchMessages(selectedThread.connection_id);
      await fetchThreads(); // Refresh thread list to update last_message_at
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  const handleUploadAttachment = async () => {
    if (!attachmentFile || !selectedThread) return;

    try {
      setUploading(true);
      // Create a temporary message to attach to
      const tempMessageId = "temp_" + Date.now();
      await api.uploadAttachment(tempMessageId, attachmentFile);
      setAttachmentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert("Attachment uploaded successfully!");
    } catch (err) {
      console.error("Error uploading attachment:", err);
      alert("Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const handleExport = (format) => {
    if (!selectedThread) return;
    api.exportConversation(selectedThread.connection_id, format);
    setExportMenuAnchor(null);
  };

  const handleOpenPreferences = async () => {
    try {
      const res = await api.getNotificationPreferences();
      setPreferences(res.preferences);
      setPreferencesOpen(true);
    } catch (err) {
      console.error("Error loading preferences:", err);
      alert("Failed to load notification preferences");
    }
  };

  const handleSavePreferences = async () => {
    try {
      await api.updateNotificationPreferences(preferences);
      setPreferencesOpen(false);
      alert("Preferences saved successfully!");
    } catch (err) {
      console.error("Error saving preferences:", err);
      alert("Failed to save preferences");
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("Notifications Enabled", {
          body: "You will now receive notifications for new messages",
          icon: "/favicon.ico",
        });
      }
    }
  };

  // Inmate Search with debounce
  useEffect(() => {
    if (!inmateSearch || inmateSearch.length < 2) {
      setInmateResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingInmates(true);
        const res = await api.searchInmates(inmateSearch);
        setInmateResults(res.inmates || []);
      } catch (err) {
        console.error("Error searching inmates:", err);
      } finally {
        setSearchingInmates(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inmateSearch]);

  const handleCreateThread = async () => {
    if (!selectedInmate) return;
    try {
      setCreatingThread(true);
      const res = await api.createMessageThread(
        selectedInmate.booking_number,
        selectedInmate.name,
        selectedInmate.facility,
        initialMessage || null
      );
      if (res.success) {
        await fetchThreads();
        setNewThreadOpen(false);
        setSelectedInmate(null);
        setInmateSearch("");
        setInitialMessage("");
        // Select the new thread
        if (res.connection) {
          setSelectedThread({
            connection_id: res.connection.id,
            inmate_name: res.connection.inmate_name,
            inmate_booking_id: res.connection.inmate_booking_id,
            inmate_facility: res.connection.inmate_facility,
          });
        }
        alert("Thread created successfully!");
      }
    } catch (err) {
      console.error("Error creating thread:", err);
      alert("Failed to create thread: " + (err.response?.data?.error || err.message));
    } finally {
      setCreatingThread(false);
    }
  };

  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.inmate_name?.toLowerCase().includes(query) ||
      thread.inmate_booking_id?.toLowerCase().includes(query) ||
      thread.family_user_name?.toLowerCase().includes(query) ||
      thread.family_user_email?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={2}>
        {/* Stats Row */}
        <MDBox display="flex" gap={2} mb={2}>
          <Card sx={{ flex: 1, p: 2 }}>
            <MDTypography variant="caption" color="text">
              Total Threads
            </MDTypography>
            <MDTypography variant="h4">{stats?.total_threads || 0}</MDTypography>
          </Card>
          <Card sx={{ flex: 1, p: 2 }}>
            <MDTypography variant="caption" color="text">
              Total Messages
            </MDTypography>
            <MDTypography variant="h4">{stats?.total_messages || 0}</MDTypography>
          </Card>
          <Card sx={{ flex: 1, p: 2 }}>
            <MDTypography variant="caption" color="text">
              Unread
            </MDTypography>
            <MDTypography variant="h4" color="error">
              {stats?.unread_messages || 0}
            </MDTypography>
          </Card>
        </MDBox>

        {/* Main Interface */}
        <Box sx={{ display: "flex", height: "calc(100vh - 280px)", gap: 0 }}>
          {/* Sidebar - Thread List */}
          <Card sx={{ width: sidebarWidth, flexShrink: 0, overflow: "hidden" }}>
            <MDBox p={2} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDTypography variant="h6">💬 Messages</MDTypography>
                <MDBox display="flex" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => setNewThreadOpen(true)}
                    title="New Thread"
                  >
                    <Icon fontSize="small">add</Icon>
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleOpenPreferences}
                    title="Notification Settings"
                  >
                    <Icon fontSize="small">settings</Icon>
                  </IconButton>
                </MDBox>
              </MDBox>

              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon fontSize="small">search</Icon>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Thread List */}
              {loading ? (
                <MDBox display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={30} />
                </MDBox>
              ) : filteredThreads.length === 0 ? (
                <MDBox textAlign="center" py={4}>
                  <Icon sx={{ fontSize: 48, color: "grey.400" }}>inbox</Icon>
                  <MDTypography variant="body2" color="text">
                    No threads found
                  </MDTypography>
                </MDBox>
              ) : (
                <List dense sx={{ flex: 1, overflow: "auto" }}>
                  {filteredThreads.map((thread) => (
                    <ListItemButton
                      key={thread.connection_id}
                      selected={selectedThread?.connection_id === thread.connection_id}
                      onClick={() => handleSelectThread(thread)}
                      sx={{ borderBottom: "1px solid #eee", py: 1 }}
                    >
                      <ListItemText
                        primary={
                          <MDBox display="flex" justifyContent="space-between" alignItems="center">
                            <MDTypography
                              variant="button"
                              fontWeight={thread.unread_count > 0 ? "bold" : "regular"}
                              noWrap
                            >
                              {thread.inmate_name || thread.inmate_booking_id}
                            </MDTypography>
                            {thread.unread_count > 0 && (
                              <Chip
                                label={thread.unread_count}
                                color="error"
                                size="small"
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            )}
                          </MDBox>
                        }
                        secondary={
                          <MDBox>
                            <MDTypography variant="caption" color="text" display="block" noWrap>
                              {thread.family_user_name || thread.family_user_email}
                            </MDTypography>
                            <MDTypography
                              variant="caption"
                              color="text"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              {formatTimestamp(thread.last_message_at)}
                            </MDTypography>
                          </MDBox>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </MDBox>
          </Card>

          {/* Message View */}
          <Card sx={{ width: messageListWidth, flexShrink: 0, overflow: "hidden" }}>
            <MDBox p={2} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              {!selectedThread ? (
                <MDBox display="flex" justifyContent="center" alignItems="center" flex={1}>
                  <MDBox textAlign="center">
                    <Icon sx={{ fontSize: 64, color: "grey.300" }}>chat_bubble_outline</Icon>
                    <MDTypography variant="h6" color="text" mt={2}>
                      Select a thread to view messages
                    </MDTypography>
                  </MDBox>
                </MDBox>
              ) : (
                <>
                  {/* Thread Header */}
                  <MDBox
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                    pb={2}
                    sx={{ borderBottom: "2px solid #eee" }}
                  >
                    <MDBox>
                      <MDTypography variant="h6">
                        {selectedThread.inmate_name || selectedThread.inmate_booking_id}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        {selectedThread.inmate_facility} • {selectedThread.family_user_name}
                      </MDTypography>
                    </MDBox>
                    <MDBox display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                        title="Export Conversation"
                      >
                        <Icon fontSize="small">download</Icon>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={fetchMessages.bind(null, selectedThread.connection_id)}
                      >
                        <Icon fontSize="small">
                          {loadingMessages ? "hourglass_empty" : "refresh"}
                        </Icon>
                      </IconButton>
                    </MDBox>
                  </MDBox>

                  {/* Export Menu */}
                  <Menu
                    anchorEl={exportMenuAnchor}
                    open={Boolean(exportMenuAnchor)}
                    onClose={() => setExportMenuAnchor(null)}
                  >
                    <MenuItem onClick={() => handleExport("csv")}>
                      <Icon fontSize="small" sx={{ mr: 1 }}>
                        table_chart
                      </Icon>
                      Export as CSV
                    </MenuItem>
                    <MenuItem onClick={() => handleExport("json")}>
                      <Icon fontSize="small" sx={{ mr: 1 }}>
                        code
                      </Icon>
                      Export as JSON
                    </MenuItem>
                    <MenuItem onClick={() => handleExport("html")}>
                      <Icon fontSize="small" sx={{ mr: 1 }}>
                        print
                      </Icon>
                      Print-Friendly HTML
                    </MenuItem>
                  </Menu>

                  {/* Messages */}
                  {loadingMessages ? (
                    <MDBox display="flex" justifyContent="center" py={4} flex={1}>
                      <CircularProgress size={30} />
                    </MDBox>
                  ) : messages.length === 0 ? (
                    <MDBox textAlign="center" py={4} flex={1}>
                      <Icon sx={{ fontSize: 48, color: "grey.400" }}>mail_outline</Icon>
                      <MDTypography variant="body2" color="text">
                        No messages yet
                      </MDTypography>
                    </MDBox>
                  ) : (
                    <MDBox flex={1} sx={{ overflow: "auto", mb: 2 }}>
                      {messages.map((msg) => (
                        <MDBox
                          key={msg.id}
                          display="flex"
                          justifyContent={msg.direction === "outbound" ? "flex-end" : "flex-start"}
                          mb={1}
                        >
                          <MDBox
                            sx={{
                              maxWidth: "70%",
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: msg.direction === "outbound" ? "info.main" : "grey.200",
                              color: msg.direction === "outbound" ? "white" : "text.primary",
                            }}
                          >
                            {msg.message_type === "voice" && msg.audio_url ? (
                              <MDBox>
                                <MDTypography variant="caption" display="block" mb={0.5}>
                                  🎤 Voice Message ({msg.audio_duration}s)
                                </MDTypography>
                                <audio
                                  controls
                                  style={{ width: "100%", maxWidth: "300px" }}
                                  src={msg.audio_url}
                                >
                                  Your browser does not support audio playback.
                                </audio>
                              </MDBox>
                            ) : (
                              <MDTypography variant="body2">{msg.message_content}</MDTypography>
                            )}
                            <MDTypography
                              variant="caption"
                              sx={{ fontSize: "0.65rem", opacity: 0.8, display: "block", mt: 0.5 }}
                            >
                              {formatTimestamp(msg.sent_at)}
                            </MDTypography>
                          </MDBox>
                        </MDBox>
                      ))}
                      <div ref={messagesEndRef} />
                    </MDBox>
                  )}

                  {/* Compose */}
                  <MDBox pt={2} sx={{ borderTop: "2px solid #eee" }}>
                    {attachmentFile && (
                      <MDBox
                        display="flex"
                        alignItems="center"
                        gap={1}
                        mb={1}
                        p={1}
                        bgcolor="grey.100"
                        borderRadius={1}
                      >
                        <Icon fontSize="small">attach_file</Icon>
                        <MDTypography variant="caption" flex={1}>
                          {attachmentFile.name}
                        </MDTypography>
                        <IconButton size="small" onClick={() => setAttachmentFile(null)}>
                          <Icon fontSize="small">close</Icon>
                        </IconButton>
                      </MDBox>
                    )}
                    <MDBox display="flex" gap={1}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                      />
                      <IconButton
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending || uploading}
                        title="Attach File"
                      >
                        <Icon fontSize="small">attach_file</Icon>
                      </IconButton>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        multiline
                        maxRows={3}
                        disabled={sending}
                      />
                      <MDButton
                        variant="gradient"
                        color="info"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        sx={{ minWidth: "80px" }}
                      >
                        {sending ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <Icon>send</Icon>
                        )}
                      </MDButton>
                    </MDBox>
                  </MDBox>
                </>
              )}
            </MDBox>
          </Card>
        </Box>

        {/* New Thread Dialog */}
        <Dialog
          open={newThreadOpen}
          onClose={() => setNewThreadOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <MDBox display="flex" alignItems="center" gap={1}>
              <Icon color="info">person_add</Icon>
              Start New Conversation
            </MDBox>
          </DialogTitle>
          <DialogContent>
            <MDBox display="flex" flexDirection="column" gap={2} pt={1}>
              <MDTypography variant="body2" color="text">
                Search for an inmate by booking number or name to start a new message thread.
              </MDTypography>

              <TextField
                fullWidth
                label="Search Inmate (Booking # or Name)"
                value={inmateSearch}
                onChange={(e) => setInmateSearch(e.target.value)}
                placeholder="Enter booking number or name..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon fontSize="small">search</Icon>
                    </InputAdornment>
                  ),
                  endAdornment: searchingInmates && (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Search Results */}
              {inmateResults.length > 0 && !selectedInmate && (
                <MDBox
                  sx={{
                    maxHeight: 200,
                    overflow: "auto",
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                  }}
                >
                  <List dense>
                    {inmateResults.map((inmate) => (
                      <ListItemButton
                        key={inmate.booking_number}
                        onClick={() => {
                          setSelectedInmate(inmate);
                          setInmateSearch(inmate.booking_number);
                        }}
                      >
                        <ListItemText
                          primary={inmate.name || inmate.booking_number}
                          secondary={`Booking: ${inmate.booking_number} • ${
                            inmate.facility || "Unknown Facility"
                          }`}
                        />
                        <Chip
                          label={inmate.status}
                          size="small"
                          color={inmate.status === "active" ? "success" : "default"}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </MDBox>
              )}

              {/* Selected Inmate */}
              {selectedInmate && (
                <MDBox p={2} bgcolor="success.light" borderRadius={1}>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center">
                    <MDBox>
                      <MDTypography variant="button" fontWeight="medium">
                        {selectedInmate.name || selectedInmate.booking_number}
                      </MDTypography>
                      <MDTypography variant="caption" display="block" color="text">
                        Booking: {selectedInmate.booking_number} • {selectedInmate.facility}
                      </MDTypography>
                    </MDBox>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedInmate(null);
                        setInmateSearch("");
                      }}
                    >
                      <Icon fontSize="small">close</Icon>
                    </IconButton>
                  </MDBox>
                </MDBox>
              )}

              {/* Initial Message (Optional) */}
              {selectedInmate && (
                <TextField
                  fullWidth
                  label="Initial Message (Optional)"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Type your first message..."
                  multiline
                  rows={3}
                />
              )}
            </MDBox>
          </DialogContent>
          <DialogActions>
            <MDButton
              onClick={() => {
                setNewThreadOpen(false);
                setSelectedInmate(null);
                setInmateSearch("");
                setInitialMessage("");
              }}
              color="secondary"
            >
              Cancel
            </MDButton>
            <MDButton
              onClick={handleCreateThread}
              variant="gradient"
              color="info"
              disabled={!selectedInmate || creatingThread}
            >
              {creatingThread ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Start Conversation"
              )}
            </MDButton>
          </DialogActions>
        </Dialog>

        {/* Notification Preferences Dialog */}
        <Dialog
          open={preferencesOpen}
          onClose={() => setPreferencesOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogContent>
            {preferences && (
              <MDBox display="flex" flexDirection="column" gap={2} pt={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.email_enabled}
                      onChange={(e) =>
                        setPreferences({ ...preferences, email_enabled: e.target.checked })
                      }
                    />
                  }
                  label="Email Notifications"
                />

                {preferences.email_enabled && (
                  <FormControl fullWidth size="small">
                    <InputLabel>Email Frequency</InputLabel>
                    <Select
                      value={preferences.email_frequency || "immediate"}
                      onChange={(e) =>
                        setPreferences({ ...preferences, email_frequency: e.target.value })
                      }
                      label="Email Frequency"
                    >
                      <MenuItem value="immediate">Immediate</MenuItem>
                      <MenuItem value="hourly">Hourly Digest</MenuItem>
                      <MenuItem value="daily">Daily Digest</MenuItem>
                      <MenuItem value="disabled">Disabled</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.sms_enabled}
                      onChange={(e) =>
                        setPreferences({ ...preferences, sms_enabled: e.target.checked })
                      }
                    />
                  }
                  label="SMS Notifications"
                />

                {preferences.sms_enabled && (
                  <FormControl fullWidth size="small">
                    <InputLabel>SMS Frequency</InputLabel>
                    <Select
                      value={preferences.sms_frequency || "immediate"}
                      onChange={(e) =>
                        setPreferences({ ...preferences, sms_frequency: e.target.value })
                      }
                      label="SMS Frequency"
                    >
                      <MenuItem value="immediate">Immediate</MenuItem>
                      <MenuItem value="hourly">Hourly Digest</MenuItem>
                      <MenuItem value="daily">Daily Digest</MenuItem>
                      <MenuItem value="disabled">Disabled</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.browser_enabled}
                      onChange={(e) =>
                        setPreferences({ ...preferences, browser_enabled: e.target.checked })
                      }
                    />
                  }
                  label="Browser Push Notifications"
                />

                {preferences.browser_enabled && Notification.permission !== "granted" && (
                  <MDButton
                    variant="outlined"
                    color="info"
                    size="small"
                    onClick={requestNotificationPermission}
                  >
                    Enable Browser Notifications
                  </MDButton>
                )}

                <MDBox display="flex" gap={2}>
                  <TextField
                    label="Quiet Hours Start"
                    type="time"
                    size="small"
                    value={preferences.quiet_hours_start || ""}
                    onChange={(e) =>
                      setPreferences({ ...preferences, quiet_hours_start: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="Quiet Hours End"
                    type="time"
                    size="small"
                    value={preferences.quiet_hours_end || ""}
                    onChange={(e) =>
                      setPreferences({ ...preferences, quiet_hours_end: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </MDBox>
                <MDTypography variant="caption" color="text">
                  During quiet hours, you won&apos;t receive notifications
                </MDTypography>
              </MDBox>
            )}
          </DialogContent>
          <DialogActions>
            <MDButton onClick={() => setPreferencesOpen(false)} color="secondary">
              Cancel
            </MDButton>
            <MDButton onClick={handleSavePreferences} variant="gradient" color="info">
              Save Preferences
            </MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
    </DashboardLayout>
  );
}

export default Messages;
