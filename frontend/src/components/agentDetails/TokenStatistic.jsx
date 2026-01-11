import React from "react";
import {
  Box,
  Typography,
  Card,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ComposedChart,
  Bar,
  Line,
} from "recharts";
import dayjs from "dayjs";

const TOKEN_PRICE_PER_1000 = 10;

const TokenStatistic = ({ usageToken, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeMethods, setActiveMethods] = React.useState({
    message: true,
    document: true,
  });

  // Tính toán dữ liệu cho biểu đồ từ usageToken
  const calculateUsageAndCostByDate = (data) => {
    if (!data || !Array.isArray(data)) return [];

    const statsByDate = {};

    data.forEach((entry) => {
      if (!entry.date_time || !activeMethods[entry.method]) return;

      try {
        const date = dayjs(entry.date_time).format("YYYY-MM-DD");
        const tokens = parseInt(entry.usage_tokens) || 0;
        const cost = (tokens / 1000) * TOKEN_PRICE_PER_1000;

        if (!statsByDate[date]) {
          statsByDate[date] = {
            date,
            totalTokens: 0,
            totalCost: 0,
            messageTokens: 0,
            documentTokens: 0,
            messageCost: 0,
            documentCost: 0,
          };
        }

        statsByDate[date].totalTokens += tokens;
        statsByDate[date].totalCost += cost;

        if (entry.method === "message") {
          statsByDate[date].messageTokens += tokens;
          statsByDate[date].messageCost += cost;
        } else if (entry.method === "document") {
          statsByDate[date].documentTokens += tokens;
          statsByDate[date].documentCost += cost;
        }
      } catch (e) {
        console.error("Error processing entry:", entry, e);
      }
    });

    return Object.values(statsByDate)
      .map((item) => ({
        ...item,
        totalCost: Math.round(item.totalCost), // Round to avoid decimals for VND
        messageCost: Math.round(item.messageCost), // Round to avoid decimals for VND
        documentCost: Math.round(item.documentCost), // Round to avoid decimals for VND
      }))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
  };

  const chartData = calculateUsageAndCostByDate(usageToken);
  const hasData =
    chartData.length > 0 && chartData.some((item) => item.totalTokens > 0);

  const toggleMethod = (method) => {
    setActiveMethods((prev) => ({
      ...prev,
      [method]: !prev[method],
    }));
  };

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

  return (
    <>
      <title>Erudition | Token statistic</title>
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
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
            justifyContent: hasData ? "flex-start" : "center",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" textAlign="center" mb={2}>
            Token usage and cost ({TOKEN_PRICE_PER_1000} ₫/1K tokens)
          </Typography>

          <Stack direction="row" spacing={1} mb={2}>
            <Chip
              label="Message tokens"
              color={activeMethods.message ? "primary" : "default"}
              onClick={() => toggleMethod("message")}
              variant={activeMethods.message ? "filled" : "outlined"}
            />
            <Chip
              label="Document tokens"
              color={activeMethods.document ? "secondary" : "default"}
              onClick={() => toggleMethod("document")}
              variant={activeMethods.document ? "filled" : "outlined"}
            />
          </Stack>

          {hasData ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => dayjs(date).format("MM-DD")}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#8884d8"
                  label={{
                    value: "Tokens",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#ff7300"
                  label={{
                    value: "Cost (₫)",
                    angle: 90,
                    position: "insideRight",
                  }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name.includes("tokens"))
                      return [value.toLocaleString(), name];
                    return [`${value.toLocaleString("vi-VN")} ₫`, name];
                  }}
                  labelFormatter={(date) => dayjs(date).format("MMM DD, YYYY")}
                />
                <Legend />
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
                    barSize={60}
                    stackId="tokens"
                  />
                )}
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
          ) : (
            <Typography variant="h6" color="textSecondary">
              No token usage data available
            </Typography>
          )}
        </Card>
      </Box>
    </>
  );
};

export default TokenStatistic;
