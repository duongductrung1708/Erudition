import React from "react";
import { Grid } from "@mui/material";
import { Outlet } from "react-router-dom";
import Introduction from "../../components/Introduction";

const AuthLayout = () => {
  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      {/* Video Background (Persists across pages) */}
      <Grid
        item
        xs={12}
        md={7}
        sx={{
          background: "linear-gradient(to bottom, #B8A8E7, #F1C599)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          height: { xs: "auto", md: "100vh" },
          py: { xs: 4, md: 0 },
          px: { xs: 4, md: 0 },
        }}
      >
        <Introduction />
      </Grid>

      {/* Content (Changes between Login & Register) */}
      <Grid
        item
        xs={12}
        md={5}
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
        <Outlet /> {/* Dynamically renders Login or Register */}
      </Grid>
    </Grid>
  );
};

export default AuthLayout;
