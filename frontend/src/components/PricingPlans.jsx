import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip,
} from "@mui/material";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PaymentIcon from "@mui/icons-material/Payment";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { checkout } from "../services/chatbot_api";
import { getTokenBundle } from "../services/api";
import { useAuth } from "../hooks/AuthProvider";

export default function PricingPlans({ chatbots }) {
  console.log(chatbots);
  const { user } = useAuth();
  const token = user.accessToken;
  const [plansData, setPlansData] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedChatbotId, setSelectedChatbotId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plans = await getTokenBundle(token);
        setPlansData(plans);
      } catch (error) {
        console.error("Error fetching token bundles:", error);
        toast.error("Failed to fetch token bundles.");
      }
    };

    fetchPlans();
  }, [token]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedPlan(null);
    setSelectedChatbotId("");
  };

  const handleChatbotChange = (event) => {
    setSelectedChatbotId(event.target.value);
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.warn("Please select a deposit bundle.");
      return;
    }
    if (!selectedChatbotId) {
      toast.warn("Please select a chatbot to deposit.");
      return;
    }

    setLoading(true);
    const paymentData = {
      amount: parseFloat(selectedPlan.price),
      notes: `Top up bundle '${selectedPlan.name}' for chatbot ${selectedChatbotId}`,
      chatbot_id: selectedChatbotId,
    };
    try {
      console.log("Đang gọi API thanh toán với:", paymentData);
      const response = await checkout(paymentData, token);
      console.log("Phản hồi API thanh toán:", response);

      const redirectUrl =
        response?.url ||
        response?.data?.url ||
        response?.checkout_url ||
        response?.data?.checkout_url;

      if (redirectUrl) {
        window.location.href = redirectUrl;
        toast.success("Redirected to secure payment page.");
      } else {
        toast.success("Transaction successful!");
        console.log("Không có URL chuyển hướng, có thể đã xử lý trực tiếp.");
        navigate("/payment-return", {
          state: { paymentResponse: response, purchaseDetails: paymentData },
        });
      }
      handleClosePaymentDialog();
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Đã xảy ra lỗi khi thanh toán. Vui lòng thử lại.";
      toast.error(`Lỗi thanh toán: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    const integerAmount = Math.round(Number(amount || 0));
    return integerAmount.toLocaleString("vi-VN");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 3,
        marginTop: { xs: "42rem", md: "0", lg: "0" },
      }}
    >
      <Box
        sx={{
          padding: "2rem",
          border: "none",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          fontWeight="bold"
          sx={{ marginBottom: 3 }}
        >
          Pricing plans for all token bundles
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ marginBottom: 3 }}
        >
          For customized enterprise solutions, please{" "}
          <a style={{ color: "purple" }}>contact us.</a>
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3} justifyContent="center">
          {plansData.map((plan, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={plansData.length < 3 ? 6 : 3}
              key={plan.id}
            >
              <Card
                sx={{
                  display: "flex",
                  height: "23rem",
                  flexDirection: "column",
                  alignItems: "center",
                  borderRadius: 2,
                  boxShadow: 3,
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  textAlign: "start",
                  padding: 1,
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0px 6px 16px rgba(87, 59, 255, 0.4)",
                  },
                  border: "1px solid",
                  borderColor: index === 2 ? "#794cca" : "white",
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-evenly",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        background:
                          "linear-gradient(90deg, #9933ff 0%, #ff99cc 100%)",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      {plan.name}
                    </Typography>
                  </Box>

                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    align="center"
                    sx={{ marginBottom: 1 }}
                  >
                    {formatAmount(plan.price)}VND
                  </Typography>

                  <Typography
                    variant="h7"
                    align="center"
                    sx={{ marginBottom: 1, color: "green" }}
                  >
                    {formatAmount(plan.token_amount)}Tokens
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ minHeight: "auto", marginBottom: 2 }}
                  >
                    {plan.description}
                  </Typography>

                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#794CCA",
                      color: "#fff",
                      width: "100%",
                      textTransform: "none",
                    }}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Select
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog
        open={openPaymentDialog}
        onClose={handleClosePaymentDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#794CCA",
            color: "white",
            py: 2,
            mb: 4,
            borderTopLeftRadius: "inherit",
            borderTopRightRadius: "inherit",
          }}
        >
          <Box display="flex" alignItems="center">
            <LocalAtmIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              Purchase tokens
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          {selectedPlan && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600, mb: 3 }}
                  >
                    <ReceiptLongIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                    Bundle information
                  </Typography>

                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: "rgba(121, 76, 202, 0.08)",
                      borderRadius: 1,
                      borderLeft: "4px solid #794CCA",
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Selected plan
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {selectedPlan.name}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Description
                    </Typography>
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: "background.paper",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="body1">
                        {selectedPlan.description}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Price summary
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1,
                        p: 1,
                        bgcolor: "rgba(121, 76, 202, 0.05)",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="h5"
                        color="primary"
                        sx={{ fontWeight: 700 }}
                      >
                        {formatAmount(selectedPlan.price)} VND
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        (incl. VAT)
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        p: 2,
                        bgcolor: "rgba(76, 175, 80, 0.08)",
                        borderRadius: 1,
                        borderLeft: "4px solid #4CAF50",
                      }}
                    >
                      <Typography variant="body1" sx={{ mr: 2 }}>
                        You receive:
                      </Typography>
                      <Chip
                        label={`${formatAmount(
                          selectedPlan.token_amount
                        )} tokens`}
                        color="success"
                        size="medium"
                        sx={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          px: 1.5,
                          py: 1.75,
                        }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    <SmartToyIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                    Assign to chatbot
                  </Typography>

                  <FormControl fullWidth>
                    <InputLabel
                      sx={{
                        "&.Mui-focused": { color: "#9c27b0" },
                      }}
                    >
                      Select chatbot
                    </InputLabel>
                    <Select
                      labelId="select-chatbot-label"
                      id="select-chatbot"
                      value={selectedChatbotId}
                      onChange={handleChatbotChange}
                      label="Select chatbot"
                      size="medium"
                      color="secondary"
                    >
                      {chatbots.map((chatbot) => (
                        <MenuItem
                          key={chatbot.id}
                          value={chatbot.id}
                          sx={{ py: 1 }}
                        >
                          <ListItemIcon>
                            <ChatBubbleOutlineIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={chatbot.name}
                            secondary={
                              chatbot.organization?.name ||
                              chatbot.organization ||
                              "No organization"
                            }
                            primaryTypographyProps={{ fontWeight: "medium" }}
                            secondaryTypographyProps={{
                              color: "text.secondary",
                              fontSize: "0.875rem",
                            }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box mt={4}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handlePayment}
                      disabled={!selectedChatbotId || loading}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} color="#794cca" />
                        ) : (
                          <PaymentIcon />
                        )
                      }
                      sx={{
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: "1rem",
                        boxShadow: "none",
                        "&:hover": {
                          boxShadow: "none",
                          transform: "translateY(-1px)",
                          transition: "transform 0.2s",
                        },
                        "&:active": {
                          transform: "none",
                        },
                      }}
                    >
                      {loading ? "Processing Payment..." : "Proceed to Payment"}
                    </Button>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      textAlign="center"
                      mt={1}
                    >
                      Secure payment processing
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClosePaymentDialog}
            disabled={loading}
            sx={{
              color: "white",
              bgcolor: "#794CCA",
              px: 3,
              borderWidth: 2,
              "&:hover": {
                bgcolor: "#6a3fb8",
              },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
