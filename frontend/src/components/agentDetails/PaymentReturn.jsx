import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  styled,
  Tooltip,
  Chip,
} from "@mui/material";
import { payment_return } from "../../services/chatbot_api";
import { useAuth } from "../../hooks/AuthProvider";
import { toast } from "react-toastify";

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[6],
  backgroundColor: "#FFFFFF",
  animation: "fadeIn 0.5s ease-in",
  "@keyframes fadeIn": {
    from: { opacity: 0, transform: "translateY(20px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  [theme.breakpoints.down("sm")]: {
    margin: theme.spacing(1),
  },
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: "#F9FAFB",
  },
  "&:hover": {
    backgroundColor: "#F5F3FF",
  },
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#7844D3",
  color: "#FFFFFF",
  textTransform: "none",
  padding: theme.spacing(1.5, 4),
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    backgroundColor: "#8B5CF6",
    boxShadow: theme.shadows[4],
  },
  "&:disabled": {
    backgroundColor: "#D1D5DB",
    color: "#6B7280",
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1, 3),
    fontSize: "0.875rem",
  },
}));

const PaymentReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.accessToken;

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [urlParams, setUrlParams] = useState(null);
  const [error, setError] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount / 100);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("vi-VN").format(number);
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 14) return dateStr;
    const year = dateStr.slice(2, 4); // YY
    const month = dateStr.slice(4, 6); // MM
    const day = dateStr.slice(6, 8); // DD
    const hour = dateStr.slice(8, 10); // HH
    const minute = dateStr.slice(10, 12); // MM
    return `${hour}:${minute} ${day}/${month}/${year}`;
  };

  const formatValue = (key, value) => {
    if (key === "amount" || key === "vnp_Amount") {
      return formatCurrency(value);
    }
    if (key === "tokens_received") {
      return formatNumber(value);
    }
    if (key === "vnp_PayDate") {
      return formatDate(value);
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2).replace(/[{}"]/g, "");
    }
    return value;
  };

  const getStatusChip = (status) => {
    const isSuccess = status === "00";
    return (
      <Chip
        label={isSuccess ? "Success" : "Failed"}
        color={isSuccess ? "success" : "error"}
        size="small"
        sx={{ fontWeight: "medium" }}
      />
    );
  };

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        setLoading(true);

        const searchParams = new URLSearchParams(location.search);
        const paramsObj = {};
        for (const [key, value] of searchParams.entries()) {
          paramsObj[key] = value;
        }
        setUrlParams(paramsObj);

        if (location.state && location.state.paymentData) {
          console.log(
            "Using payment data from navigation state:",
            location.state.paymentData
          );
          setPaymentInfo(location.state.paymentData);
          setLoading(false);
          return;
        }

        if (searchParams.toString()) {
          const response = await payment_return(token, searchParams);

          setPaymentInfo(response);
        } else {
          setError("No payment information available");
        }
      } catch (err) {
        console.error("Error fetching payment info:", err);
        setError(err.message || "Failed to fetch payment information");
        toast.error("Failed to fetch payment information");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPaymentInfo();
    } else {
      setError("Authentication token not found");
      setLoading(false);
    }
  }, [location.search, location.state, token]);

  const handleBackToHome = () => {
    navigate("/workspace");
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          p: 2,
        }}
      >
        <CircularProgress sx={{ color: "#5E33A8", mb: 2 }} />
        <Typography
          variant="h6"
          sx={{ color: "#1F2937", fontWeight: "medium" }}
        >
          Loading payment information...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
          mt: { xs: 2, sm: 4 },
          p: { xs: 1, sm: 2 },
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <StyledCard>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h5"
              sx={{
                color: "#EF4444",
                fontWeight: "bold",
                mb: 2,
                textAlign: "center",
              }}
            >
              Error
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#1F2937", mb: 3, textAlign: "center" }}
            >
              {error}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <StyledButton onClick={handleBackToHome}>
                Back to home
              </StyledButton>
            </Box>
          </CardContent>
        </StyledCard>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        mt: { xs: 8, sm: 10 },
        p: { xs: 1, sm: 2 },
        minHeight: "100vh",
      }}
    >
      <StyledCard>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box
            sx={{
              bgcolor: "#5E33A8",
              color: "white",
              py: 2,
              px: 3,
              borderRadius: (theme) => theme.shape.borderRadius,
              mb: 3,
              textAlign: "center",
              background: "linear-gradient(135deg, #5E33A8, #7844D3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "1.5rem", sm: "2rem" },
              }}
            >
              Payment information
            </Typography>
            {urlParams?.vnp_TransactionStatus && (
              <Tooltip title="Transaction Status">
                {getStatusChip(urlParams.vnp_TransactionStatus)}
              </Tooltip>
            )}
          </Box>

          <Divider sx={{ my: 3, borderColor: "#E5E7EB" }} />

          {paymentInfo ? (
            <>
              <Typography
                variant="h6"
                sx={{
                  color: "#1F2937",
                  fontWeight: "bold",
                  mb: 2,
                  ml: 2,
                }}
              >
                Transaction details
              </Typography>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, sm: 3 },
                  mb: 3,
                  borderRadius: (theme) => theme.shape.borderRadius,
                  bgcolor: "#F9FAFB",
                }}
              >
                <List disablePadding>
                  {Object.entries(paymentInfo).map(([key, value]) => (
                    <StyledListItem key={key}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: "medium",
                              color: "#1F2937",
                            }}
                          >
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#4B5563",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: { xs: "200px", sm: "400px" },
                            }}
                          >
                            {formatValue(key, value)}
                          </Typography>
                        }
                      />
                    </StyledListItem>
                  ))}
                </List>
              </Paper>
            </>
          ) : (
            <Typography
              variant="body1"
              sx={{
                color: "#1F2937",
                textAlign: "center",
                py: 3,
              }}
            >
              No transaction details available
            </Typography>
          )}

          {urlParams && Object.keys(urlParams).length > 0 && (
            <>
              <Typography
                variant="h6"
                sx={{
                  color: "#1F2937",
                  fontWeight: "bold",
                  mb: 2,
                  ml: 2,
                }}
              >
                Payment gateway info
              </Typography>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, sm: 3 },
                  mb: 3,
                  borderRadius: (theme) => theme.shape.borderRadius,
                  bgcolor: "#F9FAFB",
                }}
              >
                <List disablePadding>
                  {Object.entries(urlParams).map(([key, value]) => (
                    <StyledListItem key={key}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: "medium",
                              color: "#1F2937",
                            }}
                          >
                            {key
                              .replace(/vnp_/g, "")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Typography>
                        }
                        secondary={
                          <Tooltip title={value}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#4B5563",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: { xs: "200px", sm: "400px" },
                              }}
                            >
                              {formatValue(key, value)}
                            </Typography>
                          </Tooltip>
                        }
                      />
                    </StyledListItem>
                  ))}
                </List>
              </Paper>
            </>
          )}

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <StyledButton onClick={handleBackToHome} size="large">
              Back to home
            </StyledButton>
          </Box>
        </CardContent>
      </StyledCard>
    </Box>
  );
};

export default PaymentReturn;
