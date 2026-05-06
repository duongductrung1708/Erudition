import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import WorkspacesOutlinedIcon from "@mui/icons-material/WorkspacesOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import TextsmsOutlinedIcon from "@mui/icons-material/TextsmsOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";

import AgentInfo from "../../components/agentDetails/AgentInfo";
import AgentMember from "../../components/agentDetails/AgentMember";
import TokenPayment from "../../components/agentDetails/TokenPayment";
import UserStatistic from "../../components/agentDetails/UserStatistic";
import TokenStatistic from "../../components/agentDetails/TokenStatistic";
import RequestStatistic from "../../components/agentDetails/RequestStatistic";
import ChatHistoryDetail from "../ChatHistoryDetail";
import AgentEdit from "../AgentEdit.jsx";

import { getChatbotById } from "../../services/chatbot_api";
import { useAuth } from "../../hooks/AuthProvider";
import useChatbotReportData from "./hooks/useChatbotReportData";
import ChatBotDetailsView from "./ChatBotDetailsView";

const ReportTab1 = React.memo(({ chatHistory, usageToken }) => (
  <UserStatistic chatHistory={chatHistory} usageToken={usageToken} />
));
const ReportTab2 = React.memo(({ usageToken }) => (
  <TokenStatistic usageToken={usageToken} />
));
const ReportTab3 = React.memo(({ chatHistory }) => (
  <RequestStatistic chatHistory={chatHistory} />
));
const ReportTab4 = React.memo(({ chatHistory, rateReport }) => (
  <ChatHistoryDetail chatHistory={chatHistory} rateReport={rateReport} />
));

export default function ChatBotDetailsContainer() {
  const { chatbotId } = useParams();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const [activeComponent, setActiveComponent] = useState("agentInfo");
  const [activeReportTab, setActiveReportTab] = useState("report1");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      if (!token) throw new Error("Access token is missing");
      return await getChatbotById(chatbotId, token);
    },
    enabled: !!chatbotId && !!user?.accessToken,
    onError: (error) => {
      console.error("Failed to fetch chatbot details:", error);
      toast.error("Failed to load chatbot details");
    },
  });

  const { reportLoading, chatHistory, rateReport, usageToken } =
    useChatbotReportData({
      chatbotId,
      accessToken: user?.accessToken,
      dateRange,
    });

  const reportTabs = useMemo(
    () => [
      { label: "User statistics", value: "report1" },
      { label: "Token statistics", value: "report2" },
      { label: "Request statistics", value: "report3" },
      { label: "Chat history", value: "report4" },
    ],
    []
  );

  const currentTabIndex = useMemo(
    () => reportTabs.findIndex((tab) => tab.value === activeReportTab),
    [activeReportTab, reportTabs]
  );

  const handleNextTab = useCallback(() => {
    const nextIndex = (currentTabIndex + 1) % reportTabs.length;
    setActiveReportTab(reportTabs[nextIndex].value);
  }, [currentTabIndex, reportTabs]);

  const handlePrevTab = useCallback(() => {
    const prevIndex = (currentTabIndex - 1 + reportTabs.length) % reportTabs.length;
    setActiveReportTab(reportTabs[prevIndex].value);
  }, [currentTabIndex, reportTabs]);

  const handleReportTabChange = useCallback((event, newValue) => {
    setActiveReportTab(newValue);
  }, []);

  const handleAgentDetails = useCallback(() => {
    if (loading) return;
    navigate(`/user-conversation-detail/${chatbotId}`);
  }, [chatbotId, loading, navigate]);

  const sidebarButtons = useMemo(
    () => [
      {
        key: "info",
        icon: <WorkspacesOutlinedIcon sx={{ mr: 1 }} />,
        label: "Information",
        component: "agentInfo",
      },
      {
        key: "members",
        icon: <PeopleAltOutlinedIcon sx={{ mr: 1 }} />,
        label: "Members",
        component: "agentMember",
      },
      {
        key: "report",
        icon: <BarChartOutlinedIcon sx={{ mr: 1 }} />,
        label: "Report",
        component: "agentAnalysis",
      },
      {
        key: "config",
        icon: <SettingsIcon sx={{ mr: 1 }} />,
        label: "Chatbot configuration",
        component: "agentEdit",
      },
      {
        key: "chat",
        icon: <TextsmsOutlinedIcon sx={{ mr: 1 }} />,
        label: "Chat with bot",
        onClick: handleAgentDetails,
      },
    ],
    [handleAgentDetails]
  );

  const handleSelectSidebarButton = useCallback((button) => {
    if (button.onClick) {
      button.onClick();
      return;
    }
    setActiveComponent(button.component);
    setIsSidebarOpen(false);
    if (button.component !== "agentAnalysis") {
      setActiveReportTab("report1");
    }
  }, []);

  const reportContent = useMemo(() => {
    if (activeReportTab === "report1") {
      return <ReportTab1 chatHistory={chatHistory} usageToken={usageToken} />;
    }
    if (activeReportTab === "report2") {
      return <ReportTab2 usageToken={usageToken} />;
    }
    if (activeReportTab === "report3") {
      return <ReportTab3 chatHistory={chatHistory} />;
    }
    return <ReportTab4 chatHistory={chatHistory} rateReport={rateReport} />;
  }, [activeReportTab, chatHistory, rateReport, usageToken]);

  const mainContent = useMemo(() => {
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
        {activeComponent === "agentEdit" && (
          <AgentEdit
            setLoading={() => {}}
            onRefresh={refetchAgentDetails}
            agentDetails={agentDetails}
          />
        )}
        {activeComponent === "agentToken" && (
          <TokenPayment agentDetails={agentDetails} />
        )}
      </Box>
    );
  }, [activeComponent, agentDetails, loading, refetchAgentDetails]);

  const reportUi = useMemo(
    () => ({
      isMobile,
      activeReportTab,
      reportTabs,
      currentTabIndex,
      onPrevTab: handlePrevTab,
      onNextTab: handleNextTab,
      onTabChange: handleReportTabChange,
      dateRange,
      onDateRangeChange: setDateRange,
      reportLoading,
      content: reportContent,
    }),
    [
      activeReportTab,
      currentTabIndex,
      dateRange,
      handleNextTab,
      handlePrevTab,
      handleReportTabChange,
      isMobile,
      reportContent,
      reportLoading,
      reportTabs,
    ]
  );

  return (
    <>
      <title>
        {(agentDetails?.name || `Chatbot ${chatbotId}`) + " - Erudition"}
      </title>
    <ChatBotDetailsView
      chatbotId={chatbotId}
      theme={theme}
      isMobile={isMobile}
      isSidebarOpen={isSidebarOpen}
      onOpenSidebar={() => setIsSidebarOpen(true)}
      onCloseSidebar={() => setIsSidebarOpen(false)}
      sidebarButtons={sidebarButtons}
      sidebarLoading={loading}
      agentName={agentDetails?.name}
      activeComponent={activeComponent}
      onBack={() => navigate("/workspace")}
      onSelectSidebarButton={handleSelectSidebarButton}
      mainContent={mainContent}
      reportUi={reportUi}
    />
    </>
  );
}

