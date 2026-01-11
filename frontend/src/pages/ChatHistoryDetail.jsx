import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Collapse,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from "xlsx";

const formatDateTime = (dateTime) => {
  if (!dateTime) return "N/A";
  try {
    return new Date(dateTime).toLocaleString();
  } catch (e) {
    console.error("Date format error:", e);
    return "Invalid date";
  }
};

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
      <Typography variant="body1" color="text.secondary">
        No data available
      </Typography>
    </TableCell>
  </TableRow>
);

// Component hiển thị Rate Report
const RateReportSection = ({ rateReport }) => {
  if (!rateReport?.has_report) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        No rate report data available.
      </Typography>
    );
  }

  const reportDetails = rateReport.detail;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Response Rate Report (%)
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(reportDetails).map(([key, value]) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Box
              sx={{
                p: 2,
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {key}
              </Typography>
              <Typography variant="body1">{value.toFixed(2)}%</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default function ChatHistoryDetail({ chatHistory = [], rateReport }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [expandedRows, setExpandedRows] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [reportFilter, setReportFilter] = useState(""); // State for report filter

  const uniqueUsers = [
    ...new Set(chatHistory.map((item) => item.user_email).filter(Boolean)),
  ];

  const reportOptions = [
    { value: "", label: "All" },
    { value: "incorrect", label: "This answer is incorrect" },
    { value: "offensive", label: "Offensive content" },
    { value: "irrelevant", label: "Irrelevant answer" },
    { value: "spam", label: "Spam/Repeat" },
    { value: "missing", label: "Missing information" },
  ];

  const filteredData = chatHistory.filter((row) => {
    const matchesInput = row.user_email
      ?.toLowerCase()
      .replace(/\s/g, "")
      .includes(emailInput.toLowerCase().replace(/\s/g, ""));
    const matchesSelected = selectedEmail
      ? row.user_email === selectedEmail
      : true;
    const matchesReport =
      reportFilter === ""
        ? true // Show all if no filter selected
        : row.report === reportFilter; // Match specific report reason
    return matchesInput && matchesSelected && matchesReport;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const displayData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const toggleRowExpand = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage((prev) => prev - 1);
    }
  };

  const handleFirstPage = () => {
    setPage(0);
  };

  const handleLastPage = () => {
    setPage(totalPages - 1);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEmailChange = (event, newValue) => {
    setSelectedEmail(newValue);
    setPage(0);
  };

  const handleEmailInputChange = (event, newInputValue) => {
    setEmailInput(newInputValue);
    setPage(0);
  };

  const handleReportFilterChange = (event) => {
    setReportFilter(event.target.value);
    setPage(0);
  };

  const handleResetFilters = () => {
    setEmailInput("");
    setSelectedEmail(null);
    setReportFilter("");
    setPage(0);
  };

  const handleOpenDialog = (content) => {
    setDialogContent(content);
    setOpenDialog(true);
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((row) => ({
      "User Email": row.user_email || "-",
      Query: row.user_query || "-",
      "Rewrite Query": row.rewrite_query || "-",
      Response: row.response || "-",
      Report: row.report || "-",
      Date: formatDateTime(row.date_time),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chat History");
    XLSX.writeFile(workbook, "ChatHistory.xlsx");
  };

  const renderMobileRow = (row, index) => {
    const isExpanded = expandedRows[index];
    return (
      <React.Fragment key={index}>
        <TableRow
          hover
          onClick={() => toggleRowExpand(index)}
          sx={{ cursor: "pointer" }}
        >
          <TableCell>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                {row.user_email || "Unknown"}
              </Typography>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDateTime(row.date_time)}
            </Typography>
          </TableCell>
        </TableRow>
        {isExpanded && (
          <TableRow>
            <TableCell colSpan={1} sx={{ py: 0 }}>
              <Box sx={{ pl: 2, pb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Query:
                </Typography>
                <Typography variant="body2" paragraph>
                  {row.user_query?.length > 50 ? (
                    <>
                      {row.user_query.substring(0, 47) + "..."}
                      <Button
                        size="small"
                        color="secondary"
                        onClick={() => handleOpenDialog(row.user_query)}
                        sx={{ ml: 1 }}
                      >
                        View
                      </Button>
                    </>
                  ) : (
                    row.user_query || "-"
                  )}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Rewrite Query:
                </Typography>
                <Typography variant="body2" paragraph>
                  {row.rewrite_query?.length > 50 ? (
                    <>
                      {row.rewrite_query.substring(0, 47) + "..."}
                      <Button
                        size="small"
                        color="secondary"
                        onClick={() => handleOpenDialog(row.rewrite_query)}
                        sx={{ ml: 1 }}
                      >
                        View
                      </Button>
                    </>
                  ) : (
                    row.rewrite_query || "-"
                  )}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Response:
                </Typography>
                <Typography variant="body2" paragraph>
                  {row.response?.length > 50 ? (
                    <>
                      {row.response.substring(0, 47) + "..."}
                      <Button
                        size="small"
                        color="secondary"
                        onClick={() => handleOpenDialog(row.response)}
                        sx={{ ml: 1 }}
                      >
                        View
                      </Button>
                    </>
                  ) : (
                    row.response || "-"
                  )}
                </Typography>

                {row.report && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Report:
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {row.report?.length > 50 ? (
                        <>
                          {row.report.substring(0, 47) + "..."}
                          <Button
                            size="small"
                            color="secondary"
                            onClick={() => handleOpenDialog(row.report)}
                            sx={{ ml: 1 }}
                          >
                            View
                          </Button>
                        </>
                      ) : (
                        row.report
                      )}
                    </Typography>
                  </>
                )}
              </Box>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  const renderDesktopRow = (row, index) => (
    <TableRow key={index}>
      <TableCell>{row.user_email || "-"}</TableCell>
      <TableCell>
        {row.user_query?.length > 50 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {row.user_query.substring(0, 47) + "..."}
            <Button
              size="small"
              color="secondary"
              onClick={() => handleOpenDialog(row.user_query)}
            >
              View
            </Button>
          </Box>
        ) : (
          row.user_query || "-"
        )}
      </TableCell>
      <TableCell>
        {row.rewrite_query?.length > 50 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {row.rewrite_query.substring(0, 47) + "..."}
            <Button
              size="small"
              color="secondary"
              onClick={() => handleOpenDialog(row.rewrite_query)}
            >
              View
            </Button>
          </Box>
        ) : (
          row.rewrite_query || "-"
        )}
      </TableCell>
      <TableCell>
        {row.response?.length > 50 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {row.response.substring(0, 47) + "..."}
            <Button
              size="small"
              color="secondary"
              onClick={() => handleOpenDialog(row.response)}
            >
              View
            </Button>
          </Box>
        ) : (
          row.response || "-"
        )}
      </TableCell>
      <TableCell>
        {row.report?.length > 50 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {row.report.substring(0, 47) + "..."}
            <Button
              size="small"
              color="secondary"
              onClick={() => handleOpenDialog(row.report)}
            >
              View
            </Button>
          </Box>
        ) : (
          row.report || "-"
        )}
      </TableCell>
      <TableCell>{formatDateTime(row.date_time)}</TableCell>
    </TableRow>
  );

  return (
    <>
      <title>Erudition | Chat history</title>
      <Box
        sx={{
          height: "75vh",
          pt: "2rem",
          px: { xs: "0.5rem", sm: "1rem", md: "2rem" },
          width: "100%",
          overflow: "auto",
        }}
      >
        {/* Rate Report Section */}
        <RateReportSection rateReport={rateReport} />

        {/* Search, Filter, and Export Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 2,
            mb: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 2,
              alignItems: "center",
              flex: 1,
            }}
          >
            <Autocomplete
              options={uniqueUsers}
              value={selectedEmail}
              onChange={handleEmailChange}
              inputValue={emailInput}
              onInputChange={handleEmailInputChange}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  color="secondary"
                  label="Search or select user email"
                  variant="outlined"
                  size="small"
                  sx={{ flex: 1, minWidth: isMobile ? "100%" : 300 }}
                />
              )}
            />
            <FormControl
              sx={{ minWidth: isMobile ? "100%" : 200 }}
              size="small"
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
                onChange={handleReportFilterChange}
                label="Report Filter"
              >
                {reportOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              sx={{ minWidth: isMobile ? "100%" : 120 }}
              size="small"
            >
              <InputLabel
                sx={{
                  "&.Mui-focused": { color: "#9c27b0" },
                }}
              >
                Rows per page
              </InputLabel>
              <Select
                color="secondary"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                label="Rows per page"
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleResetFilters}
              sx={{ minWidth: isMobile ? "100%" : "auto" }}
            >
              Reset
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
            sx={{
              minWidth: isMobile ? "100%" : "auto",
              textTransform: "none",
              bgcolor: "#7844D3",
            }}
          >
            Export
          </Button>
        </Box>

        {/* Table Section */}
        <TableContainer component={Paper}>
          <Table stickyHeader size={isMobile ? "small" : "medium"}>
            {!isMobile && (
              <TableHead>
                <TableRow>
                  <TableCell>User Email</TableCell>
                  <TableCell>Query</TableCell>
                  <TableCell>Rewrite Query</TableCell>
                  <TableCell>Response</TableCell>
                  <TableCell>Report</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {filteredData.length === 0 ? (
                <EmptyState />
              ) : isMobile ? (
                displayData.map((row, index) => renderMobileRow(row, index))
              ) : (
                displayData.map((row, index) => renderDesktopRow(row, index))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Controls */}
        {filteredData.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mt: 2,
              gap: 1,
            }}
          >
            <Tooltip title="First Page">
              <span>
                <IconButton
                  onClick={handleFirstPage}
                  disabled={page === 0}
                  sx={{ color: "#7844D3" }}
                >
                  <FirstPageIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Previous Page">
              <span>
                <IconButton
                  onClick={handlePreviousPage}
                  disabled={page === 0}
                  sx={{ color: "#7844D3" }}
                >
                  <ArrowBackIosNewOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Typography variant="body1">
              {page + 1}/{totalPages}
            </Typography>

            <Tooltip title="Next Page">
              <span>
                <IconButton
                  onClick={handleNextPage}
                  disabled={page === totalPages - 1}
                  sx={{ color: "#7844D3" }}
                >
                  <ArrowForwardIosOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Last Page">
              <span>
                <IconButton
                  onClick={handleLastPage}
                  disabled={page === totalPages - 1}
                  sx={{ color: "#7844D3" }}
                >
                  <LastPageIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}

        {/* Dialog for detailed content */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Detailed response</DialogTitle>
          <DialogContent sx={{ whiteSpace: "pre-wrap", p: isMobile ? 1 : 3 }}>
            {dialogContent || "No content available"}
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
      </Box>
    </>
  );
}
