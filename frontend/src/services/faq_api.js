import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
// const API_URL = "http://localhost:8000/api/v1";

const faq_api = axios.create({
  baseURL: API_URL,
});

export const createFaq = async (chatbot_id, faq, token) => {
  try {
    if (!chatbot_id) throw new Error("Chatbot ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const payload = {
      question: faq.question,
      answer: faq.answer,
    };

    const response = await faq_api.post(
      `/faqs/create?chatbot_id=${chatbot_id}`,
      payload,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Error creating FAQ:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        detail: "An error occurred while creating the FAQ",
      }
    );
  }
};

export const updateFaq = async (faq_id, faq, token) => {
  try {
    if (!faq_id) throw new Error("FAQ ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const payload = {
      question: faq.question,
      answer: faq.answer,
    };

    const response = await faq_api.put(
      `/faqs/update?faq_id=${faq_id}`,
      payload,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating FAQ:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        detail: "An error occurred while updating the FAQ",
      }
    );
  }
};

export const deleteFaq = async (faq_id, token) => {
  try {
    if (!faq_id) throw new Error("FAQ ID is required");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await faq_api.delete(`/faqs/delete?faq_id=${faq_id}`, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting FAQ:", error.response?.data || error.message);
    throw (
      error.response?.data || {
        detail: "An error occurred while deleting the FAQ",
      }
    );
  }
};