import React, { memo } from "react";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";

const ConversationSidebar = ({
  sidebarRef,
  sidebarOpen,
  chatbotName,
  conversations,
  activeConversationId,
  onNewChat,
  onToggleSidebar,
  onSelectConversation,
  onDeleteConversation,
}) => {
  return (
    <Box
      ref={sidebarRef}
      sx={{
        backgroundColor: "#F3F3F3",
        overflowY: "auto",
        height: "93vh",
        transition: "all 0.3s ease",
        position: "absolute",
        top: { xs: 56 },
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        zIndex: sidebarOpen ? 1 : -1,
        width: "300px",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          backgroundColor: "#F3F3F3",
          padding: 2,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Tooltip title={chatbotName} placement="bottom">
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: { xs: "150px", sm: "200px", md: "250px" },
              }}
            >
              {chatbotName}
            </Typography>
          </Tooltip>
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="New Chat" placement="bottom">
              <IconButton onClick={onNewChat}>
                <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onToggleSidebar}>
              <ViewSidebarOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Box sx={{ padding: "0 16px 16px 16px", marginTop: "1rem" }}>
        <List>
          {conversations.map((item) => (
            <ListItem
              key={item.id}
              disablePadding
              onClick={(e) => {
                e.stopPropagation();
                onSelectConversation(item.id);
              }}
              sx={{
                marginBottom: "8px",
                "&:hover .delete-icon": { visibility: "visible" },
                "&:hover": { borderRadius: "12px" },
              }}
            >
              <ListItemButton
                sx={{
                  justifyContent: "space-around",
                  backgroundColor:
                    activeConversationId === item.id ? "#E0E0E0" : "transparent",
                  borderRadius: "8px",
                  paddingTop: "4px",
                  paddingBottom: "4px",
                  "&:hover": { backgroundColor: "#ECECEC" },
                }}
              >
                <Tooltip title={item.first_msg} placement="top">
                  <ListItemText
                    primary={item.first_msg}
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "150px",
                    }}
                  />
                </Tooltip>
                <Tooltip title="Delete Chat" placement="bottom">
                  <Box
                    className="delete-icon"
                    sx={{
                      visibility:
                        activeConversationId === item.id ? "visible" : "hidden",
                    }}
                  >
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(item.id);
                      }}
                    >
                      <ClearOutlinedIcon />
                    </IconButton>
                  </Box>
                </Tooltip>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default memo(ConversationSidebar);

