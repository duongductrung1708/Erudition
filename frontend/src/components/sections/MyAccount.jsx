import React, {useState, useEffect} from "react";
import {
    Box,
    Button,
    TextField,
    Typography,
    Divider,
    Grid,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import ChangePassword from "./ChangePassword";
import {updateUserMe, deleteUserMe} from "../../services/api";
import {toast} from "react-toastify";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../hooks/AuthProvider";

const MyAccount = () => {
    const {user: authUser} = useAuth();
    const [preferredName, setPreferredName] = useState("");
    const [isChanged, setIsChanged] = useState(false);
    const [loading, setLoading] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (authUser) {
            setPreferredName(authUser.fullName || "");
        }
    }, [authUser]);

    const handleNameChange = (event) => {
        setPreferredName(event.target.value);
        setIsChanged(event.target.value !== authUser?.fullName);
    };

    const handleSaveName = async () => {
        if (!isChanged || !authUser) return;

        setLoading(true);
        try {
            await updateUserMe(authUser.accessToken, {full_name: preferredName});
            const updatedUser = {...authUser, fullName: preferredName};
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setIsChanged(false);
            toast.success("Name updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to update name");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteUserMe(authUser.accessToken);
            localStorage.removeItem("user");
            toast.success("Account deleted successfully!");
            navigate("/login", {replace: true});
        } catch (error) {
            toast.error("Error deleting account: " + error.detail);
        }
    };

    return (
        <Box sx={{width: "100%", overflow: "hidden"}}>
            <Box sx={{height: "85vh", overflowY: "auto", p: 3}}>
                <Typography variant="h6" fontWeight="bold">
                    My profile
                </Typography>

                <Grid container spacing={3} direction="column" sx={{my: 3}}>
                    {/* Preferred Name */}
                    <Grid item xs={12}>
                        <Typography variant="body1" fontWeight="bold">
                            Username
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: {xs: "column", sm: "row"},
                                gap: 2,
                                alignItems: "center",
                                justifyContent: "space-between",
                                mt: 3,
                            }}
                        >
                            <TextField
                                label="Username"
                                variant="outlined"
                                value={preferredName}
                                color="secondary"
                                onChange={handleNameChange}
                                sx={{
                                    width: {xs: "100%", sm: "250px"},
                                }}
                            />
                            <Button
                                variant="contained"
                                sx={{textTransform: "none", backgroundColor: "#794CCA"}}
                                disabled={!isChanged || loading}
                                onClick={handleSaveName}
                            >
                                {loading ? "Saving..." : "Save change"}
                            </Button>
                        </Box>
                    </Grid>

                    {/* Account Security */}
                    <Grid item xs={12}>
                        <Divider/>
                        <Typography variant="h6" fontWeight="bold" sx={{mt: 3}}>
                            Account security
                        </Typography>
                        <Box
                            sx={{display: "flex", flexDirection: "column", gap: 2, mt: 3}}
                        >
                            <Typography variant="body1" fontWeight="bold">
                                Email
                            </Typography>
                            <TextField
                                fullWidth
                                label="Email"
                                variant="outlined"
                                color="secondary"
                                value={authUser?.email || ""}
                                disabled
                                sx={{
                                    width: {xs: "100%", sm: "250px"},
                                }}
                            />

                            <Typography variant="body1" fontWeight="bold">
                                Password
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 2,
                                }}
                            >
                                <TextField
                                    fullWidth
                                    label="Password"
                                    variant="outlined"
                                    color="secondary"
                                    defaultValue="**********"
                                    disabled
                                    sx={{
                                        width: {xs: "100%", sm: "250px"},
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    sx={{
                                        textTransform: "none",
                                        backgroundColor: "#794CCA",
                                    }}
                                    onClick={() => setOpenChangePassword(true)}
                                >
                                    Change password
                                </Button>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Associated Account */}
                    {/* <Grid item xs={12}>
            <Divider />
            <Typography variant="h6" fontWeight="bold" sx={{ mt: 3 }}>
              Associated account
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
              <LockIcon fontSize="large" sx={{ color: "#794CCA" }} />
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  Google account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {authUser?.email || ""}
                </Typography>
              </Box>
            </Box>
          </Grid> */}

                    {/* Account Deletion */}
                    {/* <Grid item xs={12}>
            <Divider />
            <Typography variant="h6" fontWeight="bold" sx={{ mt: 3 }}>
              Account
            </Typography>
            <Button
              variant="contained"
              color="error"
              sx={{ mt: 2, textTransform: "none" }}
              onClick={() => setOpenDeleteDialog(true)}
            >
              Delete account
            </Button>
          </Grid> */}
                </Grid>

                {/* Popup for changing password */}
                <ChangePassword
                    open={openChangePassword}
                    handleClose={() => setOpenChangePassword(false)}
                    accessToken={authUser?.accessToken}
                />

                {/* Confirmation Dialog for Account Deletion */}
                <Dialog
                    open={openDeleteDialog}
                    onClose={() => setOpenDeleteDialog(false)}
                >
                    <DialogTitle>Delete account</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete your account? This action cannot
                            be undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                setOpenDeleteDialog(false);
                                handleDeleteAccount();
                            }}
                            color="error"
                        >
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default MyAccount;
