import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
// const API_URL = "http://localhost:8000/api/v1";

const chatbot_api = axios.create({
  baseURL: API_URL + "/chatbot",
});

export const create = async (agent, token) => {
  let payload = {
    name: agent.name,
    organization: agent.organization,
    description: agent.description,
    temperature: agent.temperature,
    guard_rails: agent.guard_rails.join("<SEP>"),
    quota_limit: agent.quota_limit,
    window_type: agent.window_type,
    window_size: 1,
    is_disabled: agent.is_disabled,
  };
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const response = await chatbot_api.post("/", payload, { headers });
  return response;
};

export const update_chatbot = async (chatbot_id, agent, token) => {
  let payload = {
    name: agent.name,
    organization: agent.organization,
    description: agent.description,
    temperature: agent.temperature,
    guard_rails: agent.guard_rails.join("<SEP>"),
    quota_limit: agent.quota_limit,
    window_type: agent.window_type,
    window_size: 1,
    is_disabled: agent.is_disabled,
  };
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const response = await chatbot_api.put(
    `/${chatbot_id}`,
    payload,
    { headers }
  );
  return response;
};

export const sendMessageToChatbot = async (
  chatbotId,
  conversationId,
  message,
  accessToken
) => {
  try {
    const response = await fetch(
      `${API_URL}/chatbot/${chatbotId}/lightrag_query`,
      {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: message,
        }),
      }
    );
    if (response.status === 429) {
      const error = new Error(
        "You're sending messages too many requests. Please wait a moment."
      );
      error.status = 429;
      throw error;
    } else if (response.status === 403) {
      const error = new Error(
        "This chatbot is currently unavailable."
      );
      error.status = 403;
      throw error;
    } else if (response.status === 409) {
      const error = new Error(
        "This chatbot is currently unavailable."
      );
      error.status = 409;
      throw error;
    }
    return response.body;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const get_all_conversation_of_chatbot = async (chatbot_id, token) => {
  try {
    if (!chatbot_id) throw new Error("Chatbot ID is required");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const response = await chatbot_api.get(`/${chatbot_id}/conversations`, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error in getting all conversation",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while creating the conversation",
      }
    );
  }
};

export const get_chat_history = async (conversation_id, token) => {
  try {
    if (!conversation_id) throw new Error("Conversation ID is required");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const response = await chatbot_api.get(
      `/conversations/${conversation_id}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error in getting chat history",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getChatbotById = async (chatbotId, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const response = await chatbot_api.get(`/details/${chatbotId}`, { headers });

    return response.data;
  } catch (error) {
    console.error(
      "Error getting chatbot by ID:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while fetching chatbot",
      }
    );
  }
};

export const getAllDocuments = async (chatbot_id, token) => {
  try {
    if (!chatbot_id) throw new Error("Chatbot ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await chatbot_api.get(`/${chatbot_id}/documents`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching documents:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while fetching documents",
      }
    );
  }
};

export const deleteDocument = async (chatbot_id, document_id, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await chatbot_api.delete(
      `/${chatbot_id}/documents/delete/`,
      {
        headers,
        params: { document_id },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error deleting document:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while deleting the document",
      }
    );
  }
};

export const deleteChatbotUser = async (chatbot_id, email, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await chatbot_api.delete(`/${chatbot_id}/${email}`, {
      headers,
    });
    return response.data; // Return the response data (you can adjust depending on your API response structure)
  } catch (error) {
    console.error(
      "Error deleting chatbot user:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while deleting the chatbot user",
      }
    );
  }
};

export const addChatbotUser = async (chatbot_id, email, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await chatbot_api.post(
      `/${chatbot_id}/${email}`,
      {}, // Empty body for this request (assuming email and chatbot_id are the only data needed)
      { headers } // Pass headers in the config
    );

    return response.data; // Return the response data (you can adjust depending on your API response structure)
  } catch (error) {
    console.error(
      "Error adding chatbot user:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while adding the chatbot user",
      }
    );
  }
};

export const getAllChatbotFromUser = async (accessToken) => {
  try {
    const response = await chatbot_api.get("/get_chatbots_by_chatbot_user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
    });
    console.log("Chatbots fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch chatbots:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while fetching chatbots",
      }
    );
  }
};

export const reportMessage = async (reportData, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Ensure we're only sending the required fields
    const payload = {
      conversation_id: reportData.conversation_id,
      chatbot_response_id: reportData.chatbot_response_id,
      report: reportData.report,
    };

    const response = await chatbot_api.post("/messages/report", payload, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error reporting message:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const deleteConversation = async (conversationId, accessToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await chatbot_api.delete(
      `/conversations/${conversationId}`,
      {
        headers,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error deleting conversation:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getSourceOfChatbotResponse = async (
  chatbotId,
  conversationId,
  chatbotResponseId,
  token
) => {
  try {
    if (!chatbotId) throw new Error("Chatbot ID is required");
    if (!conversationId) throw new Error("Conversation ID is required");
    if (!chatbotResponseId) throw new Error("Chatbot Response ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const params = new URLSearchParams({
      chatbot_id: chatbotId,
      conversation_id: conversationId,
      chatbot_response_id: chatbotResponseId,
    });

    const response = await chatbot_api.get(
      `/get_source_of_chatbot_response?${params.toString()}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching source of chatbot response:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail:
          "An error occurred while fetching the source of the chatbot response",
      }
    );
  }
};

export const deleteChatbot = async (chatbotId, accessToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await chatbot_api.delete(
        `/?chatbot_id=${chatbotId}`,
        {
          headers,
        }
    );

    return response.data;
  } catch (error) {
    console.error(
        "Error deleting conversation:",
        error.response?.data || error.message
    );
    throw error;
  }
};

export const checkout = async (paymentData, token) => {
  try {
    let params = {
      amount: paymentData.amount,
      note: paymentData.notes, // Changed from notes to note to match your component
      chatbot_id: paymentData.chatbot_id,
    };
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(`${API_URL}/users/create-checkout-session`, params, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const payment_return = async (token, SearchParams) => {
  try {

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const response = await chatbot_api.get(`${API_URL}/users/payment_return?${SearchParams.toString()}`, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error in getting all conversation",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while creating the conversation",
      }
    );
  }
};
