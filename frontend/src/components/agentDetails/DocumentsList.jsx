import React, { useState, useEffect } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import { delete_document, get_doc_content, process_document } from "../../services/document";
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
  onDocumentDeleted,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localDocuments, setLocalDocuments] = useState(documents);
  const [reindexingDocId, setReindexingDocId] = useState(null);

  // Update local documents when prop changes
  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  if (!localDocuments || localDocuments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No documents yet.
      </Typography>
    );
  }

  const handleDeleteClick = (doc) => {
    if (doc.status === "Deleting") {
      toast.info("Document deletion is already in progress.");
      return;
    }
    if (["Uploading", "Processing"].includes(doc.status)) {
      toast.warn("This document looks stuck. You can still delete it.");
    }
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDocToDelete(null);
  };

  const handleDeleteDoc = async () => {
    if (!docToDelete) return;

    const token = user?.accessToken;
    if (!token) {
      toast.error("Session expired. Please log in again.");
      logout();
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      navigate("/login");
      handleCloseDeleteDialog();
      return;
    }

    setIsDeleting(true);
    setLoading(true);
    
    // Save current state for rollback
    const deletedDocId = docToDelete.id;
    const previousDocuments = [...localDocuments];
    
    // Optimistic update: remove document from UI immediately
    setLocalDocuments(prev => prev.filter(doc => doc.id !== deletedDocId));
    if (onDocumentDeleted) {
      onDocumentDeleted(deletedDocId);
    }
    
    try {
      const res = await delete_document(chatbotId, token, docToDelete.id);
      toast.success(
        res?.status === "deleted"
          ? "Document deleted successfully!"
          : "Delete request sent."
      );
      // Refresh to sync with server
      setTimeout(fetchChatbotData, 400);
      handleCloseDeleteDialog();
    } catch (error) {
      // Rollback optimistic update on error
      setLocalDocuments(previousDocuments);
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
      setIsDeleting(false);
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

  const handleReindex = async (doc) => {
    if (["Uploading", "Processing", "Deleting"].includes(doc.status)) {
      toast.warn("Document is still processing, please wait.");
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

    setReindexingDocId(doc.id);
    setLoading(true);
    try {
      // Get document content - check if document exists
      let documentData;
      try {
        documentData = await get_doc_content(doc.id, token);
      } catch (contentError) {
        // If document doesn't exist or content can't be retrieved
        if (contentError.response?.status === 404 || contentError.response?.status === 500) {
          toast.error("Document not found or content unavailable. Please refresh the page.");
          // Remove document from local list
          setLocalDocuments(prev => prev.filter(d => d.id !== doc.id));
          if (onDocumentDeleted) {
            onDocumentDeleted(doc.id);
          }
          // Refresh to sync
          fetchChatbotData();
          return;
        }
        throw contentError;
      }
      
      // Re-index document
      await process_document(
        chatbotId,
        token,
        documentData,
        {
          id: doc.id,
          title: doc.document_title,
          use_gen_qa: false,
        }
      );
      
      toast.success("Document re-indexing started!");
      // Refresh after a delay to see updated status
      setTimeout(() => {
        fetchChatbotData();
      }, 1000);
    } catch (error) {
      console.error("Re-index failed:", error.response?.data || error.message);
      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error(
          "Session expired or invalid credentials. Please log in again."
        );
        logout();
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        navigate("/login");
      } else if (error.response?.status === 404) {
        toast.error("Document not found. It may have been deleted. Refreshing list...");
        // Remove document from local list
        setLocalDocuments(prev => prev.filter(d => d.id !== doc.id));
        if (onDocumentDeleted) {
          onDocumentDeleted(doc.id);
        }
        fetchChatbotData();
      } else {
        toast.error(
          error.response?.data?.detail || "Failed to re-index document."
        );
      }
    } finally {
      setReindexingDocId(null);
      setLoading(false);
    }
  };

  return (
    <>
      <List dense>
        {localDocuments.map((doc, index) => (
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
                <IconButton 
                  color="primary"
                  onClick={() => handleViewDoc(doc)}
                >
                  <VisibilityIcon sx={{ color: "grey" }} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Edit doc" placement="top">
                <IconButton 
                  color="primary"
                  onClick={() => handleViewDoc(doc)}
                >
                  <ModeEditIcon sx={{ color: "grey" }} />
                </IconButton>
              </Tooltip>
            )}
            {doc.status === "Failed" && (
              <Tooltip title="Re-index document" placement="top">
                <IconButton 
                  color="primary"
                  onClick={() => handleReindex(doc)}
                  disabled={reindexingDocId === doc.id}
                >
                  {reindexingDocId === doc.id ? (
                    <CircularProgress size={20} sx={{ color: "grey" }} />
                  ) : (
                    <RefreshIcon sx={{ color: "#8B5CF6" }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete doc" placement="top">
              <IconButton 
                color="primary"
                onClick={() => handleDeleteClick(doc)}
              >
                <DeleteIcon sx={{ color: "grey" }} />
              </IconButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-document-dialog-title"
        aria-describedby="delete-document-dialog-description"
      >
        <DialogTitle id="delete-document-dialog-title" sx={{ color: "#EF4444", fontWeight: "bold" }}>
          Delete Document
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-document-dialog-description">
            Are you sure you want to delete the document{" "}
            <strong>"{docToDelete?.document_title}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            disabled={isDeleting}
            sx={{ color: "#6B7280" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteDoc}
            disabled={isDeleting}
            variant="contained"
            color="error"
            sx={{
              backgroundColor: "#EF4444",
              "&:hover": {
                backgroundColor: "#DC2626",
              },
            }}
          >
            {isDeleting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1, color: "white" }} />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DocumentsList;
