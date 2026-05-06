import React, { memo } from "react";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const ChatbotStatsControls = ({
  chatbots,
  selectedChatbot,
  chartType,
  fetchData,
  setChartType,
  onOpenDatePicker,
  isMobile,
  theme,
  StyledButton,
}) => {
  return (
    <Box
      sx={{
        mb: 2,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 2 : 0,
      }}
    >
      <Box
        sx={{
          mb: isMobile ? 2 : 0,
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {chatbots.map((bot) => (
          <Tooltip title={bot.name} key={bot.id}>
            <StyledButton
              color="secondary"
              variant={selectedChatbot === bot.id ? "contained" : "outlined"}
              onClick={() => fetchData(bot.id)}
              sx={{
                bgcolor: selectedChatbot === bot.id ? "#7844D3" : "transparent",
                color: selectedChatbot === bot.id ? "white" : "#7844D3",
                borderColor: "#7844D3",
                "&:hover": {
                  bgcolor: selectedChatbot === bot.id ? "#8B5CF6" : "#F5F3FF",
                  borderColor: "#8B5CF6",
                },
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                py: 0.5,
                px: 2,
              }}
            >
              {bot.name.length > 20 ? `${bot.name.substring(0, 17)}...` : bot.name}
            </StyledButton>
          </Tooltip>
        ))}
      </Box>

      {selectedChatbot && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120, mt: "0.6rem" }}>
            <InputLabel
              sx={{
                "&.Mui-focused": { color: "#5E33A8" },
                color: "#6B7280",
              }}
            >
              Metric
            </InputLabel>
            <Select
              value={chartType}
              label="Metric"
              onChange={(e) => setChartType(e.target.value)}
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
              <MenuItem value="tokens">Tokens</MenuItem>
              <MenuItem value="requests">Requests</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Select date range">
            <IconButton
              onClick={onOpenDatePicker}
              sx={{
                color: "#7844D3",
                "&:hover": { color: "#8B5CF6" },
              }}
            >
              <CalendarTodayIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default memo(ChatbotStatsControls);

