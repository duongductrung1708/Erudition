import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Typography,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  CircularProgress,
  TablePagination,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { deleteChatbotUser, addChatbotUser } from "../../services/chatbot_api";
import UserForm from "../UserForm";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/AuthProvider";

const AgentMember = ({ agentDetails }) => {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { chatbotId } = useParams();
  const [chatbotUsers, setChatbotUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    if (agentDetails && agentDetails.chatbot_users) {
      setChatbotUsers(agentDetails.chatbot_users);
      setLoading(false);
    }
  }, [agentDetails]);

  const handleSearchChange = (event) => setSearchQuery(event.target.value);

  const handleClickOpenDialog = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        const token = user.accessToken;
        if (!token) {
          console.error("Access token is missing");
          return;
        }
        await deleteChatbotUser(chatbotId, selectedUser.id, token);
        setChatbotUsers(
          chatbotUsers.filter((user) => user.id !== selectedUser.id)
        );
        handleCloseDialog();
        toast.success("Member deleted successfully!");
      } catch (error) {
        console.error("Error deleting member:", error);
        toast.error(error.detail || "Failed to delete member");
      }
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setOpenForm(true);
  };

  const handleSaveUser = async (userData) => {
    if (!userData.email) return;

    const token = user.accessToken;
    if (!token) {
      console.error("Access token is missing");
      return;
    }

    try {
      await addChatbotUser(chatbotId, userData.email, token);
      setChatbotUsers([
        ...chatbotUsers,
        { ...userData, id: chatbotUsers.length + 1, is_active: true },
      ]);
      setOpenForm(false);
      toast.success("Member added successfully!");
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error(error.detail || "Failed to add member");
    }
  };

  const filteredMembers = chatbotUsers.filter((user) =>
    user.email
      .toLowerCase()
      .replace(/\s/g, "")
      .includes(searchQuery.toLowerCase().replace(/\s/g, ""))
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#7844D3" }} />
      </Box>
    );
  }

  return (
    <>
      <title>{agentDetails.name}</title>
      <Box
        sx={{
          maxWidth: { xs: "100%", sm: "600px", md: "1200px" },
          margin: "0 auto",
          padding: { xs: "10px", sm: "20px" },
          marginTop: { xs: "4rem", sm: "auto" },
        }}
      >
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{
            marginBottom: "20px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Member list
        </Typography>

        {/* Search and Add Button */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            gap: 2,
          }}
        >
          {!isAdmin && (
            <Button
              variant="contained"
              sx={{
                textTransform: "none",
                bgcolor: "#7844D3",
                width: isMobile ? "100%" : "auto",
                "&:hover": { bgcolor: "#5E33A8" },
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
              onClick={handleAddUser}
            >
              Add member
            </Button>
          )}

          <TextField
            label="Search by email"
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            sx={{ width: isMobile ? "100%" : "300px" }}
            color="secondary"
          />
        </Box>

        {/* Empty state handling */}
        {chatbotUsers.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
              border: "1px dashed #ddd",
              borderRadius: "4px",
              p: 4,
              textAlign: "center",
              backgroundColor: "#fafafa",
            }}
          >
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>
              No members found
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: "text.secondary",
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            >
              This chatbot doesn't have any members yet.
            </Typography>
            {!isAdmin && (
              <Button
                variant="contained"
                sx={{
                  textTransform: "none",
                  bgcolor: "#7844D3",
                  "&:hover": { bgcolor: "#5E33A8" },
                  fontSize: isMobile ? "0.875rem" : "1rem",
                }}
                onClick={handleAddUser}
              >
                Add your first member
              </Button>
            )}
          </Box>
        ) : (
          <>
            {/* Responsive Table or Card List */}
            {isMobile ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {filteredMembers.length === 0 ? (
                  <Typography sx={{ textAlign: "center", py: 4 }}>
                    No members match your search
                  </Typography>
                ) : (
                  filteredMembers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user, index) => (
                      <Card key={user.id} sx={{ boxShadow: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            #{page * rowsPerPage + index + 1}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Email:</strong> {user.email}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Status:</strong>
                            <Box
                              component="span"
                              sx={{
                                ml: 1,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                backgroundColor: user.is_active
                                  ? "success.light"
                                  : "error.light",
                                color: user.is_active
                                  ? "success.dark"
                                  : "error.dark",
                              }}
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </Box>
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleClickOpenDialog(user)}
                          >
                            Remove
                          </Button>
                        </CardActions>
                      </Card>
                    ))
                )}
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  mt: 2,
                  border: "1px solid #ddd",
                  boxShadow: 2,
                  overflowX: "auto",
                  "&::-webkit-scrollbar": {
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "#f1f1f1",
                    borderRadius: "10px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#DDDDDD",
                    borderRadius: "10px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: "#5a2ca0",
                  },
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMembers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          sx={{ textAlign: "center", py: 4 }}
                        >
                          <Typography variant="body1">
                            No members match your search
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMembers
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((user, index) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              {page * rowsPerPage + index + 1}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  backgroundColor: user.is_active
                                    ? "success.light"
                                    : "error.light",
                                  color: user.is_active
                                    ? "success.dark"
                                    : "error.dark",
                                }}
                              >
                                {user.is_active ? "Active" : "Inactive"}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleClickOpenDialog(user)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination */}
            {chatbotUsers.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                component="div"
                count={filteredMembers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  "& .MuiTablePagination-toolbar": {
                    flexWrap: isMobile ? "wrap" : "nowrap",
                    justifyContent: isMobile ? "center" : "flex-end",
                    padding: isMobile ? "10px 0" : "inherit",
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                    {
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                    },
                }}
              />
            )}
          </>
        )}

        {/* Confirmation Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          fullWidth={isMobile}
          maxWidth={isMobile ? "xs" : "sm"}
        >
          <DialogTitle>Confirm removal</DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
              Are you sure you want to remove{" "}
              <strong>{selectedUser?.email}</strong> from this chatbot?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* UserForm Dialog */}
        <Dialog
          open={openForm}
          onClose={() => setOpenForm(false)}
          fullWidth
          maxWidth={isMobile ? "xs" : "md"}
        >
          <UserForm
            open={openForm}
            onClose={() => setOpenForm(false)}
            onSave={handleSaveUser}
          />
        </Dialog>
      </Box>
    </>
  );
};

export default AgentMember;
