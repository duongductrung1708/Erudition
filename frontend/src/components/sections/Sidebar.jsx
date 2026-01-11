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
  Add,
  InfoOutlined,
  WorkspacesOutlined,
  ExpandCircleDown,
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

const Sidebar = ({ chatbots }) => {
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

  const handleCreateMenu = () => {
    navigate("/agents/create");
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
        width: 70,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "none",
        paddingY: 2,
        background: "linear-gradient(to bottom, #F5F3FF, #ffffff)",
        borderRight: "1px solid #E3E3E3",
        zIndex: 2,
      }}
    >
      {/* Main Buttons */}
      <Stack spacing={2} mt={10}>
        <Tooltip
          title="Workspace"
          placement="right"
          componentsProps={{ tooltip: customTooltipStyles }}
        >
          <Link to="/workspace">
            <IconButton sx={getButtonStyles("/workspace")}>
              <WorkspacesOutlined />
            </IconButton>
          </Link>
        </Tooltip>
        {/* <Tooltip
          title="Help"
          placement="right"
          componentsProps={{ tooltip: customTooltipStyles }}
        >
          <Link to="/help">
            <IconButton sx={getButtonStyles("/help")}>
              <InfoOutlined />
            </IconButton>
          </Link>
        </Tooltip> */}
        <Tooltip
          title="Favorite response"
          placement="right"
          componentsProps={{ tooltip: customTooltipStyles }}
        >
          <Link to="/favorite-response">
            <IconButton sx={getButtonStyles("/favorite-response")}>
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
                isDisabled ? "This chatbot is inactive or disabled" : bot.name
              }
              placement="right"
              componentsProps={{ tooltip: customTooltipStyles }}
            >
              <IconButton
                disabled={isDisabled}
                onClick={() => navigate(`/user-conversation-detail/${bot.id}`)}
                sx={{
                  bgcolor: "white",
                  border: "1px solid #E3E3E3",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  mb: 1,
                  p: 0,
                  "&:hover": { bgcolor: "#EEE" },
                }}
              >
                <img
                  src={
                    bot.avatar || randomAvatars[index % randomAvatars.length]
                  }
                  alt={bot.name}
                  style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                />
              </IconButton>
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
                const isDisabled = !bot.is_active;
                return (
                  <MenuItem
                    disabled={isDisabled}
                    key={bot.id}
                    onClick={() =>
                      navigate(`/user-conversation-detail/${bot.id}`)
                    }
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

      <Box sx={{ flexGrow: 1 }} />

      {/* Bottom Icons */}
      <Stack spacing={2}>
        {/* Add Icon with Pop-up */}
        <Tooltip
          title="Create agent"
          placement="right"
          componentsProps={{ tooltip: customTooltipStyles }}
        >
          <IconButton
            sx={{
              bgcolor: "#F6F3FF",
              color: "#7844d3",
              padding: 1,
              borderRadius: "50%",
            }}
            onClick={handleCreateMenu}
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

export default Sidebar;
