import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import WorkspacesOutlinedIcon from "@mui/icons-material/WorkspacesOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TextsmsOutlinedIcon from "@mui/icons-material/TextsmsOutlined";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import AgentInfo from "../components/agentDetails/AgentInfo";
import AgentMember from "../components/agentDetails/AgentMember";
import TokenPayment from "../components/agentDetails/TokenPayment";
import { useNavigate, useParams } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import AgentEdit from "./AgentEdit.jsx";
import { useAuth } from "../hooks/AuthProvider";
import UserStatistic from "../components/agentDetails/UserStatistic";
import TokenStatistic from "../components/agentDetails/TokenStatistic";
import RequestStatistic from "../components/agentDetails/RequestStatistic";
import ChatHistoryDetail from "./ChatHistoryDetail";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  filterChatHistoryByChatbot,
  getRateOfResponseReport,
  getUsageTokenByChatbot,
} from "../services/statistics_api";
import { getChatbotById } from "../services/chatbot_api";
import { useQuery } from "@tanstack/react-query";

const ReportTab1 = ({ chatHistory, usageToken }) => (
  <UserStatistic chatHistory={chatHistory} usageToken={usageToken} />
);
const ReportTab2 = ({ usageToken }) => (
  <TokenStatistic usageToken={usageToken} />
);
const ReportTab3 = ({ chatHistory }) => (
  <RequestStatistic chatHistory={chatHistory} />
);
const ReportTab4 = ({ chatHistory, rateReport }) => (
  <ChatHistoryDetail chatHistory={chatHistory} rateReport={rateReport} />
);

const DateFilter = ({ dateRange, setDateRange }) => {
  const handleStartDateChange = (e) => {
    setDateRange((prev) => ({ ...prev, startDate: new Date(e.target.value) }));
  };

  const handleEndDateChange = (e) => {
    setDateRange((prev) => ({ ...prev, endDate: new Date(e.target.value) }));
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        mb: 3,
        alignItems: "center",
        flexWrap: "wrap",
        p: 2,
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body1" sx={{ minWidth: 20 }}>
          From:
        </Typography>
        <input
          type="date"
          value={formatDateForInput(dateRange.startDate)}
          onChange={handleStartDateChange}
          max={formatDateForInput(dateRange.endDate)}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontSize: "14px",
            fontFamily: "inherit",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body1" sx={{ minWidth: 20 }}>
          To:
        </Typography>
        <input
          type="date"
          value={formatDateForInput(dateRange.endDate)}
          onChange={handleEndDateChange}
          min={formatDateForInput(dateRange.startDate)}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontSize: "14px",
            fontFamily: "inherit",
          }}
        />
      </Box>
    </Box>
  );
};

const ChatBotDetails = () => {
  const { chatbotId } = useParams();
  const { user } = useAuth();
  const [activeComponent, setActiveComponent] = useState("agentInfo");
  const [activeReportTab, setActiveReportTab] = useState("report1");
  const [reportLoading, setReportLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [rateReport, setRateReport] = useState(null);
  const [usageToken, setUsageToken] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date(),
  });

  const {
    data: agentDetails,
    isLoading: loading,
    refetch: refetchAgentDetails,
  } = useQuery({
    queryKey: ["chatbotDetails", chatbotId, user?.accessToken],
    queryFn: async () => {
      const token = user?.accessToken;
      if (!token) {
        throw new Error("Access token is missing");
      }
      return await getChatbotById(chatbotId, token);
    },
    enabled: !!chatbotId && !!user?.accessToken,
    onError: (error) => {
      console.error("Failed to fetch chatbot details:", error);
      toast.error("Failed to load chatbot details");
    },
  });

  const fetchChatHistory = async () => {
    try {
      setReportLoading(true);
      const token = user.accessToken;
      const fromDate = dayjs(dateRange.startDate)
        .startOf("day")
        .add(7, "hour")
        .toISOString();
      const toDate = dayjs(dateRange.endDate)
        .endOf("day")
        .add(7, "hour")
        .toISOString();

      const params = {
        chatbot_id: chatbotId,
        skip: 0,
        limit: 1000,
        from_date: fromDate,
        to_date: toDate,
        filter_email: "",
      };

      const response = await filterChatHistoryByChatbot(params, token);
      const history = response.data || response;

      const filteredHistory = (history || []).filter((chat) => {
        const chatDate = dayjs(chat.date_time);
        return (
          chatDate.isAfter(
            dayjs(dateRange.startDate).startOf("day"),
            "minute"
          ) &&
          chatDate.isBefore(dayjs(dateRange.endDate).endOf("day"), "minute")
        );
      });

      setChatHistory(filteredHistory);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      toast.error("Failed to load chat history");
    } finally {
      setReportLoading(false);
    }
  };

  const fetchRateReport = async () => {
    try {
      setReportLoading(true);
      const token = user.accessToken;
      const fromDate = dayjs(dateRange.startDate)
        .startOf("day")
        .add(7, "hour")
        .toISOString();
      const toDate = dayjs(dateRange.endDate)
        .endOf("day")
        .add(7, "hour")
        .toISOString();

      const report = await getRateOfResponseReport(
        chatbotId,
        fromDate,
        toDate,
        token
      );
      setRateReport(report);
    } catch (error) {
      console.error("Failed to fetch rate report:", error);
      toast.error("Failed to load rate report");
    } finally {
      setReportLoading(false);
    }
  };

  const fetchUsageTokenByChatbot = async () => {
    try {
      setReportLoading(true);
      const token = user.accessToken;
      const fromDate = dayjs(dateRange.startDate)
        .startOf("day")
        .add(7, "hour")
        .toISOString();
      const toDate = dayjs(dateRange.endDate)
        .endOf("day")
        .add(7, "hour")
        .toISOString();

      const report = await getUsageTokenByChatbot(
        chatbotId,
        fromDate,
        toDate,
        token
      );
      setUsageToken(report);
    } catch (error) {
      console.error("Failed to fetch usage token report:", error);
      toast.error("Failed to load usage token report");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    // Reset state when chatbotId or date range changes
    setChatHistory([]);
    setRateReport(null);
    setUsageToken([]);

    if (chatbotId) {
      fetchChatHistory();
      fetchRateReport();
      fetchUsageTokenByChatbot();
    }
  }, [dateRange, chatbotId]);

  const reportTabs = [
    { label: "User statistics", value: "report1" },
    { label: "Token statistics", value: "report2" },
    { label: "Request statistics", value: "report3" },
    { label: "Chat history", value: "report4" },
  ];

  const currentTabIndex = reportTabs.findIndex(
    (tab) => tab.value === activeReportTab
  );

  const handleNextTab = () => {
    const nextIndex = (currentTabIndex + 1) % reportTabs.length;
    setActiveReportTab(reportTabs[nextIndex].value);
  };

  const handlePrevTab = () => {
    const prevIndex =
      (currentTabIndex - 1 + reportTabs.length) % reportTabs.length;
    setActiveReportTab(reportTabs[prevIndex].value);
  };

  const handleAgentDetails = () => {
    if (loading) return;
    navigate(`/user-conversation-detail/${chatbotId}`);
  };

  const handleButtonClick = (component) => {
    setActiveComponent(component);
    setIsSidebarOpen(false);
    if (component !== "agentAnalysis") {
      setActiveReportTab("report1");
    }
  };

  const handleReportTabChange = (event, newValue) => {
    setActiveReportTab(newValue);
  };

  const sidebarButtons = [
    {
      icon: <WorkspacesOutlinedIcon sx={{ mr: 1 }} />,
      label: "Information",
      component: "agentInfo",
    },
    {
      icon: <PeopleAltOutlinedIcon sx={{ mr: 1 }} />,
      label: "Members",
      component: "agentMember",
    },
    {
      icon: <BarChartOutlinedIcon sx={{ mr: 1 }} />,
      label: "Report",
      component: "agentAnalysis",
    },
    {
      icon: <SettingsIcon sx={{ mr: 1 }} />,
      label: "Chatbot configuration",
      component: "agentEdit",
    },
    {
      icon: <TextsmsOutlinedIcon sx={{ mr: 1 }} />,
      label: "Chat with bot",
      onClick: handleAgentDetails,
    },
  ];

  const SidebarContent = (
    <Box
      sx={{
        flexDirection: "column",
        px: 3,
        py: 5,
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        mb: 1,
        marginTop: { xs: "3rem" },
        backgroundColor: "white",
      }}
    >
      <Button
        sx={{
          color: "black",
          borderRadius: "10px",
          "&:hover": { backgroundColor: "#f1f1f1" },
        }}
        onClick={() => navigate("/workspace")}
      >
        <ArrowBackIcon />
        <Typography variant="h6" fontWeight="bold" paddingRight="0.5rem">
          Back
        </Typography>
      </Button>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          textAlign: "center",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress size={24} sx={{ color: "#5E33A8" }} />
          </Box>
        ) : agentDetails ? (
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              color: "#1976d2 !important",
              p: 1.5,
              maxWidth: { xs: 150, sm: 200 },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={agentDetails.name || "Chatbot"}
          >
            {agentDetails.name || "Chatbot"}
          </Typography>
        ) : (
          <Typography variant="h6" color="#1976d2" sx={{ p: 1.5 }}>
            Failed to load agent name
          </Typography>
        )}
        {sidebarButtons.map((button, index) => (
          <Button
            key={index}
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              padding: 1.5,
              textTransform: "none",
              color: "black",
              backgroundColor:
                activeComponent === button.component
                  ? "#F1E9FF"
                  : "transparent",
              fontWeight:
                activeComponent === button.component ? "bold" : "normal",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#d8caf2", fontWeight: "bold" },
            }}
            onClick={() =>
              button.onClick
                ? button.onClick()
                : handleButtonClick(button.component)
            }
          >
            {button.icon}
            <Typography variant="body2">{button.label}</Typography>
          </Button>
        ))}
      </Box>
    </Box>
  );

  const renderReportContent = () => (
    <Box sx={{ width: "100%" }}>
      {isMobile ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
            pb: 1,
            mt: "6rem",
          }}
        >
          <IconButton
            onClick={handlePrevTab}
            disabled={currentTabIndex === 0}
            sx={{ color: currentTabIndex === 0 ? "text.disabled" : "#5E33A8" }}
          >
            <ArrowLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            {reportTabs[currentTabIndex].label}
          </Typography>
          <IconButton
            onClick={handleNextTab}
            disabled={currentTabIndex === reportTabs.length - 1}
            sx={{
              color:
                currentTabIndex === reportTabs.length - 1
                  ? "text.disabled"
                  : "#5E33A8",
            }}
          >
            <ArrowRightIcon />
          </IconButton>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Tabs
            value={activeReportTab}
            onChange={handleReportTabChange}
            aria-label="report tabs"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              mb: 3,
              "& .MuiTabs-indicator": { backgroundColor: "#5E33A8" },
            }}
          >
            {reportTabs.map((tab) => (
              <Tab
                key={tab.value}
                sx={{
                  "&.Mui-selected": { color: "#5E33A8", fontWeight: "bold" },
                  "&:hover": { backgroundColor: "rgba(216, 202, 242, 0.2)" },
                  textTransform: "none",
                  fontSize: "0.875rem",
                }}
                label={tab.label}
                value={tab.value}
              />
            ))}
          </Tabs>
          <DateFilter dateRange={dateRange} setDateRange={setDateRange} />
        </Box>
      )}
      {reportLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <CircularProgress sx={{ color: "#7844D3" }} />
          <Typography sx={{ ml: 2 }}>Loading data...</Typography>
        </Box>
      ) : (
        <>
          {activeReportTab === "report1" && (
            <ReportTab1 chatHistory={chatHistory} usageToken={usageToken} />
          )}
          {activeReportTab === "report2" && (
            <ReportTab2 usageToken={usageToken} />
          )}
          {activeReportTab === "report3" && (
            <ReportTab3 chatHistory={chatHistory} />
          )}
          {activeReportTab === "report4" && (
            <ReportTab4 chatHistory={chatHistory} rateReport={rateReport} />
          )}
        </>
      )}
    </Box>
  );

  const renderMainContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress sx={{ color: "#7844D3" }} />
        </Box>
      );
    }
    if (!agentDetails) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
          }}
        >
          <Alert
            sx={{ alignItems: "end" }}
            severity="error"
            action={
              <Button color="inherit" onClick={() => window.location.reload()}>
                RETRY
              </Button>
            }
          >
            Failed to load agent details
          </Alert>
        </Box>
      );
    }
    return (
      <Box sx={{ flex: 1, p: 3 }}>
        {activeComponent === "agentInfo" && (
          <AgentInfo
            agentDetails={agentDetails}
            onRefresh={refetchAgentDetails}
            setAgentDetails={() => {}}
          />
        )}
        {activeComponent === "agentMember" && (
          <AgentMember agentDetails={agentDetails} />
        )}
        {activeComponent === "agentAnalysis" && renderReportContent()}
        {activeComponent === "agentEdit" && (
          <AgentEdit
            setLoading={() => {}}
            onRefresh={refetchAgentDetails}
            agentDetails={agentDetails} // Truyền agentDetails
          />
        )}
        {activeComponent === "agentToken" && (
          <TokenPayment agentDetails={agentDetails} />
        )}
      </Box>
    );
  };

  return (
    <>
      {loading ? (
        <>
          <title>Loading - Erudition</title>
          <meta name="description" content="Loading chatbot details..." />
        </>
      ) : agentDetails ? (
        <>
          <title>
            {agentDetails.name ||
              agentDetails.bot_name ||
              agentDetails.title ||
              agentDetails.chatbot_name ||
              agentDetails.agent_name ||
              agentDetails.display_name ||
              agentDetails.botName ||
              agentDetails.agentName ||
              agentDetails.botDisplayName ||
              `Chatbot ${chatbotId}`}{" "}
            - Erudition
          </title>
        </>
      ) : (
        <>
          <title>Error - Chatbot Not Found - Erudition</title>
          <meta name="description" content="Failed to load chatbot details" />
        </>
      )}
      <Grid container sx={{ height: "100%", overflow: "hidden" }}>
        <Box
          sx={{
            position: "absolute",
            display: { xs: "block", sm: "none" },
            marginTop: { xs: "5rem" },
            marginLeft: "1rem",
            zIndex: 1000,
          }}
        >
          <IconButton
            onClick={() => setIsSidebarOpen(true)}
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: 1,
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
        <Grid
          item
          xs={12}
          sm={2}
          md={2}
          sx={{
            display: { xs: "none", sm: "block" },
            backgroundColor: "#f9f9f9",
          }}
        >
          {SidebarContent}
        </Grid>
        <Drawer
          anchor="left"
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              borderTopRightRadius: "20px",
              width: 240,
              boxShadow: "3px 0px 10px rgba(0,0,0,0.1)",
              backgroundColor: "#f9f9f9",
            },
          }}
        >
          {SidebarContent}
        </Drawer>
        <Grid
          item
          xs={12}
          sm={10}
          md={10}
          mt={8}
          sx={{
            borderLeft: "1px solid #e5e5e5",
            marginTop: { xs: 0, md: "64px", lg: "64px" },
            backgroundColor: "#fff",
          }}
        >
          {renderMainContent()}
        </Grid>
      </Grid>
    </>
  );
};

export default ChatBotDetails;
