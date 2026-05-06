import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  Alert,
  Button,
  CircularProgress,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { ResponsiveContainer } from "recharts";
import {
  People as PeopleIcon,
  Token as TokenIcon,
  AttachMoney as RevenueIcon,
  SmartToy as ChatbotIcon,
} from "@mui/icons-material";
import StaticsChatbot from "./StaticsChatbot";
import { useAuth } from "../../hooks/AuthProvider";
import adminApi from "../../services/admin_api";
import { getChatbotById } from "../../services/chatbot_api";
import { toast } from "react-toastify";

const Item = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[100]} 100%)`,
  padding: theme.spacing(3),
  textAlign: "center",
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[4],
  borderRadius: theme.shape.borderRadius * 2,
  transition: "transform 0.2s, box-shadow 0.2s",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  "&:hover": {
    transform: "scale(1.03)",
    boxShadow: theme.shadows[8],
  },
  animation: "fadeIn 0.5s ease-in",
  "@keyframes fadeIn": {
    from: { opacity: 0, transform: "translateY(10px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
}));

const Dashboard = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, logout } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalChatbots, setTotalChatbots] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const PRICE_PER_TOKEN = 0.01;
  const totalCostVnd = useMemo(
    () => totalTokens * PRICE_PER_TOKEN,
    [PRICE_PER_TOKEN, totalTokens]
  );

  const fetchStats = useCallback(async () => {
    if (!user || !user.isAdmin) {
      setError("Admin privileges required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const usersResponse = await adminApi.getUsers(user.accessToken, 0, 0);
      setTotalUsers(usersResponse.count || 0);

      try {
        const chatbotsResponse = await adminApi.getChatbot(
          user.accessToken,
          0,
          999
        );

        const chatbots =
          chatbotsResponse.data ||
          (Array.isArray(chatbotsResponse) ? chatbotsResponse : []);
        setTotalChatbots(chatbots.length || chatbotsResponse.count || 0);

        let totalTokenUsage = 0;
        if (chatbots.length > 0) {
          if (chatbots[0].total_usage_token != null) {
            totalTokenUsage = chatbots.reduce(
              (sum, chatbot) => sum + (chatbot.total_usage_token || 0),
              0
            );
          } else {
            const chatbotDetails = await Promise.all(
              chatbots.map(async (chatbot) => {
                try {
                  const detail = await getChatbotById(
                    user.accessToken,
                    chatbot.chatbot_id
                  );
                  console.log(`Chatbot ${chatbot.chatbot_id} Detail:`, detail);
                  return detail.total_usage_token || 0;
                } catch (err) {
                  console.error(
                    `Error fetching chatbot ${chatbot.chatbot_id}:`,
                    err.response?.data || err.message,
                    err.response?.status
                  );
                  return 0;
                }
              })
            );
            totalTokenUsage = chatbotDetails.reduce(
              (sum, tokens) => sum + tokens,
              0
            );
          }
        } else {
          console.warn("No chatbots found; total token usage set to 0");
          toast.warn("No chatbots found in the system");
        }
        setTotalTokens(totalTokenUsage);

        setTotalRevenue(totalTokenUsage * PRICE_PER_TOKEN);
      } catch (err) {
        console.error(
          "GetChatbot Error:",
          err.response?.data || err.message,
          err.response?.status
        );
        throw err;
      }
    } catch (err) {
      if (err.message?.includes("expired")) {
        logout();
        return;
      }
      setError(err.message || "Failed to fetch statistics");
      toast.error("Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  }, [PRICE_PER_TOKEN, logout, user, user?.accessToken]);

  useEffect(() => {
    fetchStats();
  }, [user, logout]);

  if (!user || !user.isAdmin) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          p: 2,
        }}
      >
        <Alert
          severity="error"
          sx={{
            maxWidth: 600,
            boxShadow: theme.shadows[4],
            borderRadius: theme.shape.borderRadius,
            bgcolor: theme.palette.error.light,
            color: theme.palette.error.contrastText,
          }}
        >
          You don't have permission to access this page. Admin privileges
          required.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#5E33A8" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          p: 2,
        }}
      >
        <Alert
          severity="error"
          sx={{
            maxWidth: 600,
            boxShadow: theme.shadows[4],
            borderRadius: theme.shape.borderRadius,
            color: theme.palette.error.contrastText,
          }}
          action={
            <Button
              color="inherit"
              onClick={fetchStats}
              sx={{
                bgcolor: theme.palette.common.white,
                color: theme.palette.error.main,
                "&:hover": { bgcolor: theme.palette.grey[200] },
              }}
            >
              RETRY
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <title>Erudition | Admin Dashboard</title>
      <Box
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          mt: 8,
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            mb: 4,
            py: 2,
            px: 3,
            // bgcolor: "#5E33A8",
            color: theme.palette.common.dark,
            borderRadius: theme.shape.borderRadius,
            // boxShadow: theme.shadows[2],
          }}
        >
          <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight="bold">
            Admin dashboard
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Item>
              <PeopleIcon fontSize="large" sx={{ color: "#1976D2", mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Total users
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {totalUsers.toLocaleString()}
              </Typography>
            </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Item>
              <ChatbotIcon fontSize="large" sx={{ color: "#388E3C", mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Total chatbots
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {totalChatbots.toLocaleString()}
              </Typography>
            </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Item>
              <TokenIcon fontSize="large" sx={{ color: "#F57C00", mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Total token usage
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {totalTokens.toLocaleString()}
              </Typography>
            </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Item>
              <RevenueIcon fontSize="large" sx={{ color: "#D81B60", mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Total cost
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {totalCostVnd.toLocaleString("vi-VN")} ₫
              </Typography>
            </Item>
          </Grid>
        </Grid>

        <Grid container sx={{ mt: 4 }}>
          <Grid item xs={12}>
            <Item
              sx={{
                p: 4,
                borderRadius: theme.shape.borderRadius * 2,
                boxShadow: theme.shadows[6],
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                gutterBottom
                color="text.primary"
              >
                Token usage overview
              </Typography>
              <ResponsiveContainer width="100%" height={450}>
                <StaticsChatbot />
              </ResponsiveContainer>
            </Item>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Dashboard;
