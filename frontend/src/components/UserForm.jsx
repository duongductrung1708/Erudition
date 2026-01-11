import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";

const UserForm = ({ open, onClose, onSave, user = null }) => {
  const [email, setEmail] = useState(user ? user.email : "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    const newUser = { email };
    setLoading(true);
    try {
      await onSave(newUser);
      setEmail("");
      onClose();
    } catch (error) {
      toast.error("Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    console.log("File uploaded:", file);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? () => {} : onClose}
      disableEscapeKeyDown={loading}
    >
      <DialogTitle fontWeight="bold">
        {user ? "Edit user" : "Invite new user"}
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          color="secondary"
          disabled={loading}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            color: "#5E33A8",
            borderColor: "#5E33A8",
            textTransform: "capitalize",
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            color: "white",
            bgcolor: "#5E33A8",
            textTransform: "none",
          }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : user ? (
            "Save changes"
          ) : (
            "Invite user"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;
