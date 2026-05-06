import React, { memo } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import Chat from "../../components/Chat";
import ConversationSidebar from "./components/ConversationSidebar";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

const ConversationForUserView = ({
  chatbotName,
  sidebarOpen,
  sidebarRef,
  conversations,
  conversationId,
  onToggleSidebar,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  chatProps,
  confirmDeleteOpen,
  onCloseConfirmDelete,
  onConfirmDelete,
}) => {
  return (
    <>
      <title>Erudition | Chat with bot</title>
      <Box
        sx={{
          height: "93vh",
          mt: "3rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <ConversationSidebar
          sidebarRef={sidebarRef}
          sidebarOpen={sidebarOpen}
          chatbotName={chatbotName}
          conversations={conversations}
          activeConversationId={conversationId}
          onNewChat={onNewChat}
          onToggleSidebar={onToggleSidebar}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
        />

        <Box sx={{ width: "100%", height: "93vh", overflowY: "hidden" }}>
          {!sidebarOpen && (
            <Box
              sx={{
                position: "fixed",
                top: { xs: "3.6rem", md: "5rem" },
                left: { xs: "3.5rem", md: "15rem" },
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                backgroundColor: "background.paper",
                padding: "4px 12px",
                borderRadius: "4px",
                maxWidth: "300px",
              }}
            >
              <IconButton onClick={onToggleSidebar} sx={{ mr: 1, p: 0 }}>
                <ViewSidebarOutlinedIcon />
              </IconButton>
              <Tooltip title={chatbotName} placement="bottom">
                <Typography
                  variant="subtitle1"
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
            </Box>
          )}

          <Chat {...chatProps} />
        </Box>

        <ConfirmDeleteDialog
          open={confirmDeleteOpen}
          onClose={onCloseConfirmDelete}
          onConfirm={onConfirmDelete}
        />
      </Box>
    </>
  );
};

export default memo(ConversationForUserView);

