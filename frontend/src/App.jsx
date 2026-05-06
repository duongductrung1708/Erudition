import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const AuthLayout = lazy(() => import("./sections/auth/AuthLayout"));
const Login = lazy(() => import("./sections/auth/signin/Login"));
const Register = lazy(() => import("./sections/auth/signup/Register"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ForgotPassword = lazy(() => import("./sections/auth/signin/ForgotPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));
const DashboardLayout = lazy(() => import("./sections/@dashboard/DashboardLayout"));
const InforPage = lazy(() => import("./pages/InforPage"));
const CreateAgent = lazy(() => import("./pages/CreateAgent"));
const UpdatePassword = lazy(() => import("./sections/auth/signup/UpdatePassword"));
const ConversationForUser = lazy(() => import("./pages/ConversationForUser"));
const ChatBotDetails = lazy(() => import("./pages/ChatBotDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./sections/@dashboard/adminDashboard/AdminLayout"));
const Dashboard = lazy(() => import("./pages/adminPages/Dashboard"));
const UserLayout = lazy(() => import("./sections/@dashboard/userDashboard/UserLayout"));
const UserDashboard = lazy(() => import("./pages/userPages/WorkspacePage"));
const UserInfoPage = lazy(() => import("./pages/userPages/InforPage"));
const ChatHistory = lazy(() => import("./pages/ChatHistory"));
const UserAdmin = lazy(() => import("./pages/adminPages/UserAdmin"));
const ChatbotAdmin = lazy(() => import("./pages/adminPages/ChatbotAdmin"));
const ChatbotDetail = lazy(() => import("./pages/adminPages/ChatbotDetail"));
const ChatHistoryForUser = lazy(() => import("./pages/userPages/ChatHistoryForUser"));
const ChatHistoryForOwner = lazy(() => import("./pages/ChatHistoryForUser"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const FavoritesPageForOwner = lazy(() => import("./pages/FavoritesPageForOwner"));
const PaymentReturn = lazy(() => import("./components/agentDetails/PaymentReturn"));
const TokenBundles = lazy(() => import("./pages/adminPages/TokenBundles"));
const FavoritesPageForUser = lazy(() => import("./pages/userPages/FavoritesPageForUser"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>
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
        </Suspense>

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
