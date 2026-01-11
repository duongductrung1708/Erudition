import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { updatePassword } from "../../services/api";
import { toast } from "react-toastify";

const ChangePassword = ({ open, handleClose, accessToken }) => {
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const handleTogglePassword = (field) => {
    setShowPassword((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Please fill in both current and new password fields!");
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      toast.error(
        "Password must contain at least 1 letter, 1 number, 1 symbol, and be 8-32 characters long!"
      );
      return;
    }

    try {
      const response = await updatePassword(accessToken, {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      toast.success("Password updated successfully!");
      handleClose();
    } catch (err) {
      console.error("Error updating password:", err);
      toast.error(
        err?.detail || "An error occurred while updating the password"
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      sx={{ "& .MuiDialog-paper": { maxWidth: "350px" } }}
    >
      <DialogTitle fontWeight="bold">Change password</DialogTitle>
      <DialogContent>
        <p style={{ color: "gray", marginBottom: "16px" }}>
          Password must contain at least 1 letter, 1 number, and 1 symbol.
          Minimum length is 8 characters.
        </p>
        <Typography variant="body1" fontWeight="bold">
          Enter your current password
        </Typography>
        <TextField
          fullWidth
          label="Current Password"
          type={showPassword.current ? "text" : "password"}
          margin="dense"
          color="secondary"
          sx={{ mb: "1.5rem" }}
          name="currentPassword"
          value={passwordData.currentPassword}
          onChange={handleChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => handleTogglePassword("current")}
                  edge="end"
                >
                  {showPassword.current ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="body1" fontWeight="bold">
          Enter your new password
        </Typography>
        <TextField
          fullWidth
          label="New Password"
          type={showPassword.new ? "text" : "password"}
          margin="dense"
          color="secondary"
          sx={{ mb: "1.5rem" }}
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handleChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => handleTogglePassword("new")}
                  edge="end"
                >
                  {showPassword.new ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions sx={{ padding: "0 2rem 2rem 0" }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            textTransform: "capitalize",
            color: "#794CCA",
            borderColor: "#794CCA",
            backgroundColor: "#F1E9FF",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ textTransform: "none", backgroundColor: "#794CCA" }}
        >
          Change password
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePassword;
