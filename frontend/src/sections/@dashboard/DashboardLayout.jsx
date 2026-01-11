import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import NavbarDash from "../../components/sections/NavbarDash";
import Sidebar from "../../components/sections/Sidebar";
import { Box } from "@mui/material";
import { getAllChatbots, getUserMe } from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/AuthProvider";

const DashboardLayout = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [chatbots, setChatbots] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const refreshChatbots = async () => {
    try {
      setIsLoading(true);
      const userToken = user.accessToken;
      if (!userToken) {
        console.error("No access token found.");
        return;
      }
      const response = await getAllChatbots(userToken);
      setChatbots(response);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load chatbots.");
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    refreshChatbots();
  }, [user]);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        chatbots={chatbots}
        sx={{
          width: isSidebarOpen ? 250 : 60, // Chiều rộng cố định khi mở/đóng
          minWidth: isSidebarOpen ? 250 : 60, // Ngăn sidebar bị thu hẹp quá mức
          flexShrink: 0, // Ngăn sidebar bị nén bởi nội dung chính
          transition: "width 0.3s ease", // Hiệu ứng mượt khi thay đổi kích thước
        }}
      />

      {/* Main Content Wrapper */}
      <Box
        sx={{
          flex: 1, // Chiếm toàn bộ không gian còn lại
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Navbar */}
        <NavbarDash
          toggleSidebar={toggleSidebar}
          userData={userData}
          chatbots={chatbots}
        />

        {/* Content (Outlet) with Scrollable Area */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Outlet context={{setChatbots, chatbots, isLoading, refreshChatbots }} />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
