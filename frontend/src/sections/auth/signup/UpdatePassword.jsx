import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Box,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { updatePassword, getUserMe } from "../../../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const UpdatePassword = () => {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserEmail = async () => {
      setLoading(true);
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = storedUser?.accessToken;
        if (!token) {
          throw new Error("No access token found");
        }

        const user = await getUserMe(token);
        setEmail(user.email);
        setIsFirstLogin(user.isFirstLogin);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user email");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserEmail();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all fields!");
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error(
        "Password must contain at least 1 letter, 1 number, 1 symbol, and be 8-32 characters long!"
      );
      return;
    }

    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const token = storedUser?.accessToken;
      if (!token) {
        throw new Error("No access token found");
      }

      // Update password
      const updateResponse = await updatePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success("Password updated successfully!");

      // Fetch updated user data
      const updatedUser = await getUserMe(token);

      // Update `isFirstLogin` in localStorage
      const newUserData = {
        ...storedUser,
        isFirstLogin: updatedUser.isFirstLogin || false,
      };
      localStorage.setItem("user", JSON.stringify(newUserData));

      // Update state to reflect changes
      setIsFirstLogin(updatedUser.isFirstLogin || false);

      // Force refresh to the workspace page
      window.location.href = "/user/workspace";
    } catch (err) {
      console.error("Error updating password:", err);
      toast.error(
        err?.response?.data?.detail ||
          "An error occurred while updating the password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <>
          <title>Updating Password | Erudition</title>
          <meta
            name="description"
            content="Updating your Erudition account password..."
          />
        </>
      ) : !email ? (
        <>
          <title>Loading | Erudition</title>
          <meta
            name="description"
            content="Loading your Erudition account details..."
          />
        </>
      ) : (
        <>
          <title>Update Password | Erudition</title>
          <meta
            name="description"
            content="Update your Erudition account password to secure your AI agent workspace."
          />
          <meta
            name="keywords"
            content="Erudition, update password, password change, AI agents"
          />
        </>
      )}
      <Container maxWidth="xs" sx={{ mt: 8, p: 2 }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
        >
          Set up your password
        </Typography>
        <Typography textAlign="center" fontSize="13px" fontWeight="bold" mb={2}>
          {email || "Loading..."}
        </Typography>
        <form onSubmit={handleSubmit}>
          {/* Current Password Field */}
          <Box mb={2}>
            <TextField
              fullWidth
              size="small"
              label="Current password"
              type={showCurrentPassword ? "text" : "password"}
              variant="outlined"
              color="secondary"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      disabled={loading}
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* New Password Field */}
          <Box mb={2}>
            <TextField
              fullWidth
              size="small"
              label="New password"
              type={showNewPassword ? "text" : "password"}
              variant="outlined"
              color="secondary"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={loading}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{
              height: 36,
              fontSize: "0.75rem",
              backgroundColor: "#7844D3",
              color: "white",
              fontWeight: "bold",
              marginTop: "1rem",
              "&:hover": { bgcolor: "#4F13B7" },
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </Container>
    </>
  );
};

export default UpdatePassword;
