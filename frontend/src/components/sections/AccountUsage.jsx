import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  Button,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Message,
  Description,
  SettingsInputComponent,
  AttachMoney
} from "@mui/icons-material";
import PricingPlans from "../PricingPlans";

const AccountUsage = ({
  user,
  chatbots,
  chatbotCount,
  conversationCount,
  documentCount,
  paymentHistory,
  isLoading,
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Count total payments
  const paymentCount = paymentHistory.length;

  return (
    <Box sx={{ padding: 3, height: "85vh", overflowY: "auto" }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 3 }}>
        Account activities
      </Typography>

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Grid container spacing={2} justifyContent="center">
          {/* Agents Card */}
          <Grid item xs={12} sm={3}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: 2,
                boxShadow: 3,
                padding: 3,
                height: "200px",
              }}
            >
              <Typography variant="h6" sx={{ fontSize: ".875rem" }}>
                Chatbots
              </Typography>
              <SettingsInputComponent
                sx={{
                  fontSize: 40,
                  color: "#794CCA",
                  marginBottom: 2,
                  marginTop: "36px",
                }}
              />
              <Typography
                variant="h6"
                sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
              >
                {chatbotCount || 0}
              </Typography>
            </Card>
          </Grid>

          {/* Messages Card */}
          <Grid item xs={12} sm={3}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: 2,
                boxShadow: 3,
                padding: 3,
                height: "200px",
              }}
            >
              <Typography variant="h6" sx={{ fontSize: ".875rem" }}>
                Conversations
              </Typography>
              <Message
                sx={{
                  fontSize: 40,
                  color: "#794CCA",
                  marginBottom: 2,
                  marginTop: "36px",
                }}
              />
              <Typography
                variant="h6"
                sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
              >
                {conversationCount || 0}
              </Typography>
            </Card>
          </Grid>

          {/* Payments Card */}
          <Grid item xs={12} sm={3}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: 2,
                boxShadow: 3,
                padding: 3,
                height: "200px",
              }}
            >
              <Typography variant="h6" sx={{ fontSize: ".875rem" }}>
                Payments
              </Typography>
              <AttachMoney
                sx={{
                  fontSize: 40,
                  color: "#794CCA",
                  marginBottom: 2,
                  marginTop: "36px",
                }}
              />
              <Typography
                variant="h6"
                sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
              >
                {paymentCount || 0}
              </Typography>
            </Card>
          </Grid>

          {/* Documents Card */}
          <Grid item xs={12} sm={3}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: 2,
                boxShadow: 3,
                padding: 3,
                height: "200px",
              }}
            >
              <Typography variant="h6" sx={{ fontSize: ".875rem" }}>
                Documents
              </Typography>
              <Description
                sx={{
                  fontSize: 40,
                  color: "#794CCA",
                  marginBottom: 2,
                  marginTop: "36px",
                }}
              />
              <Typography
                variant="h6"
                sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
              >
                {documentCount || 0}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      <Divider sx={{ my: 4 }} />

      <Box
        sx={{
          textAlign: "center",
          padding: 3,
          backgroundColor: "#f5f5f5",
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "#5E33A8",
            marginBottom: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#5E33A8">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
          </svg>
          Unlock full chatbot potential
        </Typography>

        <Typography variant="body1" sx={{ color: "#555", marginBottom: 2 }}>
          Your chatbot is currently running on limited tokens. Purchase
          additional tokens to:
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            textAlign: "left",
            marginBottom: 3,
            "& li": {
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              mb: 1,
            },
          }}
        >
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            <li>
              <span>✅ Continue uninterrupted conversations</span>
            </li>
            <li>
              <span>✅ Add more documents</span>
            </li>
          </Box>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            <li>
              <span>✅ Enable premium features</span>
            </li>
            <li>
              <span>✅ Add more frequently Q&As</span>
            </li>
          </Box>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: "#5E33A8",
            fontWeight: "bold",
            marginBottom: 3,
            fontStyle: "italic",
          }}
        >
          Replenish now!
        </Typography>

        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: "#5E33A8",
            color: "#fff",
            padding: "12px 32px",
            textTransform: "none",
            fontWeight: "bold",
            borderRadius: "50px",
            boxShadow: "0 4px 6px rgba(94, 51, 168, 0.2)",
            "&:hover": {
              backgroundColor: "#4a2991",
              boxShadow: "0 6px 8px rgba(94, 51, 168, 0.3)",
            },
          }}
          onClick={handleOpen}
          startIcon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
            </svg>
          }
        >
          Buy tokens now
        </Button>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="lg"
        sx={{
          "& .MuiDialog-paper": {
            maxHeight: "100vh",
            height: "95vh",
            overflowY: "auto",
          },
        }}
      >
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

export default AccountUsage;