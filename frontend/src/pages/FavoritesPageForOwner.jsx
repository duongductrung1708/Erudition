import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
  CircularProgress,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowBackIos as ArrowBackIosIcon,
  Bookmark as StarIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import Markdown from "markdown-to-jsx";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/AuthProvider";
import {
  getFavorites,
  deleteFavoriteByMessageId,
  createFavorite,
} from "../services/favorite_api";
import { getChatbotById } from "../services/chatbot_api";

const FavoritesPageForOwner = () => {
  const { user } = useAuth();
  const { chatbotId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [allFavorites, setAllFavorites] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [chatbotName, setChatbotName] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("favorite_at");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewContent, setViewContent] = useState("");
  const [viewTitle, setViewTitle] = useState("");

  // Initialize default 7-day date range
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formatDate = (date) => date.toISOString().split("T")[0]; // YYYY-MM-DD
    setEndDate(formatDate(today));
    setStartDate(formatDate(sevenDaysAgo));
  }, []);

  const fetchChatbotDetails = async () => {
    try {
      const response = await getChatbotById(chatbotId, user.accessToken);
      setChatbotName(response.name || "Unnamed Chatbot");
    } catch (error) {
      console.error("Error fetching chatbot details:", error);
      toast.error("Failed to fetch chatbot details");
      navigate("/user/workspace");
    }
  };

  const fetchFavorites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, total } = await getFavorites(chatbotId, user.accessToken, {
        limit: 1000, // Fetch a large batch to minimize API calls
        skip: 0,
        sort_by: "favorite_at", // Initial fetch sorted by favorite_at
      });
      console.log("Fetched favorites:", { data, total });
      setAllFavorites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setError(error);
      toast.error(error.detail || "Failed to load favorites");
      setAllFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort favorites client-side
  const filterAndSortFavorites = useCallback(
    (keyword = searchKeyword) => {
      let filtered = [...allFavorites];

      // Search filter
      if (keyword) {
        const search = keyword.toLowerCase().replace(/\s/g, "");
        filtered = filtered.filter(
          (fav) =>
            fav.message.user_query
              .toLowerCase()
              .replace(/\s/g, "")
              .includes(search) ||
            fav.message.response
              .toLowerCase()
              .replace(/\s/g, "")
              .includes(search)
        );
      }

      // Date filter
      if (startDate || endDate) {
        filtered = filtered.filter((fav) => {
          const favDate = new Date(fav.favorite_at).setHours(0, 0, 0, 0);
          const start = startDate
            ? new Date(startDate).setHours(0, 0, 0, 0)
            : -Infinity;
          const end = endDate
            ? new Date(endDate).setHours(23, 59, 59, 999)
            : Infinity;
          return favDate >= start && favDate <= end;
        });
      }

      // Sort
      filtered.sort((a, b) => {
        const dateA =
          sortBy === "favorite_at"
            ? new Date(a.favorite_at)
            : new Date(a.message.date_time);
        const dateB =
          sortBy === "favorite_at"
            ? new Date(b.favorite_at)
            : new Date(b.message.date_time);
        return dateB - dateA; // Descending order
      });

      // Paginate
      const startIndex = page * rowsPerPage;
      const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);

      setFavorites(paginated);
      setTotalCount(filtered.length);
    },
    [allFavorites, startDate, endDate, sortBy, page, rowsPerPage, searchKeyword]
  );

  useEffect(() => {
    if (!user.accessToken) {
      toast.error("Please log in to view favorites");
      navigate("/login");
      return;
    }

    fetchChatbotDetails();
    fetchFavorites();
  }, [chatbotId, user.accessToken, navigate]); // Fetch only once

  // Apply initial filtering on data load
  useEffect(() => {
    if (allFavorites.length > 0) {
      filterAndSortFavorites("");
    }
  }, [allFavorites, filterAndSortFavorites]);

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  const handleSearch = () => {
    setPage(0);
    filterAndSortFavorites(searchKeyword);
  };

  const handleClearSearch = () => {
    setSearchKeyword("");
    setPage(0);
    filterAndSortFavorites(""); // Reset search
  };

  const handleDateChange = (field) => (e) => {
    const value = e.target.value;
    if (field === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    setPage(0);
  };

  const handleClearDates = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const formatDate = (date) => date.toISOString().split("T")[0];
    setStartDate(formatDate(sevenDaysAgo));
    setEndDate(formatDate(today));
    setPage(0);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUnfavorite = (favorite) => {
    setSelectedFavorite(favorite);
    setOpenConfirmDialog(true);
  };

  const handleConfirmUnfavorite = async () => {
    if (!selectedFavorite) return;

    try {
      // Delete from backend
      await deleteFavoriteByMessageId(
        selectedFavorite.message.chatbot_response_id,
        user.accessToken
      );

      // Remove from UI immediately
      setAllFavorites((prev) =>
        prev.filter((fav) => fav.id !== selectedFavorite.id)
      );
      setTotalCount((prev) => prev - 1);

      // Show undo toast
      const toastId = toast.success(
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Removed from favorites</Typography>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 2,
              paddingX: 2,
              paddingY: 0.5,
              backgroundColor: "#73C088",
              "&:hover": {
                backgroundColor: "#5B9C72",
              },
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            onClick={async () => {
              try {
                const restoredFavorite = await createFavorite(
                  selectedFavorite.message.chatbot_response_id,
                  chatbotId,
                  user.accessToken
                );
                setAllFavorites((prev) =>
                  [...prev, restoredFavorite].sort(
                    (a, b) => new Date(b.favorite_at) - new Date(a.favorite_at)
                  )
                );
                setTotalCount((prev) => prev + 1);
                toast.dismiss(toastId);
                toast.success("Favorite restored");
              } catch (error) {
                console.error(
                  "Error restoring favorite:",
                  error.response?.status,
                  error.response?.data || error.message
                );
                toast.error(error.detail || "Failed to restore favorite");
              }
            }}
          >
            Undo
          </Button>
        </Box>,
        {
          autoClose: 5000,
          closeButton: false,
        }
      );
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error(error.detail || "Failed to remove favorite");
    }

    setOpenConfirmDialog(false);
    setSelectedFavorite(null);
  };

  const handleViewContent = (content, title) => {
    setViewContent(content);
    setViewTitle(title);
    setOpenViewDialog(true);
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <title>Erudition | Favorite response</title>
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
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
            mt: 1,
          }}
        >
          <Tooltip title="Back">
            <IconButton
              sx={{
                color: "black",
                borderRadius: "10px",
                "&:hover": { backgroundColor: "#f1f1f1" },
              }}
              onClick={() => navigate("/favorite-response")}
            >
              <ArrowBackIosIcon />
            </IconButton>
          </Tooltip>

          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              flexGrow: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: { xs: "200px", md: "400px" },
            }}
          >
            Favorites / {chatbotName}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <TextField
              color="secondary"
              placeholder="Search favorites..."
              value={searchKeyword}
              onChange={handleSearchChange}
              size="small"
              sx={{ width: { xs: "100%", sm: "200px" } }}
              InputProps={{
                endAdornment: searchKeyword && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              color="secondary"
              variant="contained"
              size="small"
              onClick={handleSearch}
              disabled={!searchKeyword}
              sx={{ height: "40px" }}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Box>

          <TextField
            color="secondary"
            label="Start date"
            type="date"
            value={startDate}
            onChange={handleDateChange("start")}
            size="small"
            sx={{ width: { xs: "100%", sm: "150px" } }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            color="secondary"
            label="End date"
            type="date"
            value={endDate}
            onChange={handleDateChange("end")}
            size="small"
            sx={{ width: { xs: "100%", sm: "150px" } }}
            InputLabelProps={{ shrink: true }}
          />

          {(startDate || endDate) && (
            <Button
              color="secondary"
              variant="outlined"
              size="small"
              onClick={handleClearDates}
              sx={{ height: "40px" }}
            >
              Reset Dates
            </Button>
          )}

          <FormControl size="small" sx={{ width: { xs: "100%", sm: "150px" } }}>
            <InputLabel
              sx={{
                "&.Mui-focused": { color: "#9c27b0" },
              }}
            >
              Sort by
            </InputLabel>
            <Select
              color="secondary"
              value={sortBy}
              onChange={handleSortChange}
              label="Sort By"
            >
              <MenuItem value="favorite_at">Favorite at</MenuItem>
              <MenuItem value="date_time">Date time</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Error Message */}
        {error && (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography color="error" sx={{ mt: 2 }}>
              Error: {error.detail || "Failed to load favorites"}
            </Typography>
            <Button onClick={fetchFavorites} variant="contained" sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "70vh",
            }}
          >
            <CircularProgress sx={{ color: "#5E33A8" }} />
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && !error && favorites.length === 0 && (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <StarIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchKeyword || startDate || endDate
                ? "No matching favorites found"
                : "No favorites yet"}
            </Typography>
            {!searchKeyword && !startDate && !endDate && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Star responses in your chats to save them here
              </Typography>
            )}
          </Box>
        )}

        {/* Favorites Table */}
        {!isLoading && !error && favorites.length > 0 && (
          <>
            <TableContainer component={Paper} sx={{ maxHeight: "70vh" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", width: "15%" }}>
                      User Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "15%" }}>
                      Query
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "15%" }}>
                      Rewrite Query
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "15%" }}>
                      Response
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "10%" }}>
                      Saved
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "10%" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {favorites.map((fav) => (
                    <TableRow key={fav.id}>
                      <TableCell>
                        <Typography
                          sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                        >
                          {fav.message.user_email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            sx={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            {truncateText(fav.message.user_query)}
                          </Typography>
                          {fav.message.user_query.length > 100 && (
                            <Tooltip title="View full query">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleViewContent(
                                    fav.message.user_query,
                                    "Full Query"
                                  )
                                }
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                        >
                          {fav.message.rewrite_query}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              maxHeight: "100px",
                              overflowY: "auto",
                            }}
                          >
                            <Markdown>
                              {truncateText(fav.message.response)}
                            </Markdown>
                          </Box>
                          {fav.message.response.length > 100 && (
                            <Tooltip title="View full response">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleViewContent(
                                    fav.message.response,
                                    "Full response"
                                  )
                                }
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDateTime(fav.favorite_at)}</TableCell>
                      <TableCell>
                        <Tooltip title="Remove favorite">
                          <IconButton
                            onClick={() => handleUnfavorite(fav)}
                            sx={{ color: "#FFD700" }}
                          >
                            <StarIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
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
          </>
        )}

        {/* Confirmation Dialog */}
        <Dialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
        >
          <DialogTitle>Remove favorite?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to remove this response from your favorites?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmUnfavorite}
              color="error"
              variant="contained"
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Content Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{viewTitle}</DialogTitle>
          <DialogContent>
            <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              <Markdown>{viewContent}</Markdown>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)} color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default FavoritesPageForOwner;
