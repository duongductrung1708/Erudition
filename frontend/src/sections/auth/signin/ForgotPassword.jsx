import React, { useState } from "react";
import {
  Grid,
  Typography,
  Button,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { passwordRecovery, resetPassword } from "../../../services/api";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handlePasswordRecovery = async () => {
    setLoading(true);
    try {
      const response = await passwordRecovery(email);
      toast.success("Password reset link sent to your email!");
    } catch (error) {
      toast.error(
        "Error during password recovery: " + (error.detail || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
    return regex.test(password);
  };

  const handleResetPassword = async () => {
    if (!validatePassword(newPassword)) {
      toast.error(
        "Password must contain at least 1 letter, 1 number, 1 symbol, and be 8-32 characters long!"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, newPassword);
      toast.success("Password reset successful!");
      navigate("/login");
    } catch (error) {
      toast.error(
        "Error during password reset: " + (error.detail || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    handlePasswordRecovery();
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    handleResetPassword();
  };

  return (
    <>
      {loading ? (
        <>
          <title>
            {token ? "Resetting Password" : "Sending Reset Link"} | Erudition
          </title>
          <meta
            name="description"
            content={
              token
                ? "Resetting your Erudition account password..."
                : "Sending a password reset link..."
            }
          />
        </>
      ) : token ? (
        <>
          <title>Reset Password | Erudition</title>
          <meta
            name="description"
            content="Reset your Erudition account password to regain access to your AI agents."
          />
          <meta
            name="keywords"
            content="Erudition, reset password, password recovery, AI agents"
          />
        </>
      ) : (
        <>
          <title>Forgot Password | Erudition</title>
          <meta
            name="description"
            content="Recover your Erudition account by entering your email to receive a password reset link."
          />
          <meta
            name="keywords"
            content="Erudition, forgot password, password recovery, AI agents"
          />
        </>
      )}
      <Grid container sx={{ minHeight: "100vh" }}>
        <Grid
          item
          xs={12}
          md={12}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            px: { xs: 3, sm: 6 },
            py: { xs: 6, md: 0 },
          }}
        >
          <Grid container alignItems="center" sx={{ maxWidth: 400, mb: 3 }}>
            {token && (
              <IconButton
                onClick={() => navigate("/forgot-password")}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                <ArrowBack />
              </IconButton>
            )}
            <Typography variant="h5" fontWeight="bold" textAlign="center">
              {token ? "Enter New Password" : "Enter your email address"}
            </Typography>
          </Grid>

          {!token ? (
            <form
              onSubmit={handleEmailSubmit}
              style={{ width: "100%", maxWidth: 400 }}
            >
              <TextField
                fullWidth
                label="Email address"
                variant="outlined"
                color="secondary"
                sx={{ mb: 2 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

              <Button
                variant="contained"
                fullWidth
                sx={{
                  height: 40,
                  fontSize: "0.8rem",
                  backgroundColor: "#7844D3",
                  color: "white",
                  fontWeight: "bold",
                  marginTop: "1rem",
                  textTransform: "capitalize",
                  "&:hover": { bgcolor: "#4F13B7" },
                }}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handlePasswordSubmit}
              style={{ width: "100%", maxWidth: 400 }}
            >
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                color="secondary"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      sx={{ color: "gray" }}
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />

              <Button
                variant="contained"
                fullWidth
                sx={{
                  height: 40,
                  fontSize: "0.8rem",
                  backgroundColor: "#7844D3",
                  color: "white",
                  fontWeight: "bold",
                  marginTop: "1rem",
                  textTransform: "capitalize",
                  "&:hover": { bgcolor: "#4F13B7" },
                }}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}

          <Link
            to="/login"
            style={{
              color: "black",
              cursor: "pointer",
              textDecoration: "none",
              marginTop: "1rem",
              fontSize: "1rem",
            }}
          >
            Go back
          </Link>
        </Grid>
      </Grid>
    </>
  );
};

export default ForgotPassword;
