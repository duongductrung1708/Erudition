import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/AuthProvider";

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

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { label: "HOME", path: "/" },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background: "#ffffff",
          boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* LOGO */}
          <Link to="/" style={{ textDecoration: "none" }}>
            <Typography>
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

          {/* MENU ITEMS (Desktop) */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: "20px",
              alignItems: "center",
            }}
          >
            {navItems.map((item) =>
              item.external ? (
                <Box
                  key={item.label}
                  component="a"
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: "none",
                    color: "#000",
                    position: "relative",
                    fontWeight:
                      location.pathname === item.path ? "bold" : "normal",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      left: "50%",
                      bottom: "-3px",
                      width: "0%",
                      height: "2px",
                      backgroundColor: "#BA48FF",
                      transition:
                        "width 0.4s ease-in-out, left 0.4s ease-in-out",
                    },
                    "&:hover::after": {
                      width: "100%",
                      left: "0%",
                    },
                  }}
                >
                  {item.label}
                </Box>
              ) : (
                <Box
                  key={item.label}
                  component={Link}
                  to={item.path}
                  sx={{
                    textDecoration: "none",
                    color: location.pathname === item.path ? "#BA48FF" : "#000",
                    fontWeight:
                      location.pathname === item.path ? "bold" : "normal",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      left: "50%",
                      bottom: "-3px",
                      width: "0%",
                      height: "2px",
                      backgroundColor: "#BA48FF",
                      transition:
                        "width 0.4s ease-in-out, left 0.4s ease-in-out",
                    },
                    "&:hover::after": {
                      width: "100%",
                      left: "0%",
                    },
                  }}
                >
                  {item.label}
                </Box>
              )
            )}

            {/* Conditional Rendering based on user login status */}
            {user ? (
              <>
                <Avatar
                  sx={{
                    bgcolor: getColorFromString(user.email),
                    width: 36,
                    height: 36,
                  }}
                >
                  {user.email.charAt(0).toUpperCase()}
                </Avatar>
                <Button color="error" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" sx={{ color: "#000" }}>
                  Log in
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{
                    background: "#000",
                    color: "#fff",
                    borderRadius: "20px",
                  }}
                >
                  Sign Up - It's Free
                </Button>
              </>
            )}
          </Box>

          {/* MENU ICON (Mobile) */}
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{
              display: { xs: "block", md: "none" },
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <MenuIcon sx={{ color: "#000" }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR MENU (Mobile) */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ width: "100%" }}
      >
        <List sx={{ textAlign: "center", width: 250 }}>
          {navItems.map((item) => (
            <ListItem
              button
              key={item.label}
              onClick={handleDrawerToggle}
              sx={{ justifyContent: "center", display: "flex" }}
            >
              {item.external ? (
                <a
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "none",
                    color: location.pathname === item.path ? "#BA48FF" : "#000",
                    fontWeight:
                      location.pathname === item.path ? "bold" : "normal",
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    sx={{ textAlign: "center" }}
                  />
                </a>
              ) : (
                <Link
                  to={item.path}
                  style={{
                    textDecoration: "none",
                    color: location.pathname === item.path ? "#BA48FF" : "#000",
                    fontWeight:
                      location.pathname === item.path ? "bold" : "normal",
                  }}
                  onClick={handleDrawerToggle}
                >
                  <ListItemText
                    primary={item.label}
                    sx={{ textAlign: "center" }}
                  />
                </Link>
              )}
            </ListItem>
          ))}

          {/* Conditional Rendering for Mobile */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2 }}>
            {user ? (
              <>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                  <Avatar
                    sx={{
                      bgcolor: getColorFromString(user.email),
                      width: 36,
                      height: 36,
                    }}
                  >
                    {user.email.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
                <Button
                  onClick={() => {
                    handleLogout();
                    handleDrawerToggle();
                  }}
                  sx={{ color: "#000" }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" sx={{ color: "#000" }}>
                  Log in
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{
                    background: "#000",
                    color: "#fff",
                    borderRadius: "20px",
                  }}
                >
                  Sign Up - It's Free
                </Button>
              </>
            )}
          </Box>
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
