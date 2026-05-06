import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import {
  filterChatHistoryByChatbot,
  getRateOfResponseReport,
  getUsageTokenByChatbot,
} from "../../../services/statistics_api";
import { getApiIsoRange, getInclusiveDayBounds } from "../../../utils/dateRange";

export default function useChatbotReportData({ chatbotId, accessToken, dateRange }) {
  const [reportLoading, setReportLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [rateReport, setRateReport] = useState(null);
  const [usageToken, setUsageToken] = useState([]);

  const { fromDateIso, toDateIso } = useMemo(() => {
    const { fromIso, toIso } = getApiIsoRange({
      fromDate: dayjs(dateRange.startDate),
      endDate: dayjs(dateRange.endDate),
      endIsNowIfToday: false,
    });
    return { fromDateIso: fromIso, toDateIso: toIso };
  }, [dateRange.endDate, dateRange.startDate]);

  const fetchChatHistory = useCallback(async () => {
    if (!chatbotId || !accessToken) return;
    try {
      setReportLoading(true);
      const params = {
        chatbot_id: chatbotId,
        skip: 0,
        limit: 1000,
        from_date: fromDateIso,
        to_date: toDateIso,
        filter_email: "",
      };

      const response = await filterChatHistoryByChatbot(params, accessToken);
      const history = response.data || response;

      const filteredHistory = (history || []).filter((chat) => {
        const chatDate = dayjs(chat.date_time);
        const { from, to } = getInclusiveDayBounds({
          fromDate: dayjs(dateRange.startDate),
          endDate: dayjs(dateRange.endDate),
        });
        return (
          (chatDate.isAfter(from, "minute") || chatDate.isSame(from, "minute")) &&
          (chatDate.isBefore(to, "minute") || chatDate.isSame(to, "minute"))
        );
      });

      setChatHistory(filteredHistory);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      toast.error("Failed to load chat history");
    } finally {
      setReportLoading(false);
    }
  }, [accessToken, chatbotId, dateRange.endDate, dateRange.startDate, fromDateIso, toDateIso]);

  const fetchRateReport = useCallback(async () => {
    if (!chatbotId || !accessToken) return;
    try {
      setReportLoading(true);
      const report = await getRateOfResponseReport(
        chatbotId,
        fromDateIso,
        toDateIso,
        accessToken
      );
      setRateReport(report);
    } catch (error) {
      console.error("Failed to fetch rate report:", error);
      toast.error("Failed to load rate report");
    } finally {
      setReportLoading(false);
    }
  }, [accessToken, chatbotId, fromDateIso, toDateIso]);

  const fetchUsageToken = useCallback(async () => {
    if (!chatbotId || !accessToken) return;
    try {
      setReportLoading(true);
      const report = await getUsageTokenByChatbot(
        chatbotId,
        fromDateIso,
        toDateIso,
        accessToken
      );
      setUsageToken(report);
    } catch (error) {
      console.error("Failed to fetch usage token report:", error);
      toast.error("Failed to load usage token report");
    } finally {
      setReportLoading(false);
    }
  }, [accessToken, chatbotId, fromDateIso, toDateIso]);

  useEffect(() => {
    setChatHistory([]);
    setRateReport(null);
    setUsageToken([]);

    fetchChatHistory();
    fetchRateReport();
    fetchUsageToken();
  }, [fetchChatHistory, fetchRateReport, fetchUsageToken]);

  return {
    reportLoading,
    chatHistory,
    rateReport,
    usageToken,
    refetchReports: useCallback(() => {
      fetchChatHistory();
      fetchRateReport();
      fetchUsageToken();
    }, [fetchChatHistory, fetchRateReport, fetchUsageToken]),
  };
}

