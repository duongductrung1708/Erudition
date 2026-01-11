import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const statistics_api = axios.create({
  baseURL: API_URL + "/statistics",
});

export const filterChatHistoryForUser = async (filterParams, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const params = {
      chatbot_id: filterParams.chatbot_id,
      from_date: filterParams.from_date,
      to_date: filterParams.to_date,
    };

    if (filterParams.filter_email) {
      params.filter_email = filterParams.filter_email;
    }

    const response = await statistics_api.post("/chat-history-me", params, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error filtering chat history:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const filterChatHistoryByChatbot = async (filterParams, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const params = {
      chatbot_id: filterParams.chatbot_id,
      skip: filterParams.skip,
      limit: filterParams.limit,
      from_date: filterParams.from_date,
      to_date: filterParams.to_date,
    };

    if (filterParams.filter_email) {
      params.filter_email = filterParams.filter_email;
    }

    const response = await statistics_api.post(
      "/chat-history-by-chatbot",
      params,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error filtering chat history:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getRateOfResponseReport = async (
  chatbotId,
  fromDate,
  toDate,
  token
) => {
  try {
    if (!chatbotId) throw new Error("Chatbot ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Tạo query params
    const params = new URLSearchParams({ chatbot_id: chatbotId });
    if (fromDate) params.append("from_date", fromDate);
    if (toDate) params.append("to_date", toDate);

    const response = await statistics_api.get(
      `/rate_of_response_report?${params.toString()}`,
      {
        headers,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching rate of response report:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while fetching rate of response report",
      }
    );
  }
};

export const getUsageTokenByChatbot = async (
  chatbotId,
  fromDate,
  toDate,
  token
) => {
  try {
    if (!chatbotId) throw new Error("Chatbot ID is required");
    if (!token) throw new Error("Authentication token is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const params = new URLSearchParams({ chatbot_id: chatbotId });
    if (fromDate) params.append("from_date", fromDate);
    if (toDate) params.append("to_date", toDate);

    const response = await statistics_api.get(
      `/get_usage_token_by_chatbot?${params.toString()}`,
      {
        headers,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching usage tokens:",
      error.response?.status,
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while fetching usage tokens",
      }
    );
  }
};
