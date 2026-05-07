import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "../hooks/AuthProvider";

const StyledContainer = styled(Container)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  textAlign: "center",
}));

const StyledList = styled(List)(() => ({
  display: "flex",
  flexDirection: "row",
  padding: 0,
  alignItems: "center",
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(0, 1),
  "&:hover": {
    "& .MuiListItemText-primary": {
      textDecoration: "underline",
    },
  },
}));

const MiddleListItem = styled(StyledListItem)(({ theme }) => ({
  padding: theme.spacing(0, 3),
}));

const StyledListItemText = styled(ListItemText)(() => ({
  "& .MuiListItemText-primary": {
    fontSize: "0.875rem",
    color: "#135CAD",
  },
}));

const DotSeparator = styled("span")(({ theme }) => ({
  fontSize: "0.875rem",
  color: "black",
  margin: theme.spacing(0, 1),
}));

const NotFound = () => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);

  const handleLogout = async (event) => {
    event.preventDefault();
    setIsLoggingOut(true);
    setError(null);

    try {
      await logout();
      window.location.href = "/login";
    } catch (err) {
      setError("Failed to log out. Please try again.");
      console.error("Logout error:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { text: "Home", href: "/" },
    {
      text: "Sign out and sign in with a different account",
      onClick: handleLogout,
    },
    { text: "Help", href: "/help" },
  ];

  return (
    <>
      {isLoggingOut ? (
        <>
          <title>Logging Out | Erudition</title>
          <meta
            name="description"
            content="Logging out of Erudition. Please wait..."
          />
        </>
      ) : error ? (
        <>
          <title>404 Page Not Found | Error | Erudition</title>
          <meta
            name="description"
            content="The page wasn’t found, and an error occurred. Try the homepage or contact Erudition support."
          />
          <meta
            name="keywords"
            content="Erudition, 404, page not found, AI agents, support"
          />
        </>
      ) : (
        <>
          <title>404 Page Not Found | Erudition</title>
          <meta
            name="description"
            content="The page you’re looking for doesn’t exist on Erudition. Return to the homepage or get help."
          />
          <meta
            name="keywords"
            content="Erudition, 404, page not found, AI agents, support"
          />
        </>
      )}
      <StyledContainer maxWidth="md" className="page-container">
        <Box className="error-container">
          <img
            alt="404"
            src="https://gitlab.com/assets/illustrations/error/error-404-lg-9dfb20cc79e1fe8104e0adb122a710283a187b075b15187e2f184d936a16349c.svg"
            style={{ maxWidth: "100%", height: "auto", marginBottom: "2rem" }}
          />

          <Typography variant="h4" fontWeight="bold" gutterBottom>
            404: Page not found
          </Typography>

          <Typography variant="body1" paragraph>
            Make sure the address is correct and the page has not moved.
          </Typography>

          <Typography variant="body1" paragraph>
            Please contact your Erudition administrator if you think this is a
            mistake.
          </Typography>

          {error && (
            <Typography variant="body2" color="error" paragraph>
              {error}
            </Typography>
          )}

          <Divider />

          <nav>
            <StyledList className="error-nav">
              {navItems.map((item, index) => (
                <React.Fragment key={item.text}>
                  {index === 1 ? (
                    <MiddleListItem
                      component="a"
                      href={item.href || "#"}
                      onClick={item.onClick || undefined}
                      disabled={isLoggingOut}
                    >
                      <StyledListItemText
                        primary={
                          isLoggingOut && index === 1 ? (
                            <Box display="flex" alignItems="center">
                              Logging out...{" "}
                              <CircularProgress size={14} sx={{ ml: 1 }} />
                            </Box>
                          ) : (
                            item.text
                          )
                        }
                      />
                    </MiddleListItem>
                  ) : (
                    <StyledListItem
                      component="a"
                      href={item.href}
                      onClick={item.onClick || undefined}
                    >
                      <StyledListItemText primary={item.text} />
                    </StyledListItem>
                  )}
                  {index < navItems.length - 1 && (
                    <DotSeparator> • </DotSeparator>
                  )}
                </React.Fragment>
              ))}
            </StyledList>
          </nav>
        </Box>
      </StyledContainer>
    </>
  );
};

export default NotFound;
