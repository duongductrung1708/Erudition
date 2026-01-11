import axios from "axios";
// import {loadEnv} from "vite";

// Ensure environment variables are accessible through the build system
export const API_URL = import.meta.env.VITE_API_URL;
// const API_URL = "http://localhost:8000/api/v1";
export const ws_url = import.meta.env.VITE_WS_API_URL;
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

export { api };

// New function to fetch all chatbots
export const getAllChatbots = async (accessToken) => {
  try {
    const response = await api.get("/chatbot/get_chatbots_by_owner", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
    });
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

export const getUserMe = async (accessToken) => {
  try {
    const response = await api.get("/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch user:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while fetching user data",
      }
    );
  }
};

export const updateUserMe = async (accessToken, userData) => {
  try {
    const response = await api.patch("/users/me", userData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Failed to update user:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while updating user data",
      }
    );
  }
};

export const registerUser = async (email, password, fullName) => {
  try {
    const response = await api.post(
      "/users/signup",
      {
        email,
        password,
        full_name: fullName,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Registration failed:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || { detail: "An error occurred while registering" }
    );
  }
};

export const updatePassword = async (accessToken, userData) => {
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  try {
    const response = await api.patch("/users/me/password", userData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("API error during password update:", error);
    throw error;
  }
};

// Gửi email để nhận OTP
export const passwordRecovery = async (email) => {
  try {
    const response = await api.post(`/password-recovery/${email}`);
    return response.data;
  } catch (error) {
    console.error(
      "Password recovery failed:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while recovering password",
      }
    );
  }
};

// Reset password with OTP token
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post(
      `/reset-password/`,
      {
        token: token,
        new_password: newPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Password reset failed:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while resetting password",
      }
    );
  }
};

export const deleteUserMe = async (accessToken) => {
  try {
    const response = await api.delete("/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Failed to delete user:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while deleting user",
      }
    );
  }
};

export const getTokenBundle = async (accessToken) => {
  try {
    const response = await api.get("/users/token_bundle", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
        "Failed to fetch token bundle:",
        error.response?.data || error.message
    );
    throw (
        error.response?.data || {
          detail: "An error occurred while fetching token bundle data",
        }
    );
  }
};

export const selectUserRole = async (accessToken, role) => {
  try {
    const response = await api.post(
      `/user/select-role?role=${role}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Failed to select role:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while selecting role",
      }
    );
  }
};

export const switchRole = async (accessToken) => {
  try {
    const response = await api.get("/users/switch_role", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Failed to switch role:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while switching role",
      }
    );
  }
};

export const getPaymentHistory = async (accessToken, chatbotId, createdFrom = null, createdTo = null) => {
  try {
    const params = { chatbot_id: chatbotId };
    if (createdFrom) params.created_from = createdFrom;
    if (createdTo) params.created_to = createdTo;

    const response = await api.get("/users/payment_history", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
      params,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch payment history:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        detail: "An error occurred while fetching payment history",
      }
    );
  }
};