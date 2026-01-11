import React, { useState, useEffect } from "react";
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
  TablePagination,
  CircularProgress,
  Autocomplete,
  TextField,
  Alert,
  Chip,
  TableSortLabel,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate, useOutletContext } from "react-router-dom";

export default function UserDashboard() {
  const { chatbots, isLoading } = useOutletContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  const [filteredAgents, setFilteredAgents] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    let filtered = chatbots.filter((agent) =>
      agent.name
        .toLowerCase()
        .replace(/\s/g, "")
        .includes(searchTerm.toLowerCase().replace(/\s/g, ""))
    );

    if (sortField) {
      filtered = filtered.sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];

        if (sortField === "is_active") {
          valueA = a.is_active ? 1 : 0;
          valueB = b.is_active ? 1 : 0;
        }

        if (typeof valueA === "string") {
          return sortDirection === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      });
    } else {
      filtered = filtered.reverse();
    }

    setFilteredAgents(filtered);
    setPage(0);
  }, [chatbots, searchTerm, sortField, sortDirection]);

  const handleSort = (property) => () => {
    const isDesc = sortField === property && sortDirection === "desc";
    setSortDirection(isDesc ? "asc" : "desc");
    setSortField(property);
  };

  const handleAgentDetails = (chatbotId) => {
    navigate(`/user/user-conversation-detail/${chatbotId}`);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return (
      <>
        <title>Loading - Erudition User Workspace</title>
        <meta name="description" content="Loading your chatbot workspace..." />
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
      </>
    );
  }

  if (error || chatbots.length === 0) {
    return (
      <>
        <title>
          {error
            ? "Error - Erudition User Workspace"
            : "No Chatbots - Erudition User Workspace"}
        </title>
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
            <Typography variant="h5" fontWeight="bold">
              All your chatbots
            </Typography>
          </Box>
          <Alert severity={error ? "error" : "info"} sx={{ mt: 2 }}>
            {error || "You don't have any chatbots yet."}
          </Alert>
        </Box>
      </>
    );
  }

  return (
    <>
      <title>
        {searchTerm
          ? `"${searchTerm}" - Erudition User Workspace`
          : `Erudition - User Workspace`}
      </title>
      <meta
        name="description"
        content={
          searchTerm
            ? `"${searchTerm}" in Erudition’s user chatbot workspace.`
            : `Erudition’s user workspace.`
        }
      />
      <meta
        name="keywords"
        content={`chatbots, AI, workspace, Erudition${
          chatbots.length > 0
            ? ", " + chatbots.map((a) => a.name).join(", ")
            : ""
        }`}
      />
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
          <Typography variant="h5" fontWeight="bold">
            All your chatbots
          </Typography>
        </Box>

        <Box sx={{ mb: "1rem" }}>
          <Autocomplete
            options={chatbots}
            getOptionLabel={(option) => option.name}
            inputValue={searchTerm}
            onInputChange={(event, newInputValue) => {
              setSearchTerm(newInputValue || "");
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

        <Box
          sx={{ width: "100%", boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px" }}
        >
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell
                    sortDirection={sortField === "name" ? sortDirection : false}
                  >
                    <TableSortLabel
                      active={sortField === "name"}
                      direction={sortField === "name" ? sortDirection : "desc"}
                      onClick={handleSort("name")}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sortDirection={
                      sortField === "description" ? sortDirection : false
                    }
                  >
                    <TableSortLabel
                      active={sortField === "description"}
                      direction={
                        sortField === "description" ? sortDirection : "desc"
                      }
                      onClick={handleSort("description")}
                    >
                      Description
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sortDirection={
                      sortField === "organization" ? sortDirection : false
                    }
                  >
                    <TableSortLabel
                      active={sortField === "organization"}
                      direction={
                        sortField === "organization" ? sortDirection : "desc"
                      }
                      onClick={handleSort("organization")}
                    >
                      Organization
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sortDirection={
                      sortField === "is_active" ? sortDirection : false
                    }
                  >
                    <TableSortLabel
                      active={sortField === "is_active"}
                      direction={
                        sortField === "is_active" ? sortDirection : "desc"
                      }
                      onClick={handleSort("is_active")}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center" }}>
                      No agent found
                    </TableCell>
                  </TableRow>
                )}
                {filteredAgents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((agent, index) => {
                    const isActive = agent.is_active === true;
                    return (
                      <TableRow
                        key={agent.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: isActive ? "#F5F3FF" : "inherit",
                            cursor: isActive ? "pointer" : "default",
                          },
                        }}
                        onClick={
                          isActive
                            ? () => handleAgentDetails(agent.id)
                            : undefined
                        }
                        title={
                          isActive ? "" : "Inactive chatbots cannot be accessed"
                        }
                      >
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell sx={{ maxWidth: "200px" }}>
                          <Tooltip title={agent.name} placement="top" arrow>
                            <Typography
                              sx={{
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {agent.name}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ maxWidth: "300px" }}>
                          <Tooltip
                            title={agent.description || "No description"}
                            placement="top"
                            arrow
                          >
                            <Typography
                              sx={{
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {agent.description || "No description"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ maxWidth: "200px" }}>
                          <Tooltip
                            title={agent.organization || "No organization"}
                            placement="top"
                            arrow
                          >
                            <Typography
                              sx={{
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {agent.organization || "No organization"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={agent.is_active ? "Active" : "Inactive"}
                            color={agent.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={agent.is_disabled ? "Disable" : "Enable"}
                            color={agent.is_disabled ? "default" : "success"}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

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
