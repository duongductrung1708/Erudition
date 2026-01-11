import { Box, Typography } from "@mui/material";
import React from "react";

const Introduction = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
      }}
    >
      {/* Centered Text Logo */}
      <Typography
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <svg
          width="250"
          height="60"
          viewBox="0 0 500 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <text
            x="50%"
            y="80"
            textAnchor="middle"
            fontFamily="'Orbitron', sans-serif"
            fontSize="60"
            fontWeight="bold"
            fill="#222"
            letterSpacing="5"
          >
            <tspan>E</tspan>
            <tspan fill="#5E33A8">R</tspan>
            <tspan>U</tspan>
            <tspan fill="#5E33A8">D</tspan>
            <tspan>I</tspan>
            <tspan fill="#5E33A8">T</tspan>
            <tspan>I</tspan>
            <tspan fill="#5E33A8">O</tspan>
            <tspan>N</tspan>
          </text>
        </svg>
      </Typography>

      {/* Video Element */}
      <iframe
        src="https://www.youtube.com/embed/YZXrWcj110o?autoplay=1&mute=1&loop=1&playlist=YZXrWcj110o"
        width="100%"
        height="50%"
        style={{
          borderRadius: "10px",
          border: "none",
          margin: "2rem 0",
        }}
        allow="autoplay; encrypted-media; fullscreen"
        title="Erudition Video"
      />

      <Typography variant="h7" fontWeight="bold">
        Explore new features! Start building your AI agent with Erudition today.
      </Typography>
    </Box>
  );
};

export default Introduction;
