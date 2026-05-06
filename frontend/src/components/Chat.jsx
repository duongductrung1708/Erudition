import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Modal,
  TextareaAutosize,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Radio,
  RadioGroup,
} from "@mui/material";
import {
  Report as ReportIcon,
  ArrowBackIos as ArrowBackIosIcon,
  MenuBook,
  Bookmark,
  BookmarkBorder,
} from "@mui/icons-material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  reportMessage,
  getSourceOfChatbotResponse,
} from "../services/chatbot_api";
import {
  createFavorite,
  deleteFavoriteByMessageId,
} from "../services/favorite_api";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/AuthProvider";
import SourceDialog from "./SourceDialog";
import ChatInput from "./chat/ChatInput";
import ChatMessages from "./chat/ChatMessages";

const Chat = ({
  chatHistory,
  onSendMessage,
  isLoading,
  chatbotId,
  isChatbotDisabled,
  isChatbotCreator,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const messagesEndRef = useRef(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceData, setSourceData] = useState({});
  const [selectedResponseId, setSelectedResponseId] = useState(null);

  useEffect(() => {
    // Always scroll to the bottom when chat history changes
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // If the last message is a streaming chatbot message, ensure smooth scrolling
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (
      lastMessage &&
      lastMessage.sender === "chatbot" &&
      lastMessage.isStreaming
    ) {
      // This ensures the cursor stays visible during streaming
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [chatHistory]);

  const inputDisabled = (isChatbotDisabled && !isChatbotCreator) || isLoading;
  const inputPlaceholder = isChatbotDisabled && !isChatbotCreator
    ? "Chatbot is disabled"
    : "Type a message...";

  const handleToggleFavorite = useCallback(async (message) => {
    if (message.sender !== "chatbot" || !message.id) {
      toast.error("Only chatbot responses can be favorited");
      return;
    }

    if (isLoading) {
      toast.error("Please wait until the response is complete");
      return;
    }

    const responseId = message.id;
    try {
      if (message.is_favorite) {
        await deleteFavoriteByMessageId(responseId, user.accessToken);
        toast.success("Removed from favorites");
        onSendMessage({ ...message, is_favorite: false }, true);
      } else {
        await createFavorite(responseId, chatbotId, user.accessToken);
        toast.success("Added to favorites");
        onSendMessage({ ...message, is_favorite: true }, true);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error(
        error.response?.data?.detail || "Failed to update favorite status"
      );
    }
  }, [chatbotId, isLoading, onSendMessage, user.accessToken]);

  const handleOpenReportModal = useCallback((message) => {
    if (message.sender === "chatbot" && message.id) {
      if (isLoading) {
        toast.error("Please wait a moment to report this message");
        return;
      }
      setSelectedMessageId(message.id);
      setReportModalOpen(true);
    } else {
      toast.error("Only chatbot responses can be reported");
    }
  }, [isLoading]);

  const handleCloseReportModal = useCallback(() => {
    setReportModalOpen(false);
    setSelectedReason("");
    setCustomReason("");
  }, []);

  const handleReasonChange = useCallback((event) => {
    setSelectedReason(event.target.value);
  }, []);

  const handleSubmitReport = useCallback(async () => {
    try {
      const reportedMessage = chatHistory.find(
        (msg) => msg.id === selectedMessageId && msg.sender === "chatbot"
      );

      if (!reportedMessage) {
        toast.error("Invalid message selected for reporting");
        return;
      }

      const reportData = {
        conversation_id: reportedMessage.conversation_id,
        chatbot_response_id: reportedMessage.id,
        report:
          selectedReason === "other"
            ? `other - ${customReason}`
            : selectedReason,
      };

      await reportMessage(reportData, user.accessToken);
      toast.success("Message reported successfully!");
      handleCloseReportModal();
    } catch (error) {
      console.error("Failed to report message:", error);
      toast.error(error.response?.data?.detail || "Failed to report message");
    }
  }, [
    chatHistory,
    handleCloseReportModal,
    selectedMessageId,
    selectedReason,
    customReason,
    user.accessToken,
  ]);

  const fetchSourceData = useCallback(async (cbId, conversationId, responseId) => {
    try {
      const data = await getSourceOfChatbotResponse(
        cbId,
        conversationId,
        responseId,
        user.accessToken
      );
      setSourceData((prev) => ({
        ...prev,
        [responseId]: data,
      }));
    } catch (error) {
      console.error("Error fetching source data:", error);
      toast.error("Failed to fetch source information");
    }
  }, [user.accessToken]);

  const handleOpenSourceDialog = useCallback((message) => {
    const { id, conversation_id } = message;
    setSelectedResponseId(id);
    if (!sourceData[id]) {
      fetchSourceData(chatbotId, conversation_id, id);
    }
    setSourceDialogOpen(true);
  }, [chatbotId, fetchSourceData, sourceData]);

  const handleCloseSourceDialog = useCallback(() => {
    setSourceDialogOpen(false);
    setSelectedResponseId(null);
  }, []);

  const formatDateTime = useCallback((dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  const renderActions = useCallback(
    (msg, idx, chatHistoryLength) => {
      if (msg.sender !== "chatbot" || msg.isStreaming) return null;

      const isLastAndLoading = isLoading && idx === chatHistoryLength - 1;

      return (
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Tooltip title="Reference" placement="bottom" arrow>
            <IconButton
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                "&:hover": {
                  backgroundColor: isLastAndLoading
                    ? "rgba(255, 255, 255, 0.8)"
                    : "rgba(0, 0, 255, 0.1)",
                },
                opacity: isLastAndLoading ? 0.5 : 1,
              }}
              onClick={() => handleOpenSourceDialog(msg)}
              disabled={isLastAndLoading}
            >
              <MenuBook
                fontSize="small"
                sx={{ color: isLastAndLoading ? "grey" : "#5E33A8" }}
              />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={msg.is_favorite ? "Remove from favorites" : "Add to favorites"}
            placement="bottom"
            arrow
          >
            <IconButton
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                "&:hover": {
                  backgroundColor: isLastAndLoading
                    ? "rgba(255, 255, 255, 0.8)"
                    : "rgba(255, 215, 0, 0.2)",
                },
                opacity: isLastAndLoading ? 0.5 : 1,
              }}
              onClick={() => handleToggleFavorite(msg)}
              disabled={isLastAndLoading}
            >
              {msg.is_favorite ? (
                <Bookmark
                  fontSize="small"
                  sx={{ color: isLastAndLoading ? "grey" : "#FFD700" }}
                />
              ) : (
                <BookmarkBorder
                  fontSize="small"
                  sx={{ color: isLastAndLoading ? "grey" : "#5E33A8" }}
                />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              isLastAndLoading
                ? "Please wait until the response is complete"
                : "Report this message"
            }
            placement="bottom"
            arrow
          >
            <IconButton
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                "&:hover": {
                  backgroundColor: isLastAndLoading
                    ? "rgba(255, 255, 255, 0.8)"
                    : "rgba(255, 0, 0, 0.1)",
                },
                opacity: isLastAndLoading ? 0.5 : 1,
              }}
              onClick={() => handleOpenReportModal(msg)}
              disabled={isLastAndLoading}
            >
              <ReportIcon
                fontSize="small"
                color={isLastAndLoading ? "disabled" : "error"}
              />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
    [handleOpenReportModal, handleOpenSourceDialog, handleToggleFavorite, isLoading]
  );

  return (
    <Box
      sx={{
        mt: "3rem",
        display: "flex",
        flexDirection: "column",
        height: "85vh",
      }}
    >
      {/* Back button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          pr: isMobile ? "0rem" : "15rem",
        }}
      >
        <Tooltip title="Back" placement="bottom">
          <IconButton
            sx={{
              color: "#7844D3",
              "&:hover": { backgroundColor: "transparent" },
            }}
            onClick={() =>
              navigate(
                isChatbotCreator
                  ? `/agent-details/${chatbotId}`
                  : "/user/workspace"
              )
            }
          >
            <ArrowBackIosIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Message area */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          overflowY: "auto",
          px: { xs: 3, sm: 5, md: "20%", lg: "30%" },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChatMessages
          chatHistory={chatHistory}
          formatDateTime={formatDateTime}
          renderActions={renderActions}
          messagesEndRef={messagesEndRef}
          emptyState={
            <Box
              sx={{
                flex: 1,
                width: "100%",
                overflowY: "auto",
                px: { xs: 3, sm: 5, md: "20%", lg: "30%" },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" color="text.secondary">
                What can I help with?
              </Typography>
            </Box>
          }
        />
      </Box>

      <ChatInput
        disabled={inputDisabled}
        placeholder={inputPlaceholder}
        onSend={onSendMessage}
        isChatbotDisabled={isChatbotDisabled}
        isChatbotCreator={isChatbotCreator}
        isLoading={isLoading}
      />

      {/* Report Modal */}
      <Modal
        open={reportModalOpen}
        onClose={handleCloseReportModal}
        aria-labelledby="report-modal-title"
        aria-describedby="report-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: "80%", md: "500px" },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "8px",
          }}
        >
          <Typography id="report-modal-title" variant="h6" component="h2">
            Report Message
          </Typography>
          <Typography id="report-modal-description" sx={{ mt: 2, mb: 3 }}>
            Please select the reason for reporting this message:
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedReason}
              onChange={handleReasonChange}
              name="report-reason"
            >
              {[
                "incorrect",
                "offensive",
                "irrelevant",
                "spam",
                "missing",
                "other",
              ].map((reason) => (
                <FormControlLabel
                  key={reason}
                  value={reason}
                  control={
                    <Radio
                      sx={{
                        "&.Mui-checked": {
                          color: "#794CCA",
                        },
                      }}
                    />
                  }
                  label={
                    reason === "incorrect"
                      ? "This answer is incorrect"
                      : reason === "offensive"
                      ? "Offensive content"
                      : reason === "irrelevant"
                      ? "Irrelevant answer"
                      : reason === "missing"
                      ? "Missing information"
                      : reason === "spam"
                      ? "Spam/Repeat"
                      : "Other"
                  }
                />
              ))}
            </RadioGroup>
            <FormHelperText>
              {selectedReason === "other"
                ? "Please provide additional details below"
                : "Select one option"}
            </FormHelperText>
          </FormControl>

          {selectedReason === "other" && (
            <TextareaAutosize
              minRows={3}
              placeholder="Please describe the issue..."
              style={{
                width: "100%",
                marginTop: "16px",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              onClick={handleCloseReportModal}
              sx={{
                textTransform: "capitalize",
                color: "#794CCA",
                borderColor: "#794CCA",
                backgroundColor: "#F1E9FF",
                mr: 2,
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              variant="contained"
              color="error"
              disabled={!selectedReason}
              sx={{ textTransform: "none", backgroundColor: "#794CCA" }}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Source Dialog */}
      <SourceDialog
        open={sourceDialogOpen}
        onClose={handleCloseSourceDialog}
        sourceData={selectedResponseId ? sourceData[selectedResponseId] : null}
        isLoading={
          selectedResponseId && !sourceData[selectedResponseId] && !isLoading
        }
      />
    </Box>
  );
};

export default Chat;
