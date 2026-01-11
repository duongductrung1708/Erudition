import React from "react";
import { Box, Button } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

const NavigationBar = () => {
  const location = useLocation();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2.5,
        px: 2,
        pt: { xs: 10, lg: 12 },
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        borderTopLeftRadius: "20px",
        borderTopRightRadius: "20px",
        width: "100%",
        backgroundColor: "white",
        position: "relative", // Needed for positioning the line
      }}
    >
      <Box sx={{ display: "flex", position: "relative" }}>
        <Button
          component={Link}
          to="/space"
          sx={{
            fontWeight: location.pathname === "/space" ? "bold" : "normal",
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
            px: 2,
            pt: 1,
            fontSize: "1rem",
            color: "black",
            textTransform: "none",
            "&:hover": { backgroundColor: "#F3E8FF" },
            position: "relative", // Allows the line to be positioned under it
          }}
        >
          Agent Space
          {location.pathname === "/space" && (
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "2px",
                backgroundColor: "#7C3AED",
              }}
            />
          )}
        </Button>
        <Button
          component={Link}
          to="/space/profile"
          sx={{
            fontWeight:
              location.pathname === "/space/profile" ? "bold" : "normal",
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
            px: 2,
            pt: 1,
            fontSize: "1rem",
            color: "black",
            textTransform: "none",
            "&:hover": { backgroundColor: "#F3E8FF" },
            position: "relative",
          }}
        >
          My Profile
          {location.pathname === "/space/profile" && (
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "2px",
                backgroundColor: "#7C3AED",
              }}
            />
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default NavigationBar;
