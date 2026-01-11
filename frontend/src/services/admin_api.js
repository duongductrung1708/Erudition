import { api } from "./api";

const adminApi = {
  getUsers: async (
    token,
    skip = 0,
    limit = 0,
    search = "",
    orderBy = "email",
    order = "asc"
  ) => {
    try {
      const response = await api.get("/admin/get_users", {
        params: {
          skip,
          limit,
          search,
          order_by: orderBy,
          order,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Admin API Error:", error);
      throw error;
    }
  },

  getUserById: async (token, userId) => {
    try {
      const response = await api.get(`/admin/get_user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  updateUser: async (token, userId, updates) => {
    try {
      const updateData = {
        is_active: updates.is_active,
        is_chatbot_creator: updates.is_chatbot_creator,
        is_admin: updates.is_admin,
      };

      const response = await api.patch(
        `/admin/update_user/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  deleteUser: async (token, userId) => {
    try {
      const response = await api.delete(`/admin/delete_user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  getChatbot: async (token, skip, limit, chatbot_name = "") => {
    try {
      const response = await api.get(`/admin/get_chatbots`, {
        params: {
          skip,
          limit,
          chatbot_name
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching chatbot:", error);
      throw error;
    }
  },


    deleteChatbot: async (token, chatbotId) => {
      try {
        console.log("Deleting chatbot with token:", token); // Debug log
        const response = await api.delete(`/admin/delete_chatbot/?chatbot_id=${chatbotId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error) {
        console.error("Error deleting chatbot:", error.response?.data || error.message);
        throw error;
      }
    },

    activeChatbot: async (token, chatbotId) => {
      try {
        const response = await api.post(
            `/admin/activate_chatbot?chatbot_id=${chatbotId}`,
            {}, // Body rỗng
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            }
        );
        return response.data;
      } catch (error) {
        console.error("Error activating chatbot:", error.response?.data || error.message);
        throw error;
      }
    },

    deactivateChatbot: async (token, chatbotId) => {
      try {
        const response = await api.post(
            `/admin/deactivate_chatbot?chatbot_id=${chatbotId}`,
            {}, // Body rỗng
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            }
        );
        return response.data;
      } catch (error) {
        console.error("Error deactivating chatbot:", error.response?.data || error.message);
        throw error;
      }
    },


  getChatbotsUsageTokens: async (token, params) => {
    try {
      const response = await api.get("/statistics/get_chatbots_usage_tokens", {
        params: {
          from_date: params.from_date,
          to_date: params.to_date,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      throw error;
    }
  },
  getTokenBundles: async (token) => {
    try {
      const response = await api.get("/admin/token_bundle", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      throw error;
    }
  },
  updateBundle: async (token, bundleId, updates) => {
    try {
      const updateData = {
        price: updates.price,
        token_amount: updates.token_amount,
        name: updates.name,
        description: updates.description,
      };

      const response = await api.put(
          `/admin/token_bundle/${bundleId}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating bundle:", error);
      throw error;
    }
  },
  createBundle: async (token, bundle) => {
    try {
      const bundleData = {
        price: bundle.price,
        token_amount: bundle.token_amount,
        name: bundle.name,
        description: bundle.description,
      };

      const response = await api.post(
          `/admin/create_token_bundle`,
          bundleData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating bundle:", error);
      throw error;
    }
  },
  deleteBundle: async (token, bundleId) => {
    try {
      const response = await api.delete(`/admin/token_bundle/${bundleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting bundle:", error);
      throw error;
    }
  },



};

export default adminApi;
