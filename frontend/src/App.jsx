import { Routes, Route } from "react-router-dom";
import AuthLayout from "./sections/auth/AuthLayout";
import Login from "./sections/auth/signin/Login";
import Register from "./sections/auth/signup/Register";
import HomePage from "./pages/HomePage";
import ForgotPassword from "./sections/auth/signin/ForgotPassword";
import Pricing from "./pages/Pricing";
import WorkspacePage from "./pages/WorkspacePage";
import DashboardLayout from "./sections/@dashboard/DashboardLayout";
import InforPage from "./pages/InforPage";
import CreateAgent from "./pages/CreateAgent";
import UpdatePassword from "./sections/auth/signup/UpdatePassword";
import ConversationForUser from "./pages/ConversationForUser";
import ChatBotDetails from "./pages/ChatBotDetails";
import { ToastContainer } from "react-toastify";
import NotFound from "./pages/NotFound";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import AdminLayout from "./sections/@dashboard/adminDashboard/AdminLayout";
import Dashboard from "./pages/adminPages/Dashboard";
import UserLayout from "./sections/@dashboard/userDashboard/UserLayout";
import UserDashboard from "./pages/userPages/WorkspacePage";
import UserInfoPage from "./pages/userPages/InforPage";
import ChatHistory from "./pages/ChatHistory";
import UserAdmin from "./pages/adminPages/UserAdmin";
import ChatbotAdmin from "./pages/adminPages/ChatbotAdmin";
import ChatbotDetail from "./pages/adminPages/ChatbotDetail";
import ChatHistoryForUser from "./pages/userPages/ChatHistoryForUser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChatHistoryForOwner from "./pages/ChatHistoryForUser";
import FavoritesPage from "./pages/FavoritesPage";
import FavoritesPageForOwner from "./pages/FavoritesPageForOwner";
import PaymentReturn from "./components/agentDetails/PaymentReturn";
import TokenBundles from "./pages/adminPages/TokenBundles";
import FavoritesPageForUser from "./pages/userPages/FavoritesPageForUser";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          {/* Payment return - public route so VNPay can redirect here */}
          <Route path="/payment-return" element={<PaymentReturn />} />

          {/* Auth Routes */}
          <Route path="/" element={<PublicRoute element={<AuthLayout />} />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="reset-password" element={<ForgotPassword />} />
            <Route path="change-password" element={<UpdatePassword />} />
          </Route>

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute
                requiredRole="chatbot_creator"
                element={<DashboardLayout />}
              />
            }
          >
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="help" element={<InforPage />} />
            <Route path="agents/create" element={<CreateAgent />} />
            <Route path="agent-chat-history" element={<ChatHistory />} />
            <Route path="favorite-response" element={<FavoritesPage />} />
            <Route
              path="favorite-response/:chatbotId"
              element={<FavoritesPageForOwner />}
            />
            <Route
              path="agent-details/:chatbotId"
              element={<ChatBotDetails />}
            />
            <Route
              path="user-conversation-detail/:chatbotId"
              element={<ConversationForUser />}
            />
            <Route
              path="agent-chat-history-detail/:chatbotId"
              element={<ChatHistoryForOwner />}
            />
            {/* Keep old route for backward compatibility */}
            <Route path="payment_return" element={<PaymentReturn />} />
          </Route>

          <Route
            path="/user"
            element={
              <ProtectedRoute requiredRole="user" element={<UserLayout />} />
            }
          >
            <Route path="workspace" element={<UserDashboard />} />
            <Route path="help" element={<UserInfoPage />} />
            <Route path="favorite-response" element={<FavoritesPage />} />
            <Route
              path="favorite-response/:chatbotId"
              element={<FavoritesPageForUser />}
            />
            <Route
              path="user-conversation-detail/:chatbotId"
              element={<ConversationForUser />}
            />
            <Route path="agent-chat-history" element={<ChatHistory />} />
            <Route
              path="agent-chat-history-detail/:chatbotId"
              element={<ChatHistoryForUser />}
            />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin" element={<AdminLayout />} />
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserAdmin />} />
            <Route path="chatbots" element={<ChatbotAdmin />} />
            <Route path="bundles" element={<TokenBundles />} />
            <Route
              path="admin-agent-details/:chatbotId"
              element={<ChatbotDetail />}
            />
          </Route>

          {/* Not Found Page */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
          pauseDelay={300}
          theme="colored"
        />
      </QueryClientProvider>
    </>
  );
}

export default App;
