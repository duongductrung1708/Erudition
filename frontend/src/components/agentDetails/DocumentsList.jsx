import React from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { delete_document } from "../../services/document";
import { useAuth } from "../../hooks/AuthProvider";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const DocumentsList = ({
  documents,
  setLoading,
  chatbotId,
  fetchChatbotData,
  handleClickViewDocument,
  handleQAViewItemClick,
  isViewOnly,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!documents || documents.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No documents yet.
      </Typography>
    );
  }

  const handleDeleteDoc = async (doc) => {
    if (["Uploading", "Processing", "Deleting"].includes(doc.status)) {
      toast.warn("Document is still processing, please wait.");
      return;
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );
    if (!confirmDelete) {
      return;
    }

    const token = user?.accessToken;
    if (!token) {
      toast.error("Session expired. Please log in again.");
      logout();
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      await delete_document(chatbotId, token, doc.id);
    } catch (error) {
      console.error(
        "Delete document failed:",
        error.response?.data || error.message
      );
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error(
          "Session expired or invalid credentials. Please log in again."
        );
        logout();
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        navigate("/login");
      } else {
        toast.error(
          error.response?.data?.detail || "Failed to delete document."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoc = (doc) => {
    if (["Uploading", "Processing", "Deleting"].includes(doc.status)) {
      toast.warn("Document is still processing, please wait.");
      return;
    }
    try {
      handleClickViewDocument(doc);
    } catch (error) {
      console.error("View document failed:", error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error(
          "Session expired or invalid credentials. Please log in again."
        );
        logout();
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        navigate("/login");
      } else {
        toast.error("Failed to view document.");
      }
    }
  };

  return (
    <List dense>
      {documents.map((doc, index) => (
        <ListItem
          key={doc.id || index}
          disableGutters
          sx={{
            boxShadow: "0 0 3px rgba(0,0,0,.5)",
            borderRadius: "2px",
            p: ".6rem .5rem",
            minWidth: "15rem",
            mb: "1rem",
          }}
        >
          <DescriptionIcon color="action" sx={{ mr: "1rem" }} />
          <ListItemText
            primary={
              <Typography variant="body2" color="text.primary">
                {doc.document_title}
              </Typography>
            }
            secondary={
              <Typography
                variant="body2"
                sx={{
                  color:
                    doc.status === "Ready"
                      ? "#22C55E"
                      : doc.status === "Queued"
                      ? "orange"
                      : doc.status === "Failed"
                      ? "tomato"
                      : doc.status === "Processing"
                      ? "#EAB308"
                      : "#D97706",
                }}
              >
                {doc.status}
              </Typography>
            }
          />

          {isViewOnly(doc.status) ? (
            <Tooltip title="View doc" placement="top">
              <IconButton color="primary">
                <VisibilityIcon
                  onClick={() => handleViewDoc(doc)}
                  sx={{ color: "grey", cursor: "pointer" }}
                />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Edit doc" placement="top">
              <IconButton color="primary">
                <ModeEditIcon
                  onClick={() => handleViewDoc(doc)}
                  sx={{ color: "grey", cursor: "pointer" }}
                />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete doc" placement="top">
            <IconButton color="primary">
              <DeleteIcon
                onClick={() => handleDeleteDoc(doc)}
                sx={{ color: "grey", cursor: "pointer" }}
              />
            </IconButton>
          </Tooltip>
        </ListItem>
      ))}
    </List>
  );
};

export default DocumentsList;
