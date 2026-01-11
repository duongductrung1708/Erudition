import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
} from "@mui/material";
import MemoryIcon from "@mui/icons-material/Memory";
import BusinessIcon from "@mui/icons-material/Business";
import TuneIcon from "@mui/icons-material/Tune";
import ShieldIcon from "@mui/icons-material/Security";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const ChatbotCard = ({ chatbot }) => {
  const guardRailItems = chatbot.guard_rails
    ? chatbot.guard_rails.split("<SEP>").filter((item) => item.trim() !== "")
    : [];

  const formatTokens = (tokens) => tokens?.toLocaleString() || "0";

  const remainingTokens = chatbot.remaining_tokens || 0;
  const isLowTokens = remainingTokens < 1000;
  const tokenColor = isLowTokens ? "error.main" : "success.main";

  const isActive =
    chatbot.is_disabled !== undefined ? !chatbot.is_disabled : true;
  const statusLabel = isActive ? "Enabled" : "Disabled";
  const statusColor = isActive ? "success" : "error";

  return (
    <>
      <title>{chatbot.name}</title>
      <Card>
        <CardHeader
          avatar={<MemoryIcon color="primary" />}
          title={<Typography variant="h6">{chatbot.name}</Typography>}
          subheader={
            <Stack direction="row" alignItems="center" spacing={1}>
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="body2">{chatbot.organization}</Typography>
              <Chip
                label={statusLabel}
                color={statusColor}
                size="small"
                sx={{ height: 20, fontWeight: "medium" }}
              />
            </Stack>
          }
        />

        <CardContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {chatbot.description}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Token Usage Section */}
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Token Usage
          </Typography>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center">
              <AccountBalanceWalletIcon
                fontSize="small"
                color="primary"
                sx={{ mr: 1 }}
              />
              <Typography variant="body1" fontWeight="medium">
                Remaining Tokens:{" "}
                <Tooltip
                  title={
                    isLowTokens
                      ? "Warning: Low token balance!"
                      : "Sufficient tokens available"
                  }
                  arrow
                >
                  <Box component="span" sx={{ color: tokenColor }}>
                    {formatTokens(remainingTokens)}
                  </Box>
                </Tooltip>
              </Typography>
              {isLowTokens && (
                <Chip
                  label="Low"
                  color="error"
                  size="small"
                  sx={{ ml: 1, height: 20 }}
                />
              )}
            </Box>
            <Box display="flex" alignItems="center">
              <TrendingUpIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1" fontWeight="medium">
                Total Usage Tokens: {formatTokens(chatbot.total_usage_token)}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Box display="flex" alignItems="center">
              <TuneIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">
                Temperature: {chatbot.temperature}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center">
              <ShieldIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2" fontWeight={500}>
                Guardrails:
              </Typography>
            </Box>

            <List dense sx={{ display: "flex", flexWrap: "wrap" }}>
              {guardRailItems.map((item, index) => (
                <ListItem
                  key={index}
                  disableGutters
                  sx={{ pl: 4, flexBasis: "300px" }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        {item}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Box display="flex" alignItems="center" mt={1}>
              <QueryStatsIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">
                Quota limit: {chatbot.quota_limit} request(s) /{" "}
                {chatbot.window_size} {chatbot.window_type}(s)
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
};

export default ChatbotCard;
