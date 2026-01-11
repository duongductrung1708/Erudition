import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/AuthProvider";
import adminApi from "../../services/admin_api";
import {
  Box,
  Switch,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  useTheme,
  useMediaQuery,
  Tooltip,
  CircularProgress,
  Alert,
  Autocomplete,
  styled,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import { toast } from "react-toastify";

const PurpleSwitch = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "#5E33A8",
    "&:hover": { backgroundColor: "rgba(94, 51, 168, 0.08)" },
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#5E33A8",
  },
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[4],
  maxWidth: "100%",
  overflowX: "auto",
  backgroundColor: theme.palette.background.paper,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": { backgroundColor: "#F9FAFB" },
  "&:hover": { backgroundColor: "#F5F3FF" },
}));

const ChatbotAdmin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [chatbots, setChatbots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState(null);
  const [statusConfirmationOpen, setStatusConfirmationOpen] = useState(false);
  const [chatbotToToggle, setChatbotToToggle] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const token = user?.accessToken;

  useEffect(() => {
    const fetchChatbots = async () => {
      if (!user?.isAdmin || !token) {
        setError("Admin privileges required or user not authenticated.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError("");
        const response = await adminApi.getChatbot(token);
        setChatbots(response.filter((chatbot) => !chatbot.is_deleted));
      } catch (err) {
        if (err?.response?.status === 401) {
          logout();
          return;
        }
        setError(err?.message || "Failed to fetch chatbots");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatbots();
  }, [user, logout, token]);

  const filteredChatbots = useMemo(() => {
    return chatbots.filter((chatbot) =>
      chatbot.name
        .toLowerCase()
        .replace(/\s/g, "")
        .includes(searchTerm.toLowerCase().replace(/\s/g, ""))
    );
  }, [chatbots, searchTerm]);

  const totalPages = Math.ceil(filteredChatbots.length / rowsPerPage);

  const truncateText = (text, maxLength) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const handleChatbotDetails = (chatbotId) => {
    navigate(`/admin/admin-agent-details/${chatbotId}`);
  };

  const openDeleteConfirmation = (chatbotId) => {
    setChatbotToDelete(chatbotId);
    setDeleteConfirmationOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setChatbotToDelete(null);
    setDeleteConfirmationOpen(false);
  };

  const handleDeleteConfirmed = async () => {
    if (!token) {
      setError("Authentication token is missing.");
      return;
    }
    if (chatbotToDelete) {
      try {
        await adminApi.deleteChatbot(token, chatbotToDelete);
        setChatbots((prevChatbots) =>
          prevChatbots
            .map((chatbot) =>
              chatbot.id === chatbotToDelete
                ? { ...chatbot, is_deleted: true }
                : chatbot
            )
            .filter((chatbot) => !chatbot.is_deleted)
        );
        closeDeleteConfirmation();
        toast.success("Chatbot deleted successfully!");
      } catch (err) {
        setError(err?.message || "Failed to delete chatbot");
        toast.error(err);
      }
    }
  };

  const openStatusConfirmation = (chatbotId, isActive) => {
    setChatbotToToggle(chatbotId);
    setNewStatus(!isActive);
    setStatusConfirmationOpen(true);
  };

  const closeStatusConfirmation = () => {
    setChatbotToToggle(null);
    setNewStatus(null);
    setStatusConfirmationOpen(false);
  };

  const handleStatusConfirmed = async () => {
    if (!token) {
      setError("Authentication token is missing.");
      return;
    }
    if (chatbotToToggle !== null && newStatus !== null) {
      setIsStatusUpdating(true);
      try {
        if (newStatus) {
          await adminApi.activeChatbot(token, chatbotToToggle);
        } else {
          await adminApi.deactivateChatbot(token, chatbotToToggle);
        }
        setChatbots((chatbots) =>
          chatbots.map((chatbot) =>
            chatbot.id === chatbotToToggle
              ? { ...chatbot, is_active: newStatus }
              : chatbot
          )
        );
        closeStatusConfirmation();
        toast.success("Change chatbot status successfully!");
      } catch (err) {
        setError(
          err?.message ||
            `Failed to ${newStatus ? "activate" : "deactivate"} chatbot`
        );
        toast.error(err);
      } finally {
        setIsStatusUpdating(false);
      }
    }
  };

  const handleFirstPage = () => setPage(0);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNextPage = () =>
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  const handleLastPage = () => setPage(totalPages - 1);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading && chatbots.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#5E33A8" }} />
      </Box>
    );
  }

  if (error && chatbots.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          p: 2,
        }}
      >
        <Alert
          severity="error"
          sx={{
            maxWidth: 600,
            boxShadow: theme.shadows[4],
            borderRadius: theme.shape.borderRadius,
            bgcolor: theme.palette.error.light,
            color: theme.palette.error.contrastText,
          }}
          action={
            <Button
              color="inherit"
              onClick={() => window.location.reload()}
              sx={{
                bgcolor: theme.palette.common.white,
                color: theme.palette.error.main,
                "&:hover": { bgcolor: theme.palette.grey[200] },
              }}
            >
              RETRY
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <title>Erudition | Admin Chatbot Management</title>
      <Box
        sx={{
          minHeight: "100vh",
          pt: "5rem",
          px: { xs: 2, sm: 3, md: 4 },
          width: "100%",
          maxWidth: "100vw",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            // bgcolor: "#5E33A8",
            color: "black",
            py: 2,
            px: 3,
            borderRadius: theme.shape.borderRadius,
            // boxShadow: theme.shadows[2],
          }}
        >
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
            Chatbot management
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            mb: 3,
          }}
        >
          <Autocomplete
            options={chatbots}
            getOptionLabel={(option) => option.name}
            inputValue={searchTerm}
            onInputChange={(event, newInputValue) =>
              setSearchTerm(newInputValue)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search chatbots"
                variant="outlined"
                size="small"
                color="secondary"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: theme.shape.borderRadius,
                    "&:hover fieldset": { borderColor: "#7844D3" },
                    "&.Mui-focused fieldset": { borderColor: "#5E33A8" },
                  },
                }}
              />
            )}
            freeSolo
            fullWidth
            sx={{ maxWidth: { xs: "100%", sm: "500px" } }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ "&.Mui-focused": { color: "#5E33A8" } }}>
              Chatbots per page
            </InputLabel>
            <Select
              value={rowsPerPage}
              label="Chatbots per page"
              onChange={handleChangeRowsPerPage}
              sx={{
                borderRadius: theme.shape.borderRadius,
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#7844D3",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#5E33A8",
                },
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <StyledTableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="chatbots table">
            <TableHead>
              <TableRow
                sx={{ background: "linear-gradient(135deg, #5E33A8, #7844D3)" }}
              >
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  #
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Name
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Creator Email
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Organization
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Description
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Active
                </TableCell>
                {/* <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Action
                </TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredChatbots.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={{ textAlign: "center", color: "#1F2937" }}
                  >
                    No chatbots found
                  </TableCell>
                </TableRow>
              ) : (
                filteredChatbots
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((chatbot, index) => (
                    <StyledTableRow
                      key={chatbot.id}
                      onClick={() => handleChatbotDetails(chatbot.id)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell sx={{ color: "#1F2937" }}>
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ color: "#1F2937" }}>
                        <Tooltip title={chatbot.name} placement="top">
                          <span>{truncateText(chatbot.name, 20)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ color: "#1F2937" }}>
                        <Tooltip
                          title={chatbot.chatbot_creator?.email || "N/A"}
                          placement="top"
                        >
                          <span>
                            {truncateText(chatbot.chatbot_creator?.email, 30)}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ color: "#1F2937" }}>
                        <Tooltip
                          title={chatbot.organization || "N/A"}
                          placement="top"
                        >
                          <span>{truncateText(chatbot.organization, 20)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ color: "#1F2937" }}>
                        <Tooltip
                          title={chatbot.description || "N/A"}
                          placement="top"
                        >
                          <span>{truncateText(chatbot.description, 30)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <PurpleSwitch
                            checked={chatbot.is_active}
                            onChange={(e) => {
                              e.stopPropagation();
                              openStatusConfirmation(
                                chatbot.id,
                                chatbot.is_active
                              );
                            }}
                            disabled={isStatusUpdating}
                          />
                          {isStatusUpdating && (
                            <CircularProgress
                              size={16}
                              sx={{ ml: 1, color: "#5E33A8" }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      {/* <TableCell onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Delete Chatbot" placement="bottom">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteConfirmation(chatbot.id);
                            }}
                            size="small"
                            sx={{
                              color: "#EF4444",
                              "&:hover": { color: "#DC2626" },
                            }}
                          >
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell> */}
                    </StyledTableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </StyledTableContainer>

        {filteredChatbots.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mt: 3,
              gap: 2,
            }}
          >
            <Tooltip title="First Page">
              <IconButton
                onClick={handleFirstPage}
                disabled={page === 0}
                sx={{ color: "#7844D3", "&:hover": { color: "#8B5CF6" } }}
              >
                <FirstPageIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Previous Page">
              <IconButton
                onClick={handlePreviousPage}
                disabled={page === 0}
                sx={{ color: "#7844D3", "&:hover": { color: "#8B5CF6" } }}
              >
                <ArrowBackIosNewOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography
              variant="body1"
              sx={{ fontWeight: "bold", color: "#1F2937" }}
            >
              {page + 1}/{totalPages}
            </Typography>
            <Tooltip title="Next Page">
              <IconButton
                onClick={handleNextPage}
                disabled={page === totalPages - 1}
                sx={{ color: "#7844D3", "&:hover": { color: "#8B5CF6" } }}
              >
                <ArrowForwardIosOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Last Page">
              <IconButton
                onClick={handleLastPage}
                disabled={page === totalPages - 1}
                sx={{ color: "#7844D3", "&:hover": { color: "#8B5CF6" } }}
              >
                <LastPageIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Dialog
          open={deleteConfirmationOpen}
          onClose={closeDeleteConfirmation}
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[6],
              animation: "fadeIn 0.3s ease-in",
              "@keyframes fadeIn": {
                from: { opacity: 0, transform: "translateY(20px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            },
          }}
        >
          <DialogTitle sx={{ bgcolor: "#5E33A8", color: "white" }}>
            Confirm delete
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <DialogContentText sx={{ color: "#1F2937" }}>
              Are you sure you want to delete this chatbot? This action cannot
              be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={closeDeleteConfirmation}
              sx={{
                color: "#7844D3",
                "&:hover": { bgcolor: "#F5F3FF" },
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirmed}
              sx={{
                bgcolor: "#EF4444",
                color: "white",
                "&:hover": { bgcolor: "#DC2626" },
                textTransform: "none",
              }}
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={statusConfirmationOpen}
          onClose={closeStatusConfirmation}
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[6],
              animation: "fadeIn 0.3s ease-in",
            },
          }}
        >
          <DialogTitle sx={{ bgcolor: "#5E33A8", color: "white" }}>
            Confirm status change
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <DialogContentText sx={{ color: "#1F2937" }}>
              Are you sure you want to {newStatus ? "activate" : "deactivate"}{" "}
              this chatbot?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={closeStatusConfirmation}
              sx={{
                color: "#7844D3",
                "&:hover": { bgcolor: "#F5F3FF" },
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusConfirmed}
              sx={{
                bgcolor: "#7844D3",
                color: "white",
                "&:hover": { bgcolor: "#8B5CF6" },
                textTransform: "none",
              }}
              autoFocus
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default ChatbotAdmin;
