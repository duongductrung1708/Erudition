import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Switch,
  Box,
  CircularProgress,
  Alert,
  Button,
  TextField,
  TableSortLabel,
  styled,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAuth } from "../../hooks/AuthProvider";
import adminApi from "../../services/admin_api";
import { toast } from "react-toastify";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import ChatbotStatsDialog from "../../components/adminDashboard/ChatbotStatsDialog";
import BarChartIcon from "@mui/icons-material/BarChart";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";

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

const getColorFromString = (str) => {
  const colors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const UserAdmin = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState("email");
  const [order, setOrder] = useState("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [updatingUsers, setUpdatingUsers] = useState({});
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [userCache, setUserCache] = useState([]);
  const [fetchedBatchStart, setFetchedBatchStart] = useState(0);

  const BATCH_SIZE = 50;

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (searchTerm) {
      const term = searchTerm.toLowerCase().replace(/\s/g, "");
      result = result.filter(
        (user) =>
          user.email.toLowerCase().replace(/\s/g, "").includes(term) ||
          (user.full_name &&
            user.full_name.toLowerCase().replace(/\s/g, "").includes(term))
      );
    }
    if (selectedStatus) {
      switch (selectedStatus) {
        case "active":
          result = result.filter((user) => user.is_active);
          break;
        case "inactive":
          result = result.filter((user) => !user.is_active);
          break;
        default:
          break;
      }
    }
    result.sort((a, b) => {
      let aValue = orderBy === "email" ? a.email : a.full_name;
      let bValue = orderBy === "email" ? b.email : b.full_name;
      if (orderBy === "full_name") {
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return order === "asc" ? 1 : -1;
        if (bValue == null) return order === "asc" ? -1 : 1;
      }
      aValue = (aValue || "").toLowerCase();
      bValue = (bValue || "").toLowerCase();
      return order === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    return result;
  }, [users, searchTerm, selectedStatus, orderBy, order]);

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const handleFirstPage = () => setPage(0);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNextPage = () =>
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  const handleLastPage = () => setPage(totalPages - 1);
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isValidUUID = (uuid) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const fetchUsers = async (forceRefresh = false) => {
    if (!user || !user.isAdmin) {
      setError("Admin privileges required");
      setLoading(false);
      return;
    }
    const startIndex = page * rowsPerPage;
    if (
      forceRefresh ||
      userCache.length === 0 ||
      startIndex < fetchedBatchStart ||
      startIndex >= fetchedBatchStart + userCache.length
    ) {
      try {
        setLoading(true);
        const skip = Math.floor(startIndex / BATCH_SIZE) * BATCH_SIZE;
        const response = await adminApi.getUsers(
          user.accessToken,
          skip,
          BATCH_SIZE,
          searchTerm
        );
        const validUsers = response.data.filter(
          (u) => u.id && isValidUUID(u.id) && u.email
        );
        setUserCache(validUsers);
        setFetchedBatchStart(skip);
        setTotalCount(response.count);
        setUsers(validUsers);
      } catch (err) {
        if (err.message?.includes("expired")) {
          logout();
          return;
        }
        setError(err.message || "Failed to fetch users");
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    } else {
      setUsers(userCache);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user, logout, page, searchTerm]);

  const handleRefresh = () => {
    setUserCache([]);
    setFetchedBatchStart(0);
    setPage(0);
    fetchUsers(true);
    toast.info("Refreshing user list...");
  };

  const handleViewUserDetails = async (rowUser) => {
    setSelectedUser(rowUser);
    setDetailsLoading(true);
    setUserDetailsDialogOpen(true);
    if (!rowUser.id || !isValidUUID(rowUser.id)) {
      setUserDetails(rowUser);
      setDetailsLoading(false);
      return;
    }
    try {
      const details = await adminApi.getUserById(user.accessToken, rowUser.id);
      setUserDetails(details);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        setUserDetails(rowUser);
        if (err.response?.status === 403) {
          toast.warning(
            "Using cached data - full details require admin privileges"
          );
        }
      } else {
        setError(err.message || "Failed to fetch user details");
        toast.error("Failed to fetch user details");
        setUserDetailsDialogOpen(false);
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleStatus = (userId, field, currentValue) => {
    if (userId === user.id) {
      toast.warning("You cannot modify your own status");
      return;
    }
    setPendingUpdate({ userId, field, newValue: !currentValue });
    setUpdateDialogOpen(true);
  };

  const handleUpdateConfirm = async () => {
    if (!pendingUpdate) return;
    const { userId, field, newValue } = pendingUpdate;
    if (userId === user.id) {
      toast.warning("You cannot modify your own status");
      setUpdateDialogOpen(false);
      setPendingUpdate(null);
      return;
    }
    setUpdatingUsers((prev) => ({ ...prev, [userId]: true }));
    try {
      const update = { [field]: newValue };
      const updatedUser = await adminApi.updateUser(
        user.accessToken,
        userId,
        update
      );
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u))
      );
      setUserCache((prevCache) =>
        prevCache.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u))
      );
      toast.success(`User status updated successfully!`);
    } catch (err) {
      setError(err.message || `Failed to update ${field}`);
      toast.error(`Failed to update user status`);
    } finally {
      setUpdatingUsers((prev) => ({ ...prev, [userId]: false }));
      setUpdateDialogOpen(false);
      setPendingUpdate(null);
    }
  };

  const handleUpdateCancel = () => {
    setUpdateDialogOpen(false);
    setPendingUpdate(null);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
    setPage(0);
  };

  // const handleDeleteClick = (user) => {
  //   setUserToDelete(user);
  //   setDeleteDialogOpen(true);
  // };

  // const handleDeleteConfirm = async () => {
  //   try {
  //     await adminApi.deleteUser(user.accessToken, userToDelete.id);
  //     setUsers((prevUsers) =>
  //       prevUsers.filter((u) => u.id !== userToDelete.id)
  //     );
  //     setUserCache((prevCache) =>
  //       prevCache.filter((u) => u.id !== userToDelete.id)
  //     );
  //     setTotalCount((prev) => prev - 1);
  //     toast.success("User deleted successfully!");
  //     if (paginatedUsers.length === 1 && page > 0) {
  //       setPage((prev) => prev - 1);
  //     }
  //   } catch (err) {
  //     setError(err.message || "Failed to delete user");
  //     toast.error(err.message);
  //   }
  //   setDeleteDialogOpen(false);
  // };

  // const handleDeleteCancel = () => {
  //   setDeleteDialogOpen(false);
  //   setUserToDelete(null);
  // };

  const truncateEmail = (email, maxLength = 30) => {
    if (email.length <= maxLength) return email;
    return `${email.substring(0, maxLength)}...`;
  };

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!user || !user.isAdmin) {
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
        >
          You don't have permission to access this page. Admin privileges
          required.
        </Alert>
      </Box>
    );
  }

  if (loading) {
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

  if (error) {
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
      <title>Erudition | Admin User Management</title>
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
            color: "black",
            py: 2,
            px: 3,
            borderRadius: theme.shape.borderRadius,
          }}
        >
          <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight="bold">
            User management
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            size={isSmallScreen ? "small" : "medium"}
            sx={{
              bgcolor: "#7844D3",
              "&:hover": { bgcolor: "#8B5CF6" },
              textTransform: "none",
            }}
          >
            Refresh
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            mb: 3,
          }}
        >
          <TextField
            label="Search by email or name"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            color="secondary"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Type to search..."
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: theme.shape.borderRadius,
                "&:hover fieldset": { borderColor: "#7844D3" },
                "&.Mui-focused fieldset": { borderColor: "#5E33A8" },
              },
              "&.Mui-focused": { color: "#5E33A8" },
            }}
          />
          <FormControl
            size="small"
            fullWidth
            sx={{ minWidth: { xs: "auto", sm: 200 } }}
          >
            <InputLabel sx={{ "&.Mui-focused": { color: "#5E33A8" } }}>
              Filter by status
            </InputLabel>
            <Select
              value={selectedStatus}
              label="Filter by status"
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(0);
              }}
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
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active Users</MenuItem>
              <MenuItem value="inactive">Inactive Users</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ "&.Mui-focused": { color: "#5E33A8" } }}>
              Users per page
            </InputLabel>
            <Select
              value={rowsPerPage}
              label="Users per page"
              onChange={handleRowsPerPageChange}
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
          <Table size={isSmallScreen ? "small" : "medium"}>
            <TableHead>
              <TableRow
                sx={{ background: "linear-gradient(135deg, #5E33A8, #7844D3)" }}
              >
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  <TableSortLabel
                    active={orderBy === "email"}
                    direction={orderBy === "email" ? order : "asc"}
                    onClick={() => handleRequestSort("email")}
                    sx={{
                      color: "white !important",
                      "&:hover": { color: "white" },
                    }}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                {!isSmallScreen && (
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <TableSortLabel
                      active={orderBy === "full_name"}
                      direction={orderBy === "full_name" ? order : "asc"}
                      onClick={() => handleRequestSort("full_name")}
                      sx={{
                        color: "white !important",
                        "&:hover": { color: "white" },
                      }}
                    >
                      Full Name
                    </TableSortLabel>
                  </TableCell>
                )}
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Active
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((rowUser) => (
                <StyledTableRow key={rowUser.id}>
                  <TableCell sx={{ wordBreak: "break-word", color: "#1F2937" }}>
                    <Tooltip title={rowUser.email} arrow>
                      <span>{truncateEmail(rowUser.email)}</span>
                    </Tooltip>
                  </TableCell>
                  {!isSmallScreen && (
                    <TableCell sx={{ color: "#1F2937" }}>
                      {rowUser.full_name || "-"}
                    </TableCell>
                  )}
                  <TableCell>
                    <PurpleSwitch
                      checked={rowUser.is_active}
                      onChange={() =>
                        handleToggleStatus(
                          rowUser.id,
                          "is_active",
                          rowUser.is_active
                        )
                      }
                      disabled={
                        updatingUsers[rowUser.id] || rowUser.id === user.id
                      }
                      size={isSmallScreen ? "small" : "medium"}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: isSmallScreen ? 0.5 : 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          onClick={() => handleViewUserDetails(rowUser)}
                          size={isSmallScreen ? "small" : "medium"}
                          sx={{
                            color: "#7844D3",
                            "&:hover": { color: "#8B5CF6" },
                          }}
                        >
                          <RemoveRedEyeOutlinedIcon
                            fontSize={isSmallScreen ? "small" : "medium"}
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Stats">
                        <IconButton
                          onClick={() => {
                            setSelectedUserEmail(rowUser.email);
                            setStatsDialogOpen(true);
                          }}
                          size={isSmallScreen ? "small" : "medium"}
                          sx={{
                            color: "#7844D3",
                            "&:hover": { color: "#8B5CF6" },
                          }}
                        >
                          <BarChartIcon
                            fontSize={isSmallScreen ? "small" : "medium"}
                          />
                        </IconButton>
                      </Tooltip>
                      {/* <Tooltip title="Delete User">
                        <IconButton
                          onClick={() => handleDeleteClick(rowUser)}
                          disabled={
                            updatingUsers[rowUser.id] || rowUser.id === user.id
                          }
                          size={isSmallScreen ? "small" : "medium"}
                          sx={{
                            color: "#EF4444",
                            "&:hover": { color: "#DC2626" },
                          }}
                        >
                          <DeleteIcon
                            fontSize={isSmallScreen ? "small" : "medium"}
                          />
                        </IconButton>
                      </Tooltip> */}
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isSmallScreen ? 3 : 4} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </StyledTableContainer>

        {filteredUsers.length > 0 && (
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

        <ChatbotStatsDialog
          open={statsDialogOpen}
          onClose={() => setStatsDialogOpen(false)}
          userEmail={selectedUserEmail}
          accessToken={user.accessToken}
          isAdmin={user.isAdmin}
          isChatbotCreator={user.isChatbotCreator}
          userId={user.id}
        />

        <Dialog
          open={userDetailsDialogOpen}
          onClose={() => setUserDetailsDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isSmallScreen}
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
            User details
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {detailsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={40} sx={{ color: "#5E33A8" }} />
              </Box>
            ) : userDetails ? (
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar
                      sx={{ bgcolor: getColorFromString(userDetails.email) }}
                    >
                      {userDetails.email.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={userDetails.email}
                    secondary="Email"
                    primaryTypographyProps={{
                      sx: { wordBreak: "break-word", color: "#1F2937" },
                    }}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary={userDetails.full_name || "Not specified"}
                    secondary="Full Name"
                    primaryTypographyProps={{ color: "#1F2937" }}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary={userDetails.is_active ? "Active" : "Inactive"}
                    secondary="Account Status"
                    primaryTypographyProps={{ color: "#1F2937" }}
                  />
                  <PurpleSwitch
                    checked={userDetails.is_active}
                    onChange={() =>
                      handleToggleStatus(
                        userDetails.id,
                        "is_active",
                        userDetails.is_active
                      )
                    }
                    disabled={userDetails.id === user.id}
                    size={isSmallScreen ? "small" : "medium"}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary={userDetails.is_admin ? "Yes" : "No"}
                    secondary="Admin Privileges"
                    primaryTypographyProps={{ color: "#1F2937" }}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary={userDetails.is_chatbot_creator ? "Yes" : "No"}
                    secondary="Chatbot Creator"
                    primaryTypographyProps={{ color: "#1F2937" }}
                  />
                </ListItem>
              </List>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setUserDetailsDialogOpen(false)}
              sx={{
                color: "#7844D3",
                "&:hover": { bgcolor: "#F5F3FF" },
                textTransform: "none",
              }}
              size={isSmallScreen ? "small" : "medium"}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          fullScreen={isSmallScreen}
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[6],
              animation: "fadeIn 0.3s ease-in",
            },
          }}
        >
          <DialogTitle sx={{ bgcolor: "#5E33A8", color: "white" }}>
            Delete user
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <DialogContentText sx={{ color: "#1F2937" }}>
              Are you sure you want to delete user {userToDelete?.email}? This
              action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleDeleteCancel}
              sx={{
                color: "#7844D3",
                "&:hover": { bgcolor: "#F5F3FF" },
                textTransform: "none",
              }}
              size={isSmallScreen ? "small" : "medium"}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              sx={{
                bgcolor: "#EF4444",
                color: "white",
                "&:hover": { bgcolor: "#DC2626" },
                textTransform: "none",
              }}
              autoFocus
              size={isSmallScreen ? "small" : "medium"}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog> */}

        <Dialog
          open={updateDialogOpen}
          onClose={handleUpdateCancel}
          fullScreen={isSmallScreen}
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[6],
              animation: "fadeIn 0.3s ease-in",
            },
          }}
        >
          <DialogTitle sx={{ bgcolor: "#5E33A8", color: "white" }}>
            Confirm status update
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <DialogContentText sx={{ color: "#1F2937" }}>
              Are you sure you want to{" "}
              {pendingUpdate?.newValue ? "activate" : "deactivate"} this user?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleUpdateCancel}
              sx={{
                color: "#7844D3",
                "&:hover": { bgcolor: "#F5F3FF" },
                textTransform: "none",
              }}
              size={isSmallScreen ? "small" : "medium"}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateConfirm}
              sx={{
                bgcolor: "#7844D3",
                color: "white",
                "&:hover": { bgcolor: "#8B5CF6" },
                textTransform: "none",
              }}
              autoFocus
              size={isSmallScreen ? "small" : "medium"}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default UserAdmin;
