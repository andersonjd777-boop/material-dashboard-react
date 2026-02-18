/**
 * Voice Messages - View and manage voice messages sent through DCG phone system
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import VoicemailIcon from "@mui/icons-material/Voicemail";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import api from "services/api";
import logger from "services/logger";

function VoiceMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [daysFilter, setDaysFilter] = useState("7");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [stats, setStats] = useState(null);
  const audioRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getVoiceMessages({ days: daysFilter });
      setMessages(response?.messages || []);
    } catch (error) {
      logger.error("Failed to fetch voice messages:", error);
    }
    setLoading(false);
  }, [daysFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.getVoiceMessageStats();
      setStats(response?.stats || null);
    } catch (error) {
      logger.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [fetchMessages, fetchStats]);

  const handlePlayAudio = (message) => {
    if (!message.audio_url) {
      alert("Audio file not available");
      return;
    }
    if (playingId === message.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(message.audio_url);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        alert("Failed to play audio");
        setPlayingId(null);
      };
      audio.play();
      audioRef.current = audio;
      setPlayingId(message.id);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatPhone = (phone) => {
    if (!phone) return "-";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("1")) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (msg.inmate_name && msg.inmate_name.toLowerCase().includes(q)) ||
      (msg.booking_number && msg.booking_number.includes(q)) ||
      (msg.recipient_number && msg.recipient_number.includes(q)) ||
      (msg.facility && msg.facility.toLowerCase().includes(q)) ||
      (msg.transcription && msg.transcription.toLowerCase().includes(q))
    );
  });

  const filterButtons = [
    { value: "1", label: "Today" },
    { value: "3", label: "3 Days" },
    { value: "7", label: "7 Days" },
    { value: "14", label: "14 Days" },
    { value: "30", label: "30 Days" },
  ];

  const getDeliveryChip = (method, status) => {
    const colors = { voicemail: "info", sms: "success", email: "warning" };
    const statusColor = status === "sent" ? "success" : status === "failed" ? "error" : "default";
    return (
      <MDBox display="flex" gap={0.5}>
        <Chip label={method || "?"} size="small" color={colors[method] || "default"} />
        <Chip label={status || "pending"} size="small" color={statusColor} variant="outlined" />
      </MDBox>
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          {/* Stats Cards */}
          {stats && (
            <Grid item xs={12}>
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Card>
                    <MDBox p={2} textAlign="center">
                      <MDTypography variant="h4" color="info">
                        {stats.total_messages}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Total Messages (30d)
                      </MDTypography>
                    </MDBox>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <MDBox p={2} textAlign="center">
                      <MDTypography variant="h4" color="success">
                        {stats.total_sent}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Delivered
                      </MDTypography>
                    </MDBox>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <MDBox p={2} textAlign="center">
                      <MDTypography variant="h4" color="warning">
                        {stats.by_delivery_method?.voicemail || 0}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Voicemail
                      </MDTypography>
                    </MDBox>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <MDBox p={2} textAlign="center">
                      <MDTypography variant="h4" color="secondary">
                        {formatDuration(stats.avg_duration_seconds)}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Avg Duration
                      </MDTypography>
                    </MDBox>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Main Table */}
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="primary"
                borderRadius="lg"
                coloredShadow="primary"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                <MDBox display="flex" alignItems="center">
                  <VoicemailIcon sx={{ mr: 1, color: "white" }} />
                  <MDTypography variant="h6" color="white">
                    Voice Messages
                  </MDTypography>
                </MDBox>
                <MDBox display="flex" alignItems="center" flexWrap="wrap" gap={0.5}>
                  {filterButtons.map((btn) => (
                    <MDButton
                      key={btn.value}
                      variant={daysFilter === btn.value ? "contained" : "outlined"}
                      color="white"
                      size="small"
                      onClick={() => setDaysFilter(btn.value)}
                    >
                      {btn.label}
                    </MDButton>
                  ))}
                  <IconButton onClick={fetchMessages}>
                    <RefreshIcon sx={{ color: "white" }} />
                  </IconButton>
                </MDBox>
              </MDBox>

              {/* Search Bar */}
              <MDBox px={2} pt={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, booking #, phone, facility, or transcription..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </MDBox>

              <MDBox pt={2} px={2} pb={2}>
                {loading && messages.length === 0 ? (
                  <MDTypography variant="body2" color="text" textAlign="center" py={4}>
                    Loading voice messages...
                  </MDTypography>
                ) : filteredMessages.length === 0 ? (
                  <MDTypography variant="body2" color="text" textAlign="center" py={4}>
                    No voice messages found.
                  </MDTypography>
                ) : (
                  <MDBox sx={{ overflowX: "auto" }}>
                    {/* Header Row */}
                    <MDBox
                      display="flex"
                      sx={{ borderBottom: "2px solid #e0e0e0", pb: 1, mb: 1, minWidth: "900px" }}
                    >
                      <MDBox flex="2" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Date/Time
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="2" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Sender
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="1.5" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Booking #
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="2" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Recipient
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="1" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Duration
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="2" px={1}>
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Delivery
                        </MDTypography>
                      </MDBox>
                      <MDBox flex="1" px={1} textAlign="center">
                        <MDTypography variant="caption" fontWeight="bold" color="text">
                          Actions
                        </MDTypography>
                      </MDBox>
                    </MDBox>

                    {/* Data Rows */}
                    {filteredMessages.map((msg, index) => (
                      <MDBox
                        key={msg.id || index}
                        display="flex"
                        sx={{
                          py: 1,
                          borderBottom: "1px solid #f0f0f0",
                          minWidth: "900px",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                        }}
                      >
                        <MDBox flex="2" px={1}>
                          <MDTypography variant="body2" color="text">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : "-"}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="2" px={1}>
                          <MDTypography variant="body2" color="text" fontWeight="medium">
                            {msg.inmate_name || "Unknown"}
                          </MDTypography>
                          <MDTypography variant="caption" color="text">
                            {msg.facility || ""}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="1.5" px={1}>
                          <MDTypography variant="body2" color="text">
                            {msg.booking_number || "-"}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="2" px={1}>
                          <MDTypography variant="body2" color="text">
                            {formatPhone(msg.recipient_number)}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="1" px={1}>
                          <MDTypography variant="body2" color="text">
                            {formatDuration(msg.duration_seconds)}
                          </MDTypography>
                        </MDBox>
                        <MDBox flex="2" px={1}>
                          {getDeliveryChip(msg.delivery_method, msg.delivery_status)}
                        </MDBox>
                        <MDBox flex="1" px={1} display="flex" justifyContent="center" gap={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => handlePlayAudio(msg)}
                            disabled={!msg.audio_url}
                            sx={{ color: playingId === msg.id ? "#f44336" : "#4caf50" }}
                          >
                            {playingId === msg.id ? (
                              <PauseIcon fontSize="small" />
                            ) : (
                              <PlayArrowIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton size="small" onClick={() => setSelectedMessage(msg)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </MDBox>
                      </MDBox>
                    ))}
                  </MDBox>
                )}
                <MDBox mt={2}>
                  <MDTypography variant="caption" color="text">
                    Showing {filteredMessages.length} of {messages.length} messages
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Message Detail Dialog */}
      <Dialog
        open={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <MDBox display="flex" alignItems="center" gap={1}>
            <VoicemailIcon color="primary" />
            Voice Message Details
          </MDBox>
        </DialogTitle>
        <DialogContent dividers>
          {selectedMessage && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <MDTypography variant="caption" color="text">
                  Sender
                </MDTypography>
                <MDTypography variant="body1">
                  {selectedMessage.inmate_name || "Unknown"}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="caption" color="text">
                  Facility
                </MDTypography>
                <MDTypography variant="body1">{selectedMessage.facility || "-"}</MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="caption" color="text">
                  Booking Number
                </MDTypography>
                <MDTypography variant="body1">{selectedMessage.booking_number || "-"}</MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="caption" color="text">
                  Recipient
                </MDTypography>
                <MDTypography variant="body1">
                  {formatPhone(selectedMessage.recipient_number)}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="caption" color="text">
                  Date/Time
                </MDTypography>
                <MDTypography variant="body1">
                  {selectedMessage.timestamp
                    ? new Date(selectedMessage.timestamp).toLocaleString()
                    : "-"}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="caption" color="text">
                  Duration
                </MDTypography>
                <MDTypography variant="body1">
                  {formatDuration(selectedMessage.duration_seconds)}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="caption" color="text">
                  Delivery Method
                </MDTypography>
                <MDTypography variant="body1">
                  {selectedMessage.delivery_method || "-"}
                </MDTypography>
              </Grid>
              <Grid item xs={6}>
                <MDTypography variant="caption" color="text">
                  Delivery Status
                </MDTypography>
                <Chip
                  label={selectedMessage.delivery_status || "pending"}
                  color={selectedMessage.delivery_status === "sent" ? "success" : "default"}
                  size="small"
                />
              </Grid>
              {selectedMessage.audio_url && (
                <Grid item xs={12}>
                  <MDTypography variant="caption" color="text">
                    Audio Playback
                  </MDTypography>
                  <MDBox mt={1}>
                    <audio controls style={{ width: "100%" }} src={selectedMessage.audio_url}>
                      Your browser does not support audio playback.
                    </audio>
                  </MDBox>
                </Grid>
              )}
              {selectedMessage.transcription && (
                <Grid item xs={12}>
                  <MDTypography variant="caption" color="text">
                    Transcription
                  </MDTypography>
                  <MDBox
                    mt={1}
                    p={2}
                    sx={{ bgcolor: "#f5f5f5", borderRadius: 1, maxHeight: 200, overflow: "auto" }}
                  >
                    <MDTypography variant="body2">{selectedMessage.transcription}</MDTypography>
                  </MDBox>
                </Grid>
              )}
              {selectedMessage.twilio_call_sid && (
                <Grid item xs={12}>
                  <MDTypography variant="caption" color="text">
                    Twilio Call SID
                  </MDTypography>
                  <MDTypography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {selectedMessage.twilio_call_sid}
                  </MDTypography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setSelectedMessage(null)}>Close</MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default VoiceMessages;
