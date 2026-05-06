import React, { memo, useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const ChatbotStatsChart = ({
  chartType,
  chartData,
  isMobile,
  theme,
  onRequestsClick,
}) => {
  const yAxisLabel = useMemo(() => {
    if (chartType === "tokens") return "Total tokens / Cost (VND)";
    if (chartType === "requests") return "Total requests";
    return "";
  }, [chartType]);

  if (chartType === "tokens") {
    return (
      <ResponsiveContainer width="100%" height={400}>
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
                ? [`${Number(value).toFixed(2)} ₫`, "Cost"]
                : [value, "Tokens"]
            }
          />
          <Legend align="left" wrapperStyle={{ color: "#1F2937", fontWeight: "bold" }} />
          <Bar yAxisId="left" dataKey="tokens" name="Tokens" fill="#7844D3" radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            name="Cost"
            stroke="#FF7300"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  // requests
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={chartData}
        onClick={onRequestsClick}
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
          stroke="#7844D3"
          tick={{ fill: "#1F2937" }}
          label={{
            value: yAxisLabel,
            angle: -90,
            position: "insideLeft",
            fill: "#1F2937",
            fontWeight: "bold",
            dx: -20,
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
        <Legend align="left" wrapperStyle={{ color: "#1F2937", fontWeight: "bold" }} />
        <Bar dataKey="requests" name="Requests" fill="#7844D3" radius={[4, 4, 0, 0]} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default memo(ChatbotStatsChart);

