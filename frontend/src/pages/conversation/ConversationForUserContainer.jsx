import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  deleteConversation,
  get_all_conversation_of_chatbot,
  get_chat_history,
  getAllChatbotFromUser,
  getChatbotById,
  sendMessageToChatbot,
} from "../../services/chatbot_api";
import { ws_url } from "../../services/api";
import { useAuth } from "../../hooks/AuthProvider";
import ConversationForUserView from "./ConversationForUserView";

export default function ConversationForUserContainer() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { chatbotId } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatbotName, setChatbotName] = useState("");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isAbleToChat, setIsAbleToChat] = useState(true);
  const [isChatbotDisabled, setIsChatbotDisabled] = useState(false);

  const sidebarRef = useRef(null);

  const generateUUID = useCallback(() => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }, []);

  const fetchChatbotDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      let chatbot;
      if (user.isChatbotCreator) {
        chatbot = await getChatbotById(chatbotId, user.accessToken);
      } else {
        const chatbots = await getAllChatbotFromUser(user.accessToken);
        chatbot = chatbots.find((cb) => cb.id === chatbotId);
        if (!chatbot) {
          throw new Error("Chatbot not found or you do not have access");
        }
      }

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
  }, [chatbotId, nav, user.accessToken, user.isChatbotCreator]);

  const fetchAllConversation = useCallback(async () => {
    try {
      const response = await get_all_conversation_of_chatbot(
        chatbotId,
        user.accessToken
      );
      const activeConversations = response.filter((conv) => !conv.is_deleted);
      setConversations([...activeConversations].reverse());
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error(error.response?.data?.detail || "Failed to fetch conversations");
    }
  }, [chatbotId, user.accessToken]);

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

  useEffect(() => {
    fetchChatbotDetails().then((isReady) => {
      if (isReady) fetchAllConversation();
    });

    const ws = new WebSocket(`${ws_url}?chatbot_id=${chatbotId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "success") toast.success(data.message);
        else if (data.status === "error") toast.error(data.message);
        else if (data.status === "info") toast.info(data.message);
        else if (data.status === "warn") toast.warn(data.message);
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    };

    return () => ws.close();
  }, [chatbotId, fetchAllConversation, fetchChatbotDetails]);

  useEffect(() => {
    const fetchConversationHistory = async () => {
      if (!conversationId) return;
      if (isLoading) return;
      try {
        const response = await get_chat_history(conversationId, user.accessToken);
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
        if (error.response && error.response.status !== 404) {
          toast.error("Failed to load conversation history");
        }
      }
    };

    fetchConversationHistory();
  }, [conversationId, generateUUID, isLoading, user.accessToken]);

  const checkChatbotIfReady = useCallback(() => {
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
  }, [isAbleToChat, isChatbotDisabled, nav, user.isChatbotCreator]);

  const handleSendMessage = useCallback(
    async (newMessage, isUpdate = false) => {
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

      if (!checkChatbotIfReady()) return;
      setIsLoading(true);

      const message = String(newMessage).trim();
      if (!chatbotId) {
        setIsLoading(false);
        return;
      }
      if (!message) {
        setIsLoading(false);
        return;
      }

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
          setIsLoading(false);
          return;
        }

        let conversation_id = conversationId || generateUUID();

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
        const updateInterval = 50;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const jsonChunks = text.split(/(?<=})/);

          for (const chunk of jsonChunks) {
            if (!chunk.trim()) continue;
            try {
              const res = JSON.parse(chunk);
              if (res.conversation_id && !conversationId) {
                setConversationId(res.conversation_id);
                conversation_id = res.conversation_id;
              }
              if (res.chatbot_response_id) chatbotResponseId = res.chatbot_response_id;
              if (res.content) {
                fullResponse += res.content;
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime > updateInterval) {
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
              console.error("Failed to parse chunk:", chunk);
            }
          }
        }

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

        await fetchAllConversation();
      } catch (error) {
        console.error("Error sending message:", error);
        setChatHistory((prevHistory) => prevHistory.slice(0, -2));
        toast.error(error.response?.data?.detail || "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [
      chatbotId,
      checkChatbotIfReady,
      conversationId,
      fetchAllConversation,
      generateUUID,
      user.accessToken,
    ]
  );

  const chatProps = useMemo(
    () => ({
      chatHistory,
      onSendMessage: handleSendMessage,
      isLoading,
      chatbotId,
      isChatbotDisabled,
      isChatbotCreator: user.isChatbotCreator,
    }),
    [
      chatHistory,
      handleSendMessage,
      isLoading,
      chatbotId,
      isChatbotDisabled,
      user.isChatbotCreator,
    ]
  );

  const handleDeleteClick = useCallback((convId) => {
    setSelectedConversationId(convId);
    setOpenConfirmDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedConversationId) return;
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
      toast.error(error.response?.data?.detail || "Failed to delete conversation");
    } finally {
      setOpenConfirmDialog(false);
      setSelectedConversationId(null);
    }
  }, [
    conversationId,
    fetchAllConversation,
    selectedConversationId,
    user.accessToken,
  ]);

  const handleCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
  }, []);

  const handleNewChat = useCallback(() => {
    setConversationId("");
    setChatHistory([]);
    setSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSelectConversation = useCallback((convId) => {
    setConversationId(convId);
    setSidebarOpen(false);
  }, []);

  return (
    <ConversationForUserView
      chatbotName={chatbotName}
      sidebarOpen={sidebarOpen}
      sidebarRef={sidebarRef}
      conversations={conversations}
      conversationId={conversationId}
      onToggleSidebar={handleToggleSidebar}
      onNewChat={handleNewChat}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={handleDeleteClick}
      chatProps={chatProps}
      confirmDeleteOpen={openConfirmDialog}
      onCloseConfirmDelete={handleCloseConfirmDialog}
      onConfirmDelete={handleConfirmDelete}
    />
  );
}

