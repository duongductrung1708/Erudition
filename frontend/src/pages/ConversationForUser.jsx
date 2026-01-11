import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import Chat from "../components/Chat";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import {
  sendMessageToChatbot,
  get_all_conversation_of_chatbot,
  get_chat_history,
  getChatbotById,
  getAllChatbotFromUser,
  deleteConversation,
} from "../services/chatbot_api";
import { useAuth } from "../hooks/AuthProvider";
import { toast } from "react-toastify";
import { ws_url } from "../services/api";

export default function ConversationForUser() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const { chatbotId } = useParams();
  const [conversationId, setConversationId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatbotName, setChatbotName] = useState("");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isAbleToChat, setIsAbleToChat] = useState(true);
  const [isChatbotDisabled, setIsChatbotDisabled] = useState(false);
  const sidebarRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const nav = useNavigate();

  const fetchChatbotDetails = async () => {
    setIsLoading(true);
    try {
      let chatbot;
      if (user.isChatbotCreator) {
        // Creators use getChatbotById
        chatbot = await getChatbotById(chatbotId, user.accessToken);
      } else {
        // Non-creators use getAllChatbotFromUser
        const chatbots = await getAllChatbotFromUser(user.accessToken);
        chatbot = chatbots.find((cb) => cb.id === chatbotId);
        if (!chatbot) {
          throw new Error("Chatbot not found or you do not have access");
        }
      }

      // Store is_disabled state
      setIsChatbotDisabled(chatbot.is_disabled ?? false);
      if (chatbot.is_disabled && !user.isChatbotCreator) {
        toast.warn(
          "This chatbot is disabled. You can view history but cannot send messages."
        );
      }

      const isReady = true;
      setIsAbleToChat(isReady);
      setChatbotName(chatbot.name || "Unnamed Chatbot");

      if (!isReady) {
        toast.error("This chatbot is not ready right now.");
        nav(user.isChatbotCreator ? "/workspace" : "/user/workspace");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error fetching chatbot details:", error);
      toast.error(error.message || "Failed to fetch chatbot details");
      nav(user.isChatbotCreator ? "/workspace" : "/user/workspace");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  const fetchAllConversation = async () => {
    try {
      const response = await get_all_conversation_of_chatbot(
        chatbotId,
        user.accessToken
      );
      const activeConversations = response.filter((conv) => !conv.is_deleted);
      setConversations([...activeConversations].reverse());
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error(
        error.response?.data?.detail || "Failed to fetch conversations"
      );
    }
  };

  useEffect(() => {
    fetchChatbotDetails().then((isReady) => {
      if (isReady) {
        fetchAllConversation();
      }
    });
    const ws = new WebSocket(`${ws_url}?chatbot_id=${chatbotId}`);
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "success") {
          toast.success(data.message);
        } else if (data.status === "error") {
          toast.error(data.message);
        } else if (data.status === "info") {
          toast.info(data.message);
        } else if (data.status === "warn") {
          toast.warn(data.message);
        } else {
          console.log("Unknown WebSocket message:", data);
        }
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
  }, [chatbotId, user.accessToken, nav]);

  useEffect(() => {
    async function fetchConversationHistory() {
      if (!conversationId) return;

      // Don't fetch history if we're currently streaming a response
      if (isLoading) return;

      try {
        const accessToken = user.accessToken;
        const response = await get_chat_history(conversationId, accessToken);
        const historyWithSharedDateTime = [];
        let lastUserDateTime = "";
        (response.history || []).forEach((item) => {
          if (item.sender === "user" && item.date_time) {
            lastUserDateTime = item.date_time;
            historyWithSharedDateTime.push({
              sender: item.sender,
              text: item.content,
              conversation_id: response.conversation_id,
              id: item.user_query_id || generateUUID(),
              date_time: item.date_time,
              is_favorite: false,
            });
          } else if (item.sender === "chatbot" && item.chatbot_response_id) {
            historyWithSharedDateTime.push({
              sender: item.sender,
              text: item.content,
              conversation_id: response.conversation_id,
              id: item.chatbot_response_id,
              date_time: lastUserDateTime || item.date_time || "",
              is_favorite: item.is_favorite || false,
              isStreaming: false,
            });
          }
        });
        setChatHistory(historyWithSharedDateTime);
      } catch (error) {
        console.error("Error fetching conversation history:", error);
        // Only show error toast if it's not a 404 error (which might be temporary during streaming)
        if (error.response && error.response.status !== 404) {
          toast.error("Failed to load conversation history");
        }
      }
    }
    fetchConversationHistory();
  }, [conversationId, user.accessToken, isLoading]);

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const checkChatbotIfReady = () => {
    if (!isAbleToChat) {
      toast.error("This chatbot is not ready right now.");
      nav(user.isChatbotCreator ? "/workspace" : "/user/workspace");
      return false;
    }
    if (isChatbotDisabled && !user.isChatbotCreator) {
      toast.error("This chatbot is disabled and cannot be used.");
      return false;
    }
    return true;
  };

  const handleSendMessage = async (newMessage, isUpdate = false) => {
    if (isUpdate) {
      setChatHistory((prevHistory) =>
        prevHistory.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, is_favorite: newMessage.is_favorite }
            : msg
        )
      );
      return;
    }

    if (!checkChatbotIfReady()) {
      return;
    }

    setIsLoading(true);
    const message = String(newMessage).trim();
    if (!chatbotId) {
      console.error("Chatbot ID is required.");
      setIsLoading(false);
      return;
    }
    if (message) {
      try {
        const userMessageId = generateUUID();
        const tempChatbotMessageId = generateUUID();
        const currentDateTime = new Date().toISOString();

        setChatHistory((prevHistory) => [
          ...prevHistory,
          {
            sender: "user",
            text: message,
            conversation_id: conversationId,
            id: userMessageId,
            date_time: currentDateTime,
            is_favorite: false,
          },
          {
            sender: "chatbot",
            text: "",
            conversation_id: conversationId,
            id: tempChatbotMessageId,
            date_time: currentDateTime,
            is_favorite: false,
            isStreaming: true,
          },
        ]);

        const accessToken = user.accessToken;
        if (!accessToken) {
          console.error("Access token is missing");
          setIsLoading(false);
          return;
        }

        let conversation_id = conversationId ? conversationId : generateUUID();

        try {
          const responseBody = await sendMessageToChatbot(
            chatbotId,
            conversation_id,
            message,
            accessToken
          );

          const reader = responseBody.getReader();
          const decoder = new TextDecoder();
          let fullResponse = "";
          let chatbotResponseId = null;
          let lastUpdateTime = Date.now();
          const updateInterval = 50; // Update UI every 50ms for smoother experience

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const jsonChunks = text.split(/(?<=})/);

            for (const chunk of jsonChunks) {
              if (!chunk.trim()) continue; // Skip empty chunks

              try {
                const res = JSON.parse(chunk);

                if (res.conversation_id && !conversationId) {
                  setConversationId(res.conversation_id);
                  conversation_id = res.conversation_id;
                }

                if (res.chatbot_response_id) {
                  chatbotResponseId = res.chatbot_response_id;
                }

                if (res.content) {
                  fullResponse += res.content;

                  // Throttle UI updates for smoother experience
                  const currentTime = Date.now();
                  if (currentTime - lastUpdateTime > updateInterval) {
                    // Update the chat history with the streaming response
                    setChatHistory((prevHistory) => {
                      const lastMessageIndex = prevHistory.length - 1;
                      const lastMessage = prevHistory[lastMessageIndex];

                      if (lastMessage && lastMessage.sender === "chatbot") {
                        const updatedHistory = [...prevHistory];
                        updatedHistory[lastMessageIndex] = {
                          ...lastMessage,
                          text: fullResponse,
                          id: chatbotResponseId || lastMessage.id,
                          date_time:
                            prevHistory[lastMessageIndex - 1].date_time,
                          is_favorite: false,
                          isStreaming: true,
                        };
                        return updatedHistory;
                      }
                      return prevHistory;
                    });
                    lastUpdateTime = currentTime;
                  }
                }
              } catch (e) {
                console.log(text);
                console.error("Failed to parse chunk:", chunk);
              }
            }
          }

          // Final update to mark streaming as complete
          setChatHistory((prevHistory) => {
            const lastMessageIndex = prevHistory.length - 1;
            const lastMessage = prevHistory[lastMessageIndex];

            if (lastMessage && lastMessage.sender === "chatbot") {
              const updatedHistory = [...prevHistory];
              updatedHistory[lastMessageIndex] = {
                ...lastMessage,
                text: fullResponse,
                id: chatbotResponseId || lastMessage.id,
                date_time: prevHistory[lastMessageIndex - 1].date_time,
                is_favorite: false,
                isStreaming: false,
              };
              return updatedHistory;
            }
            return prevHistory;
          });

          // Cập nhật danh sách cuộc trò chuyện mà không cần gọi lại API get_chat_history
          await fetchAllConversation();

          // Đặt isLoading = false để useEffect có thể gọi fetchConversationHistory nếu cần
          setIsLoading(false);
        } catch (error) {
          console.error("Error sending message:", error);
          setChatHistory((prevHistory) => prevHistory.slice(0, -2));

          if (error.response) {
            if (error.response.status === 429) {
              toast.error(
                "You're sending messages too quickly. Please wait and try again later."
              );
            } else {
              toast.error(
                error.response.data?.detail || "Failed to send message"
              );
            }
          } else if (error.request) {
            toast.error(
              "No response received from server. Please check your connection."
            );
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred");
        setIsLoading(false);
      }
    }
  };

  const handleDeleteClick = (conversationId) => {
    setSelectedConversationId(conversationId);
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedConversationId) {
      try {
        await deleteConversation(selectedConversationId, user.accessToken);
        await fetchAllConversation();

        if (conversationId === selectedConversationId) {
          setConversationId("");
          setChatHistory([]);
        }

        toast.success("Conversation deleted successfully");
      } catch (error) {
        console.error("Error deleting conversation:", error);
        toast.error(
          error.response?.data?.detail || "Failed to delete conversation"
        );
      }
    }
    setOpenConfirmDialog(false);
    setSelectedConversationId(null);
  };

  return (
    <>
      <title>Erudition | Chat with bot</title>
      <Box
        sx={{
          height: "93vh",
          mt: "3rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box
          ref={sidebarRef}
          sx={{
            backgroundColor: "#F3F3F3",
            overflowY: "auto",
            height: "93vh",
            transition: "all 0.3s ease",
            position: "absolute",
            top: { xs: 56 },
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            zIndex: sidebarOpen ? 1 : -1,
            width: "300px",
          }}
        >
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              backgroundColor: "#F3F3F3",
              padding: 2,
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Tooltip title={chatbotName} placement="bottom">
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: { xs: "150px", sm: "200px", md: "250px" },
                  }}
                >
                  {chatbotName}
                </Typography>
              </Tooltip>
              <Box display="flex" alignItems="center" gap={1}>
                <Tooltip title="New Chat" placement="bottom">
                  <IconButton
                    onClick={() => {
                      setConversationId("");
                      setChatHistory([]);
                      setSidebarOpen(false);
                    }}
                  >
                    <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
                <IconButton onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <ViewSidebarOutlinedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
          <Box sx={{ padding: "0 16px 16px 16px", marginTop: "1rem" }}>
            <List>
              {conversations.map((item, index) => (
                <ListItem
                  key={index}
                  disablePadding
                  onClick={(e) => {
                    e.stopPropagation();
                    setConversationId(item.id);
                    setSidebarOpen(false);
                  }}
                  sx={{
                    marginBottom: "8px",
                    "&:hover .delete-icon": { visibility: "visible" },
                    "&:hover": { borderRadius: "12px" },
                  }}
                >
                  <ListItemButton
                    sx={{
                      justifyContent: "space-around",
                      backgroundColor:
                        conversationId === item.id ? "#E0E0E0" : "transparent",
                      borderRadius: "8px",
                      paddingTop: "4px",
                      paddingBottom: "4px",
                      "&:hover": { backgroundColor: "#ECECEC" },
                    }}
                  >
                    <Tooltip title={item.first_msg} placement="top">
                      <ListItemText
                        primary={item.first_msg}
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "150px",
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Delete Chat" placement="bottom">
                      <Box
                        className="delete-icon"
                        sx={{
                          visibility:
                            conversationId === item.id ? "visible" : "hidden",
                        }}
                      >
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(item.id);
                          }}
                        >
                          <ClearOutlinedIcon />
                        </IconButton>
                      </Box>
                    </Tooltip>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>

        <Box sx={{ width: "100%", height: "93vh", overflowY: "hidden" }}>
          {!sidebarOpen && (
            <Box
              sx={{
                position: "fixed",
                top: { xs: "3.6rem", md: "5rem" },
                left: { xs: "3.5rem", md: "15rem" },
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                backgroundColor: "background.paper",
                padding: "4px 12px",
                borderRadius: "4px",
                maxWidth: "300px",
              }}
            >
              <IconButton
                onClick={() => setSidebarOpen(!sidebarOpen)}
                sx={{ mr: 1, p: 0 }}
              >
                <ViewSidebarOutlinedIcon />
              </IconButton>
              <Tooltip title={chatbotName} placement="bottom">
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: { xs: "150px", sm: "200px", md: "250px" },
                  }}
                >
                  {chatbotName}
                </Typography>
              </Tooltip>
            </Box>
          )}
          <Chat
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            chatbotId={chatbotId}
            isChatbotDisabled={isChatbotDisabled}
            isChatbotCreator={user.isChatbotCreator}
          />
        </Box>

        <Dialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              color="error"
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
