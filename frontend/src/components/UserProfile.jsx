import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Avatar,
  Typography,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MyAccount from "./sections/MyAccount";
import Billing from "./sections/Billing";
import AccountUsage from "./sections/AccountUsage";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "../hooks/AuthProvider";
import { getUserMe, getAllChatbots, getPaymentHistory } from "../services/api";
import { getChatbotById } from "../services/chatbot_api";
import { toast } from "react-toastify";

const getColorFromString = (str) => {
  const colors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

const UserProfile = ({ onClose }) => {
  const { user: authUser, logout } = useAuth();
  const [userData, setUserData] = useState("");
  const [activeComponent, setActiveComponent] = useState("myAccount");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatbots, setChatbots] = useState([]);
  const [chatbotCount, setChatbotCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUserData(storedUser);
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = storedUser?.accessToken;
        if (token && storedUser?.isChatbotCreator) {
          const chatbotData = await getAllChatbots(token);

          const activeChatbots = chatbotData.filter((cb) => cb.is_active);
          setChatbots(activeChatbots);
          setChatbotCount(activeChatbots.length);

          const chatbotDetails = await Promise.all(
            activeChatbots.map((cb) => getChatbotById(cb.id, token))
          );

          const totalConversations = chatbotDetails.reduce(
            (sum, cb) =>
              sum +
              (cb.conversations?.filter((c) => !c.is_deleted).length || 0),
            0
          );
          const totalDocuments = chatbotDetails.reduce(
            (sum, cb) =>
              sum +
              (cb.documents?.filter((d) => d.status === "Ready").length || 0),
            0
          );

          setConversationCount(totalConversations);
          setDocumentCount(totalDocuments);

          const historyResults = await Promise.all(
            activeChatbots.map((cb) => getPaymentHistory(token, cb.id))
          );
          const allHistory = historyResults
            .flatMap((res) => res.detail || [])
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setPaymentHistory(allHistory);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(
          error.response?.status === 403
            ? "You do not have permission to access chatbot or payment data."
            : "Failed to fetch data."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleButtonClick = (component) => {
    setActiveComponent(component);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const isChatbotCreator = userData.isChatbotCreator;

  return (
    <>
      <Grid container spacing={3} sx={{ height: "100%", overflow: "hidden" }}>
        {/* Sidebar Section */}
        <Grid item xs={12} sm={3} md={3}>
          <Box
            sx={{
              display: { xs: "flex", sm: "none" },
              alignItems: "center",
              justifyContent: "flex-start",
              marginTop: { xs: "5rem" },
            }}
          >
            <Button onClick={toggleSidebar} sx={{ color: "#000" }}>
              <ArrowBackIcon />
            </Button>
          </Box>

          <Box
            sx={{
              flexDirection: "column",
              gap: 5,
              px: 3,
              paddingTop: isMobile ? "123px" : 5,
              paddingBottom: isMobile ? "70px" : "60px",
              borderRight: "1px solid #e5e5e5",
              position: "sticky",
              top: 0,
              height: isMobile ? "110vh" : "100vh",
              overflowY: "auto",
              display: { xs: sidebarOpen ? "flex" : "none", sm: "flex" },
              marginTop: { xs: sidebarOpen ? "35rem" : "none" },
            }}
          >
            <Box sx={{ position: "relative", mx: "auto" }}>
              <IconButton sx={{ color: "black" }} onClick={onClose}>
                <CloseIcon />
              </IconButton>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: "4rem",
                  cursor: "pointer",
                  bgcolor: userData?.email
                    ? getColorFromString(userData.email)
                    : "#ccc",
                }}
              >
                {userData?.email ? userData.email.charAt(0).toUpperCase() : ""}
              </Avatar>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
              }}
            >
              <Button
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  padding: 1,
                  textTransform: "none",
                  color: "black",
                  backgroundColor:
                    activeComponent === "myAccount" ? "#F1E9FF" : "transparent",
                  fontWeight:
                    activeComponent === "myAccount" ? "bold" : "normal",
                  "&:hover": {
                    backgroundColor: "#d8caf2",
                    fontWeight: "bold",
                  },
                }}
                onClick={() => handleButtonClick("myAccount")}
              >
                <PersonOutlinedIcon sx={{ mr: 1 }} />
                <Typography variant="body2">My account</Typography>
              </Button>

              {isChatbotCreator && (
                <>
                  <Button
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      padding: 1,
                      textTransform: "none",
                      color: "black",
                      backgroundColor:
                        activeComponent === "billing"
                          ? "#F1E9FF"
                          : "transparent",
                      fontWeight:
                        activeComponent === "billing" ? "bold" : "normal",
                      "&:hover": {
                        backgroundColor: "#d8caf2",
                        fontWeight: "bold",
                      },
                    }}
                    onClick={() => handleButtonClick("billing")}
                  >
                    <AttachMoneyOutlinedIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">Billing</Typography>
                  </Button>

                  <Button
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      padding: 1,
                      textTransform: "none",
                      color: "black",
                      backgroundColor:
                        activeComponent === "accountUsage"
                          ? "#F1E9FF"
                          : "transparent",
                      fontWeight:
                        activeComponent === "accountUsage" ? "bold" : "normal",
                      "&:hover": {
                        backgroundColor: "#d8caf2",
                        fontWeight: "bold",
                      },
                    }}
                    onClick={() => handleButtonClick("accountUsage")}
                  >
                    <StorageOutlinedIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">Account usage</Typography>
                  </Button>
                </>
              )}
            </Box>

            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: isMobile ? 10 : 20,
              }}
            >
              <Button
                onClick={logout}
                variant="outlined"
                sx={{
                  borderColor: "#FF4D4D",
                  fontWeight: "bold",
                  borderRadius: "20px",
                  "&:hover": { borderColor: "red" },
                  width: "auto",
                  color: "#FF4D4D",
                  textTransform: "none",
                }}
              >
                Log out
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Main Content Section */}
        <Grid item xs={12} sm={9} md={9}>
          <Box sx={{ flex: 1 }}>
            {activeComponent === "myAccount" && <MyAccount user={userData} />}
            {isChatbotCreator && activeComponent === "billing" && (
              <Billing
                user={userData}
                chatbots={chatbots}
                paymentHistory={paymentHistory}
                isLoading={isLoading}
              />
            )}
            {isChatbotCreator && activeComponent === "accountUsage" && (
              <AccountUsage
                user={userData}
                chatbots={chatbots}
                chatbotCount={chatbotCount}
                conversationCount={conversationCount}
                documentCount={documentCount}
                paymentHistory={paymentHistory}
                isLoading={isLoading}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default UserProfile;
