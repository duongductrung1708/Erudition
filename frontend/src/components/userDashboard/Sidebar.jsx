import React, { useState } from "react";
import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  useMediaQuery,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  InfoOutlined,
  WorkspacesOutlined,
  ExpandCircleDown,
  Chat,
  BookmarkBorder,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";

const customTooltipStyles = {
  sx: {
    bgcolor: "#5E33A8",
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    paddingX: 1.5,
    paddingY: 0.8,
    borderRadius: 1,
    boxShadow: 2,
  },
};

const randomAvatars = [
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/4.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/13.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/29.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/30.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/21.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/15.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/36.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/13.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/27.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/20.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/34.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/14.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/8.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/25.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/19.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/28.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/16.svg",
  "https://agentx-resources.s3.us-west-1.amazonaws.com/system_agent_avatars/7.svg",
];

const Sidebar = ({ isSidebarOpen, toggleSidebar, chatbots }) => {
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:900px)");
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMoreClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getButtonStyles = (path) => ({
    bgcolor: location.pathname === path ? "#5E33A8" : "white",
    color: location.pathname === path ? "white" : "black",
    padding: 1,
    borderRadius: 2,
    border: "1px solid rgb(226, 226, 227)",
    "&:hover":
      location.pathname === path
        ? { bgcolor: "#5E33A8", color: "white" }
        : { bgcolor: "#EEE", color: "black" },
  });

  if (isMobile) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        width: isSidebarOpen ? 70 : 60,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "none",
        paddingY: 2,
        background: "linear-gradient(to bottom, #F5F3FF, #ffffff)",
        borderRight: "1px solid #E3E3E3",
        flexShrink: 0,
      }}
    >
      {/* Main Buttons */}
      <Stack spacing={2} mt={10}>
        <Tooltip
          title="Workspace"
          placement="right"
          componentsProps={{ tooltip: customTooltipStyles }}
        >
          <Link to="/user/workspace">
            <IconButton sx={getButtonStyles("/user/workspace")}>
              <WorkspacesOutlined />
            </IconButton>
          </Link>
        </Tooltip>
        {/* <Tooltip
          title="Help"
          placement="right"
          componentsProps={{ tooltip: customTooltipStyles }}
        >
          <Link to="/user/help">
            <IconButton sx={getButtonStyles("/user/help")}>
              <InfoOutlined />
            </IconButton>
          </Link>
        </Tooltip> */}
        <Tooltip
          title="Favorite response"
          placement="right"
          componentsProps={{ tooltip: customTooltipStyles }}
        >
          <Link to="/user/favorite-response">
            <IconButton sx={getButtonStyles("/user/favorite-response")}>
              <BookmarkBorder />
            </IconButton>
          </Link>
        </Tooltip>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Divider
          sx={{
            width: "3rem",
            height: "1px",
            marginTop: "1rem",
            backgroundColor: "neutral.300",
          }}
        />
      </Box>

      {/* Chatbot List */}
      <Box
        sx={{
          mt: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {chatbots.slice(0, 2).map((bot, index) => {
          const isDisabled = !bot.is_active;
          return (
            <Tooltip
              key={bot.id}
              title={
                isDisabled ? "This chatbot is inactive" : bot.name
              }
              placement="right"
              componentsProps={{ tooltip: customTooltipStyles }}
            >
              <span>
                <IconButton
                  onClick={() =>
                    !isDisabled &&
                    navigate(`/user/user-conversation-detail/${bot.id}`)
                  }
                  disabled={isDisabled}
                  sx={{
                    bgcolor: "white",
                    border: "1px solid #E3E3E3",
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    mb: 1,
                    p: 0,
                    opacity: isDisabled ? 0.5 : 1,
                    "&:hover": { bgcolor: isDisabled ? "white" : "#EEE" },
                  }}
                >
                  <img
                    src={
                      bot.avatar || randomAvatars[index % randomAvatars.length]
                    }
                    alt={bot.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          );
        })}
        {chatbots.length > 2 && (
          <>
            <IconButton onClick={handleMoreClick}>
              <ExpandCircleDown
                sx={{
                  color: "#5E33A8",
                }}
              />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              {chatbots.slice(2).map((bot, index) => {
                const isDisabled = !bot.is_active || (bot.is_disabled ?? false);
                return (
                  <MenuItem
                    key={bot.id}
                    onClick={() =>
                      !isDisabled &&
                      navigate(`/user/user-conversation-detail/${bot.id}`)
                    }
                    disabled={isDisabled}
                    sx={{ opacity: isDisabled ? 0.5 : 1 }}
                  >
                    <img
                      src={
                        bot.avatar ||
                        randomAvatars[index % randomAvatars.length]
                      }
                      alt={bot.name}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        marginRight: 10,
                      }}
                    />
                    {bot.name}
                  </MenuItem>
                );
              })}
            </Menu>
          </>
        )}
      </Box>

      {/* Middle Floating Button */}
      <Tooltip
        title="Chat history"
        placement="right"
        componentsProps={{ tooltip: customTooltipStyles }}
      >
        <Link to="/user/agent-chat-history">
          <IconButton
            sx={{
              bgcolor: "#5E33A8",
              color: "white",
              marginBottom: 5,
              marginTop: "1rem",
              "&:hover": { backgroundColor: "#5E33A8" },
            }}
          >
            <Chat />
          </IconButton>
        </Link>
      </Tooltip>
    </Paper>
  );
};

export default Sidebar;
