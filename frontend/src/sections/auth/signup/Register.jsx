import React, { useState } from "react";
import {
  Grid,
  Typography,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../../hooks/AuthProvider";

const Register = () => {
  const { loginWithGoogle } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  // Hàm kiểm tra mật khẩu
  const validatePassword = (password) => {
    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
    return regex.test(password);
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

  const handleSignUp = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!fullName.trim()) {
      toast.error("Full Name is required!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      toast.error("Please enter a valid email address!");
      return;
    }

    if (!validatePassword(password)) {
      toast.error(
        "Password must contain at least 1 letter, 1 number, 1 symbol, and be 8-32 characters long!"
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser(
        email.trim(),
        password.trim(),
        fullName.trim()
      );
      if (response) {
        toast.success("Registration successful!");
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.detail || "Registration failed!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <>
          <title>Registering | Erudition</title>
          <meta
            name="description"
            content="Registering for Erudition’s AI agent platform..."
          />
        </>
      ) : (
        <>
          <title>Register | Erudition</title>
          <meta
            name="description"
            content="Sign up for Erudition to create and manage AI agents. Register with email or Google."
          />
          <meta
            name="keywords"
            content="Erudition, register, signup, AI agents, Google signup, no-code AI"
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
            Register
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
            onSubmit={handleSignUp}
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
              label="Full name"
              variant="outlined"
              color="secondary"
              sx={{ maxWidth: 400 }}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="Enter email"
              variant="outlined"
              color="secondary"
              sx={{ mt: 2, maxWidth: 400 }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="Enter password"
              variant="outlined"
              color="secondary"
              type={showPassword ? "text" : "password"}
              sx={{ mt: 2, maxWidth: 400 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm password"
              variant="outlined"
              color="secondary"
              type={showConfirmPassword ? "text" : "password"}
              sx={{ mt: 2, maxWidth: 400 }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleConfirmPassword}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

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
                textTransform: "capitalize",
                mt: 3,
                "&:hover": { bgcolor: "#4F13B7" },
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Register"
              )}
            </Button>
          </form>

          <Typography
            fontSize="0.8rem"
            sx={{ mt: 3, textAlign: "center", fontWeight: "bold" }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "#6200ea", textDecoration: "none" }}
            >
              Log in
            </Link>
          </Typography>

          <Typography
            variant="body2"
            color="textSecondary"
            textAlign="center"
            sx={{ mt: 3, maxWidth: 400 }}
          >
            By clicking "Register", I agree to Erudition{" "}
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

export default Register;
