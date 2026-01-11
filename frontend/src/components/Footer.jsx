import React from "react";
import { Container, Grid, Typography, Link, Box } from "@mui/material";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <Box component="footer" sx={{ bgcolor: "#f8f9fa", py: 4, mt: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Branding Section */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                sx={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 700,
                  fontSize: "3rem",
                  color: "black",
                }}
              >
                ERUDITION
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ marginBottom: "2rem" }}
            >
              Erudition™ | One-stop AI Agent build platform.
            </Typography>

            <Typography variant="h6" gutterBottom fontWeight="bold">
              TUTORIALS
            </Typography>

            {/* Tutorials Section */}
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              How to build an AI agent
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              How to deploy to the websites
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              How to deploy to Slack workspace
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              How to deploy to Discord server
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              How to deploy to WhatsApp Business
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Lead Generation with HubSpot CRM
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Lead Generation with Wix CRM
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Lead Generation with Zapier webhook
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Zapier Integration Overview
            </Link>
          </Grid>

          {/* Channels Section */}
          <Grid item xs={12} sm={2}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              CHANNELS
            </Typography>
            <Link
              href="/login"
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Web Widget
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Slack
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Discord
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Shopify
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              WordPress
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Wix
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              SquareSpace
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Zapier
            </Link>
          </Grid>

          {/* PRODUCT Section */}
          <Grid item xs={12} sm={2}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              PRODUCT
            </Typography>
            <Link
              href="/login"
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Work Space
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Pricing
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              AI Chatbot
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Knowledge Base
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Data Tracking
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Enterprise RAG
            </Link>
            <Link
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Tools
            </Link>
          </Grid>

          <Grid item xs={12} sm={2}>
            {/* Company Section */}
            <Typography variant="h6" gutterBottom fontWeight="bold">
              COMPANY
            </Typography>
            <Link
              href="/login"
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              About us
            </Link>
            <Link
              href="/login"
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Contact us
            </Link>
            <Link
              href="/login"
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              FAQs
            </Link>

            {/* Resources Section */}
            <Typography
              variant="h6"
              gutterBottom
              fontWeight="bold"
              marginTop="1rem"
            >
              RESOURCES
            </Typography>
            <Link
              href="/login"
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Blogs
            </Link>
            <Link
              href="/login"
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              News
            </Link>
            <Link
              href="/login"
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Trends
            </Link>
            <Link
              href="/login"
              underline="hover"
              display="block"
              lineHeight="2rem"
              sx={{
                color: "gray",
                "&:hover": { color: "darkgray" },
              }}
            >
              Features
            </Link>
          </Grid>
        </Grid>

        <Box sx={{ marginTop: "3rem" }}>
          <hr className="custom-line" sx={{ bgcolor: "gray" }}></hr>
        </Box>

        <Grid container spacing={4}>
          {/* Branding Section */}
          <Grid item xs={12} sm={6}>
            <Box mt={4} textAlign="start">
              <Typography variant="body1" color="textSecondary">
                © {new Date().getFullYear()} Erudition Inc
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box mt={4} textAlign="end">
              <Link
                href="/terms-of-service"
                underline="hover"
                color="textSecondary"
                sx={{ cursor: "pointer" }}
              >
                Terms of Service
              </Link>
              <span> | </span>
              <Link
                href="/privacy-policy"
                underline="hover"
                color="textSecondary"
                sx={{ cursor: "pointer" }}
              >
                Privacy Policy
              </Link>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;
