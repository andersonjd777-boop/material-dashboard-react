/**
 * Shared Drive - Company file storage for DCG employees
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import HomeIcon from "@mui/icons-material/Home";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import api from "services/api";

function SharedDrive() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [playingFile, setPlayingFile] = useState(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Check if file is audio
  const isAudioFile = (filename) => {
    const ext = filename.toLowerCase().split(".").pop();
    return ["wav", "mp3", "ogg", "m4a", "aac"].includes(ext);
  };

  // Check if file can be viewed in browser
  const isViewableInBrowser = (filename) => {
    const ext = filename.toLowerCase().split(".").pop();
    return [
      "pdf",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "svg",
      "webp",
      "txt",
      "html",
      "htm",
      "mp4",
      "webm",
      "mp3",
      "wav",
      "ogg",
    ].includes(ext);
  };

  // Get public URL for voice messages (accessible via nginx)
  const getAudioUrl = (filePath) => {
    // Voice_Messages folder is served publicly via nginx
    if (filePath.startsWith("Voice_Messages/") || filePath.startsWith("voice_messages/")) {
      const filename = filePath.split("/").pop();
      const baseUrl = process.env.REACT_APP_API_URL || "";
      return `${baseUrl}/voice_messages/${filename}`;
    }
    return null;
  };

  // Handle play/pause
  const handlePlayAudio = (file) => {
    const audioUrl = getAudioUrl(file.path);
    if (!audioUrl) {
      alert("Audio playback only available for Voice Messages folder");
      return;
    }

    if (playingFile === file.path) {
      // Pause current
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingFile(null);
    } else {
      // Play new file
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingFile(null);
      audio.onerror = () => {
        alert("Failed to play audio");
        setPlayingFile(null);
      };
      audio.play();
      audioRef.current = audio;
      setPlayingFile(file.path);
    }
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getSharedDriveFiles(currentPath);
      setFiles(response.files || []);
      setFolders(response.folders || []);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
    setLoading(false);
  }, [currentPath]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const formatSize = (bytes) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleFolderClick = (folderPath) => {
    setCurrentPath(folderPath);
  };

  const handleBreadcrumbClick = (path) => {
    setCurrentPath(path);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.createSharedDriveFolder(newFolderName, currentPath);
      setNewFolderOpen(false);
      setNewFolderName("");
      fetchFiles();
    } catch (error) {
      console.error("Failed to create folder:", error);
      alert("Failed to create folder: " + (error.response?.data?.error || error.message));
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadSharedDriveFile(file, currentPath);
      fetchFiles();
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Failed to upload file: " + (error.response?.data?.error || error.message));
    }
    setUploading(false);
    event.target.value = "";
  };

  const handleDownload = async (filePath) => {
    try {
      await api.downloadSharedDriveFile(filePath, false);
    } catch (error) {
      console.error("Failed to download file:", error);
      alert("Failed to download file: " + (error.message || "Unknown error"));
    }
  };

  const handleView = async (filePath) => {
    try {
      await api.downloadSharedDriveFile(filePath, true);
    } catch (error) {
      console.error("Failed to view file:", error);
      alert("Failed to view file: " + (error.message || "Unknown error"));
    }
  };

  const handleDelete = async (path, isFolder) => {
    const confirmMsg = isFolder ? "Delete this folder and all its contents?" : "Delete this file?";
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.deleteSharedDriveItem(path);
      fetchFiles();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete: " + (error.response?.data?.error || error.message));
    }
  };

  const pathParts = currentPath ? currentPath.split("/").filter(Boolean) : [];

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
                bgColor="success"
                borderRadius="lg"
                coloredShadow="success"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDBox display="flex" alignItems="center">
                  <FolderIcon sx={{ mr: 1, color: "white" }} />
                  <MDTypography variant="h6" color="white">
                    Company Shared Drive
                  </MDTypography>
                </MDBox>
                <MDBox>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleUpload}
                  />
                  <MDButton
                    variant="contained"
                    color="white"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <CloudUploadIcon sx={{ mr: 0.5 }} /> {uploading ? "Uploading..." : "Upload"}
                  </MDButton>
                  <MDButton
                    variant="contained"
                    color="white"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => setNewFolderOpen(true)}
                  >
                    <CreateNewFolderIcon sx={{ mr: 0.5 }} /> New Folder
                  </MDButton>
                  <IconButton onClick={fetchFiles}>
                    <RefreshIcon sx={{ color: "white" }} />
                  </IconButton>
                </MDBox>
              </MDBox>
              <MDBox pt={2} px={2}>
                <Breadcrumbs>
                  <Link
                    component="button"
                    underline="hover"
                    color="inherit"
                    onClick={() => handleBreadcrumbClick("")}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <HomeIcon sx={{ mr: 0.5 }} fontSize="small" /> Home
                  </Link>
                  {pathParts.map((part, index) => {
                    const path = pathParts.slice(0, index + 1).join("/");
                    return (
                      <Link
                        key={path}
                        component="button"
                        underline="hover"
                        color="inherit"
                        onClick={() => handleBreadcrumbClick(path)}
                      >
                        {part}
                      </Link>
                    );
                  })}
                </Breadcrumbs>
              </MDBox>
              <MDBox pt={2} px={2} pb={2}>
                {loading ? (
                  <MDTypography variant="body2" color="text" textAlign="center" py={4}>
                    Loading...
                  </MDTypography>
                ) : (
                  <TableContainer sx={{ maxHeight: 500 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell>Modified</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {folders.map((folder) => (
                          <TableRow
                            key={folder.path}
                            hover
                            sx={{ cursor: "pointer" }}
                            onClick={() => handleFolderClick(folder.path)}
                          >
                            <TableCell>
                              <MDBox display="flex" alignItems="center">
                                <FolderIcon sx={{ mr: 1, color: "#ffc107" }} />
                                {folder.name}
                              </MDBox>
                            </TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>{new Date(folder.modified).toLocaleString()}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(folder.path, true);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {files.map((file) => (
                          <TableRow key={file.path} hover>
                            <TableCell>
                              <MDBox display="flex" alignItems="center">
                                {isAudioFile(file.name) ? (
                                  <AudioFileIcon sx={{ mr: 1, color: "#4caf50" }} />
                                ) : (
                                  <InsertDriveFileIcon sx={{ mr: 1, color: "#2196f3" }} />
                                )}
                                {file.name}
                                {playingFile === file.path && (
                                  <MDTypography
                                    variant="caption"
                                    color="success"
                                    sx={{ ml: 1, fontWeight: "bold" }}
                                  >
                                    ▶ Playing
                                  </MDTypography>
                                )}
                              </MDBox>
                            </TableCell>
                            <TableCell>{formatSize(file.size)}</TableCell>
                            <TableCell>{new Date(file.modified).toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {isAudioFile(file.name) && getAudioUrl(file.path) && (
                                <IconButton
                                  size="small"
                                  onClick={() => handlePlayAudio(file)}
                                  sx={{ color: playingFile === file.path ? "#f44336" : "#4caf50" }}
                                >
                                  {playingFile === file.path ? (
                                    <PauseIcon fontSize="small" />
                                  ) : (
                                    <PlayArrowIcon fontSize="small" />
                                  )}
                                </IconButton>
                              )}
                              {isViewableInBrowser(file.name) && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleView(file.path)}
                                  title="View in browser"
                                  sx={{ color: "#2196f3" }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleDownload(file.path)}
                                title="Download file"
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(file.path, false)}
                                title="Delete file"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {folders.length === 0 && files.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <MDTypography variant="body2" color="text">
                                This folder is empty
                              </MDTypography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Dialog open={newFolderOpen} onClose={() => setNewFolderOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setNewFolderOpen(false)}>Cancel</MDButton>
          <MDButton onClick={handleCreateFolder} color="success">
            Create
          </MDButton>
        </DialogActions>
      </Dialog>
      <Footer />
    </DashboardLayout>
  );
}

export default SharedDrive;
