import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";
import adminApi from "../../services/admin_api";
import { toast } from "react-toastify";
import {
  filterChatHistoryByChatbot,
  getUsageTokenByChatbot,
} from "../../services/statistics_api";
import { styled } from "@mui/material/styles";

const TOKEN_PRICE_PER_1000 = 10;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[6],
    backgroundColor: "#F5F7FA",
    animation: "fadeIn 0.3s ease-in",
    "@keyframes fadeIn": {
      from: { opacity: 0, transform: "translateY(20px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    backgroundColor: "#8B5CF6",
  },
}));

const ChatbotStatsDialog = ({
  open,
  onClose,
  userEmail,
  accessToken,
  isAdmin,
  isChatbotCreator,
  userId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [chatbots, setChatbots] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [usageRecords, setUsageRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [fromDate, setFromDate] = useState(dayjs().subtract(7, "day"));
  const [endDate, setEndDate] = useState(dayjs());
  const [selectedUserChat, setSelectedUserChat] = useState(null);
  const [chatDetailDialogOpen, setChatDetailDialogOpen] = useState(false);
  const [chartType, setChartType] = useState("tokens");
  const [datePickerDialogOpen, setDatePickerDialogOpen] = useState(false);
  const cacheRef = useRef({}); // Cache for API responses
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchChatbots();
    }
  }, [open, userEmail, userId]);

  const fetchChatbots = async () => {
    setLoading(true);
    try {
      const allChatbots = await adminApi.getChatbot(accessToken);
      let filteredChatbots = [];

      if (isAdmin) {
        filteredChatbots = allChatbots.filter((bot) => {
          const isOwnerById = bot.owner_id === userId;
          const isOwnerByEmail = bot.chatbot_creator?.email === userEmail;
          const isUser = bot.chatbot_users?.some(
            (user) => user.email === userEmail
          );
          return isOwnerById || isOwnerByEmail || isUser;
        });
      } else if (isChatbotCreator) {
        filteredChatbots = allChatbots.filter((bot) => {
          const isOwnerById = bot.owner_id === userId;
          const isOwnerByEmail = bot.chatbot_creator?.email === userEmail;
          return isOwnerById || isOwnerByEmail;
        });
      } else {
        filteredChatbots = allChatbots.filter((bot) => {
          const isUser = bot.chatbot_users?.some(
            (user) => user.email === userEmail
          );
          return isUser;
        });
      }

      setChatbots([{ id: "all", name: "All Chatbots" }, ...filteredChatbots]);

      if (filteredChatbots.length > 0) {
        setSelectedChatbot("all");
      } else {
        setSelectedChatbot(null);
        setChatHistory([]);
        setUsageRecords([]);
      }
    } catch (error) {
      console.error("Error fetching chatbots:", error);
      toast.error("Failed to fetch chatbots");
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (chatbotId) => {
    setLoading(true);
    try {
      const now = dayjs();
      const isEndDateToday = endDate.isSame(now, "day");

      const fromDateStr = fromDate.startOf("day").add(7, "hour").toISOString();
      const toDateStr = isEndDateToday
        ? now.toISOString()
        : endDate.endOf("day").add(7, "hour").toISOString();

      let history = [];
      if (chatbotId === "all") {
        // Fetch history for all chatbots
        const allHistory = await Promise.all(
          chatbots
            .filter((bot) => bot.id !== "all")
            .map((bot) =>
              filterChatHistoryByChatbot(
                {
                  chatbot_id: bot.id,
                  skip: 0,
                  limit: 0,
                  filter_email: userEmail,
                  from_date: fromDateStr,
                  to_date: toDateStr,
                },
                accessToken
              ).catch((err) => {
                console.error(`Error fetching history for chatbot ${bot.id}:`, err);
                return []; // Return empty array on error
              })
            )
        );
        history = allHistory.flat();
      } else {
        const filterParams = {
          chatbot_id: chatbotId,
          skip: 0,
          limit: 0,
          filter_email: userEmail,
          from_date: fromDateStr,
          to_date: toDateStr,
        };

        history = await filterChatHistoryByChatbot(
          filterParams,
          accessToken
        );
      }

      // Filter history by date range (inclusive)
      const filteredHistory = (history || []).filter((chat) => {
        const chatDate = dayjs(chat.date_time);
        const fromDateStart = fromDate.startOf("day").add(7, "hour");
        const endDateEnd = endDate.endOf("day").add(7, "hour");
        return (
          (chatDate.isAfter(fromDateStart, "minute") || chatDate.isSame(fromDateStart, "minute")) &&
          (chatDate.isBefore(endDateEnd, "minute") || chatDate.isSame(endDateEnd, "minute"))
        );
      });

      // Cache the result
      const cacheKey = getCacheKey(chatbotId, "requests", fromDate, endDate);
      cacheRef.current[cacheKey] = filteredHistory;
      
      setChatHistory(filteredHistory);
      setSelectedChatbot(chatbotId);
    } catch (error) {
      console.error(
        "Error fetching chat history:",
        error.response?.status,
        error.response?.data || error.message
      );
      toast.error("No chat history data available");
      setChatHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate cache key
  const getCacheKey = useCallback((chatbotId, chartType, fromDate, endDate) => {
    return `${chatbotId}-${chartType}-${fromDate.format('YYYY-MM-DD')}-${endDate.format('YYYY-MM-DD')}`;
  }, []);

  const fetchUsageTokens = async (chatbotId) => {
    setLoading(true);
    try {
      const now = dayjs();
      const isEndDateToday = endDate.isSame(now, "day");

      const fromDateStr = fromDate.startOf("day").add(7, "hour").toISOString();
      const toDateStr = isEndDateToday
        ? now.toISOString()
        : endDate.endOf("day").add(7, "hour").toISOString();

      let records = [];
      if (chatbotId === "all") {
        const allRecords = await Promise.all(
          chatbots
            .filter((bot) => bot.id !== "all")
            .map((bot) =>
              getUsageTokenByChatbot(
                bot.id,
                fromDateStr,
                toDateStr,
                accessToken
              ).catch((err) => {
                console.error(`Error fetching tokens for chatbot ${bot.id}:`, err);
                return []; // Return empty array on error
              })
            )
        );
        records = allRecords.flat();
      } else {
        try {
          records = await getUsageTokenByChatbot(
            chatbotId,
            fromDateStr,
            toDateStr,
            accessToken
          );
        } catch (error) {
          records = [];
        }
      }
      
      // Filter records by user_email and date range (inclusive)
      const filteredRecords = records.filter((record) => {
        const matchesEmail = record.user_email === userEmail;
        const recordDate = dayjs(record.date_time);
        const fromDateStart = fromDate.startOf("day");
        const endDateEnd = endDate.endOf("day");
        const matchesDate = 
          (recordDate.isAfter(fromDateStart) || recordDate.isSame(fromDateStart, "day")) &&
          (recordDate.isBefore(endDateEnd) || recordDate.isSame(endDateEnd, "day"));
        
        return matchesEmail && matchesDate;
      });

      // Cache the result
      const cacheKey = getCacheKey(chatbotId, "tokens", fromDate, endDate);
      cacheRef.current[cacheKey] = filteredRecords;
      
      setUsageRecords(filteredRecords);
      setSelectedChatbot(chatbotId);
    } catch (error) {
      console.error(
        "Error fetching usage tokens:",
        error.response?.status,
        error.response?.data || error.message
      );
      toast.error("No token usage data available");
      setUsageRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = useCallback((chatbotId) => {
    if (!chatbotId) return;
    
    const cacheKey = getCacheKey(chatbotId, chartType, fromDate, endDate);
    
    // Check cache first
    if (cacheRef.current[cacheKey]) {
      if (chartType === "tokens") {
        setUsageRecords(cacheRef.current[cacheKey]);
      } else {
        setChatHistory(cacheRef.current[cacheKey]);
      }
      setSelectedChatbot(chatbotId);
      return;
    }

    if (chartType === "tokens") {
      fetchUsageTokens(chatbotId);
    } else {
      fetchChatHistory(chatbotId);
    }
  }, [chartType, fromDate, endDate, getCacheKey]);

  // Debounced fetch data
  useEffect(() => {
    if (selectedChatbot) {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new timer (debounce 300ms for date changes)
      debounceTimerRef.current = setTimeout(() => {
        fetchData(selectedChatbot);
      }, 300);
      
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }
  }, [selectedChatbot, fromDate, endDate, chartType, fetchData]);

  const prepareChartData = () => {
    if (chartType === "tokens") {
      const dailyStats = usageRecords.reduce((acc, record) => {
        const date = dayjs(record.date_time)
          .subtract(7, "hour")
          .format("YYYY-MM-DD");
        if (!acc[date]) {
          acc[date] = { date, totalTokens: 0 };
        }
        acc[date].totalTokens += record.usage_tokens || 0;
        return acc;
      }, {});

      const chartData = Object.values(dailyStats).map((stat) => ({
        date: stat.date,
        tokens: stat.totalTokens,
        cost: (stat.totalTokens / 1000) * TOKEN_PRICE_PER_1000,
        requests: 0,
      }));
      return chartData;
    } else {
      const dailyStats = chatHistory.reduce((acc, chat) => {
        const date = dayjs(chat.date_time)
          .subtract(7, "hour")
          .format("YYYY-MM-DD");
        if (!acc[date]) {
          acc[date] = {
            date,
            totalTokens: 0,
            totalChats: 0,
          };
        }
        acc[date].totalTokens += chat.usage_tokens || 0;
        acc[date].totalChats += 1;
        return acc;
      }, {});

      const chartData = Object.values(dailyStats).map((stat) => ({
        date: stat.date,
        tokens: stat.totalTokens,
        cost: (stat.totalTokens / 1000) * TOKEN_PRICE_PER_1000,
        requests: stat.totalChats,
      }));
      return chartData;
    }
  };

  const chartData = prepareChartData();

  const getYAxisLabel = () => {
    switch (chartType) {
      case "tokens":
        return "Total tokens / Cost (VND)";
      case "requests":
        return "Total requests";
      default:
        return "";
    }
  };

  const renderChart = () => {
    if (chartType === "tokens") {
      return (
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: isMobile ? 10 : 30,
            left: isMobile ? 0 : 20,
            bottom: isMobile ? 80 : 60,
          }}
        >
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fill: "#1F2937", fontSize: isMobile ? 12 : 14 }}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="#7844D3"
            tick={{ fill: "#1F2937" }}
            label={{
              value: "Tokens",
              angle: -90,
              position: "insideLeft",
              fill: "#1F2937",
              fontWeight: "bold",
              dx: -20,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#FF7300"
            tick={{ fill: "#1F2937" }}
            label={{
              value: "Cost (VND)",
              angle: -90,
              position: "insideRight",
              fill: "#1F2937",
              fontWeight: "bold",
            }}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #7844D3",
              borderRadius: theme.shape.borderRadius,
              color: "#1F2937",
            }}
            formatter={(value, name) =>
              name === "Cost"
                ? [`${value.toFixed(2)} ₫`, "Cost"]
                : [value, "Tokens"]
            }
          />
          <Legend
            align="left"
            wrapperStyle={{ color: "#1F2937", fontWeight: "bold" }}
          />
          <Bar
            yAxisId="left"
            dataKey="tokens"
            name="Tokens"
            fill="#7844D3"
            barSize={isMobile ? 40 : 63}
            opacity={0.9}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            name="Cost"
            stroke="#FF7300"
            strokeWidth={2}
            dot={{ r: 4, fill: "#FF7300" }}
          />
        </ComposedChart>
      );
    } else {
      return (
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: isMobile ? 10 : 30,
            left: isMobile ? 0 : 20,
            bottom: isMobile ? 80 : 60,
          }}
          onClick={(data) => {
            if (data && data.activePayload) {
              const date = data.activePayload[0].payload.date;
              const chatsOnDate = chatHistory.filter(
                (chat) => dayjs(chat.date_time).format("YYYY-MM-DD") === date
              );
              if (chatsOnDate.length >= 1) {
                setSelectedUserChat(chatsOnDate[0]);
                setChatDetailDialogOpen(true);
              }
            }
          }}
        >
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fill: "#1F2937", fontSize: isMobile ? 12 : 14 }}
          />
          <YAxis
            tick={{ fill: "#1F2937" }}
            label={{
              value: getYAxisLabel(),
              angle: -90,
              position: "insideLeft",
              offset: -10,
              fill: "#1F2937",
              fontWeight: "bold",
            }}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #7844D3",
              borderRadius: theme.shape.borderRadius,
              color: "#1F2937",
            }}
          />
          <Legend
            align="left"
            wrapperStyle={{ color: "#1F2937", fontWeight: "bold" }}
          />
          <Bar
            dataKey="requests"
            fill="#7844D3"
            barSize={isMobile ? 40 : 63}
            name="Total requests"
            opacity={0.9}
          />
        </BarChart>
      );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <StyledDialog
        open={open}
        onClose={onClose}
        sx={{
          "& .MuiDialog-paper": {
            width: isMobile ? "100%" : "63.25rem",
            height: isMobile ? "100%" : "43.125rem",
            maxWidth: "none",
            maxHeight: "none",
          },
        }}
      >
        <DialogTitle
          sx={{ bgcolor: "#5E33A8", color: "white", fontWeight: "bold", mb: 2 }}
        >
          Chatbot statistics for {userEmail}
        </DialogTitle>
        <DialogContent sx={{ overflowY: "auto", p: 3 }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ height: "70vh" }}
            >
              <CircularProgress sx={{ color: "#5E33A8" }} />
            </Box>
          ) : chatbots.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                borderRadius: theme.shape.borderRadius,
              }}
            >
              <Typography variant="h6" color="#6B7280">
                No chatbots available
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? 2 : 0,
                }}
              >
                <Box
                  sx={{
                    mb: isMobile ? 2 : 0,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  {chatbots.map((bot) => (
                    <Tooltip title={bot.name} key={bot.id}>
                      <StyledButton
                        color="secondary"
                        variant={
                          selectedChatbot === bot.id ? "contained" : "outlined"
                        }
                        onClick={() => fetchData(bot.id)}
                        sx={{
                          bgcolor:
                            selectedChatbot === bot.id
                              ? "#7844D3"
                              : "transparent",
                          color:
                            selectedChatbot === bot.id ? "white" : "#7844D3",
                          borderColor: "#7844D3",
                          "&:hover": {
                            bgcolor:
                              selectedChatbot === bot.id
                                ? "#8B5CF6"
                                : "#F5F3FF",
                            borderColor: "#8B5CF6",
                          },
                          fontSize: isMobile ? "0.75rem" : "0.875rem",
                          py: 0.5,
                          px: 2,
                        }}
                      >
                        {bot.name.length > 20
                          ? `${bot.name.substring(0, 17)}...`
                          : bot.name}
                      </StyledButton>
                    </Tooltip>
                  ))}
                </Box>
                {selectedChatbot && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120, mt: "0.6rem" }}>
                      <InputLabel
                        sx={{
                          "&.Mui-focused": { color: "#5E33A8" },
                          color: "#6B7280",
                        }}
                      >
                        Metric
                      </InputLabel>
                      <Select
                        value={chartType}
                        label="Metric"
                        onChange={(e) => setChartType(e.target.value)}
                        sx={{
                          borderRadius: theme.shape.borderRadius,
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#7844D3",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#5E33A8",
                          },
                          "& .MuiSelect-select": { color: "#1F2937" },
                        }}
                      >
                        <MenuItem value="tokens">Tokens</MenuItem>
                        <MenuItem value="requests">Requests</MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip title="Select date range">
                      <IconButton
                        onClick={() => setDatePickerDialogOpen(true)}
                        sx={{
                          color: "#7844D3",
                          "&:hover": { color: "#8B5CF6" },
                        }}
                      >
                        <CalendarTodayIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {selectedChatbot && (
                <>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "#1F2937", fontWeight: "bold" }}
                  >
                    {chartType === "tokens"
                      ? `Token Usage Statistics (${
                          chatbots.find((bot) => bot.id === selectedChatbot)
                            ?.name || selectedChatbot
                        })`
                      : `Request Statistics (${
                          chatbots.find((bot) => bot.id === selectedChatbot)
                            ?.name || selectedChatbot
                        })`}
                  </Typography>
                  <Box
                    sx={{
                      height: 400,
                      mt: 2,
                      bgcolor: "#FFFFFF",
                      borderRadius: theme.shape.borderRadius,
                      p: 2,
                    }}
                  >
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                      </ResponsiveContainer>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                          bgcolor: "#F9FAFB",
                          borderRadius: theme.shape.borderRadius,
                        }}
                      >
                        <Typography color="#6B7280">
                          No data available for selected date range
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
      </StyledDialog>

      <StyledDialog
        open={datePickerDialogOpen}
        onClose={() => setDatePickerDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ "& .MuiDialog-paper": { maxWidth: isMobile ? "90%" : "400px" } }}
      >
        <DialogTitle
          sx={{ bgcolor: "#5E33A8", color: "white", fontWeight: "bold", mb: 2 }}
        >
          Select date range
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography></Typography>
            <DatePicker
              label="From date"
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              slots={{
                textField: (params) => (
                  <TextField
                    {...params}
                    size="small"
                    color="secondary"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: theme.shape.borderRadius,
                        "&:hover fieldset": { borderColor: "#7844D3" },
                        "&.Mui-focused fieldset": { borderColor: "#5E33A8" },
                      },
                    }}
                  />
                ),
              }}
            />
            <DatePicker
              label="To date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slots={{
                textField: (params) => (
                  <TextField
                    {...params}
                    size="small"
                    color="secondary"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: theme.shape.borderRadius,
                        "&:hover fieldset": { borderColor: "#7844D3" },
                        "&.Mui-focused fieldset": { borderColor: "#5E33A8" },
                      },
                    }}
                  />
                ),
              }}
              minDate={fromDate}
            />
            <StyledButton
              variant="outlined"
              onClick={() => {
                setFromDate(dayjs().subtract(7, "day"));
                setEndDate(dayjs());
                setDatePickerDialogOpen(false);
              }}
              sx={{
                color: "#7844D3",
                borderColor: "#7844D3",
                "&:hover": { borderColor: "#8B5CF6", bgcolor: "#F5F3FF" },
              }}
            >
              Reset to last 7 days
            </StyledButton>
          </Stack>
        </DialogContent>
      </StyledDialog>

      <StyledDialog
        open={chatDetailDialogOpen}
        onClose={() => setChatDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{ "& .MuiDialog-paper": { maxWidth: isMobile ? "90%" : "600px" } }}
      >
        <DialogTitle
          sx={{ bgcolor: "#5E33A8", color: "white", fontWeight: "bold" }}
        >
          Chat details
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedUserChat && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography sx={{ color: "#1F2937" }}>
                <strong>User Query:</strong> {selectedUserChat.user_query}
              </Typography>
              <Typography sx={{ color: "#1F2937" }}>
                <strong>Rewrite Query:</strong> {selectedUserChat.rewrite_query}
              </Typography>
              <Typography sx={{ color: "#1F2937" }}>
                <strong>Response:</strong> {selectedUserChat.response || "N/A"}
              </Typography>
              <Typography sx={{ color: "#1F2937" }}>
                <strong>Tokens Used:</strong> {selectedUserChat.usage_tokens}
              </Typography>
              <Typography sx={{ color: "#1F2937" }}>
                <strong>Response Time:</strong> {selectedUserChat.response_time}
              </Typography>
              <Typography sx={{ color: "#1F2937" }}>
                <strong>Date:</strong> {selectedUserChat.date_time}
              </Typography>
              <Typography sx={{ color: "#1F2937" }}>
                <strong>Report:</strong> {selectedUserChat.report || "None"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogContent
          sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}
        >
          <StyledButton
            onClick={() => setChatDetailDialogOpen(false)}
            sx={{
              color: "#7844D3",
              "&:hover": { bgcolor: "#F5F3FF" },
            }}
          >
            Close
          </StyledButton>
        </DialogContent>
      </StyledDialog>
    </LocalizationProvider>
  );
};

export default ChatbotStatsDialog;