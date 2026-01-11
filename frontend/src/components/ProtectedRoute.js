import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/AuthProvider";

export const PublicRoute = ({ element }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      // Nếu đã đăng nhập
      if (user.isFirstLogin) {
        // Nếu là lần đăng nhập đầu tiên, chỉ cho phép vào change-password
        if (location.pathname !== "/change-password") {
          navigate("/change-password", { replace: true });
        }
      } else if (user.isAdmin) {
        // Nếu là admin, chuyển hướng đến dashboard
        navigate("/admin/dashboard", { replace: true });
      } else if (user.isChatbotCreator) {
        // Nếu là chatbot creator, chuyển hướng đến workspace
        navigate("/workspace", { replace: true });
      } else {
        // Nếu là user thường, chuyển hướng đến user workspace
        navigate("/user/workspace", { replace: true });
      }
    }
  }, [user, navigate, location]);

  // Nếu chưa đăng nhập, cho phép truy cập trang công khai
  return !user || (user.isFirstLogin && location.pathname === "/change-password") ? element : null;
};

// Giữ nguyên ProtectedRoute như cũ
export const ProtectedRoute = ({ element, requiredRole }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }

    if (user.isFirstLogin && location.pathname !== "/change-password") {
      navigate("/change-password", { replace: true });
      return;
    }

    if (user.isAdmin && requiredRole !== "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (requiredRole === "admin" && !user.isAdmin) {
      navigate("/user/workspace", { replace: true });
      return;
    }

    if (requiredRole === "user" && (user.isChatbotCreator || user.isAdmin)) {
      navigate("/workspace", { replace: true });
      return;
    }

    if (
      requiredRole === "chatbot_creator" &&
      (!user.isChatbotCreator || user.isAdmin)
    ) {
      navigate("/user/workspace", { replace: true });
      return;
    }
  }, [user, navigate, location, requiredRole]);

  if (
    user &&
    !user.isFirstLogin &&
    ((requiredRole === "admin" && user.isAdmin) ||
      (requiredRole === "user" && !user.isChatbotCreator && !user.isAdmin) ||
      (requiredRole === "chatbot_creator" &&
        user.isChatbotCreator &&
        !user.isAdmin))
  ) {
    return element;
  }

  return null;
};