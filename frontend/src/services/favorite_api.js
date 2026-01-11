// favorite_api.js

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
// const API_URL = "http://localhost:8000/api/v1";

const favorite_api = axios.create({
  baseURL: API_URL,
});

export const getFavorites = async (
  chatbot_id,
  token,
  { limit = 10, skip = 0, sort_by = "favorite_at", search_keyword = "" } = {}
) => {
  try {
    if (!chatbot_id) throw new Error("Chatbot ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const params = new URLSearchParams({
      chatbot_id,
      limit: limit.toString(),
      skip: skip.toString(),
      sort_by,
    });

    if (search_keyword) {
      params.append("search_keyword", search_keyword);
    }

    const response = await favorite_api.get(`/favorite/?${params.toString()}`, {
      headers,
    });

    // Handle both array and paginated responses
    const responseData = response.data;
    const data = Array.isArray(responseData)
      ? responseData
      : responseData.results || [];
    const total = Array.isArray(responseData)
      ? responseData.length
      : responseData.total || data.length;

    return { data, total };
  } catch (error) {
    console.error(
      "Error getting favorites:",
      error.response?.data || error.message
    );
    throw error.response?.data || {
      detail: "An error occurred while getting favorites",
    };
  }
};

export const createFavorite = async (
  chatbot_response_id,
  chatbot_id,
  token
) => {
  try {
    if (!chatbot_response_id)
      throw new Error("Chatbot response ID is required");
    if (!chatbot_id) throw new Error("Chatbot ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const payload = {
      chatbot_response_id,
      chatbot_id,
    };

    const response = await favorite_api.post(`/favorite/create`, payload, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error creating favorite:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while creating the favorite",
      }
    );
  }
};

export const deleteFavoriteById = async (fav_id, token) => {
  try {
    if (!fav_id) throw new Error("Favorite ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await favorite_api.delete(
      `/favorite/delete_by_id?fav_id=${fav_id}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error deleting favorite:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while deleting the favorite",
      }
    );
  }
};

export const deleteFavoriteByMessageId = async (chatbot_response_id, token) => {
  try {
    if (!chatbot_response_id)
      throw new Error("Chatbot response ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await favorite_api.delete(
      `/favorite/delete_by_message_id?chatbot_response_id=${chatbot_response_id}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error deleting favorite by message ID:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while deleting the favorite by message ID",
      }
    );
  }
};
