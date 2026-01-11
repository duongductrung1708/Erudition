import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Modal,
  Paper,
  Stack,
  TextareaAutosize,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Radio,
  RadioGroup,
} from "@mui/material";
import {
  Report as ReportIcon,
  Send as SendIcon,
  ArrowBackIos as ArrowBackIosIcon,
  MenuBook,
  Bookmark,
  BookmarkBorder,
} from "@mui/icons-material";
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Markdown from "markdown-to-jsx";
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

const Chat = ({
  chatHistory,
  onSendMessage,
  isLoading,
  chatbotId,
  isChatbotDisabled,
  isChatbotCreator,
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleToggleFavorite = async (message) => {
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
  };

  const handleOpenReportModal = (message) => {
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
  };

  const handleCloseReportModal = () => {
    setReportModalOpen(false);
    setSelectedReason("");
    setCustomReason("");
  };

  const handleReasonChange = (event) => {
    setSelectedReason(event.target.value);
  };

  const handleSubmitReport = async () => {
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
  };

  const fetchSourceData = async (chatbotId, conversationId, responseId) => {
    try {
      const data = await getSourceOfChatbotResponse(
        chatbotId,
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
  };

  const handleOpenSourceDialog = (message) => {
    const { id, conversation_id } = message;
    setSelectedResponseId(id);
    if (!sourceData[id]) {
      fetchSourceData(chatbotId, conversation_id, id);
    }
    setSourceDialogOpen(true);
  };

  const handleCloseSourceDialog = () => {
    setSourceDialogOpen(false);
    setSelectedResponseId(null);
  };

  const formatDateTime = (dateTime) => {
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
  };

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
        {chatHistory.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              width: "100%",
              overflowY: "auto",
              px: { xs: 3, sm: 5, md: "20%", lg: "30%" },
              display: "flex",
              flexDirection: "column",
              justifyContent:
                chatHistory.length === 0 ? "center" : "flex-start",
              alignItems: chatHistory.length === 0 ? "center" : "flex-start",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              What can I help with?
            </Typography>
          </Box>
        ) : (
          chatHistory.map((msg, idx) => (
            <Stack
              key={msg.id || idx}
              direction={msg.sender === "user" ? "row-reverse" : "row"}
              spacing={2}
              mb={2}
            >
              <Box
                sx={{
                  position: "relative",
                  maxWidth: "70%",
                }}
              >
                <Tooltip
                  title={formatDateTime(msg.date_time)}
                  placement="top"
                  arrow
                >
                  <Paper
                    sx={{
                      px: 2,
                      py: 1.5,
                      bgcolor:
                        msg.sender === "user"
                          ? "rgba(120, 68, 211, 0.1)"
                          : "rgba(0, 0, 0, 0.05)",
                      boxShadow: "none",
                      borderRadius: "12px",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.text === "" && msg.isStreaming ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          "& span": {
                            width: 6,
                            height: 6,
                            backgroundColor: "#888",
                            borderRadius: "50%",
                            display: "inline-block",
                            marginRight: "5px",
                            animation: "blink 1.4s infinite both",
                          },
                          "& span:nth-of-type(2)": {
                            animationDelay: "0.2s",
                          },
                          "& span:nth-of-type(3)": {
                            animationDelay: "0.4s",
                          },
                          "& span:nth-of-type(4)": {
                            animationDelay: "0.6s",
                          },
                          "& span:nth-of-type(5)": {
                            animationDelay: "0.8s",
                          },
                          "@keyframes blink": {
                            "0%, 80%, 100%": { opacity: 0 },
                            "40%": { opacity: 1 },
                          },
                        }}
                      >
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </Box>
                    ) : msg.isStreaming ? (
                      <Box>
                        <Markdown>{msg.text}</Markdown>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            width: "2px",
                            height: "1em",
                            backgroundColor: "#000",
                            marginLeft: "2px",
                            animation: "cursor-blink 1s infinite",
                            verticalAlign: "middle",
                            "@keyframes cursor-blink": {
                              "0%, 100%": { opacity: 1 },
                              "50%": { opacity: 0 },
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <Markdown>{msg.text}</Markdown>
                    )}
                  </Paper>
                </Tooltip>

                {/* Buttons for chatbot messages */}
                {msg.sender === "chatbot" && !msg.isStreaming && (
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Tooltip title="Reference" placement="bottom" arrow>
                      <IconButton
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          "&:hover": {
                            backgroundColor:
                              isLoading && idx === chatHistory.length - 1
                                ? "rgba(255, 255, 255, 0.8)"
                                : "rgba(0, 0, 255, 0.1)",
                          },
                          opacity:
                            isLoading && idx === chatHistory.length - 1
                              ? 0.5
                              : 1,
                        }}
                        onClick={() => handleOpenSourceDialog(msg)}
                        disabled={isLoading && idx === chatHistory.length - 1}
                      >
                        <MenuBook
                          fontSize="small"
                          sx={{
                            color:
                              isLoading && idx === chatHistory.length - 1
                                ? "grey"
                                : "#5E33A8",
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        msg.is_favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      placement="bottom"
                      arrow
                    >
                      <IconButton
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          "&:hover": {
                            backgroundColor:
                              isLoading && idx === chatHistory.length - 1
                                ? "rgba(255, 255, 255, 0.8)"
                                : "rgba(255, 215, 0, 0.2)",
                          },
                          opacity:
                            isLoading && idx === chatHistory.length - 1
                              ? 0.5
                              : 1,
                        }}
                        onClick={() => handleToggleFavorite(msg)}
                        disabled={isLoading && idx === chatHistory.length - 1}
                      >
                        {msg.is_favorite ? (
                          <Bookmark
                            fontSize="small"
                            sx={{
                              color:
                                isLoading && idx === chatHistory.length - 1
                                  ? "grey"
                                  : "#FFD700",
                            }}
                          />
                        ) : (
                          <BookmarkBorder
                            fontSize="small"
                            sx={{
                              color:
                                isLoading && idx === chatHistory.length - 1
                                  ? "grey"
                                  : "#5E33A8",
                            }}
                          />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        isLoading && idx === chatHistory.length - 1
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
                            backgroundColor:
                              isLoading && idx === chatHistory.length - 1
                                ? "rgba(255, 255, 255, 0.8)"
                                : "rgba(255, 0, 0, 0.1)",
                          },
                          opacity:
                            isLoading && idx === chatHistory.length - 1
                              ? 0.5
                              : 1,
                        }}
                        onClick={() => handleOpenReportModal(msg)}
                        disabled={isLoading && idx === chatHistory.length - 1}
                      >
                        <ReportIcon
                          fontSize="small"
                          color={
                            isLoading && idx === chatHistory.length - 1
                              ? "disabled"
                              : "error"
                          }
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Stack>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message input */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: "1rem",
          bgcolor: "#fff",
          width: "100%",
        }}
      >
        <Box
          sx={{
            boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            bgcolor: "white",
            borderRadius: "12px",
            border: "1px solid white",
            width: { xs: "90%", sm: "80%", md: "44rem" },
          }}
        >
          <Tooltip
            title={
              isChatbotDisabled && !isChatbotCreator
                ? "Chatbot is disabled. Viewing only."
                : ""
            }
            arrow
          >
            <TextField
              disabled={(isChatbotDisabled && !isChatbotCreator) || isLoading}
              fullWidth
              placeholder={
                isChatbotDisabled && !isChatbotCreator
                  ? "Chatbot is disabled"
                  : "Type a message..."
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              multiline
              maxRows={4}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !(isChatbotDisabled && !isChatbotCreator) &&
                  !isLoading
                ) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": { border: "none" },
                  "&:hover fieldset": { borderColor: "white" },
                  "&.Mui-focused fieldset": { borderColor: "white" },
                  "&.Mui-disabled": { bgcolor: "white" },
                },
              }}
            />
          </Tooltip>
          <Tooltip
            title={
              isChatbotDisabled && !isChatbotCreator
                ? "Chatbot is disabled. Viewing only."
                : "Send"
            }
            placement="top"
          >
            <IconButton
              disabled={(isChatbotDisabled && !isChatbotCreator) || isLoading}
              sx={{
                ml: 2,
                color: "#7844D3",
                "&:hover": { bgcolor: "#E0D4F5" },
                "&:disabled": { bgcolor: "#F5F5F5", color: "#CCCCCC" },
              }}
              onClick={handleSendMessage}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

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
