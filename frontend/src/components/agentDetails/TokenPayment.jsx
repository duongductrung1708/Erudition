import React, { useState } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  Button,
  TextField,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { checkout } from "../../services/chatbot_api";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/AuthProvider";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { CreditCardIcon } from "lucide-react";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

const TokenPayment = ({ agentDetails }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { chatbotId } = useParams();
  const token = user.accessToken;
  const navigate = useNavigate();
  const agent_name = agentDetails?.name || "N/A";
  const chatbot_creator = agentDetails?.chatbot_creator?.email || "N/A";

  const StyledInfoCard = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius * 1.5,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
    boxShadow: theme.shadows[1],
  }));
  const formatAmount = (amount) => {
    const integerAmount = Math.round(Number(amount || 0));

    return integerAmount.toLocaleString("vi-VN");
  };
  const purpleColor = "#7844D3";
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 10,
    notes: "",
    chatbot_id: chatbotId,
  });
  const [packageOption, setPackageOption] = useState("10");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const packageOptions = [
    { value: "10", amount: 10000, label: "10 tokens - 10.000VND" },
    { value: "50", amount: 45000, label: "50 tokens - 45.000VND" },
    { value: "100", amount: 80000, label: "100 tokens - 80.000VND" },
    { value: "custom", amount: 0, label: "Custom amount" },
  ];

  // Find the label for the currently selected package
  const getSelectedPackageLabel = () => {
    if (packageOption === "custom") {
      return `Custom amount: $${paymentData.amount}`;
    }
    const selected = packageOptions.find((pkg) => pkg.value === packageOption);
    return selected ? selected.label : "N/A";
  };

  const handlePackageChange = (e) => {
    const value = e.target.value;
    setPackageOption(value);

    if (value !== "custom") {
      const selectedPackage = packageOptions.find((pkg) => pkg.value === value);
      if (selectedPackage) {
        setPaymentData({
          ...paymentData,
          amount: selectedPackage.amount,
        });
      }
    } else {
      setPaymentData({ ...paymentData, amount: 0 });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === "amount" ? Number(value) : value;
    setPaymentData({
      ...paymentData,
      [name]: finalValue,
    });
  };

  // Function to open the confirmation dialog
  const handleOpenDialog = (e) => {
    e.preventDefault();
    if (
      packageOption === "custom" &&
      (!paymentData.amount || paymentData.amount <= 0)
    ) {
      toast.warn("Please enter a valid custom amount greater than 0.");
      return;
    }
    if (!paymentData.notes.trim()) {
      toast.warn("Please enter a payment note.");
      return;
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    handleCloseDialog();

    try {
      console.log("Submitting payment data:", paymentData);
      const response = await checkout(paymentData, token);
      console.log("Checkout API response:", response);

      const redirectUrl =
        response?.url ||
        response?.data?.url ||
        response?.checkout_url ||
        response?.data?.checkout_url;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.info(
          "Payment processed (no redirect URL found). Navigating to return page."
        );
        console.log("Full response (no redirect URL):", response);
        navigate("/payment-return", {
          state: { paymentResponse: response, purchaseDetails: paymentData },
        });
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || "Payment failed";
      toast.error(`Payment Error: ${errorMessage}`);
      console.error("Payment error details:", error.response || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: isMobile ? "100%" : "500px",
        margin: "0 auto",
        p: 2,
        minHeight: isMobile ? "calc(100vh - 64px)" : "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        mt: isMobile ? 0 : 4,
      }}
    >
      <Card elevation={3} sx={{ width: "100%" }}>
        {loading && <LinearProgress sx={{ color: "#7844D3" }} />}
        <CardContent>
          <Typography
            variant="h5"
            gutterBottom
            align="center"
            sx={{ fontWeight: "bold" }}
          >
            Token Purchase for {agent_name}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Keep the form for input organization, but submission triggered differently */}
          <form>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel
                id="package-select-label"
                sx={{
                  "&.Mui-focused": { color: "#9c27b0" },
                }}
              >
                Token package
              </InputLabel>
              <Select
                labelId="package-select-label"
                value={packageOption}
                label="Token package"
                color="secondary"
                onChange={handlePackageChange}
              >
                {packageOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {packageOption === "custom" && (
              <TextField
                fullWidth
                type="number"
                label="Custom amount ($)"
                name="amount"
                color="secondary"
                value={paymentData.amount}
                onChange={handleInputChange}
                sx={{ mb: 3 }}
                inputProps={{ min: 1 }}
                required
              />
            )}

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Payment note"
              name="notes"
              color="secondary"
              value={paymentData.notes}
              onChange={handleInputChange}
              sx={{ mb: 3 }}
              required
            />

            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              {/* This button now opens the dialog */}
              <Button
                type="button"
                onClick={handleOpenDialog}
                variant="contained"
                color="secondary"
                size="large"
                disabled={loading}
                sx={{ px: 4, py: 1.5, bgcolor: "#7844D3" }}
              >
                Proceed to Payment
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Click "Proceed to Payment" to confirm your purchase details.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            overflow: "hidden",
            borderRadius: "12px",
            maxWidth: "900px",
          },
        }}
      >
        {/* Optional Close Button */}
        <IconButton
          aria-label="close"
          onClick={handleCloseDialog}
          disabled={loading}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "grey.500",
            zIndex: 1,
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent sx={{ p: 0 }}>
          <Grid container>
            <Grid item xs={12} md={7} sx={{ p: 3, bgcolor: "grey.50" }}>
              {" "}
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "grey.800", mb: 2 }}
              >
                {" "}
                Selected Plan
              </Typography>
              <StyledInfoCard>
                {" "}
                <Typography
                  variant="h5"
                  component="h3"
                  sx={{ fontWeight: "bold", color: purpleColor }}
                >
                  {" "}
                  {agent_name}
                </Typography>
                <Typography variant="body2" sx={{ color: "grey.500", mb: 1 }}>
                  {" "}
                  Created by: {chatbot_creator}
                </Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  {" "}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    {" "}
                    <CheckCircleIcon
                      sx={{ color: "success.main", fontSize: 18 }}
                    />{" "}
                    <Typography variant="body2">
                      {getSelectedPackageLabel()}
                    </Typography>{" "}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <CheckCircleIcon
                      sx={{ color: "success.main", fontSize: 18 }}
                    />
                    <Typography variant="body2">
                      Secure payment processing
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon
                      sx={{ color: "success.main", fontSize: 18 }}
                    />
                    <Typography variant="body2">
                      Instant token credit
                    </Typography>
                  </Box>
                </Box>
              </StyledInfoCard>
              {paymentData.notes && (
                <StyledInfoCard sx={{ p: 2 }}>
                  {" "}
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 0.5, fontWeight: 500, color: "grey.800" }}
                  >
                    {" "}
                    Payment Note:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", wordBreak: "break-word" }}
                  >
                    {" "}
                    {paymentData.notes}
                  </Typography>
                </StyledInfoCard>
              )}
            </Grid>

            {/* --- Right column (MUI Grid item) --- */}
            <Grid
              item
              xs={12}
              md={5}
              sx={{
                p: 3,
                borderTop: { xs: 1, md: 0 },
                borderLeft: { xs: 0, md: 1 },
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "grey.800", mb: 2 }}
              >
                {" "}
                Order Summary
              </Typography>

              {/* Order Summary Details */}
              <Box sx={{ mb: 3 }}>
                {" "}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    {getSelectedPackageLabel()}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatAmount(paymentData.amount)}VND
                  </Typography>{" "}
                  {/* font-medium */}
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="h6"
                    component="span"
                    sx={{ fontWeight: 600 }}
                  >
                    Total due
                  </Typography>{" "}
                  <Typography
                    variant="h6"
                    component="span"
                    sx={{ fontWeight: 600 }}
                  >
                    {formatAmount(paymentData.amount)}VND
                  </Typography>
                </Box>
              </Box>

              {/* --- Pay Button (MUI Button styled with sx) --- */}
              <Button
                fullWidth
                onClick={handleSubmit}
                variant="contained"
                disabled={loading}
                startIcon={loading ? null : <CreditCardIcon />}
                sx={{
                  py: 1.8,
                  bgcolor: purpleColor,
                  color: "white",
                  fontWeight: 500,
                  fontSize: "1.1rem",
                  textTransform: "none",
                  gap: 1,
                  "&:hover": {
                    bgcolor: "#5e35b1",
                  },
                }}
              >
                {loading
                  ? "Processing..."
                  : `Pay ${formatAmount(paymentData.amount)} VND now`}
              </Button>

              {/* Secure Payment Text */}
              <Box sx={{ mt: 2, textAlign: "center" }}>
                {" "}
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {" "}
                  <AttachMoneyIcon sx={{ fontSize: 16 }} />
                  Secure payment processing
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TokenPayment;
