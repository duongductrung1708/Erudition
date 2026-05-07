import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  TablePagination,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Autocomplete,
  Button,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getAllChatbots } from "../services/api";
import { getAllChatbotFromUser } from "../services/chatbot_api";
import { useAuth } from "../hooks/AuthProvider";
import { ArrowBackIos as ArrowBackIosIcon } from "@mui/icons-material";

export default function ChatHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isLoading, setIsLoading] = useState(false);

  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchChatbots = async () => {
      try {
        setIsLoading(true);
        const userToken = user.accessToken;
        if (!userToken) {
          setError("No access token found. Please log in.");
          return;
        }

        let response;
        if (user.isChatbotCreator) {
          response = await getAllChatbots(userToken);
        } else {
          response = await getAllChatbotFromUser(userToken);
        }

        setAgents(response);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load chatbots.");
        setIsLoading(false);
      }
    };
    fetchChatbots();
  }, [user]);

  const filteredAgents = agents.filter((agent) =>
    agent.name
      .toLowerCase()
      .replace(/\s/g, "")
      .includes(searchTerm.toLowerCase().replace(/\s/g, ""))
  );

  const handleAgentDetailsChatHistory = (chatbotId) => {
    if (user.isChatbotCreator) {
      navigate(`/agent-chat-history-detail/${chatbotId}`);
    } else {
      navigate(`/user/agent-chat-history-detail/${chatbotId}`);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
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

  if (error) {
    return (
      <Box
        p={4}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Alert
          sx={{ alignItems: "end" }}
          severity="error"
          action={
            <Button color="inherit" onClick={() => window.location.reload()}>
              RETRY
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <title>Erudition | Chat history</title>
      <Box
        sx={{
          minHeight: "100vh",
          pt: "5rem",
          px: { xs: "1rem", sm: "2rem", md: "3rem" },
          width: "100%",
          maxWidth: "100vw",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          mb={"1rem"}
        >
          <Box
            variant="h5"
            fontWeight="bold"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <IconButton
              sx={{
                color: "black",
                borderRadius: "10px",
                "&:hover": { backgroundColor: "#f1f1f1" },
              }}
              onClick={() => navigate("/user/workspace")}
            >
              <ArrowBackIosIcon />
            </IconButton>

            <Typography variant="h6" fontWeight="bold" paddingRight="0.5rem">
              Chat history
            </Typography>
          </Box>
        </Box>

        {/* Search with Autocomplete */}
        <Box sx={{ mb: "1rem" }}>
          <Autocomplete
            options={agents}
            getOptionLabel={(option) => option.name}
            inputValue={searchTerm}
            onInputChange={(event, newInputValue) => {
              setSearchTerm(newInputValue);
              setPage(0);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search chatbots"
                variant="outlined"
                size="small"
                color="secondary"
              />
            )}
            freeSolo
            fullWidth
            sx={{ maxWidth: "500px" }}
          />
        </Box>

        {/* Table */}
        <Box
          sx={{ width: "100%", boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px" }}
        >
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Organization</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: "center" }}>
                      No agent found
                    </TableCell>
                  </TableRow>
                )}
                {filteredAgents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((agent, index) => {
                    return (
                      <TableRow
                        key={agent.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#F5F3FF",
                            cursor: "pointer",
                          },
                        }}
                        onClick={() => handleAgentDetailsChatHistory(agent.id)}
                      >
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell
                          sx={{
                            maxWidth: "200px",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {agent.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: "300px",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {agent.description}
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: "200px",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {agent.organization}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          component="div"
          count={filteredAgents.length}
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
      </Box>
    </>
  );
}
