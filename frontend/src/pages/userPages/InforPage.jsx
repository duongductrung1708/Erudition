import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  TextareaAutosize,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const faqs = [
  {
    question: "Do I need coding skills to build an AI Agent?",
    answer:
      "No, Erudition provides a no-code solution to build AI Agents easily.",
  },
  {
    question: "What model can I use to build an AI agent?",
    answer:
      "You can use models like GPT-4, Claude, or any LLM that supports API integration.",
  },
  {
    question: "How do I embed my AI Agent into my website?",
    answer: "You can embed your AI Agent using an iframe or JavaScript widget.",
  },
  {
    question: "How do I deploy an AI Agent to my WhatsApp Business account?",
    answer:
      "Deploying your AI Agent to a WhatsApp Business account is straightforward. Our tutorial walks you step by step through the setup process. Check it out here: How to Deploy AI Agents to a WhatsApp Business Account",
  },
  {
    question:
      "How do I make an AI Agent that only talks about my specific business topic?",
    answer:
      "Your AI Agent will only use the knowledge you provide. By supplying topic-specific documents, FAQs, or data relevant to your industry or specialty, you ensure it focuses solely on that field. The more targeted your content and prompts, the more specialized your agent will be. For guidance on implementing guardrails using LLM prompting, check out: How to Guardrail an AI Agent with LLM Prompting.",
  },
  {
    question:
      "How do I create an AI Agent that extracts data from my PDF and turns it into JSON?",
    answer:
      "To build an AI Agent capable of parsing data from PDFs and converting it into JSON, check out our step-by-step tutorial: How to Create an AI Agent That Extracts Data from My PDF and Turns It into JSON.",
  },
  {
    question:
      "How can I empower my employee training with Retrieval-Augmented Generation (RAG)?",
    answer:
      "Learn how Retrieval-Augmented Generation (RAG) can transform employee training by providing relevant, on-demand knowledge. For more details and a step-by-step guide, check out our blog post: Empowering Employee Training with RAG.",
  },
  {
    question:
      "How do I create my Midjourney Discord server without coding, for free?",
    answer:
      "If you’re looking to set up a Midjourney Discord server at no cost and without coding, check out our comprehensive guide: How to Create Your Midjourney Discord Server No-Code for Free.",
  },
  {
    question: "How do I generate leads and send them to a Zapier Webhook?",
    answer:
      "If you want to capture leads and automatically send them to a Zapier Webhook, follow our step-by-step tutorial to get set up: How to Generate Leads and Send Them to a Zapier Webhook.",
  },
  {
    question:
      "How do I build a powerful AI Agent that understands multiple languages with voice input?",
    answer:
      "If you want to create an AI Agent that accepts voice inputs and supports multiple languages, check out: Multilingual Voice Input: Build a Powerful AI Agent That Understands Multiple Languages.",
  },
  {
    question: "How do I create AI Agent chatbots for Slack?",
    answer:
      "To set up AI Agent chatbots in your Slack workspace, follow our in-depth tutorial: How to Create AI Agent Chatbots for Slack.",
  },
  {
    question:
      "What are the best tips to make my AI Agent chatbot more engaging and human?",
    answer:
      "Discover 6 practical tips to enhance your AI Agent chatbot’s engagement, making it feel more human. Read our blog post for actionable insights: 6 Best Tips To Make Your AI Agent Chatbot More Engaging And More Human.",
  },
  {
    question: "How do I enable image display in chats for my AI Agent?",
    answer:
      "Easily configure your AI Agent to display images in the chat window by following our step-by-step guide: Easy Steps to Enable Image Display in Chats for Your AI Agent: A Setup Guide.",
  },
  {
    question: "How do I test multiple LLMs or AI Agents at the same time?",
    answer:
      "Comparing multiple Large Language Models or AI Agents side by side is an effective way to evaluate performance and features. Check out our blog post for a comprehensive guide: How to Test Multiple LLMs or AI Agents at the Same Time.",
  },
  {
    question: "How can I integrate Erudition with Zapier?",
    answer:
      "With AgentX’s Zapier integration, you can automate workflows by triggering and connecting actions across multiple platforms. To get started, follow our step-by-step guide: Zapier Integration Overview.",
  },
];

const InfoPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <>
      <title>Support & FAQs - Erudition</title>
      <meta
        name="description"
        content="Get help with Erudition’s AI agents. Submit a support request or explore FAQs on no-code AI, integrations, and more."
      />
      <meta
        name="keywords"
        content="AI agents, no-code AI, Erudition, support, FAQs, Zapier, WhatsApp, Slack, RAG, Midjourney, voice input, chatbot engagement"
      />
      <Box
        sx={{
          pt: "1.5rem",
          margin: "auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: { xs: 2, sm: 3, lg: "40px" },
            padding: { xs: "20px", sm: "30px", lg: "40px" },
            width: "100%",
            alignItems: "start",
          }}
        >
          {/* Left Side - Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              mx: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              bgcolor: "white",
              marginTop: { xs: "4rem", sm: "8rem", lg: "14rem" },
              width: "100%",
              maxWidth: { xs: "100%", sm: "400px" },
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              fontWeight="bold"
              textAlign="center"
              pb={2}
            >
              Let us know how we can help you
            </Typography>

            {/* Title Input */}
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="body2"
                  fontWeight="600"
                  fontSize={isMobile ? "0.875rem" : "1rem"}
                >
                  Title
                </Typography>
                <IconButton size="small">
                  <InfoOutlinedIcon
                    sx={{ color: "#804FD6" }}
                    fontSize={isMobile ? "small" : "medium"}
                  />
                </IconButton>
              </Box>
              <TextField
                fullWidth
                variant="outlined"
                name="title"
                placeholder="Tell us what you need"
                value={formData.title}
                onChange={handleChange}
                size="small"
                sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
              />
            </Box>

            {/* Message Input */}
            <Typography
              variant="body2"
              fontWeight="600"
              fontSize={isMobile ? "0.875rem" : "1rem"}
            >
              Message
            </Typography>
            <TextareaAutosize
              minRows={4}
              name="content"
              placeholder="Describe your issue"
              value={formData.content}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: isMobile ? "0.875rem" : "14px",
              }}
            />

            {/* File Upload and Submit Button */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={1}
            >
              <IconButton component="label">
                <AttachFileOutlinedIcon
                  fontSize={isMobile ? "small" : "medium"}
                />
                <input
                  type="file"
                  accept="image/*,.heic"
                  hidden
                  onChange={handleFileChange}
                />
              </IconButton>

              <Button
                type="submit"
                variant="contained"
                sx={{
                  bgcolor: "#804FD6",
                  color: "white",
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  fontSize: isMobile ? "0.75rem" : "12px",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#4F13B7" },
                }}
              >
                Submit
              </Button>
            </Box>
          </Box>

          {/* Right Side - FAQs */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              borderLeft: { lg: "1px solid #e0e0e0" },
              paddingLeft: { lg: "24px" },
              width: "100%",
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              fontWeight="bold"
              mt={isMobile ? 0 : "1rem"}
              gutterBottom
            >
              FAQs
            </Typography>
            <Box
              sx={{
                maxHeight: { xs: "auto", lg: "77vh" },
                overflowY: { xs: "visible", lg: "auto" },
              }}
            >
              {faqs.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{
                    marginBottom: "0.8rem",
                    width: "100%",
                    maxWidth: {
                      xs: "100%",
                      md: "1000px",
                      lg: "500px",
                    },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      fontSize={isMobile ? "0.875rem" : "1rem"}
                    >
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography
                      variant="body2"
                      fontSize={isMobile ? "0.75rem" : "0.875rem"}
                    >
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default InfoPage;
