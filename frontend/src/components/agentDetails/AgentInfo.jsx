import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import ChatbotCard from "./ChatbotCard";
import DocumentsList from "./DocumentsList";
import FAQList from "./FAQList";
import UploadFile from "./UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import FaqDialog from "../forms/FaqDialog";
import { deleteFaq } from "../../services/faq_api";
import {
  get_aqs_data,
  get_doc_content,
  index_aqs_data,
  process_document,
  save_document_content,
  save_qas_data,
  update_document_title,
  upload_document,
  reconstructTables,
} from "../../services/document";
import DocumentViewer from "../../pages/DocumentViewer";
import { useAuth } from "../../hooks/AuthProvider";
import AQList from "./AQList";
import { ws_url } from "../../services/api";
import DriverTour from "../tour/DriverTour";

const AgentInfo = ({ agentDetails, onRefresh, setAgentDetails }) => {
  const { user } = useAuth();
  const { chatbotId } = useParams();
  const [loading, setLoading] = useState(false);
  const [aqs, setAqs] = useState([]);
  const [openKnowledgeDialog, setOpenKnowledgeDialog] = useState(false);
  const [deleteFaqDialogOpen, setDeleteFaqDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [isDeletingFaq, setIsDeletingFaq] = useState(false);
  const [openDocumentViewDialog, setOpenDocumentViewDialog] = useState(false);
  const [openAqsViewDialog, setOpenAqsViewDialog] = useState(false);
  const [openFaqDialog, setOpenFaqDialog] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState(null);
  const [processedDocIds, setProcessedDocIds] = useState(new Set());
  const isAdmin = user?.isAdmin === true;
  const [newDocument, setNewDocument] = useState({
    title: "",
    file: null,
    use_gen_qa: false,
    id: "",
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [currentDocId, setCurrentDocId] = useState("");
  const [documentData, setDocumentData] = useState("");
  const [afterSetHeader, setAfterSetHeader] = useState("");
  const [currentDocument, setCurrentDocument] = useState("");
  const nav = useNavigate();
  const [runTour, setRunTour] = useState(false);

  // Joyride steps
  const steps = [
    {
      target: '[data-tour="add-document"]',
      content: "Click here to add a new document to the knowledge base.",
      disableBeacon: false,
      placement: "top",
    },
    {
      target: '[data-tour="add-faq"]',
      content: "Click here to add a new FAQ.",
      disableBeacon: true,
      placement: "top",
    },
  ];

  // Start tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`agentInfoTour_${chatbotId}`);
    if (!hasSeenTour && agentDetails) {
      setTimeout(() => setRunTour(true), 300);
    }
  }, [agentDetails, chatbotId]);

  const handleTourFinished = () => {
    setRunTour(false);
    localStorage.setItem(`agentInfoTour_${chatbotId}`, "true");
  };

  const handleOpenKnowledgeDialog = () => {
    setOpenKnowledgeDialog(true);
  };

  const handleCloseKnowledgeDialog = () => {
    setOpenKnowledgeDialog(false);
    setDocumentData("");
  };

  const handleOpenFaqDialog = (faq = null) => {
    setFaqToEdit(faq);
    setOpenFaqDialog(true);
  };

  const handleCloseFaqDialog = () => {
    setOpenFaqDialog(false);
    setFaqToEdit(null);
  };

  const handleCloseDocumentViewDialog = () => {
    setOpenDocumentViewDialog(false);
    setIsEditingTitle(false);
  };
  const handleOpenDocumentViewDialog = () => {
    setOpenDocumentViewDialog(true);
  };

  const handleCloseAqsViewDialog = () => {
    setOpenAqsViewDialog(false);
    setAqs([]);
  };

  const handleCheckboxChange = (e) => {
    setNewDocument((prev) => ({
      ...prev,
      use_gen_qa: e.target.checked,
    }));
  };

  const handleSaveDocument = () => {
    const errors = [];
    if (newDocument.file === null) {
      errors.push("Please upload a file");
    }
    if (newDocument.title === "") {
      errors.push("Please enter a title");
    }
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast.error(error);
      });
      return;
    }
    setLoading(true);
    const token = user.accessToken;
    upload_document(chatbotId, token, newDocument)
      .then((data) => {
        console.log(data);
        onRefresh();
        handleCloseKnowledgeDialog();
      })
      .catch((error) => {
        toast.error("Failed to upload document");
      })
      .finally(() => setLoading(false));
  };

  const handleSaveMarkdownWithHeaders = () => {
    setLoading(true);
    save_document_content(currentDocument.id, documentData, user.accessToken)
      .then((data) => {
        toast.success("Content saved successfully!");
        console.log(data);
      })
      .finally(() => {
        setLoading(false);
        setOpenDocumentViewDialog(false);
        setAfterSetHeader("");
        onRefresh();
      });
  };

  const handleIndexMarkdownWithHeaders = () => {
    setOpenDocumentViewDialog(false);
    setLoading(true);
    process_document(chatbotId, user.accessToken, documentData, newDocument)
      .then((data) => {
        console.log(data);
      })
      .finally(() => {
        setLoading(false);
        setAfterSetHeader("");
      });
  };

  const handleReconstructTables = () => {
    setLoading(true);
    save_document_content(
      currentDocument.id,
      documentData,
      user.accessToken
    ).then(() => {
      reconstructTables(currentDocument.id, null, user.accessToken)
        .then((data) => {
          if (typeof data === "string") {
            setDocumentData(data);
          } else {
            toast.error("Unexpected response format");
          }
        })
        .catch((error) => {
          toast.error("Failed to reconstruct tables");
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  const handleSaveAqs = () => {
    setLoading(true);
    save_qas_data(currentDocId, aqs)
      .then((data) => {
        console.log(data);
        onRefresh();
        setOpenAqsViewDialog(false);
      })
      .finally(() => setLoading(false));
  };

  const handleIndexing = () => {
    setLoading(true);
    setOpenAqsViewDialog(false);
    setOpenDocumentViewDialog(false);
    index_aqs_data(currentDocId, aqs)
      .then((data) => {
        console.log(data);
        onRefresh();
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteFaqClick = (faqId) => {
    setFaqToDelete(faqId);
    setDeleteFaqDialogOpen(true);
  };

  const handleCloseDeleteFaqDialog = () => {
    setDeleteFaqDialogOpen(false);
    setFaqToDelete(null);
  };

  const handleDeleteFaq = async () => {
    if (!faqToDelete) return;
    setIsDeletingFaq(true);
    setLoading(true);
    try {
      await deleteFaq(faqToDelete, user.accessToken);
      toast.success("FAQ deleted successfully!");
      onRefresh();
      handleCloseDeleteFaqDialog();
    } catch (error) {
      toast.error(error.detail || "Failed to delete FAQ");
    } finally {
      setIsDeletingFaq(false);
      setLoading(false);
    }
  };

  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const ws = new WebSocket(`${ws_url}?chatbot_id=${chatbotId}`);
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Response:", data);
        if (data.status === "success") {
          toast.success(data.message);
          if (data.document_id && data.document_title) {
            const temp_doc = {
              id: data.document_id,
              document_title: data.document_title,
            };
            handleClickViewDocument(temp_doc);
          }
        } else if (data.status === "error") {
          toast.error(data.message);
        } else if (data.status === "info") {
          toast.info(data.message);
        } else if (data.status === "warn") {
          toast.warn(data.message);
        } else if (data.status === "response") {
          console.log("Response:", data);
        } else {
          console.log("Unknown WebSocket message:", data);
        }
        onRefresh(false);
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    };
    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };
    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };
    setSocket(ws);
    return () => ws.close();
  }, [chatbotId, user.accessToken, onRefresh]);

  const handleClickViewDocument = (doc) => {
    setLoading(true);
    const token = user.accessToken;
    setCurrentDocument(doc);
    get_doc_content(doc.id, token).then((data) => {
      setDocumentData(data);
      setNewDocument((prev) => ({
        ...prev,
        id: doc.id,
        use_gen_qa: false
      }));
      setEditedTitle(doc.document_title);
      handleOpenDocumentViewDialog();
      setLoading(false);
    });
  };

  const handleQAViewItemClick = (doc) => {
    get_aqs_data(doc.id).then((data) => {
      setAqs(data);
      setCurrentDocId(doc.id);
      setOpenAqsViewDialog(true);
    });
  };

  const handleEditClick = () => setIsEditingTitle(true);

  const handleSaveClick = async () => {
    if (editedTitle.trim() === "") {
      toast.error("Please enter a title");
      return;
    }
    const result = await update_document_title(
      currentDocument.id,
      editedTitle,
      user.accessToken
    );
    if (result && !result.error) {
      setCurrentDocument((prev) => ({
        ...prev,
        document_title: editedTitle,
      }));
      setIsEditingTitle(false);
      toast.success("Title updated successfully!");
    } else {
      toast.error("Failed to update title");
    }
  };

  const renderStatusMessage = (status) => {
    switch (status) {
      case "Uploaded (waiting for next step)":
        return "For better search and response accuracy, please use meaningful and consistent headers in your content before next step.";
      case "Queued for Processing":
        return "The document is queued for processing.";
      case "Processing":
        return "Your document is being processed...";
      case "Ready":
        return "Document is ready and fully indexed and can no longer be edited.";
      case "Questions and answer generated (waiting for next step)":
        return "The content has already been processed into questions and answers and can no longer be edited.";
      case "Uploading":
        return "The document is being uploaded. Please wait.";
      case "Failed":
        return "The document processing failed. Please check the content, delete current document and try again.";
      default:
        return "Unknown status.";
    }
  };

  const isViewOnly = (status, is_qa_view) => {
    if (
      is_qa_view &&
      status === "Questions and answer generated (waiting for next step)"
    ) {
      return false;
    }
    return [
      "Processing",
      "Queued for Processing",
      "Failed",
      "Ready",
      "Questions and answer generated (waiting for next step)",
      "Deleting",
      "Uploading",
    ].includes(status);
  };

  if (
    loading &&
    !openDocumentViewDialog &&
    !openAqsViewDialog &&
    !openFaqDialog
  ) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#7844D3" }} />
      </Box>
    );
  }

  return (
    <>
      <DriverTour run={runTour} steps={steps} onFinished={handleTourFinished} />
      <Box
        sx={{
          height: "100vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          pb: "5rem",
        }}
      >
        <Box sx={{ p: { xs: "6rem 1rem", sm: "5rem 1rem", md: 3 } }}>
          <ChatbotCard chatbot={agentDetails} />
          {!isAdmin && (
            <Box
              mt={3}
              mb={1}
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                gap: "2rem",
                flexFlow: "row wrap",
              }}
            >
              <Box
                sx={{
                  width: "30%",
                  borderRight: { sm: "none", md: "1px solid grey" },
                  pr: { sm: 0, md: "2rem" },
                  flexBasis: "19rem",
                  flexGrow: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography mr={3} variant="h5">
                    Document
                  </Typography>
                  <Tooltip
                    title={
                      agentDetails?.remaining_tokens === 0
                        ? "No tokens remaining to add documents"
                        : "Add a new document"
                    }
                  >
                    <span>
                      <Button
                        aria-label="create"
                        sx={{ color: "#8B5CF6" }}
                        onClick={handleOpenKnowledgeDialog}
                        data-tour="add-document"
                        disabled={agentDetails?.remaining_tokens === 0}
                      >
                        <NoteAddIcon />
                        <Typography ml={1} variant="h6">
                          ADD
                        </Typography>
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
                <DocumentsList
                  documents={agentDetails?.documents || []}
                  setLoading={setLoading}
                  chatbotId={chatbotId}
                  fetchChatbotData={onRefresh}
                  handleClickViewDocument={handleClickViewDocument}
                  handleQAViewItemClick={handleQAViewItemClick}
                  isViewOnly={isViewOnly}
                  onDocumentDeleted={(docId) => {
                    // Optimistic update: remove document from agentDetails
                    if (setAgentDetails && agentDetails) {
                      setAgentDetails({
                        ...agentDetails,
                        documents: (agentDetails.documents || []).filter(
                          doc => doc.id !== docId
                        )
                      });
                    }
                  }}
                />
              </Box>
              <Box sx={{ width: "40%", flexBasis: "19rem", flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography mr={3} variant="h5">
                    Frequently Q&A
                  </Typography>
                  <Tooltip
                    title={
                      agentDetails?.remaining_tokens === 0
                        ? "No tokens remaining to add FAQs"
                        : "Add a new FAQ"
                    }
                  >
                    <span>
                      <Button
                        aria-label="create"
                        sx={{ color: "#8B5CF6" }}
                        onClick={() => handleOpenFaqDialog()}
                        data-tour="add-faq"
                        disabled={agentDetails?.remaining_tokens === 0}
                      >
                        <NoteAddIcon />
                        <Typography ml={1} variant="h6">
                          ADD
                        </Typography>
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
                <FAQList
                  key={agentDetails?.faqs?.length || 0}
                  faqs={agentDetails?.faqs || []}
                  onEditFaq={handleOpenFaqDialog}
                  onDeleteFaq={handleDeleteFaqClick}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Knowledge Base Dialog */}
        <Dialog
          open={openKnowledgeDialog}
          onClose={handleCloseKnowledgeDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Add new document</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <UploadFile
              setNewDocument={setNewDocument}
              openKnowledgeDialog={openKnowledgeDialog}
              chatbotId={chatbotId}
            />
          </DialogContent>
          <DialogActions>
            <Button
              sx={{ color: "#8B5CF6" }}
              onClick={handleCloseKnowledgeDialog}
            >
              Close
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveDocument}
              sx={{ backgroundColor: "#8B5CF6" }}
              data-tour="dialog-next"
            >
              Next
            </Button>
          </DialogActions>
        </Dialog>

        {/* FAQ Dialog */}
        <FaqDialog
          open={openFaqDialog}
          onClose={handleCloseFaqDialog}
          chatbotId={chatbotId}
          token={user.accessToken}
          faqToEdit={faqToEdit}
          onFaqUpdated={onRefresh}
        />

        {/* Document View Dialog */}
        <Dialog
          open={openDocumentViewDialog}
          onClose={handleCloseDocumentViewDialog}
          fullWidth
          maxWidth="xl"
        >
          <DialogTitle>
            {isEditingTitle ? (
              <>
                <TextField
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  size="small"
                  fullWidth
                  variant="standard"
                />
                <IconButton onClick={handleSaveClick}>
                  <SaveIcon />
                </IconButton>
              </>
            ) : (
              <>
                {currentDocument.document_title}
                {!isViewOnly(currentDocument.status) && (
                  <IconButton onClick={handleEditClick}>
                    <EditIcon />
                  </IconButton>
                )}
              </>
            )}
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            {renderStatusMessage(currentDocument.status)}
            <DocumentViewer
              currentDocument={currentDocument}
              documentData={documentData}
              setDocumentData={setDocumentData}
              isViewOnly={isViewOnly}
              onReconstructTables={handleReconstructTables}
            />
          </DialogContent>
          <DialogActions
            sx={{
              display: "flex",
              justifyContent: "space-between",
              padding: ".5rem 2rem",
            }}
          >
            <Box
              sx={{
                display: isViewOnly(currentDocument.status) ? "none" : "block",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newDocument.use_gen_qa}
                    onChange={handleCheckboxChange}
                  />
                }
                label="AI generate frequently questions and answers from content"
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                sx={{ color: "#8B5CF6" }}
                onClick={handleCloseDocumentViewDialog}
              >
                Close
              </Button>
              {currentDocument.has_qa_data && (
                <Button
                  variant="contained"
                  sx={{ backgroundColor: "#8B5CF6" }}
                  onClick={() => handleQAViewItemClick(currentDocument)}
                >
                  {currentDocument.status === "Ready"
                    ? "View QAs data"
                    : "Manage QAS Data"}
                </Button>
              )}
              <Button
                onClick={handleSaveMarkdownWithHeaders}
                variant="outlined"
                sx={{
                  border: "1px solid #8B5CF6",
                  color: "#8B5CF6",
                  display: isViewOnly(currentDocument.status)
                    ? "none"
                    : "block",
                }}
              >
                Save
              </Button>
              <Button
                onClick={handleIndexMarkdownWithHeaders}
                variant="contained"
                sx={{
                  backgroundColor: "#8B5CF6",
                  display: isViewOnly(currentDocument.status)
                    ? "none"
                    : "block",
                }}
              >
                Index
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* AQS View Dialog */}
        <Dialog
          open={openAqsViewDialog}
          onClose={handleCloseAqsViewDialog}
          fullWidth
          maxWidth="xl"
        >
          <DialogTitle>
            Questions and answers generated by AI
            <Typography variant="body2" color="text.secondary">
              Question and answers data will be processed instead of the content
            </Typography>
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <AQList
              aqList={aqs}
              setAqList={setAqs}
              currentDocument={currentDocument}
              isViewOnly={isViewOnly}
            />
          </DialogContent>
          <DialogActions>
            <Button
              sx={{ color: "#8B5CF6" }}
              onClick={handleCloseAqsViewDialog}
            >
              Close
            </Button>
            {!isViewOnly(currentDocument.status, true) && (
              <>
                <Button
                  onClick={handleSaveAqs}
                  variant="contained"
                  sx={{ backgroundColor: "#8B5CF6" }}
                >
                  Save
                </Button>
                <Button
                  onClick={handleIndexing}
                  variant="contained"
                  sx={{ backgroundColor: "#8B5CF6" }}
                >
                  Index question and answers
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete FAQ Confirmation Dialog */}
        <Dialog
          open={deleteFaqDialogOpen}
          onClose={handleCloseDeleteFaqDialog}
          aria-labelledby="delete-faq-dialog-title"
          aria-describedby="delete-faq-dialog-description"
        >
          <DialogTitle id="delete-faq-dialog-title" sx={{ color: "#EF4444", fontWeight: "bold" }}>
            Delete FAQ
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-faq-dialog-description">
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={handleCloseDeleteFaqDialog} 
              disabled={isDeletingFaq}
              sx={{ color: "#6B7280" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteFaq}
              disabled={isDeletingFaq}
              variant="contained"
              color="error"
              sx={{
                backgroundColor: "#EF4444",
                "&:hover": {
                  backgroundColor: "#DC2626",
                },
              }}
            >
              {isDeletingFaq ? (
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
      </Box>
    </>
  );
};

export default AgentInfo;
