import React from "react";
import {
  Box,
  Typography,
  Card,
  useTheme,
  useMediaQuery,
  CircularProgress,
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
} from "recharts";
import dayjs from "dayjs";

const RequestStatistic = ({ chatHistory, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Calculate requests by date with error handling
  const calculateRequestsByDate = (data) => {
    if (!data || !Array.isArray(data)) return [];

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

  // Prepare chart data
  const requestsData = calculateRequestsByDate(chatHistory);
  const hasData = requestsData.length > 0;

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
      <title>Erudition | Request statistic</title>
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
            Request statistics
          </Typography>

          {hasData ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={requestsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => dayjs(date).format("MM-DD")}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [value, "Total requests"]}
                  labelFormatter={(date) => dayjs(date).format("MMM DD, YYYY")}
                />
                <Legend />
                <Bar
                  dataKey="totalRequests"
                  fill="#865AE1"
                  name="Requests"
                  barSize={63}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography variant="h6" color="textSecondary">
              No data available
            </Typography>
          )}
        </Card>
      </Box>
    </>
  );
};

export default RequestStatistic;
