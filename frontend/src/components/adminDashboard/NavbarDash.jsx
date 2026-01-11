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
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Box,
  Menu,
  Divider,
} from "@mui/material";
import {
  SmartToy,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import { Link, useLocation } from "react-router-dom";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import UserProfile from "../UserProfile";
import PricingPlans from "../PricingPlans";
import { getUserMe } from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/AuthProvider";

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

const NavbarDash = () => {
  const { logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openBilling, setOpenBilling] = useState(false);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = storedUser?.accessToken;
        if (!token) throw new Error("No access token found");

        setAccessToken(token);
        const userData = await getUserMe(token);
        setUserData(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data");
      }
    };

    fetchUser();
  }, []);

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

  const handleCreateMenu = () => {
    navigate("/admin/agents/create");
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

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
            sx={{ display: { xs: "block", md: "none" } }}
            onClick={toggleSidebar}
          >
            <WidgetsOutlinedIcon />
          </IconButton>

          {/* Centered Logo */}
          <Link to="/admin/dashboard" style={{ textDecoration: "none" }}>
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
            {/* Notifications */}
            {/* <IconButton color="default" onClick={handleNotificationsOpen}>
              <Badge badgeContent={3} color="error">
                <NotificationsOutlinedIcon />
              </Badge>
            </IconButton> */}

            {/* Upgrade Button (Hidden on Mobile) */}
            {/* <Button
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
              Upgrade
            </Button> */}

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

      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={isSidebarOpen}
        onClose={toggleSidebar}
        sx={{
          "& .MuiDrawer-paper": {
            borderTopRightRadius: "20px",
            borderBottomRightRadius: "20px",
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
              text: "Dashboard",
              icon: <DashboardIcon />,
              link: "/admin/dashboard",
            },
            { text: "Users", icon: <PeopleIcon />, link: "/admin/users" },
            { text: "Chatbots", icon: <SmartToy />, link: "/admin/chatbots" },
            {
              text: "Settings",
              icon: <SettingsIcon />,
              link: "/admin/settings",
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
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* Bottom Icons */}
        <List sx={{ width: "100%" }}>
          {/* <ListItem
            button
            onClick={handleCreateMenu}
            sx={{
              "&:hover": {
                backgroundColor: "#EEE",
              },
            }}
          >
            <IconButton
              sx={{
                bgcolor: "#F6F3FF",
                color: "#7844d3",
                padding: 1,
                borderRadius: "50%",
              }}
            >
              <Add />
            </IconButton>
            <ListItemText primary="Create Agent" sx={{ ml: 2 }} />
          </ListItem> */}
          <ListItem
            button
            onClick={logout}
            sx={{
              "&:hover": {
                backgroundColor: "#EEE",
              },
            }}
          >
            <IconButton sx={{ color: "black" }}>
              <LogoutIcon />
            </IconButton>
            <ListItemText primary="Logout" sx={{ ml: 2 }} />
          </ListItem>
        </List>
      </Drawer>

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

      {/* Profile Dialog */}
      <Dialog
        open={openProfile}
        onClose={handleCloseProfile}
        fullScreen={isSmallScreen}
        maxWidth="md"
        sx={{
          "& .MuiDialog-paper": {
            width: isSmallScreen ? "100%" : "65rem",
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
            overflowY: "auto",
          },
        }}
      >
        <DialogContent
          sx={{ display: "flex", justifyContent: "center", padding: "2rem" }}
        >
          <PricingPlans />
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
