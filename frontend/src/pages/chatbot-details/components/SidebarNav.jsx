import React, { memo } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const SidebarNav = ({
  loading,
  agentName,
  activeComponent,
  buttons,
  onBack,
  onSelectComponent,
}) => {
  return (
    <Box
      sx={{
        flexDirection: "column",
        px: 3,
        py: 5,
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        mb: 1,
        marginTop: { xs: "3rem" },
        backgroundColor: "white",
      }}
    >
      <Button
        sx={{
          color: "black",
          borderRadius: "10px",
          "&:hover": { backgroundColor: "#f1f1f1" },
        }}
        onClick={onBack}
      >
        <ArrowBackIcon />
        <Typography variant="h6" fontWeight="bold" paddingRight="0.5rem">
          Back
        </Typography>
      </Button>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          textAlign: "center",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress size={24} sx={{ color: "#5E33A8" }} />
          </Box>
        ) : (
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              color: "#1976d2 !important",
              p: 1.5,
              maxWidth: { xs: 150, sm: 200 },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={agentName || "Chatbot"}
          >
            {agentName || "Chatbot"}
          </Typography>
        )}

        {buttons.map((button) => (
          <Button
            key={button.key}
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              padding: 1.5,
              textTransform: "none",
              color: "black",
              backgroundColor:
                activeComponent === button.component ? "#F1E9FF" : "transparent",
              fontWeight: activeComponent === button.component ? "bold" : "normal",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#d8caf2", fontWeight: "bold" },
            }}
            onClick={() => onSelectComponent(button)}
          >
            {button.icon}
            <Typography variant="body2">{button.label}</Typography>
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default memo(SidebarNav);

