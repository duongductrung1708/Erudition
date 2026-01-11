import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import dayjs from "dayjs";

const TOKEN_PRICE_PER_1000 = 10;

const UserStatistic = ({ chatHistory, usageToken }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [userStats, setUserStats] = useState([]);
  const [tokenStats, setTokenStats] = useState([]);
  const [chartType, setChartType] = useState("tokens");
  const [activeMethods, setActiveMethods] = useState({
    message: true,
    document: true,
  });

  // Cập nhật dữ liệu khi chatHistory thay đổi
  useEffect(() => {
    if (chatHistory.length > 0) {
      setUserStats(prepareChartData(chatHistory));
    }
  }, [chatHistory]);

  // Cập nhật dữ liệu token khi usageToken thay đổi
  useEffect(() => {
    if (usageToken && usageToken.length > 0) {
      setTokenStats(prepareTokenData(usageToken));
    }
  }, [usageToken]);

  // Chuẩn bị dữ liệu cho biểu đồ từ chatHistory
  const prepareChartData = (data) => {
    const statsMap = {};

    data.forEach(({ user_email, usage_tokens, response_time }) => {
      if (!user_email) return;

      if (!statsMap[user_email]) {
        statsMap[user_email] = {
          email: user_email,
          totalTokens: 0,
          totalRequests: 0,
          totalResponseTime: 0,
          totalCost: 0,
        };
      }

      const tokens = parseInt(usage_tokens) || 0;
      statsMap[user_email].totalTokens += tokens;
      statsMap[user_email].totalRequests += 1;
      statsMap[user_email].totalResponseTime +=
        parseResponseTime(response_time);
      statsMap[user_email].totalCost += (tokens / 1000) * TOKEN_PRICE_PER_1000;
    });

    return Object.values(statsMap).map((user) => ({
      ...user,
      averageResponseTime:
        user.totalRequests > 0
          ? user.totalResponseTime / user.totalRequests
          : 0,
      totalCost: Math.round(user.totalCost), // Round to avoid decimals for VND
    }));
  };

  // Chuẩn bị dữ liệu token từ usageToken
  const prepareTokenData = (data) => {
    const statsMap = {};

    data.forEach((entry) => {
      if (!entry.user_email || !activeMethods[entry.method]) return;

      const tokens = parseInt(entry.usage_tokens) || 0;
      const cost = (tokens / 1000) * TOKEN_PRICE_PER_1000;

      if (!statsMap[entry.user_email]) {
        statsMap[entry.user_email] = {
          email: entry.user_email,
          totalTokens: 0,
          totalCost: 0,
          messageTokens: 0,
          documentTokens: 0,
          messageCost: 0,
          documentCost: 0,
        };
      }

      statsMap[entry.user_email].totalTokens += tokens;
      statsMap[entry.user_email].totalCost += cost;

      if (entry.method === "message") {
        statsMap[entry.user_email].messageTokens += tokens;
        statsMap[entry.user_email].messageCost += cost;
      } else if (entry.method === "document") {
        statsMap[entry.user_email].documentTokens += tokens;
        statsMap[entry.user_email].documentCost += cost;
      }
    });

    return Object.values(statsMap).map((user) => ({
      ...user,
      totalCost: Math.round(user.totalCost), // Round to avoid decimals for VND
      messageCost: Math.round(user.messageCost), // Round to avoid decimals for VND
      documentCost: Math.round(user.documentCost), // Round to avoid decimals for VND
    }));
  };

  const parseResponseTime = (responseTime) => {
    if (typeof responseTime === "number") return responseTime;
    if (typeof responseTime === "string") {
      const numericValue = parseFloat(responseTime.replace(/[^\d.]/g, ""));
      return isNaN(numericValue) ? 0 : numericValue;
    }
    return 0;
  };

  const getChartData = () => {
    if (chartType === "tokens") {
      return tokenStats.map((user) => ({
        email: user.email,
        tokens: user.totalTokens,
        messageTokens: activeMethods.message ? user.messageTokens : 0,
        documentTokens: activeMethods.document ? user.documentTokens : 0,
        cost: user.totalCost,
      }));
    } else {
      return userStats.map((user) => ({
        email: user.email,
        requests: user.totalRequests,
        responseTime: user.averageResponseTime.toFixed(2),
      }));
    }
  };

  const toggleMethod = (method) => {
    setActiveMethods((prev) => ({
      ...prev,
      [method]: !prev[method],
    }));
  };

  const renderChart = () => {
    const data = getChartData();

    if (chartType === "tokens") {
      return (
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="email"
            height={70}
            tick={{ fontSize: isMobile ? 10 : 12 }}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            stroke="#8884d8"
            label={{
              value: "Tokens",
              position: "bottom",
              style: { fontSize: isMobile ? 10 : 12 },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#ff7300"
            label={{
              value: "Cost (₫)",
              position: "bottom",
              style: { fontSize: isMobile ? 10 : 12 },
            }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name.includes("Token")) return [value.toLocaleString(), name];
              if (name === "Cost")
                return [`${value.toLocaleString("vi-VN")} ₫`, name];
              return [value, name];
            }}
          />
          <Legend align={"center"} />
          {activeMethods.message && (
            <Bar
              yAxisId="left"
              dataKey="messageTokens"
              name="Message tokens"
              fill="#8884d8"
              barSize={60}
              stackId="tokens"
            />
          )}
          {activeMethods.document && (
            <Bar
              yAxisId="left"
              dataKey="documentTokens"
              name="Document tokens"
              fill="#82ca9d"
              barSize={30}
              stackId="tokens"
            />
          )}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            name="Total cost (₫)"
            stroke="#ff7300"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      );
    } else {
      return (
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="email"
            height={70}
            tick={{ fontSize: isMobile ? 10 : 12 }}
          />
          <YAxis
            label={{
              value:
                chartType === "requests"
                  ? "Total requests"
                  : "Avg response time (s)",
              angle: -90,
              position: "insideLeft",
              offset: -10,
              style: { fontSize: isMobile ? 10 : 12 },
            }}
          />
          <Tooltip />
          <Legend align={"center"} />
          <Bar
            dataKey={chartType}
            fill="#7844D3"
            barSize={63}
            name={
              chartType === "requests"
                ? "Total requests"
                : "Avg response time (s)"
            }
          />
        </BarChart>
      );
    }
  };

  const hasTokenData =
    tokenStats.length > 0 && tokenStats.some((user) => user.totalTokens > 0);
  const hasUserData = userStats.length > 0;

  return (
    <>
      <title>Erudition | User statistic</title>
      <Box
        sx={{
          p: 3,
          maxWidth: isMobile ? "100%" : "1200px",
          margin: "auto",
          height: "70vh",
          overflowY: "auto",
          marginTop: isMobile ? "0rem" : "auto",
        }}
      >
        <Card
          sx={{
            p: 2,
            backgroundColor: "white",
            boxShadow: 3,
            borderRadius: 2,
            position: "relative",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 2,
              position: "relative",
              width: "100%",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 2 : 0,
            }}
          >
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ "&.Mui-focused": { color: "#9c27b0" } }}>
                Metric
              </InputLabel>
              <Select
                color="secondary"
                value={chartType}
                label="Metric"
                onChange={(e) => setChartType(e.target.value)}
              >
                <MenuItem value="tokens">Tokens</MenuItem>
                <MenuItem value="requests">Requests</MenuItem>
                <MenuItem value="responseTime">Response time</MenuItem>
              </Select>
            </FormControl>

            {chartType === "tokens" && (
              <Stack direction="row" spacing={1} sx={{ ml: isMobile ? 0 : 2 }}>
                <Chip
                  label="Message tokens"
                  color={activeMethods.message ? "primary" : "default"}
                  onClick={() => toggleMethod("message")}
                  variant={activeMethods.message ? "filled" : "outlined"}
                  size="small"
                />
                <Chip
                  label="Document tokens"
                  color={activeMethods.document ? "secondary" : "default"}
                  onClick={() => toggleMethod("document")}
                  variant={activeMethods.document ? "filled" : "outlined"}
                  size="small"
                />
              </Stack>
            )}

            <Typography
              variant="h6"
              sx={{
                position: isMobile ? "static" : "absolute",
                left: isMobile ? "auto" : "50%",
                transform: isMobile ? "none" : "translateX(-50%)",
                textAlign: "center",
                width: "fit-content",
                order: isMobile ? -1 : 0,
              }}
            >
              User statistics
              {chartType === "tokens" && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  ({TOKEN_PRICE_PER_1000} ₫ per 1K tokens)
                </Typography>
              )}
            </Typography>
          </Box>

          {/* Chart Section */}
          <Box sx={{ height: 400, mt: 2 }}>
            {(chartType === "tokens" ? hasTokenData : hasUserData) ? (
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
                  color: theme.palette.text.secondary,
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  No data available
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Box>
    </>
  );
};

export default UserStatistic;
