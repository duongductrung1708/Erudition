import React, { useCallback, useEffect, useState } from "react";
import { Box, IconButton, TextField, Tooltip } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

const ChatInput = ({
  disabled,
  placeholder,
  onSend,
  isChatbotDisabled,
  isChatbotCreator,
  isLoading,
}) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (disabled) {
      setValue("");
    }
  }, [disabled]);

  const handleSend = useCallback(() => {
    const message = value.trim();
    if (!message) return;
    onSend(message);
    setValue("");
  }, [onSend, value]);

  const tooltipTitle =
    isChatbotDisabled && !isChatbotCreator ? "Chatbot is disabled. Viewing only." : "";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: "1rem",
        bgcolor: "#fff",
        width: "100%",
      }}
    >
      <Box
        sx={{
          boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.35)",
          display: "flex",
          alignItems: "center",
          bgcolor: "white",
          borderRadius: "12px",
          border: "1px solid white",
          width: { xs: "90%", sm: "80%", md: "44rem" },
        }}
      >
        <Tooltip title={tooltipTitle} arrow>
          <TextField
            disabled={disabled}
            fullWidth
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            multiline
            maxRows={4}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !disabled) {
                e.preventDefault();
                handleSend();
              }
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                "& fieldset": { border: "none" },
                "&:hover fieldset": { borderColor: "white" },
                "&.Mui-focused fieldset": { borderColor: "white" },
                "&.Mui-disabled": { bgcolor: "white" },
              },
            }}
          />
        </Tooltip>
        <Tooltip title={tooltipTitle || "Send"} placement="top">
          <IconButton
            disabled={disabled || isLoading}
            sx={{
              ml: 2,
              color: "#7844D3",
              "&:hover": { bgcolor: "#E0D4F5" },
              "&:disabled": { bgcolor: "#F5F5F5", color: "#CCCCCC" },
            }}
            onClick={handleSend}
          >
            <SendIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default React.memo(ChatInput);

