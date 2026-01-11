import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from "xlsx";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/AuthProvider";
import { getChatbotById } from "../services/chatbot_api";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import ReactMarkdown from "markdown-to-jsx";
import { ArrowBackIos as ArrowBackIosIcon } from "@mui/icons-material";
import { filterChatHistoryForUser } from "../services/statistics_api";

const markdownOptions = {
  overrides: {
    h1: {
      component: Typography,
      props: {
        variant: "h6",
        sx: { mt: 2, mb: 1, fontWeight: "bold", color: "#1976d2" },
      },
    },
    h2: {
      component: Typography,
      props: {
        variant: "subtitle1",
        sx: { mt: 2, mb: 1, fontWeight: "bold", color: "#1976d2" },
      },
    },
    p: {
      component: Typography,
      props: {
        variant: "body2",
        sx: { mb: 1, lineHeight: 1.6 },
      },
    },
    strong: {
      component: Typography,
      props: {
        component: "span",
        sx: { fontWeight: "bold", color: "#424242" },
      },
    },
  },
};

const reportOptions = [
  { value: "", label: "All" },
  { value: "incorrect", label: "This answer is incorrect" },
  { value: "offensive", label: "Offensive content" },
  { value: "irrelevant", label: "Irrelevant answer" },
  { value: "spam", label: "Spam/Repeat" },
  { value: "missing", label: "Missing information" },
];

export default function ChatHistoryForOwner(props) {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { chatbotId } = useParams();
  const [agentName, setAgentName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportFilter, setReportFilter] = useState("");
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [isFiltering, setIsFiltering] = useState(false);

  const fetchChatbotDetails = async () => {
    try {
      const token = user.accessToken;
      const response = await getChatbotById(chatbotId, token);
      setAgentName(response.name || "Unnamed Agent");
    } catch (error) {
      console.error("Failed to fetch chatbot details:", error);
      toast.error("Failed to load chatbot details");
      setAgentName("Unnamed Agent");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = chatHistory.map((item) => ({
      "User Email": item.user_email,
      "User Query": item.user_query,
      "Rewrite Query": item.rewrite_query,
      Response: item.response,
      Report: item.report,
      "Date Time": formatDateTime(item.date_time),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chat History");
    XLSX.writeFile(workbook, "chat_history.xlsx");
  };

  const handleOpenDialog = (content) => {
    setDialogContent(content);
    setOpenDialog(true);
  };

  const formatDateTime = (dateTimeString) => {
    return dayjs(dateTimeString).format("DD/MM/YYYY HH:mm:ss");
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    return dayjs(dateString).startOf("day").toISOString();
  };

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      const token = user.accessToken;
      const now = dayjs();
      const isEndDateToday = dayjs(toDate).isSame(now, "day");

      const params = {
        chatbot_id: chatbotId,
        from_date: formatDateForAPI(fromDate),
        to_date: isEndDateToday
          ? now.toISOString()
          : dayjs(toDate).endOf("day").toISOString(),
      };

      const response = await filterChatHistoryForUser(params, token);
      const history = response.data || response;

      const filteredHistory = (history || []).filter((chat) => {
        const chatDate = dayjs(chat.date_time);
        return (
          chatDate.isAfter(dayjs(fromDate).startOf("day")) &&
          chatDate.isBefore(dayjs(toDate).endOf("day"))
        );
      });

      setChatHistory(filteredHistory);
      setIsFiltering(!!fromDate || !!toDate);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      toast.error("Failed to load chat history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilter = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    setFromDate(date.toISOString().split("T")[0]);
    setToDate(new Date().toISOString().split("T")[0]);
    setSearchQuery("");
    setReportFilter("");
  };

  useEffect(() => {
    fetchChatbotDetails();
    fetchChatHistory();
  }, [fromDate, toDate]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredChatHistory = chatHistory.filter((chat) => {
    const matchesQuery = chat.user_query
      ?.toLowerCase()
      .replace(/\s/g, "")
      .includes(searchQuery.toLowerCase().replace(/\s/g, ""));
    const matchesReport =
      reportFilter === ""
        ? true
        : chat.report?.toLowerCase().includes(reportFilter.toLowerCase());
    return matchesQuery && matchesReport;
  });

  const paginatedChatHistory = filteredChatHistory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (isLoading && chatHistory.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#5E33A8" }} />
      </Box>
    );
  }

  return (
    <>
      <title>Erudition | Chat history</title>
      <Box
        sx={{
          minHeight: "100vh",
          pt: { xs: "3rem", sm: "4rem", md: "5rem" },
          px: { xs: "1rem", sm: "2rem", md: "3rem" },
          width: "100%",
          maxWidth: "100vw",
          overflowX: "auto",
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          mb={2}
          sx={{ display: "flex", alignItems: "center" }}
        >
          <IconButton
            sx={{
              color: "black",
              borderRadius: "10px",
              "&:hover": { backgroundColor: "#f1f1f1" },
            }}
            onClick={() => navigate(-1)}
          >
            <ArrowBackIosIcon />
          </IconButton>
          <Typography
            variant="h6"
            fontWeight="bold"
            paddingRight="0.5rem"
            sx={{
              textAlign: "center",
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            onClick={() => navigate(-1)}
          >
            Chat history
          </Typography>
          <Typography
            variant="h6"
            fontWeight="bold"
            paddingRight="0.5rem"
            sx={{ textAlign: "center" }}
          >
            /
          </Typography>
          <Typography
            variant="h6"
            fontWeight="bold"
            paddingRight="0.5rem"
            sx={{ textAlign: "center" }}
          >
            {agentName}
          </Typography>
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          mb={3}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <TextField
              color="secondary"
              label="From date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: toDate || undefined }}
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 150 } }}
            />
            <Typography variant="body1" sx={{ mx: 1 }}>
              To:
            </Typography>
            <TextField
              color="secondary"
              label="To date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: fromDate || undefined }}
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 150 } }}
            />
            <TextField
              color="secondary"
              label="Search user query"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 200 }, mt: { xs: 1, sm: 0 } }}
            />
            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 200 }, mt: { xs: 1, sm: 0 } }}
            >
              <InputLabel
                sx={{
                  "&.Mui-focused": { color: "#9c27b0" },
                }}
              >
                Report Filter
              </InputLabel>
              <Select
                color="secondary"
                value={reportFilter}
                onChange={(e) => {
                  setReportFilter(e.target.value);
                  setPage(0);
                }}
                label="Report Filter"
              >
                {reportOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Button
            onClick={handleExportExcel}
            startIcon={<FileDownloadIcon />}
            variant="contained"
            color="primary"
            sx={{
              width: { xs: "100%", sm: "auto" },
              textTransform: "none",
              bgcolor: "#7844D3",
              "&:hover": { bgcolor: "#5E33A8" },
              py: 1,
            }}
          >
            Export
          </Button>
        </Stack>

        <TableContainer
          component={Paper}
          sx={{
            overflowX: "auto",
            boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
          }}
        >
          <Table stickyHeader sx={{ minWidth: isMobile ? 600 : "auto" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>User Email</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>User Query</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Rewrite Query</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Response</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Report</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Date Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedChatHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center" }}>
                    No chat history found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedChatHistory.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.user_email}</TableCell>

                    <TableCell>
                      {row.user_query && row.user_query.length > 50 ? (
                        <>
                          <ReactMarkdown components={markdownOptions.overrides}>
                            {row.user_query.substring(0, 50) + "..."}
                          </ReactMarkdown>
                          <Button
                            color="secondary"
                            onClick={() => handleOpenDialog(row.user_query)}
                          >
                            View
                          </Button>
                        </>
                      ) : (
                        <ReactMarkdown components={markdownOptions.overrides}>
                          {row.user_query || "-"}
                        </ReactMarkdown>
                      )}
                    </TableCell>

                    <TableCell>
                      {row.rewrite_query && row.rewrite_query.length > 50 ? (
                        <>
                          <ReactMarkdown components={markdownOptions.overrides}>
                            {row.rewrite_query.substring(0, 50) + "..."}
                          </ReactMarkdown>
                          <Button
                            color="secondary"
                            sx={{ ml: 1 }}
                            size="small"
                            onClick={() => handleOpenDialog(row.rewrite_query)}
                          >
                            View
                          </Button>
                        </>
                      ) : (
                        <ReactMarkdown components={markdownOptions.overrides}>
                          {row.rewrite_query || "-"}
                        </ReactMarkdown>
                      )}
                    </TableCell>

                    <TableCell>
                      {row.response && row.response.length > 50 ? (
                        <>
                          <ReactMarkdown components={markdownOptions.overrides}>
                            {row.response.substring(0, 50) + "..."}
                          </ReactMarkdown>
                          <Button
                            color="secondary"
                            sx={{ ml: 1 }}
                            size="small"
                            onClick={() => handleOpenDialog(row.response)}
                          >
                            View
                          </Button>
                        </>
                      ) : (
                        <ReactMarkdown components={markdownOptions.overrides}>
                          {row.response || "-"}
                        </ReactMarkdown>
                      )}
                    </TableCell>

                    <TableCell>
                      {row.report && row.report.length > 50 ? (
                        <>
                          <ReactMarkdown components={markdownOptions.overrides}>
                            {row.report.substring(0, 50) + "..."}
                          </ReactMarkdown>
                          <Button
                            color="primary"
                            sx={{ ml: 1 }}
                            size="small"
                            onClick={() => handleOpenDialog(row.report)}
                          >
                            View
                          </Button>
                        </>
                      ) : (
                        <ReactMarkdown components={markdownOptions.overrides}>
                          {row.report || "-"}
                        </ReactMarkdown>
                      )}
                    </TableCell>

                    <TableCell>{formatDateTime(row.date_time)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: isMobile ? 0 : 2,
            },
          }}
        >
          <DialogTitle sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}>
            Detailed response
          </DialogTitle>
          <DialogContent sx={{ whiteSpace: "pre-wrap", p: isMobile ? 2 : 3 }}>
            <ReactMarkdown components={markdownOptions.overrides}>
              {dialogContent || "No content available"}
            </ReactMarkdown>
          </DialogContent>
          <DialogActions>
            <Button
              color="secondary"
              onClick={() => setOpenDialog(false)}
              size={isMobile ? "small" : "medium"}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredChatHistory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            "& .MuiTablePagination-toolbar": {
              flexWrap: { xs: "wrap", sm: "nowrap" },
              justifyContent: { xs: "center", sm: "flex-end" },
              p: isMobile ? 1 : 2,
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                fontSize: isMobile ? "0.75rem" : "0.875rem",
              },
          }}
        />
      </Box>
    </>
  );
}
