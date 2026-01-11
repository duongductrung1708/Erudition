import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
  Box,
  Divider,
  Menu,
  Grid,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  InfoOutlined,
  WorkspacesOutlined,
  BookmarkBorder,
} from "@mui/icons-material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import UserProfile from "../UserProfile";
import PricingPlans from "../PricingPlans";
import { getUserMe, switchRole } from "../../services/api";
import { toast } from "react-toastify";
import { Link, useLocation, useNavigate } from "react-router-dom";

const getColorFromString = (str) => {
  const colors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
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

const NavbarDash = ({ userData, chatbots }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openBilling, setOpenBilling] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [currentRole, setCurrentRole] = useState("");
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [token, setAccessToken] = useState(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let storedUser = {};
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      console.error("Failed to parse localStorage.user:", error);
    }
    const token = storedUser.accessToken;
    const isChatbotCreator =
      storedUser.isChatbotCreator ?? userData?.isChatbotCreator ?? false;

    const role = isChatbotCreator ? "owner" : "user";
    setCurrentRole(role);
    setAccessToken(token);
  }, [userData]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleAvatarClick = () => {
    setOpenProfile(true);
  };

  const handleCloseProfile = () => {
    setOpenProfile(false);
  };

  const handleOpenBilling = () => {
    setOpenBilling(true);
  };

  const handleCloseBilling = () => {
    setOpenBilling(false);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleRoleToggle = () => {
    setOpenRoleDialog(true);
  };

  const performRoleSwitch = async () => {
    const newRole = currentRole === "owner" ? "user" : "owner";

    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      setOpenRoleDialog(false);
      return;
    }

    if (newRole === currentRole) {
      toast.info(`You are already in ${newRole} role`);
      setOpenRoleDialog(false);
      return;
    }

    setIsSwitchingRole(true);

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      await switchRole(token); // Gọi API đổi role phía backend

      const userData = await getUserMe(token); // Gọi lại thông tin user sau khi đổi role

      const updatedUserData = {
        email: userData.email,
        isActive: userData.is_active,
        isChatbotCreator: userData.is_chatbot_creator,
        isAdmin: userData.is_admin,
        fullName: userData.full_name,
        isFirstLogin: userData.is_first_login, // Update role vào User trong localStorage
        id: userData.id,
        accessToken: storedUser.accessToken, // giữ lại token
      };

      localStorage.setItem("user", JSON.stringify(updatedUserData));
      setCurrentRole(userData.isChatbotCreator ? "owner" : "user");

      toast.success(
        `Switched to ${
          userData.isChatbotCreator ? "Chatbot Owner" : "Chatbot User"
        } role`
      );

      const targetRoute = userData.isChatbotCreator
        ? "/workspace"
        : "/user/workspace";
      navigate(targetRoute, { replace: true });

      // Reload lại page để rehydrate đúng theo role mới
      window.location.assign(window.location.origin + targetRoute);
    } catch (error) {
      console.error("Role switch failed:", error);

      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error(
          "Session expired or invalid credentials. Please log in again."
        );
        navigate("/login");
      } else {
        toast.error(error.response?.data?.detail || "Failed to switch role");
      }
    } finally {
      setIsSwitchingRole(false);
      setOpenRoleDialog(false);
    }
  };

  const isChatbotCreator = currentRole === "owner";
  const homeLink = isChatbotCreator ? "/workspace" : "/user/workspace";

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#F5F3FF",
          boxShadow: "none",
          borderBottom: "1px solid #E3E3E3",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
          }}
        >
          {/* Sidebar Toggle Button */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" } }}
            onClick={toggleSidebar}
          >
            <WidgetsOutlinedIcon />
          </IconButton>

          {/* Centered Logo */}
          <Link to="/workspace" style={{ textDecoration: "none" }}>
            <Typography
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
            >
              <svg
                width="200"
                height="50"
                viewBox="0 0 500 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <text
                  y="80"
                  fontFamily="'Orbitron', sans-serif"
                  fontSize="60"
                  fontWeight="bold"
                  fill="#222"
                  letterSpacing="5"
                >
                  <tspan>E</tspan>
                  <tspan fill="#5E33A8">R</tspan>
                  <tspan>U</tspan>
                  <tspan fill="#5E33A8">D</tspan>
                  <tspan>I</tspan>
                  <tspan fill="#5E33A8">T</tspan>
                  <tspan>I</tspan>
                  <tspan fill="#5E33A8">O</tspan>
                  <tspan>N</tspan>
                </text>
              </svg>
            </Typography>
          </Link>

          {/* Right Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Role Toggle Switch (Hidden on Mobile) */}
            {!isSmallScreen && (
              <Tooltip title="Switch role" arrow>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: "bold",
                      color: currentRole === "user" ? "#5E33A8" : "#bdbdbd",
                      cursor:
                        isSwitchingRole || !token ? "not-allowed" : "pointer",
                    }}
                    onClick={() => {
                      if (!isSwitchingRole && token && currentRole !== "user") {
                        handleRoleToggle();
                      }
                    }}
                  >
                    User
                  </Typography>

                  <Switch
                    checked={currentRole === "owner"}
                    onChange={handleRoleToggle}
                    disabled={isSwitchingRole || !token}
                    sx={{
                      "& .MuiSwitch-switchBase": {
                        color: "#7844D3",
                        "&.Mui-checked": {
                          color: "#5E33A8",
                        },
                      },
                      "& .MuiSwitch-track": {
                        backgroundColor: "#7844D3",
                        opacity: 0.5,
                        "&.Mui-checked": {
                          backgroundColor: "#5E33A8",
                        },
                      },
                    }}
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: "bold",
                      color: currentRole === "owner" ? "#5E33A8" : "#bdbdbd",
                      cursor:
                        isSwitchingRole || !token ? "not-allowed" : "pointer",
                    }}
                    onClick={() => {
                      if (
                        !isSwitchingRole &&
                        token &&
                        currentRole !== "owner"
                      ) {
                        handleRoleToggle();
                      }
                    }}
                  >
                    Owner
                  </Typography>
                </div>
              </Tooltip>
            )}

            {/* Upgrade Button (Hidden on Mobile) */}
            {currentRole === "owner" && (
              <Button
                variant="outlined"
                onClick={handleOpenBilling}
                startIcon={<AutoAwesomeIcon />}
                sx={{
                  borderColor: "#794CCA",
                  color: "#7844D3",
                  fontWeight: "bold",
                  borderRadius: "20px",
                  display: { xs: "none", md: "inline-flex" },
                  "&:hover": { borderColor: "#662DBC" },
                }}
              >
                Buy tokens
              </Button>
            )}

            {/* Avatar */}
            <Avatar
              sx={{
                width: { xs: 30, sm: 35, md: 40 },
                height: { xs: 30, sm: 35, md: 40 },
                cursor: "pointer",
                bgcolor: userData?.email
                  ? getColorFromString(userData.email)
                  : "#ccc",
              }}
              onClick={handleAvatarClick}
            >
              {userData?.email ? userData.email.charAt(0).toUpperCase() : ""}
            </Avatar>
          </div>
        </Toolbar>
      </AppBar>

      {/* Role Switch Confirmation Dialog */}
      <Dialog
        open={openRoleDialog}
        onClose={() => setOpenRoleDialog(false)}
        fullScreen={isSmallScreen}
        maxWidth="sm"
        sx={{
          "& .MuiPaper-root": {
            width: isSmallScreen ? "100%" : "400px",
            borderRadius: isSmallScreen ? 0 : "8px",
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: "#F5F3FF", color: "#222" }}>
          Confirm role switch
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#F5F3FF" }}>
          <DialogContentText sx={{ color: "#333" }}>
            You are about to switch from <strong>{currentRole}</strong> to{" "}
            <strong>{currentRole === "owner" ? "user" : "owner"}</strong> role.
            The page will refresh to apply the changes.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ bgcolor: "#F5F3FF", p: 2 }}>
          <Button
            onClick={() => setOpenRoleDialog(false)}
            sx={{ color: "#675cff" }}
          >
            Cancel
          </Button>
          <Button
            onClick={performRoleSwitch}
            variant="contained"
            disabled={isSwitchingRole}
            sx={{
              bgcolor: "#7844D3",
              "&:hover": { bgcolor: "#5E33A8" },
            }}
          >
            {isSwitchingRole ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        sx={{
          "& .MuiPaper-root": {
            width: 300,
            maxHeight: 400,
            boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
          },
        }}
      >
        <Box sx={{ padding: "16px" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            Notifications
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            <ListItem>
              <ListItemText
                primary="New message from Admin"
                secondary="2 hours ago"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Your workspace has been updated"
                secondary="5 hours ago"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Upgrade to premium for more features"
                secondary="1 day ago"
              />
            </ListItem>
          </List>
        </Box>
      </Menu>

      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={isSidebarOpen}
        onClose={toggleSidebar}
        sx={{
          "& .MuiPaper-root": {
            borderTopRightRadius: "20px",
            borderBounceRightRadius: "20px",
            width: 200,
            boxShadow: "3px 0px 10px rgba(0,0,0,0.1)",
            background: "linear-gradient(to bottom, #F5F3FF, #ffffff)",
          },
        }}
      >
        <List sx={{ width: "100%", padding: "8px" }}>
          {/* Close Button */}
          <ListItem disablePadding>
            <ListItemButton onClick={toggleSidebar}>
              <ListItemIcon>
                <ArrowBackOutlinedIcon />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>

          {/* Navigation Items */}
          {[
            {
              text: "Workspace",
              icon: <WorkspacesOutlined />,
              link: homeLink,
            },
            // {
            //   text: "Help",
            //   icon: <InfoOutlined />,
            //   link: isChatbotCreator ? "/help" : "/user/help",
            // },
            {
              text: "Favorite",
              icon: <BookmarkBorder />,
              link: isChatbotCreator
                ? "/favorite-response"
                : "/user/favorite-response",
            },
          ].map((item, index) => {
            const isActive = location.pathname === item.link;
            return (
              <ListItem disablePadding key={index}>
                <ListItemButton
                  component={Link}
                  to={item.link}
                  sx={{
                    backgroundColor: isActive ? "#5E33A8" : "white",
                    color: isActive ? "white" : "black",
                    border: "1px solid #E3E3E3",
                    borderRadius: "0.5rem",
                    "&:hover": {
                      backgroundColor: isActive ? "#5E33A8" : "#F5F5F5",
                      color: isActive ? "white" : "black",
                    },
                    margin: "0.5rem",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "white" : "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}

          {/* Role Toggle Switch (Mobile Only) */}
          {isSmallScreen && (
            <ListItem
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Tooltip title="Switch role" arrow>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentRole === "owner"}
                      onChange={handleRoleToggle}
                      disabled={isSwitchingRole || !token}
                      sx={{
                        "& .MuiSwitch-switchBase": {
                          color: "#7844D3",
                          "&.Mui-checked": {
                            color: "#5E33A8",
                          },
                          "&.Mui-disabled": {
                            color: "#bdbdbd",
                          },
                        },
                        "& .MuiSwitch-track": {
                          backgroundColor: "#7844D3",
                          opacity: 0.5,
                          "&.Mui-checked": {
                            backgroundColor: "#5E33A8",
                          },
                          "&.Mui-disabled": {
                            backgroundColor: "#e0e0e0",
                          },
                        },
                      }}
                    />
                  }
                  label={
                    isSwitchingRole ? (
                      <CircularProgress size={20} sx={{ color: "#5E33A8" }} />
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ color: "#7844D3", fontWeight: "bold" }}
                      >
                        {currentRole === "owner" ? "Owner" : "User"}
                      </Typography>
                    )
                  }
                  sx={{
                    m: 0,
                    "& .MuiFormControlLabel-label": {
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    },
                  }}
                />
              </Tooltip>
            </ListItem>
          )}

          {isSmallScreen && (
            <ListItem
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              {currentRole === "owner" && (
                <Button
                  variant="outlined"
                  onClick={handleOpenBilling}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{
                    borderColor: "#794CCA",
                    color: "#7844D3",
                    fontWeight: "bold",
                    borderRadius: "20px",
                    "&:hover": { borderColor: "#662DBC" },
                  }}
                >
                  Buy tokens
                </Button>
              )}
            </ListItem>
          )}

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Divider
              sx={{
                width: "10rem",
                height: "1px",
                marginTop: "1rem",
                backgroundColor: "neutral.300",
              }}
            />
          </Box>

          {/* Chatbot List in Grid Layout */}
          <Grid
            container
            spacing={1}
            sx={{
              mt: 2,
              px: 1,
              justifyContent: "center",
              gap: 5,
            }}
          >
            {chatbots.map((bot, index) => {
              const isDisabled = !bot.is_active;
              return (
                <Grid item key={bot.id}>
                  <Tooltip
                    title={
                      isDisabled
                        ? "This chatbot is inactive or disabled"
                        : bot.name
                    }
                    placement="right"
                    componentsProps={{
                      tooltip: { sx: { bgcolor: "#5E33A8", color: "white" } },
                    }}
                  >
                    <span>
                      <IconButton
                        onClick={() =>
                          !isDisabled &&
                          navigate(
                            currentRole === "owner"
                              ? `/user-conversation-detail/${bot.id}`
                              : `/user/user-conversation-detail/${bot.id}`
                          )
                        }
                        disabled={isDisabled}
                        sx={{
                          bgcolor: "white",
                          border: "1px solid #E3E3E3",
                          borderRadius: "50%",
                          width: 40,
                          height: 40,
                          p: 0,
                          opacity: isDisabled ? 0.5 : 1,
                          "&:hover": { bgcolor: isDisabled ? "white" : "#EEE" },
                        }}
                      >
                        <img
                          src={
                            bot.avatar ||
                            randomAvatars[index % randomAvatars.length]
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
                </Grid>
              );
            })}
          </Grid>
        </List>
      </Drawer>

      {/* Profile Dialog */}
      <Dialog
        open={openProfile}
        onClose={handleCloseProfile}
        fullScreen={isSmallScreen}
        maxWidth="md"
        sx={{
          "& .MuiPaper-root": {
            width: isSmallScreen ? "100%" : "70%",
            height: "auto",
            maxWidth: "none",
          },
        }}
      >
        <UserProfile onClose={handleCloseProfile} />
      </Dialog>

      {/* PricingPlans Modal */}
      <Dialog
        open={openBilling}
        onClose={handleCloseBilling}
        fullScreen={isSmallScreen}
        fullWidth
        maxWidth="lg"
        sx={{
          "& .MuiDialog-paper": {
            maxHeight: isSmallScreen ? "100vh" : "95vh",
            height: isSmallScreen ? "100vh" : "95vh",
          },
        }}
      >
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "center",
            padding: "2rem",
            overflowX: "hidden",
          }}
        >
          <PricingPlans chatbots={chatbots} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBilling} sx={{ color: "#675cff" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NavbarDash;
