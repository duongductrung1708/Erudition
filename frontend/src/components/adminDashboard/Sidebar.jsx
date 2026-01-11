import React from "react";
import {
  Box,
  IconButton,
  Paper,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  SmartToy,
  TableRows,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/AuthProvider";

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:900px)");
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState(false);

  const handleCreateMenu = () => {
    navigate("/admin/agents/create");
  };

  const getButtonStyles = (path) => ({
    color: location.pathname === path ? "white" : "#5E33A8",
    backgroundColor: location.pathname === path ? "#5E33A8" : "transparent",
    "&:hover": {
      backgroundColor: "#5E33A8",
      color: "white",
    },
  });

  if (isMobile) return null;

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Users", icon: <PeopleIcon />, path: "/admin/users" },
    { text: "Chatbots", icon: <SmartToy />, path: "/admin/chatbots" },
    { text: "Token bundles", icon: <TableRows />, path: "/admin/bundles" },
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        width: expanded ? 240 : 70,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        boxShadow: "none",
        paddingBottom: 2,
        paddingTop: "70px",
        background: "linear-gradient(to bottom, #F5F3FF, #ffffff)",
        borderRight: "1px solid #E3E3E3",
        transition: "width 0.3s ease",
      }}
    >
      {/* Main Buttons */}
      <List sx={{ width: "100%", mt: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem
            key={index}
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              justifyContent: expanded ? "flex-start" : "center",
            }}
          >
            <Tooltip title={item.text} placement="right" arrow>
              <IconButton
                component={Link}
                to={item.path}
                sx={{
                  ...getButtonStyles(item.path),
                  mr: expanded ? 2 : 0,
                }}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
            {expanded && (
              <ListItemText
                primary={item.text}
                sx={{
                  color: location.pathname === item.path ? "white" : "inherit",
                  whiteSpace: "nowrap",
                }}
              />
            )}
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Bottom Icons */}
      <List sx={{ width: "100%" }}>
        <ListItem
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            justifyContent: expanded ? "flex-start" : "center",
          }}
        >
          {/*<Tooltip title="Create Agent" placement="right" arrow>*/}
          {/*  <IconButton*/}
          {/*      onClick={handleCreateMenu}*/}
          {/*      sx={{*/}
          {/*        bgcolor: "#F6F3FF",*/}
          {/*        color: "#7844d3",*/}
          {/*        "&:hover": {*/}
          {/*          bgcolor: "#7844d3",*/}
          {/*          color: "white",*/}
          {/*        },*/}
          {/*        mr: expanded ? 2 : 0,*/}
          {/*      }}*/}
          {/*  >*/}
          {/*    <Add />*/}
          {/*  </IconButton>*/}
          {/*</Tooltip>*/}
          {/*{expanded && (*/}
          {/*    <ListItemText primary="Create Agent" sx={{ whiteSpace: "nowrap" }} />*/}
          {/*)}*/}
        </ListItem>

        <ListItem
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            justifyContent: expanded ? "flex-start" : "center",
          }}
        >
          <Tooltip title="Logout" placement="right" arrow>
            <IconButton
              onClick={logout}
              sx={{
                color: "#5E33A8",
                "&:hover": {
                  bgcolor: "#5E33A8",
                  color: "white",
                },
                mr: expanded ? 2 : 0,
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
          {expanded && (
            <ListItemText primary="Logout" sx={{ whiteSpace: "nowrap" }} />
          )}
        </ListItem>
      </List>
    </Paper>
  );
};

export default Sidebar;
