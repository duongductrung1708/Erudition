import dayjs from "dayjs";

const TOKEN_PRICE_PER_1000 = 10;

export function prepareChatbotStatsChartData({ chartType, usageRecords, chatHistory }) {
  if (chartType === "tokens") {
    const dailyStats = usageRecords.reduce((acc, record) => {
      const date = dayjs(record.date_time).subtract(7, "hour").format("YYYY-MM-DD");
      if (!acc[date]) acc[date] = { date, totalTokens: 0 };
      acc[date].totalTokens += record.usage_tokens || 0;
      return acc;
    }, {});

    return Object.values(dailyStats).map((stat) => ({
      date: stat.date,
      tokens: stat.totalTokens,
      cost: (stat.totalTokens / 1000) * TOKEN_PRICE_PER_1000,
      requests: 0,
    }));
  }

  // requests
  const dailyStats = chatHistory.reduce((acc, chat) => {
    const date = dayjs(chat.date_time).subtract(7, "hour").format("YYYY-MM-DD");
    if (!acc[date]) {
      acc[date] = { date, totalTokens: 0, totalChats: 0 };
    }
    acc[date].totalTokens += chat.usage_tokens || 0;
    acc[date].totalChats += 1;
    return acc;
  }, {});

  return Object.values(dailyStats).map((stat) => ({
    date: stat.date,
    tokens: stat.totalTokens,
    cost: (stat.totalTokens / 1000) * TOKEN_PRICE_PER_1000,
    requests: stat.totalChats,
  }));
}

