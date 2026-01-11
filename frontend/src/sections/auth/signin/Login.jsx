import React, { useState } from "react";
import {
  Grid,
  Typography,
  Button,
  TextField,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/AuthProvider";
import { toast } from "react-toastify";

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!username.trim() || !password.trim()) {
      toast.error("Email and password cannot be empty or only spaces");
      return;
    }

    setIsLoading(true);

    try {
      await login(username.trim(), password.trim());
      toast.success("Login successful!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      if (await loginWithGoogle()) {
        toast.success("Login successful!");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
  };

  return (
    <>
      {isLoading ? (
        <>
          <title>Logging In | Erudition</title>
          <meta
            name="description"
            content="Logging in to Erudition’s AI agent platform..."
          />
        </>
      ) : (
        <>
          <title>Login | Erudition</title>
          <meta
            name="description"
            content="Log in to Erudition to manage your AI agents. Use email, password, or Google authentication."
          />
          <meta
            name="keywords"
            content="Erudition, login, AI agents, Google login, no-code AI, authentication"
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
          <Typography
            variant="h3"
            fontWeight="bold"
            textAlign="center"
            sx={{ mb: 3 }}
          >
            Log in
          </Typography>

          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              width: "100%",
              maxWidth: 400,
              height: 40,
              fontSize: "0.8rem",
              backgroundColor: "black",
              fontWeight: "bold",
              color: "white",
              textTransform: "none",
              "&:hover": { backgroundColor: "#333" },
            }}
            disabled={isLoading}
          >
            Continue with Google
          </Button>

          <Divider
            sx={{ width: "100%", maxWidth: 400, my: 3, fontWeight: "bold" }}
          >
            Or
          </Divider>

          <form
            onSubmit={handleLogin}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: "400px",
            }}
          >
            <TextField
              fullWidth
              label="Enter email address"
              variant="outlined"
              color="secondary"
              sx={{ mb: 2, maxWidth: 400 }}
              value={username}
              onChange={handleInputChange(setUsername)}
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="Enter password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              color="secondary"
              sx={{ mb: 1, maxWidth: 400 }}
              value={password}
              onChange={handleInputChange(setPassword)}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="ends"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Forgot Password */}
            <Typography
              sx={{
                width: "100%",
                maxWidth: 400,
                textAlign: "right",
                fontSize: "0.8rem",
                fontWeight: "bold",
                cursor: "pointer",
                mb: 2,
              }}
            >
              <Link
                to="/reset-password"
                style={{ textDecoration: "none", color: "black" }}
              >
                Forgot password?
              </Link>
            </Typography>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                maxWidth: 400,
                height: 40,
                fontSize: "0.8rem",
                backgroundColor: "#7844D3",
                color: "white",
                fontWeight: "bold",
                mt: 2,
                textTransform: "capitalize",
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <Typography
            fontSize="0.8rem"
            sx={{ mt: 3, textAlign: "center", fontWeight: "bold" }}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{ color: "#6200ea", textDecoration: "none" }}
            >
              Sign up now
            </Link>
          </Typography>

          <Typography
            variant="body2"
            color="textSecondary"
            textAlign="center"
            sx={{ mt: 3, maxWidth: 400 }}
          >
            By clicking "Login", I agree to Erudition{" "}
            <a
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7844D3", textDecoration: "underline" }}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7844D3", textDecoration: "underline" }}
            >
              Privacy Policy
            </a>
            . This site is protected by reCAPTCHA.
          </Typography>
        </Grid>
      </Grid>
    </>
  );
};

export default Login;
