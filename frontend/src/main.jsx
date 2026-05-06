import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "driver.js/dist/driver.css";
import App from "./App.jsx";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./styles/theme";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./hooks/AuthProvider";

createRoot(document.getElementById("root")).render(
    <Router>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </AuthProvider>
    </Router>
);
