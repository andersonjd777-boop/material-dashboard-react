/**
 * DCG Admin Dashboard - Work Email Hub
 * IMAP/SMTP email access with role-based inbox permissions
 */

import { useState, useEffect, useCallback, useRef } from "react";
import DOMPurify from "dompurify";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Pagination from "@mui/material/Pagination";
import Box from "@mui/material/Box";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import api from "services/api";

function EmailHub() {
  // State
  const [inboxes, setInboxes] = useState({ shared: [], personal: null });
  const [selectedInbox, setSelectedInbox] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [page, setPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Auto-reply state
  const [generatingReply, setGeneratingReply] = useState(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [retryNotes, setRetryNotes] = useState("");
  const [currentContextId, setCurrentContextId] = useState(null);

  // Resizable panel widths
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [listWidth, setListWidth] = useState(400);
  const containerRef = useRef(null);

  const messagesPerPage = 25;

  // Fetch accessible inboxes on mount
  useEffect(() => {
    fetchInboxes();
  }, []);

  useEffect(() => {
    if (selectedInbox) {
      fetchMessages();
      fetchFolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInbox, selectedFolder, page]);

  const fetchInboxes = async () => {
    try {
      setLoading(true);
      const res = await api.getEmailInboxes();
      setInboxes(res.inboxes || { shared: [], personal: null });
      // Auto-select first available inbox
      const firstInbox = res.inboxes?.personal || res.inboxes?.shared?.[0];
      if (firstInbox) {
        setSelectedInbox(firstInbox);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedInbox) return;
    try {
      setLoadingMessages(true);
      const res = await api.getEmailMessages(selectedInbox, selectedFolder, messagesPerPage, page);
      // API returns { messages: { messages: [...], total: N } }
      const msgData = res.messages || {};
      setMessages(Array.isArray(msgData) ? msgData : msgData.messages || []);
      setTotalMessages(msgData.total || res.total || 0);
    } catch (err) {
      setError(err.message);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchFolders = async () => {
    if (!selectedInbox) return;
    try {
      const res = await api.getEmailFolders(selectedInbox);
      setFolders(res.folders || []);
    } catch (err) {
      console.error("Error fetching folders:", err);
    }
  };

  const handleSelectMessage = async (msg) => {
    try {
      const res = await api.getEmailMessage(msg.uid, selectedInbox, selectedFolder);
      setSelectedMessage(res.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject) return;
    try {
      setSending(true);

      // Save the final response for learning if this was an AI-generated reply
      if (currentContextId && composeBody) {
        try {
          await api.saveFinalResponse(currentContextId, composeBody);
        } catch (err) {
          console.error("Failed to save final response:", err);
        }
      }

      await api.sendEmail({
        from: selectedInbox,
        to: composeTo,
        cc: composeCc,
        subject: composeSubject,
        text: composeBody,
      });
      setComposeOpen(false);
      resetCompose();
      // Refresh messages if in Sent folder
      if (selectedFolder.toLowerCase().includes("sent")) {
        fetchMessages();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const resetCompose = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeSubject("");
    setComposeBody("");
    setCurrentContextId(null);
  };

  const handleAutoReply = async (contextNotes = null) => {
    if (!selectedMessage) return;

    try {
      setGeneratingReply(true);
      setError(null);

      const res = await api.generateAutoReply(
        selectedMessage.uid,
        selectedInbox,
        selectedFolder,
        contextNotes
      );

      if (res.success) {
        // Populate compose dialog with AI-generated response
        setComposeTo(selectedMessage.from);
        setComposeSubject(`Re: ${selectedMessage.subject}`);
        setComposeBody(res.response);
        setCurrentContextId(res.contextId);
        setComposeOpen(true);
        setRetryDialogOpen(false);
        setRetryNotes("");
      } else {
        setError(res.error || "Failed to generate response");
      }
    } catch (err) {
      setError(err.message || "Failed to generate response");
    } finally {
      setGeneratingReply(false);
    }
  };

  const handleRetryWithContext = () => {
    setRetryDialogOpen(true);
  };

  const handleRetrySubmit = () => {
    handleAutoReply(retryNotes);
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setComposeTo(selectedMessage.from);
    setComposeSubject(`Re: ${selectedMessage.subject}`);
    setComposeBody(`\n\n--- Original Message ---\n${selectedMessage.text || ""}`);
    setComposeOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString();
  };

  const getInboxDisplayName = (inbox) => {
    if (!inbox) return "";
    const parts = inbox.split("@")[0];
    return parts.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Resize handlers
  const handleSidebarResize = useCallback(
    (e) => {
      const startX = e.clientX;
      const startWidth = sidebarWidth;
      const onMouseMove = (moveEvent) => {
        const newWidth = Math.max(180, Math.min(400, startWidth + moveEvent.clientX - startX));
        setSidebarWidth(newWidth);
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [sidebarWidth]
  );

  const handleListResize = useCallback(
    (e) => {
      const startX = e.clientX;
      const startWidth = listWidth;
      const onMouseMove = (moveEvent) => {
        const newWidth = Math.max(250, Math.min(600, startWidth + moveEvent.clientX - startX));
        setListWidth(newWidth);
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [listWidth]
  );

  // Resize handle style
  const resizeHandleStyle = {
    width: "6px",
    cursor: "col-resize",
    backgroundColor: "transparent",
    "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
    transition: "background-color 0.2s",
    flexShrink: 0,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress color="info" />
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={2} ref={containerRef}>
        <Box sx={{ display: "flex", height: "calc(100vh - 180px)", gap: 0 }}>
          {/* Sidebar - Inboxes & Folders */}
          <Card sx={{ width: sidebarWidth, flexShrink: 0, overflow: "hidden" }}>
            <MDBox p={2} sx={{ height: "100%", overflow: "auto" }}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDTypography variant="h6">📧 Email</MDTypography>
                <MDButton
                  variant="gradient"
                  color="info"
                  size="small"
                  onClick={() => setComposeOpen(true)}
                  disabled={!selectedInbox}
                >
                  <Icon>edit</Icon>
                </MDButton>
              </MDBox>
              <MDTypography variant="caption" color="text" fontWeight="bold" display="block">
                INBOXES
              </MDTypography>
              <List dense>
                {inboxes.personal && (
                  <ListItemButton
                    selected={selectedInbox === inboxes.personal}
                    onClick={() => {
                      setSelectedInbox(inboxes.personal);
                      setPage(1);
                    }}
                  >
                    <ListItemIcon>
                      <Icon color="primary">person</Icon>
                    </ListItemIcon>
                    <ListItemText
                      primary={getInboxDisplayName(inboxes.personal)}
                      secondary="Personal"
                    />
                  </ListItemButton>
                )}
                {inboxes.shared.map((inbox) => (
                  <ListItemButton
                    key={inbox}
                    selected={selectedInbox === inbox}
                    onClick={() => {
                      setSelectedInbox(inbox);
                      setPage(1);
                    }}
                  >
                    <ListItemIcon>
                      <Icon color="secondary">group</Icon>
                    </ListItemIcon>
                    <ListItemText primary={getInboxDisplayName(inbox)} secondary="Shared" />
                  </ListItemButton>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <MDTypography variant="caption" color="text" fontWeight="bold" display="block">
                FOLDERS
              </MDTypography>
              <List dense>
                {folders.length === 0 ? (
                  <ListItem>
                    <ListItemText secondary="Select inbox" />
                  </ListItem>
                ) : (
                  folders.slice(0, 10).map((folder) => (
                    <ListItemButton
                      key={folder.name}
                      selected={selectedFolder === folder.name}
                      onClick={() => {
                        setSelectedFolder(folder.name);
                        setPage(1);
                      }}
                    >
                      <ListItemIcon>
                        <Icon>
                          {folder.name.toLowerCase().includes("sent")
                            ? "send"
                            : folder.name.toLowerCase().includes("trash")
                            ? "delete"
                            : "folder"}
                        </Icon>
                      </ListItemIcon>
                      <ListItemText primary={folder.name} />
                    </ListItemButton>
                  ))
                )}
              </List>
            </MDBox>
          </Card>

          {/* Resize Handle 1 */}
          <Box sx={resizeHandleStyle} onMouseDown={handleSidebarResize} />

          {/* Message List */}
          <Card sx={{ width: listWidth, flexShrink: 0, overflow: "hidden" }}>
            <MDBox p={2} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <MDTypography variant="button" fontWeight="bold">
                  {selectedInbox ? getInboxDisplayName(selectedInbox) : "Select"} / {selectedFolder}
                </MDTypography>
                <IconButton size="small" onClick={fetchMessages} disabled={loadingMessages}>
                  <Icon fontSize="small">{loadingMessages ? "hourglass_empty" : "refresh"}</Icon>
                </IconButton>
              </MDBox>
              {loadingMessages ? (
                <MDBox display="flex" justifyContent="center" py={4} flex={1}>
                  <CircularProgress size={30} />
                </MDBox>
              ) : messages.length === 0 ? (
                <MDBox textAlign="center" py={4} flex={1}>
                  <Icon sx={{ fontSize: 48, color: "grey.400" }}>mail_outline</Icon>
                  <MDTypography variant="body2" color="text">
                    No messages
                  </MDTypography>
                </MDBox>
              ) : (
                <>
                  <List dense sx={{ flex: 1, overflow: "auto" }}>
                    {messages.map((msg) => (
                      <ListItemButton
                        key={msg.uid}
                        selected={selectedMessage?.uid === msg.uid}
                        onClick={() => handleSelectMessage(msg)}
                        sx={{ borderBottom: "1px solid #eee", py: 0.5 }}
                      >
                        <ListItemText
                          primary={
                            <MDTypography
                              variant="button"
                              fontWeight={msg.flags?.includes("\\Seen") ? "regular" : "bold"}
                              noWrap
                            >
                              {msg.subject || "(No Subject)"}
                            </MDTypography>
                          }
                          secondary={
                            <MDBox display="flex" justifyContent="space-between">
                              <MDTypography variant="caption" noWrap sx={{ maxWidth: "60%" }}>
                                {msg.from}
                              </MDTypography>
                              <MDTypography variant="caption">{formatDate(msg.date)}</MDTypography>
                            </MDBox>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                  <MDBox display="flex" justifyContent="center" pt={1}>
                    <Pagination
                      count={Math.ceil(totalMessages / messagesPerPage)}
                      page={page}
                      onChange={(e, p) => setPage(p)}
                      color="primary"
                      size="small"
                    />
                  </MDBox>
                </>
              )}
            </MDBox>
          </Card>

          {/* Resize Handle 2 */}
          <Box sx={resizeHandleStyle} onMouseDown={handleListResize} />

          {/* Message Detail */}
          <Card sx={{ flex: 1, overflow: "hidden", minWidth: 300 }}>
            <MDBox p={2} sx={{ height: "100%", overflow: "auto" }}>
              {selectedMessage ? (
                <>
                  <MDBox
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <MDBox flex={1} mr={1}>
                      <MDTypography variant="h6">{selectedMessage.subject}</MDTypography>
                      <MDTypography variant="caption" color="text">
                        From: {selectedMessage.from}
                      </MDTypography>
                      <br />
                      <MDTypography variant="caption" color="text">
                        To: {selectedMessage.to}
                      </MDTypography>
                      {selectedMessage.cc && (
                        <>
                          <br />
                          <MDTypography variant="caption" color="text">
                            Cc: {selectedMessage.cc}
                          </MDTypography>
                        </>
                      )}
                      <br />
                      <MDTypography variant="caption" color="text">
                        {new Date(selectedMessage.date).toLocaleString()}
                      </MDTypography>
                    </MDBox>
                    <MDBox display="flex" gap={1}>
                      <MDButton
                        variant="gradient"
                        color="success"
                        size="small"
                        onClick={() => handleAutoReply()}
                        disabled={generatingReply}
                        startIcon={
                          generatingReply ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <Icon>auto_awesome</Icon>
                          )
                        }
                      >
                        {generatingReply ? "Generating..." : "Auto-Reply"}
                      </MDButton>
                      {currentContextId && (
                        <MDButton
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={handleRetryWithContext}
                          disabled={generatingReply}
                        >
                          Retry
                        </MDButton>
                      )}
                      <IconButton size="small" onClick={handleReply} title="Manual Reply">
                        <Icon>reply</Icon>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedMessage(null)}
                        title="Close"
                      >
                        <Icon>close</Icon>
                      </IconButton>
                    </MDBox>
                  </MDBox>
                  {selectedMessage.attachments?.length > 0 && (
                    <MDBox mb={2}>
                      {selectedMessage.attachments.map((att, i) => (
                        <Chip
                          key={i}
                          icon={<Icon>attachment</Icon>}
                          label={`${att.filename} (${Math.round(att.size / 1024)}KB)`}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </MDBox>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <MDBox sx={{ "& img": { maxWidth: "100%" } }}>
                    {selectedMessage.html ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(selectedMessage.html, {
                            ALLOWED_TAGS: [
                              "p",
                              "br",
                              "b",
                              "i",
                              "em",
                              "strong",
                              "a",
                              "ul",
                              "ol",
                              "li",
                              "h1",
                              "h2",
                              "h3",
                              "h4",
                              "h5",
                              "h6",
                              "blockquote",
                              "pre",
                              "code",
                              "span",
                              "div",
                              "table",
                              "thead",
                              "tbody",
                              "tr",
                              "td",
                              "th",
                              "img",
                              "hr",
                            ],
                            ALLOWED_ATTR: [
                              "href",
                              "src",
                              "alt",
                              "title",
                              "class",
                              "style",
                              "target",
                              "rel",
                              "width",
                              "height",
                              "colspan",
                              "rowspan",
                            ],
                            ALLOW_DATA_ATTR: false,
                          }),
                        }}
                      />
                    ) : (
                      <MDTypography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {selectedMessage.text}
                      </MDTypography>
                    )}
                  </MDBox>
                </>
              ) : (
                <MDBox
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                >
                  <Icon sx={{ fontSize: 64, color: "grey.300" }}>email</Icon>
                  <MDTypography variant="body2" color="text" mt={2}>
                    Select an email to read
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
          </Card>
        </Box>

        {/* Error Display */}
        {error && (
          <MDBox mt={2}>
            <Card sx={{ bgcolor: "error.light", p: 2 }}>
              <MDTypography variant="body2" color="white">
                <Icon>error</Icon> {error}
              </MDTypography>
              <MDButton size="small" color="white" onClick={() => setError(null)}>
                Dismiss
              </MDButton>
            </Card>
          </MDBox>
        )}
      </MDBox>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <MDBox display="flex" justifyContent="space-between" alignItems="center">
            <MDTypography variant="h6">New Email</MDTypography>
            <Chip label={`From: ${selectedInbox}`} size="small" color="info" />
          </MDBox>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="To"
            value={composeTo}
            onChange={(e) => setComposeTo(e.target.value)}
            margin="normal"
            placeholder="recipient@example.com"
          />
          <TextField
            fullWidth
            label="Cc"
            value={composeCc}
            onChange={(e) => setComposeCc(e.target.value)}
            margin="normal"
            placeholder="cc@example.com (optional)"
          />
          <TextField
            fullWidth
            label="Subject"
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Message"
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            margin="normal"
            multiline
            rows={10}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setComposeOpen(false)} color="secondary">
            Cancel
          </MDButton>
          <MDButton
            onClick={handleSendEmail}
            color="info"
            disabled={sending || !composeTo || !composeSubject}
          >
            {sending ? <CircularProgress size={20} color="inherit" /> : "Send"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Retry with Context Dialog */}
      <Dialog
        open={retryDialogOpen}
        onClose={() => setRetryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <MDTypography variant="h6">Retry with Additional Context</MDTypography>
        </DialogTitle>
        <DialogContent>
          <MDTypography variant="body2" color="text" mb={2}>
            Provide additional context or instructions to help generate a better response:
          </MDTypography>
          <TextField
            fullWidth
            label="Context Notes"
            value={retryNotes}
            onChange={(e) => setRetryNotes(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            placeholder="e.g., 'Be more formal', 'Include pricing details', 'Mention our trial period', etc."
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setRetryDialogOpen(false)} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleRetrySubmit} color="info" disabled={generatingReply}>
            {generatingReply ? <CircularProgress size={20} color="inherit" /> : "Generate"}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default EmailHub;
