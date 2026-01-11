import React, {useEffect, useState} from "react";
import {
  Box,
  Card,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DateRangePicker} from "@mui/x-date-pickers-pro/DateRangePicker";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {useAuth} from "../../hooks/AuthProvider";
import {useParams} from "react-router-dom";
import {filterChatHistoryByChatbot} from "../../services/statistics_api";

const AgentAnalysis = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();
  const { chatbotId } = useParams();

  // State
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);
  const [chatHistory, setChatHistory] = useState([]);
  const [filteredChatHistory, setFilteredChatHistory] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Chat History with proper parameters
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setIsLoading(true);
        const token = user.accessToken;
        const params = {
          chatbot_id: chatbotId,
          skip: 0,
          limit: 1000, // Increased limit to get more data
          from_date: dayjs().subtract(30, "day").toISOString(), // Wider initial date range
          to_date: dayjs().toISOString(),
          filter_email: "",
        };

        const response = await filterChatHistoryByChatbot(params, token);
        setChatHistory(response.data || response); // Handle both array and object responses
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        setIsLoading(false);
      }
    };
    fetchChatHistory();
  }, [chatbotId, user.accessToken]);

  // Filter chat history based on date range with proper date handling
  useEffect(() => {
    if (chatHistory.length > 0 && dateRange[0] && dateRange[1]) {
      const filteredData = chatHistory.filter((entry) => {
        if (!entry.date_time) return false;

        try {
          const entryDate = dayjs(entry.date_time);
          return (
            entryDate.isAfter(dateRange[0].startOf("day")) &&
            entryDate.isBefore(dateRange[1].endOf("day"))
          );
        } catch (e) {
          console.error("Error parsing date:", entry.date_time, e);
          return false;
        }
      });
      setFilteredChatHistory(filteredData);
      setUserStats(analyzeUserData(filteredData));
    }
  }, [dateRange, chatHistory]);

  // Improved user data analysis with error handling
  const analyzeUserData = (data) => {
    const stats = {};
    data.forEach(({ user_email, usage_tokens, response_time }) => {
      if (!user_email) return;

      if (!stats[user_email]) {
        stats[user_email] = {
          totalTokens: 0,
          totalRequests: 0,
          totalResponseTime: 0,
        };
      }

      stats[user_email].totalTokens += parseInt(usage_tokens) || 0;
      stats[user_email].totalRequests += 1;

      // Handle response time conversion
      const responseTime = parseResponseTime(response_time);
      stats[user_email].totalResponseTime += responseTime;
    });

    // Calculate averages
    Object.keys(stats).forEach((email) => {
      stats[email].averageResponseTime =
        stats[email].totalResponseTime / stats[email].totalRequests;
    });

    return stats;
  };

  // Helper function to parse response time (handles "2.15 seconds" format)
  const parseResponseTime = (responseTime) => {
    if (typeof responseTime === "number") return responseTime;
    if (typeof responseTime === "string") {
      const numericValue = parseFloat(responseTime.replace(/[^\d.]/g, ""));
      return isNaN(numericValue) ? 0 : numericValue;
    }
    return 0;
  };

  // Calculate usage tokens by date with error handling
  const calculateUsageTokensByDate = (data) => {
    const tokensByDate = {};

    data.forEach((entry) => {
      if (!entry.date_time) return;

      try {
        const date = dayjs(entry.date_time).format("YYYY-MM-DD");
        tokensByDate[date] =
          (tokensByDate[date] || 0) + (parseInt(entry.usage_tokens) || 0);
      } catch (e) {
        console.error("Error processing entry:", entry);
      }
    });

    return Object.entries(tokensByDate)
      .map(([date, totalTokens]) => ({ date, totalTokens }))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
  };

  // Calculate requests by date with error handling
  const calculateRequestsByDate = (data) => {
    const requestsByDate = {};

    data.forEach((entry) => {
      if (!entry.date_time) return;

      try {
        const date = dayjs(entry.date_time).format("YYYY-MM-DD");
        requestsByDate[date] = (requestsByDate[date] || 0) + 1;
      } catch (e) {
        console.error("Error processing entry:", entry);
      }
    });

    return Object.entries(requestsByDate)
      .map(([date, totalRequests]) => ({ date, totalRequests }))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
  };

  if (isLoading) {
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

  // Prepare chart data
  const tokensData = calculateUsageTokensByDate(filteredChatHistory);
  const requestsData = calculateRequestsByDate(filteredChatHistory);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          p: 3,
          maxWidth: isMobile ? "100%" : "1200px",
          margin: "auto",
          height: "90vh",
          overflowY: "auto",
          marginTop: isMobile ? "5rem" : "auto",
        }}
      >
        <Typography variant="h4" fontWeight="bold" mb={3} textAlign="center">
          Agent Report
        </Typography>

        {/* Date Range Picker */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <DateRangePicker
            value={dateRange}
            onChange={(newRange) => setDateRange(newRange)}
            renderInput={(startProps, endProps) => (
              <>
                <TextField {...startProps} sx={{ mr: 2 }} />
                <TextField {...endProps} />
              </>
            )}
          />
        </Box>

        {/* User Statistics Table */}
        <Typography variant="h6" mb={2}>
          User Statistics
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>User Email</b>
                </TableCell>
                <TableCell>
                  <b>Total Tokens</b>
                </TableCell>
                <TableCell>
                  <b>Total Requests</b>
                </TableCell>
                <TableCell>
                  <b>Avg Response Time (s)</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(userStats).length > 0 ? (
                Object.keys(userStats).map((email) => (
                  <TableRow key={email}>
                    <TableCell>{email}</TableCell>
                    <TableCell>{userStats[email].totalTokens}</TableCell>
                    <TableCell>{userStats[email].totalRequests}</TableCell>
                    <TableCell>
                      {userStats[email].averageResponseTime.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: "center" }}>
                    No data available for selected date range
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Charts */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                p: 2,
                backgroundColor: "white",
                boxShadow: 3,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" textAlign="center" mb={2}>
                Total Token Usage
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tokensData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => dayjs(date).format("MM-DD")}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [value, "Total Tokens"]}
                    labelFormatter={(date) =>
                      dayjs(date).format("MMM DD, YYYY")
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalTokens"
                    stroke="#D3366F"
                    activeDot={{ r: 8 }}
                    name="Token Usage"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                p: 2,
                backgroundColor: "white",
                boxShadow: 3,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" textAlign="center" mb={2}>
                Total Requests
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={requestsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => dayjs(date).format("MM-DD")}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [value, "Total Requests"]}
                    labelFormatter={(date) =>
                      dayjs(date).format("MMM DD, YYYY")
                    }
                  />
                  <Legend />
                  <Bar dataKey="totalRequests" fill="#865AE1" name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default AgentAnalysis;
