import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Box,
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
  TablePagination,
  useTheme,
  useMediaQuery,
  Tooltip,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  TableSortLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useNavigate } from "react-router-dom";
import { deleteChatbot } from "../services/chatbot_api";
import { useAuth } from "../hooks/AuthProvider";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { chatbots, isLoading } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  const { user } = useAuth();
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ chatbotId, token }) => {
      await deleteChatbot(chatbotId, token);
    },
    onSuccess: () => {
      // Refetch owner chatbots list after successful deletion
      queryClient.invalidateQueries({ queryKey: ["ownerChatbots"] });
    },
  });

  const handleSort = (property) => () => {
    const isDesc = sortField === property && sortDirection === "desc";
    setSortDirection(isDesc ? "asc" : "desc");
    setSortField(property);
  };

  useEffect(() => {
    let filtered =
      chatbots?.filter(
        (agent) =>
          !agent.is_deleted &&
          agent.name
            .toLowerCase()
            .replace(/\s/g, "")
            .includes(searchTerm.toLowerCase().replace(/\s/g, ""))
      ) || [];

    if (sortField) {
      filtered.reverse();
      if (sortDirection === "asc") {
        filtered.reverse();
      }
    } else {
      filtered.reverse();
    }

    setFilteredAgents(filtered);
    setPage(0);
  }, [chatbots, searchTerm, sortField, sortDirection]);

  const handleCreateMenu = () => navigate("/agents/create");
  const handleAgentDetails = (chatbotId) =>
    navigate(`/agent-details/${chatbotId}`);

  const handleDeleteConfirmation = (chatbotId) => {
    setChatbotToDelete(chatbotId);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setChatbotToDelete(null);
  };

  const handleDeleteAgentConfirmed = async () => {
    handleCloseConfirmDialog();
    if (!chatbotToDelete || !user?.accessToken) {
      console.error("Chatbot ID or access token not available");
      setDeleteError("Operation failed due to missing information.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteMutation.mutateAsync({
        chatbotId: chatbotToDelete,
        token: user.accessToken,
      });
      toast.success(`Chatbot deleted successfully`);
    } catch (error) {
      toast.error("Error deleting chatbot:", error);
      setDeleteError(error.message || "Failed to delete chatbot.");
    } finally {
      setIsDeleting(false);
      setChatbotToDelete(null);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading && chatbots.length === 0) {
    return (
      <>
        <title>Loading | Erudition Workspace</title>
        <meta name="description" content="Loading your chatbot workspace..." />
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
      </>
    );
  }

  if (!isLoading && filteredAgents?.length === 0 && !searchTerm) {
    return (
      <>
        <title>No Chatbots | Erudition Workspace</title>
        <meta
          name="description"
          content="Start managing your AI chatbots with Erudition. Create your first chatbot now!"
        />
        <meta name="keywords" content="chatbots, AI, workspace, Erudition" />
        <Box sx={{ pt: "5rem", px: { xs: "1rem", sm: "2rem", md: "3rem" } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: "1rem",
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              All your chatbots
            </Typography>
            <Button
              variant="contained"
              onClick={handleCreateMenu}
              sx={{ textTransform: "none", bgcolor: "#7844D3" }}
            >
              <AddIcon sx={{ color: "white" }} />
              {!isMobile && " Create new chatbot"}
            </Button>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            You don&apos;t have any chatbots yet. Create your first one!
          </Alert>
        </Box>
      </>
    );
  }

  return (
    <>
      <title>
        {searchTerm
          ? `"${searchTerm}" | Erudition Workspace`
          : `Erudition | Workspace`}
      </title>
      <meta
        name="description"
        content={
          searchTerm
            ? `"${searchTerm}" in Erudition's chatbot workspace.`
            : `Erudition's workspace.`
        }
      />
      <meta
        name="keywords"
        content={`chatbots, AI, workspace, Erudition${
          chatbots?.length > 0
            ? ", " +
              chatbots
                .filter((agent) => !agent.is_deleted)
                .map((c) => c.name)
                .join(", ")
            : ""
        }`}
      />
      <Box
        sx={{
          minHeight: "100vh",
          pt: "5rem",
          px: { xs: "1rem", sm: "2rem", md: "3rem" },
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
            mb: "1rem",
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            All your chatbots
          </Typography>
          <Tooltip title="Create new chatbot" placement="bottom" arrow>
            <Button
              variant="contained"
              onClick={handleCreateMenu}
              sx={{ textTransform: "none", bgcolor: "#7844D3" }}
            >
              <AddIcon
                sx={{ fontSize: isMobile ? "25px" : "medium", color: "white" }}
              />
              {!isMobile && "  Create new chatbot"}
            </Button>
          </Tooltip>
        </Box>

        <Box sx={{ mb: "1rem" }}>
          <Autocomplete
            options={chatbots?.filter((agent) => !agent.is_deleted) || []}
            getOptionLabel={(option) => option.name}
            inputValue={searchTerm}
            onInputChange={(event, newInputValue) => {
              setSearchTerm(newInputValue);
              setPage(0);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search chatbots"
                variant="outlined"
                size="small"
                color="secondary"
              />
            )}
            freeSolo
            fullWidth
            sx={{ maxWidth: "500px" }}
          />
        </Box>

        <Box
          sx={{ width: "100%", boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px" }}
        >
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell
                    sortDirection={sortField === "name" ? sortDirection : false}
                  >
                    <TableSortLabel
                      active={sortField === "name"}
                      direction={sortField === "name" ? sortDirection : "desc"}
                      onClick={handleSort("name")}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sortDirection={
                      sortField === "description" ? sortDirection : false
                    }
                  >
                    <TableSortLabel
                      active={sortField === "description"}
                      direction={
                        sortField === "description" ? sortDirection : "desc"
                      }
                      onClick={handleSort("description")}
                    >
                      Description
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sortDirection={
                      sortField === "organization" ? sortDirection : false
                    }
                  >
                    <TableSortLabel
                      active={sortField === "organization"}
                      direction={
                        sortField === "organization" ? sortDirection : "desc"
                      }
                      onClick={handleSort("organization")}
                    >
                      Organization
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center" }}>
                      {searchTerm
                        ? "No agents match your search criteria"
                        : "No active agents"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((agent, index) => (
                      <TableRow
                        key={agent.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: !isDeleting && "#F5F3FF",
                            cursor: !isDeleting && "pointer",
                          },
                          backgroundColor: !agent.is_active
                            ? theme.palette.action.disabledBackground
                            : "inherit",
                          color: !agent.is_active
                            ? theme.palette.text.disabled
                            : "inherit",
                        }}
                        onClick={() => {
                          // Ensure we use id (UUID), not _id (ObjectId)
                          const chatbotId = agent.id || agent._id;
                          if (!chatbotId) {
                            console.error("Chatbot ID not found:", agent);
                            return;
                          }
                          if (agent.is_active && !isDeleting) {
                            console.log("Navigating to chatbot details with ID:", chatbotId);
                            handleAgentDetails(chatbotId);
                          }
                        }}
                      >
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell sx={{ maxWidth: "200px" }}>
                          <Tooltip title={agent.name} placement="top" arrow>
                            <Typography
                              sx={{
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {agent.name}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ maxWidth: "300px" }}>
                          <Tooltip
                            title={agent.description || "No description"}
                            placement="top"
                            arrow
                          >
                            <Typography
                              sx={{
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {agent.description || "No description"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ maxWidth: "200px" }}>
                          <Tooltip
                            title={agent.organization || "No organization"}
                            placement="top"
                            arrow
                          >
                            <Typography
                              sx={{
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {agent.organization || "No organization"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={agent.is_active ? "Active" : "Inactive"}
                            color={agent.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={agent.is_disabled ? "Disable" : "Enable"}
                            color={agent.is_disabled ? "default" : "success"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Tooltip
                            title="Delete Agent"
                            placement="bottom"
                            arrow
                          >
                            <IconButton
                              onClick={() => handleDeleteConfirmation(agent.id)}
                              size="small"
                              disabled={isDeleting}
                            >
                              {isDeleting && chatbotToDelete === agent.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <DeleteOutlineOutlinedIcon
                                  sx={{ color: "red" }}
                                />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {deleteError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {deleteError}
          </Alert>
        )}

        <Dialog
          open={openConfirmDialog}
          onClose={handleCloseConfirmDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Confirm delete"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete this agent? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
            <Button
              onClick={handleDeleteAgentConfirmed}
              autoFocus
              disabled={isDeleting}
              color="error"
            >
              {isDeleting ? <CircularProgress size={20} /> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={filteredAgents.length}
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
    </>
  );
}
