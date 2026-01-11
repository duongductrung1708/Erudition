import React, { useState, useEffect } from "react";
import { Typography, Box, CircularProgress, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import adminApi from "../../services/admin_api";
import { useAuth } from "../../hooks/AuthProvider";
import dayjs from "dayjs";

const TOKEN_PRICE_PER_1000 = 10;

const StaticsChatbot = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [chatbots, setChatbots] = useState([]);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState(dayjs().subtract(7, "day"));
  const [toDate, setToDate] = useState(dayjs());

  useEffect(() => {
    const fetchChatbots = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!user || !user.isAdmin) {
          setError("Admin privileges required");
          setIsLoading(false);
          return;
        }
        const params = {
          from_date: fromDate.add(7, "hour").toISOString(),
          to_date: toDate.add(7, "hour").toISOString(),
        };
        const response = await adminApi.getChatbotsUsageTokens(
          user.accessToken,
          params
        );
        setChatbots(response || []);
      } catch (err) {
        console.error(
          "GetChatbotsUsageTokens Error:",
          err.response?.data || err.message
        );
        if (err.message?.includes("expired")) {
          logout();
          return;
        }
        setError(err.message || "Failed to fetch chatbots");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatbots();
  }, [user, fromDate, toDate, logout]);

  // Calculate total token usage
  const totalTokenUsage = chatbots.reduce(
    (sum, chatbot) => sum + (chatbot.total_usage_tokens || 0),
    0
  );

  // Prepare chart data
  const chartData = chatbots.map((chatbot) => ({
    name: chatbot.name,
    totalTokens: chatbot.total_usage_tokens || 0,
    totalCost: Math.round(
      (chatbot.total_usage_tokens * TOKEN_PRICE_PER_1000) / 1000
    ), // Round to avoid decimals for VND
    creator: chatbot.chatbot_creator?.full_name || "Unknown",
    organization: chatbot.organization || "N/A",
  }));

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress sx={{ color: "#5E33A8" }} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Box color="error.main">
          <Typography>{error}</Typography>
        </Box>
      )}

      {/* Total Token Usage and Date Filters */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Total token usage by date: {totalTokenUsage.toLocaleString()}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box display="flex" gap={2}>
              <DatePicker
                label="From date"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
              <DatePicker
                label="To date"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
            </Box>
          </LocalizationProvider>
        </Box>

        {/* Combined chart */}
        <Box sx={{ height: 400, mt: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                height={70}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                tickFormatter={(value) => {
                  const maxLength = 10;
                  return value.length > maxLength
                    ? `${value.substring(0, maxLength)}...`
                    : value;
                }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#8884d8"
                label={{
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#ff7300"
                label={{
                  angle: 90,
                  position: "insideRight",
                }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Tokens used")
                    return [value.toLocaleString(), name];
                  if (name === "Total cost (₫)")
                    return [`${value.toLocaleString("vi-VN")} ₫`, name];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="totalTokens"
                name="Tokens used"
                fill="#8884d8"
                barSize={60}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalCost"
                name="Total cost (₫)"
                stroke="#ff7300"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>

        {/* Additional information table (commented out) */}
        {/* <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Detailed Chatbot Usage
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Chatbot Name</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Organization</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Creator</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Tokens Used</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Estimated Cost</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px' }}>{row.name}</td>
                    <td style={{ padding: '8px' }}>{row.organization}</td>
                    <td style={{ padding: '8px' }}>{row.creator}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{row.totalTokens.toLocaleString()}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{row.totalCost.toLocaleString("vi-VN")} ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box> */}
      </Box>
    </Box>
  );
};

export default StaticsChatbot;
