import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  TablePagination,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PricingPlans from "../PricingPlans";

const Billing = ({ user, chatbots, paymentHistory, isLoading }) => {
  const [open, setOpen] = useState(false);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState("");
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [searchChatbot, setSearchChatbot] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("pay_date");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Reference for the table container to handle dragging
  const tableRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Set default date range to last 7 days
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    setEndDate(today.toISOString().split("T")[0]); // YYYY-MM-DD
    setStartDate(sevenDaysAgo.toISOString().split("T")[0]); // YYYY-MM-DD
  }, []);

  // Mouse drag handlers for table scrolling
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - tableRef.current.offsetLeft);
    setScrollLeft(tableRef.current.scrollLeft);
    tableRef.current.style.cursor = "grabbing";
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    tableRef.current.style.cursor = "grab";
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    tableRef.current.style.cursor = "grab";
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - tableRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Adjust scroll speed
    tableRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCloseNoteDialog = () => {
    setOpenNoteDialog(false);
    setSelectedNote("");
  };
  const handleOpenDetailDialog = (bill) => {
    setSelectedBill(bill);
    setOpenDetailDialog(true);
  };
  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedBill(null);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Reset page to 0 when filters change
  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(0); // Reset to first page
  };

  const formatAmount = (amount) => (amount || 0).toLocaleString("vi-VN");
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  const getChatbotName = (chatbotId) => {
    const chatbot = chatbots.find((bot) => bot.id === chatbotId);
    return chatbot ? chatbot.name : "Unknown";
  };

  // Filter and sort payment history
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...paymentHistory];

    // Filter by chatbot name (ignore whitespace)
    if (searchChatbot) {
      filtered = filtered.filter((payment) =>
        getChatbotName(payment.chatbot_id)
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(searchChatbot.toLowerCase().replace(/\s/g, ""))
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (payment) => payment.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter((payment) => {
        const paymentDate = new Date(payment.pay_date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // Ensure end date includes the entire day
        if (end) {
          end.setHours(23, 59, 59, 999);
        }

        // Return true if payment date is within the range
        return (!start || paymentDate >= start) && (!end || paymentDate <= end);
      });
    }

    // Sort the filtered results
    return filtered.sort((a, b) => {
      const isAsc = order === "asc";
      switch (orderBy) {
        case "pay_date":
          return isAsc
            ? new Date(a.pay_date) - new Date(b.pay_date)
            : new Date(b.pay_date) - new Date(a.pay_date);
        case "chatbot":
          return isAsc
            ? getChatbotName(a.chatbot_id).localeCompare(
                getChatbotName(b.chatbot_id)
              )
            : getChatbotName(b.chatbot_id).localeCompare(
                getChatbotName(a.chatbot_id)
              );
        case "amount":
          return isAsc ? a.amount - b.amount : b.amount - a.amount;
        case "tokens_received":
          return isAsc
            ? a.tokens_received - b.tokens_received
            : b.tokens_received - a.tokens_received;
        case "status":
          return isAsc
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });
  }, [
    paymentHistory,
    searchChatbot,
    statusFilter,
    startDate,
    endDate,
    order,
    orderBy,
    chatbots,
  ]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedHistory = filteredAndSortedHistory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Clear all filters
  const handleClearFilters = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    setSearchChatbot("");
    setStatusFilter("all");
    setStartDate(sevenDaysAgo.toISOString().split("T")[0]); // Reset to 7 days ago
    setEndDate(today.toISOString().split("T")[0]); // Reset to today
    setPage(0);
  };

  return (
    <Box sx={{ padding: 3, height: "85vh", overflowY: "auto" }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
        Billing & payment
      </Typography>
      <hr />

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          <Box sx={{ marginTop: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 2,
              }}
            >
              <Chip
                label="ACTIVE"
                color="success"
                size="small"
                sx={{ fontWeight: "bold" }}
              />
              <Button
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  color: "#675cff",
                }}
                onClick={handleOpen}
              >
                Choose a plan
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ marginTop: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Invoices
            </Typography>
            <Box
              sx={{ display: "flex", gap: 2, mb: 2, mt: 2, flexWrap: "wrap" }}
            >
              <TextField
                color="secondary"
                label="Search by chatbot"
                variant="outlined"
                size="small"
                value={searchChatbot}
                onChange={(e) =>
                  handleFilterChange(setSearchChatbot)(e.target.value)
                }
                sx={{ width: 300 }}
              />
              <FormControl variant="outlined" size="small" sx={{ width: 150 }}>
                <InputLabel sx={{ "&.Mui-focused": { color: "#9c27b0" } }}>
                  Status
                </InputLabel>
                <Select
                  color="secondary"
                  value={statusFilter}
                  onChange={(e) =>
                    handleFilterChange(setStatusFilter)(e.target.value)
                  }
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 2,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <TextField
                  color="secondary"
                  label="Start Date"
                  type="date"
                  variant="outlined"
                  size="small"
                  value={startDate}
                  onChange={(e) =>
                    handleFilterChange(setStartDate)(e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 150 }}
                />
                <Typography>To:</Typography>
                <TextField
                  color="secondary"
                  label="End Date"
                  type="date"
                  variant="outlined"
                  size="small"
                  value={endDate}
                  onChange={(e) =>
                    handleFilterChange(setEndDate)(e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 150 }}
                />
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClearFilters}
                  sx={{ textTransform: "none" }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>
            <Card
              sx={{
                padding: 2,
                borderRadius: 2,
                boxShadow: 1,
                width: "100% !important",
              }}
            >
              <CardContent>
                {filteredAndSortedHistory.length === 0 ? (
                  <Typography variant="body2" sx={{ color: "#555" }}>
                    No invoices found
                  </Typography>
                ) : (
                  <Box
                    ref={tableRef}
                    sx={{
                      overflowX: "auto",
                      "&::-webkit-scrollbar": {
                        height: "8px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#675cff",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "#f1f1f1",
                      },
                      cursor: "grab",
                      userSelect: "none",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                  >
                    <Table
                      sx={{
                        minWidth: "900px",
                        borderCollapse: "separate",
                        borderSpacing: 0,
                        "& th, & td": {
                          borderBottom: "1px solid #e0e0e0",
                          padding: "12px",
                        },
                        "& th": {
                          backgroundColor: "#f5f5f5",
                          fontWeight: "bold",
                          color: "#333",
                        },
                        "& tr:hover": {
                          backgroundColor: "#f9f9f9",
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === "pay_date"}
                              direction={orderBy === "pay_date" ? order : "asc"}
                              onClick={() => handleRequestSort("pay_date")}
                            >
                              Pay date
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === "chatbot"}
                              direction={orderBy === "chatbot" ? order : "asc"}
                              onClick={() => handleRequestSort("chatbot")}
                            >
                              Chatbot
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === "amount"}
                              direction={orderBy === "amount" ? order : "asc"}
                              onClick={() => handleRequestSort("amount")}
                            >
                              Amount (VND)
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === "tokens_received"}
                              direction={
                                orderBy === "tokens_received" ? order : "asc"
                              }
                              onClick={() =>
                                handleRequestSort("tokens_received")
                              }
                            >
                              Tokens Received
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === "status"}
                              direction={orderBy === "status" ? order : "asc"}
                              onClick={() => handleRequestSort("status")}
                            >
                              Status
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedHistory.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {formatDate(payment.pay_date)}
                            </TableCell>
                            <TableCell>
                              {getChatbotName(payment.chatbot_id)}
                            </TableCell>
                            <TableCell>
                              {formatAmount(payment.amount)}
                            </TableCell>
                            <TableCell>
                              {formatAmount(payment.tokens_received)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={payment.status}
                                color={
                                  payment.status === "success"
                                    ? "success"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDetailDialog(payment)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={filteredAndSortedHistory.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      sx={{
                        "& .MuiTablePagination-toolbar": {
                          flexWrap: isMobile ? "wrap" : "nowrap",
                          justifyContent: isMobile ? "center" : "flex-end",
                          padding: isMobile ? "10px 0" : "inherit",
                        },
                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                          {
                            fontSize: isMobile ? "0.75rem" : "0.875rem",
                          },
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </>
      )}

      {/* Note Dialog */}
      <Dialog
        open={openNoteDialog}
        onClose={handleCloseNoteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Full note</DialogTitle>
        <DialogContent>
          <Typography variant="body1">{selectedNote}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNoteDialog} sx={{ color: "#675cff" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bill Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#f9f9f9",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#675cff",
            color: "white",
            fontWeight: "bold",
            py: 2,
            px: 3,
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
          }}
        >
          Bill details
        </DialogTitle>
        <DialogContent
          sx={{
            p: 3,
            bgcolor: "white",
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            m: 2,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
          }}
        >
          {selectedBill && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                "& > *": {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1,
                  px: 2,
                  borderBottom: "1px solid #f0f0f0",
                  "&:last-child": { borderBottom: "none" },
                },
              }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Bill ID
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {selectedBill.id}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Chatbot
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {getChatbotName(selectedBill.chatbot_id)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  User ID
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {selectedBill.user_id}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Amount
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {formatAmount(selectedBill.amount)} VND
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Tokens Received
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {formatAmount(selectedBill.tokens_received)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Bank
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {selectedBill.bank_id}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Payment Method
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {selectedBill.payment_method}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Transaction ID
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {selectedBill.transaction_id}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Status
                </Typography>
                <Chip
                  label={selectedBill.status}
                  color={
                    selectedBill.status === "success" ? "success" : "error"
                  }
                  size="small"
                />
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Pay Date
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {formatDate(selectedBill.pay_date)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Created At
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {formatDate(selectedBill.created_at)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  Note
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#555", maxWidth: "50%" }}
                >
                  {selectedBill.note}
                </Typography>
              </Box>
              {selectedBill.checkout_url && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", color: "#333" }}
                  >
                    Checkout URL
                  </Typography>
                  <Typography variant="body2">
                    <a
                      href={selectedBill.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#675cff",
                        textDecoration: "none",
                        fontWeight: "medium",
                      }}
                    >
                      View Payment
                    </a>
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "#f9f9f9" }}>
          <Button
            onClick={handleCloseDetailDialog}
            variant="contained"
            sx={{
              bgcolor: "#675cff",
              color: "white",
              borderRadius: 1,
              textTransform: "none",
              px: 3,
              "&:hover": {
                bgcolor: "#5a4ed6",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogContent
          sx={{ display: "flex", justifyContent: "center", padding: "2rem" }}
        >
          <PricingPlans chatbots={chatbots} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: "#675cff" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Billing;
