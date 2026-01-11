import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "../../../components/adminDashboard/Sidebar";
import NavbarDash from "../../../components/adminDashboard/NavbarDash";

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Wrapper */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Navbar */}
        <NavbarDash toggleSidebar={toggleSidebar} />

        {/* Content (Outlet) with Scrollable Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            height: "calc(100vh - 64px)",
            backgroundColor: "white",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
