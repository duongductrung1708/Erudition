import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  useTheme,
  useMediaQuery,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  FormHelperText,
  Autocomplete,
  TableSortLabel,
  styled,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import LastPageIcon from "@mui/icons-material/LastPage";
import { useAuth } from "../../hooks/AuthProvider";
import adminApi from "../../services/admin_api";
import { toast } from "react-toastify";

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

const TokenBundles = () => {
  const { user, logout } = useAuth();
  const [bundles, setBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [currentBundle, setCurrentBundle] = useState({
    id: "",
    name: "",
    price: "",
    priceFormatted: "",
    token_amount: "",
    tokenAmountFormatted: "",
    description: "",
  });
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [bundleIdToDelete, setBundleIdToDelete] = useState(null);
  const [bundleNameToDelete, setBundleNameToDelete] = useState("");
  const [deleteDialogLoading, setDeleteDialogLoading] = useState(false);
  const [deleteDialogError, setDeleteDialogError] = useState("");

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setIsLoading(true);
        setError("");
        if (!user || !user.isAdmin) {
          setError("Admin privileges required");
          setIsLoading(false);
          return;
        }
        const response = await adminApi.getTokenBundles(user.accessToken);
        setBundles(response || []);
      } catch (err) {
        if (err.message?.includes("expired")) {
          logout();
          return;
        }
        setError(err.message || "Failed to fetch token bundles");
        toast.error("Failed to fetch token bundles");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBundles();
  }, [user, logout]);

  const handleSort = (field) => () => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortField(field);
    setSortDirection(isAsc ? "desc" : "asc");
    setPage(0);
  };

  const handleOpenCreateDialog = () => {
    setDialogMode("create");
    setCurrentBundle({
      id: "",
      name: "",
      price: "",
      priceFormatted: "",
      token_amount: "",
      tokenAmountFormatted: "",
      description: "",
    });
    setValidationErrors({});
    setDialogError("");
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (bundle) => {
    setDialogMode("edit");
    setCurrentBundle({
      ...bundle,
      name: bundle.name?.trim() || "",
      description: bundle.description?.trim() || "",
      priceFormatted: formatNumber(bundle.price),
      tokenAmountFormatted: formatNumber(bundle.token_amount),
    });
    setValidationErrors({});
    setDialogError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCurrentBundle((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setValidationErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const handleNumberInputChange = (event) => {
    const { name, value } = event.target;
    const rawValue = value.replace(/[^0-9]/g, "");
    const formattedValue = rawValue ? formatNumber(rawValue) : "";

    setCurrentBundle((prevState) => ({
      ...prevState,
      [name]: rawValue,
      [name === "price" ? "priceFormatted" : "tokenAmountFormatted"]:
        formattedValue,
    }));
    setValidationErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const validateFields = () => {
    const errors = {};
    const trimmedName = currentBundle.name?.trim() || "";
    const trimmedPrice = currentBundle.price?.toString().trim() || "";
    const trimmedTokenAmount =
      currentBundle.token_amount?.toString().trim() || "";
    const trimmedDescription = currentBundle.description?.trim() || "";

    setCurrentBundle((prevState) => ({
      ...prevState,
      name: trimmedName,
      price: trimmedPrice,
      token_amount: trimmedTokenAmount,
      description: trimmedDescription,
      priceFormatted: trimmedPrice ? formatNumber(trimmedPrice) : "",
      tokenAmountFormatted: trimmedTokenAmount
        ? formatNumber(trimmedTokenAmount)
        : "",
    }));

    if (!trimmedName) {
      errors.name = "Name is required";
    }
    if (!trimmedPrice) {
      errors.price = "Price is required";
    } else if (isNaN(trimmedPrice) || parseFloat(trimmedPrice) <= 0) {
      errors.price = "Price must be a valid positive number";
    }
    if (!trimmedTokenAmount) {
      errors.token_amount = "Token amount is required";
    } else if (isNaN(trimmedTokenAmount) || parseInt(trimmedTokenAmount) <= 0) {
      errors.token_amount = "Token amount must be a valid positive integer";
    }
    if (!trimmedDescription) {
      errors.description = "Description is required";
    } else if (trimmedDescription.length > 500) {
      errors.description = "Description cannot exceed 500 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateNewBundle = async () => {
    if (!validateFields()) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      const createdBundle = await adminApi.createBundle(user.accessToken, {
        name: currentBundle.name,
        price: currentBundle.price,
        token_amount: currentBundle.token_amount,
        description: currentBundle.description,
      });
      setBundles((prevBundles) => [...prevBundles, createdBundle]);
      toast.success("Token bundle created successfully!");
      handleCloseDialog();
    } catch (err) {
      setDialogError(err.message || "Failed to create token bundle");
      toast.error("Failed to create token bundle");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleUpdateBundle = async () => {
    if (!validateFields()) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      const updatedBundle = await adminApi.updateBundle(
        user.accessToken,
        currentBundle.id,
        {
          name: currentBundle.name,
          price: currentBundle.price,
          token_amount: currentBundle.token_amount,
          description: currentBundle.description,
        }
      );
      setBundles((prevBundles) =>
        prevBundles.map((bundle) =>
          bundle.id === updatedBundle.id ? updatedBundle : bundle
        )
      );
      toast.success("Token bundle updated successfully!");
      handleCloseDialog();
    } catch (err) {
      setDialogError(err.message || "Failed to update token bundle");
      toast.error("Failed to update token bundle");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleOpenDeleteDialog = (bundleId, bundleName) => {
    setBundleIdToDelete(bundleId);
    setBundleNameToDelete(bundleName);
    setDeleteDialogError("");
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setBundleIdToDelete(null);
    setBundleNameToDelete("");
    setDeleteDialogError("");
  };

  const handleDeleteBundle = async () => {
    setDeleteDialogLoading(true);
    setDeleteDialogError("");
    try {
      await adminApi.deleteBundle(user.accessToken, bundleIdToDelete);
      setBundles((prevBundles) =>
        prevBundles.filter((bundle) => bundle.id !== bundleIdToDelete)
      );
      toast.success("Token bundle deleted successfully!");
      handleCloseDeleteDialog();
    } catch (err) {
      setDeleteDialogError(err.message || "Failed to delete token bundle");
      toast.error("Failed to delete token bundle");
    } finally {
      setDeleteDialogLoading(false);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFirstPage = () => {
    setPage(0);
  };

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handleLastPage = () => {
    setPage(totalPages - 1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("vi-VN").format(number);
  };

  const filteredBundles = bundles.filter((bundle) =>
    bundle.name
      ?.toLowerCase()
      .replace(/\s/g, "")
      .includes(searchTerm.toLowerCase().replace(/\s/g, ""))
  );

  const sortedBundles = [...filteredBundles].sort((a, b) => {
    let valueA, valueB;
    if (sortField === "name") {
      valueA = a.name?.toLowerCase() || "";
      valueB = b.name?.toLowerCase() || "";
      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    } else if (sortField === "price") {
      valueA = parseFloat(a.price) || 0;
      valueB = parseFloat(b.price) || 0;
    } else if (sortField === "token_amount") {
      valueA = parseInt(a.token_amount) || 0;
      valueB = parseInt(b.token_amount) || 0;
    }
    return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
  });

  const totalPages = Math.ceil(sortedBundles.length / rowsPerPage);

  if (isLoading) {
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
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <title>Token Bundles | Erudition Workspace</title>
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
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
            Token bundles
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{
              bgcolor: "#7844D3",
              "&:hover": { bgcolor: "#8B5CF6" },
              textTransform: "none",
            }}
            size={isMobile ? "small" : "medium"}
          >
            Create new bundle
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            mb: 3,
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <Autocomplete
            options={bundles}
            getOptionLabel={(option) => option.name || ""}
            inputValue={searchTerm}
            onInputChange={(event, newInputValue) => {
              setSearchTerm(newInputValue);
              setPage(0);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search bundles"
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
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 120 } }}>
            <InputLabel sx={{ "&.Mui-focused": { color: "#5E33A8" } }}>
              Rows per page
            </InputLabel>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              label="Rows per page"
              sx={{
                borderRadius: theme.shape.borderRadius,
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#7844D3",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#5E33A8",
                },
                "& .MuiSelect-select": { color: "#1F2937" },
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <StyledTableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="token bundles table">
            <TableHead>
              <TableRow
                sx={{ background: "linear-gradient(135deg, #5E33A8, #7844D3)" }}
              >
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortField === "name"}
                    direction={sortField === "name" ? sortDirection : "asc"}
                    onClick={handleSort("name")}
                    sx={{
                      color: "white !important",
                      "&:hover": { color: "white" },
                    }}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortField === "price"}
                    direction={sortField === "price" ? sortDirection : "asc"}
                    onClick={handleSort("price")}
                    sx={{
                      color: "white !important",
                      "&:hover": { color: "white" },
                    }}
                  >
                    Price
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortField === "token_amount"}
                    direction={
                      sortField === "token_amount" ? sortDirection : "asc"
                    }
                    onClick={handleSort("token_amount")}
                    sx={{
                      color: "white !important",
                      "&:hover": { color: "white" },
                    }}
                  >
                    Token Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Description
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: "bold" }}
                  align="right"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedBundles.length > 0 ? (
                sortedBundles
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((bundle) => (
                    <StyledTableRow key={bundle.id}>
                      <TableCell sx={{ color: "#1F2937" }}>
                        {bundle.name}
                      </TableCell>
                      <TableCell sx={{ color: "#1F2937" }}>
                        {formatCurrency(bundle.price)}
                      </TableCell>
                      <TableCell sx={{ color: "#1F2937" }}>
                        {formatNumber(bundle.token_amount)}
                      </TableCell>
                      <TableCell sx={{ color: "#1F2937" }}>
                        {bundle.description}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleOpenEditDialog(bundle)}
                            size="small"
                            sx={{
                              color: "#7844D3",
                              "&:hover": { color: "#8B5CF6" },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() =>
                              handleOpenDeleteDialog(bundle.id, bundle.name)
                            }
                            size="small"
                            sx={{
                              color: "#EF4444",
                              "&:hover": { color: "#DC2626" },
                            }}
                          >
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </StyledTableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ color: "#1F2937" }}
                  >
                    No bundles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </StyledTableContainer>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 3,
            gap: { xs: 1, sm: 2 },
            py: 1,
            px: { xs: 1, sm: 2 },
            borderRadius: theme.shape.borderRadius,
          }}
        >
          <Tooltip title="First Page">
            <IconButton
              onClick={handleFirstPage}
              disabled={page === 0}
              sx={{
                color: "#7844D3",
                "&:hover": { color: "#8B5CF6" },
                "&.Mui-disabled": { color: "#D1D5DB" },
              }}
            >
              <FirstPageIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous Page">
            <IconButton
              onClick={handlePreviousPage}
              disabled={page === 0}
              sx={{
                color: "#7844D3",
                "&:hover": { color: "#8B5CF6" },
                "&.Mui-disabled": { color: "#D1D5DB" },
              }}
            >
              <ArrowBackIosNewOutlinedIcon
                fontSize={isMobile ? "small" : "small"}
              />
            </IconButton>
          </Tooltip>
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              color: "#1F2937",
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            {page + 1}/{totalPages}
          </Typography>
          <Tooltip title="Next Page">
            <IconButton
              onClick={handleNextPage}
              disabled={page === totalPages - 1}
              sx={{
                color: "#7844D3",
                "&:hover": { color: "#8B5CF6" },
                "&.Mui-disabled": { color: "#D1D5DB" },
              }}
            >
              <ArrowForwardIosOutlinedIcon
                fontSize={isMobile ? "small" : "small"}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Last Page">
            <IconButton
              onClick={handleLastPage}
              disabled={page === totalPages - 1}
              sx={{
                color: "#7844D3",
                "&:hover": { color: "#8B5CF6" },
                "&.Mui-disabled": { color: "#D1D5DB" },
              }}
            >
              <LastPageIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
        </Box>

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          fullWidth
          maxWidth="sm"
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
            {dialogMode === "create"
              ? "Create new token bundle"
              : "Edit token bundle"}
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {dialogError && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  bgcolor: theme.palette.error.light,
                  color: theme.palette.error.contrastText,
                }}
              >
                {dialogError}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              id="name"
              name="name"
              label="Name"
              type="text"
              fullWidth
              variant="outlined"
              color="secondary"
              value={currentBundle.name}
              onChange={handleInputChange}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadius,
                  "&:hover fieldset": { borderColor: "#7844D3" },
                  "&.Mui-focused fieldset": { borderColor: "#5E33A8" },
                },
              }}
            />
            <FormControl
              fullWidth
              margin="dense"
              variant="outlined"
              error={!!validationErrors.price}
            >
              <InputLabel sx={{ "&.Mui-focused": { color: "#5E33A8" } }}>
                Price
              </InputLabel>
              <OutlinedInput
                id="price"
                name="price"
                value={currentBundle.priceFormatted}
                onChange={handleNumberInputChange}
                endAdornment={
                  <InputAdornment position="end">₫</InputAdornment>
                }
                label="Price"
                type="text"
                sx={{
                  borderRadius: theme.shape.borderRadius,
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#7844D3",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#5E33A8",
                  },
                }}
              />
              {validationErrors.price && (
                <FormHelperText>{validationErrors.price}</FormHelperText>
              )}
            </FormControl>
            <TextField
              margin="dense"
              id="token_amount"
              name="token_amount"
              label="Token Amount"
              type="text"
              fullWidth
              variant="outlined"
              color="secondary"
              value={currentBundle.tokenAmountFormatted}
              onChange={handleNumberInputChange}
              error={!!validationErrors.token_amount}
              helperText={validationErrors.token_amount}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadius,
                  "&:hover fieldset": { borderColor: "#7844D3" },
                  "&.Mui-focused fieldset": { borderColor: "#5E33A8" },
                },
              }}
            />
            <TextField
              margin="dense"
              id="description"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              color="secondary"
              variant="outlined"
              value={currentBundle.description}
              onChange={handleInputChange}
              error={!!validationErrors.description}
              helperText={validationErrors.description}
              maxLength={500}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadius,
                  "&:hover fieldset": { borderColor: "#7844D3" },
                  "&.Mui-focused fieldset": { borderColor: "#5E33A8" },
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: "#7844D3",
                "&:hover": { bgcolor: "#F5F3FF" },
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={
                dialogMode === "create"
                  ? handleCreateNewBundle
                  : handleUpdateBundle
              }
              sx={{
                bgcolor: "#7844D3",
                color: "white",
                "&:hover": { bgcolor: "#8B5CF6" },
                textTransform: "none",
              }}
              disabled={dialogLoading}
            >
              {dialogLoading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : dialogMode === "create" ? (
                "Create"
              ) : (
                "Save"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          fullWidth
          maxWidth="sm"
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
          <DialogTitle sx={{ bgcolor: "#EF4444", color: "white" }}>
            Delete Token Bundle
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {deleteDialogError && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  bgcolor: theme.palette.error.light,
                  color: theme.palette.error.contrastText,
                }}
              >
                {deleteDialogError}
              </Alert>
            )}
            <Typography variant="body1" sx={{ color: "#1F2937" }}>
              Are you sure you want to delete the token bundle{" "}
              <strong>{bundleNameToDelete}</strong>?
            </Typography>
            <Typography variant="body2" sx={{ color: "#6B7280", mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDeleteDialog}
              sx={{
                color: "#7844D3",
                "&:hover": { bgcolor: "#F5F3FF" },
                textTransform: "none",
              }}
              disabled={deleteDialogLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteBundle}
              sx={{
                bgcolor: "#EF4444",
                color: "white",
                "&:hover": { bgcolor: "#DC2626" },
                textTransform: "none",
              }}
              disabled={deleteDialogLoading}
            >
              {deleteDialogLoading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default TokenBundles;
