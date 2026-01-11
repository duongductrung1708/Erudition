import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Grid,
  InputAdornment,
  Typography,
  Box,
} from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import Joyride, { STATUS } from "react-joyride";

const UploadFile = ({ setNewDocument, openKnowledgeDialog, chatbotId }) => {
  const [title, setTitle] = useState("");
  const [upload, setUpload] = useState("");
  const [runTour, setRunTour] = useState(false);

  // Joyride steps
  const steps = [
    {
      target: '[data-tour="title-field"]',
      content: "Enter a title for your document here.",
      disableBeacon: false,
      placement: "top",
    },
    {
      target: '[data-tour="upload-file"]',
      content: "Click Upload to select a .docx or .pdf document.",
      disableBeacon: true,
      placement: "top",
    },
    {
      target: '[data-tour="dialog-next"]',
      content: "Click Next to upload your document.",
      disableBeacon: true,
      placement: "top",
    },
  ];

  // Start tour when dialog opens
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`uploadDocTour_${chatbotId}`);
    if (!hasSeenTour && openKnowledgeDialog) {
      setTimeout(() => setRunTour(true), 300);
    }
  }, [openKnowledgeDialog, chatbotId]);

  // Handle tour completion
  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      localStorage.setItem(`uploadDocTour_${chatbotId}`, "true");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUpload(file.name);
      const updatedTitle = title === "" ? file.name : title;
      setTitle(updatedTitle);
      setNewDocument((prev) => {
        return {
          ...prev,
          file: file,
          title: updatedTitle,
        };
      });
    }
  };

  const handleTitleChange = (event) => {
    const updatedTitle = event.target.value;
    setTitle(updatedTitle);
    setNewDocument((prev) => {
      return {
        ...prev,
        title: updatedTitle,
      };
    });
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        disableScrolling={true}
        styles={{
          options: {
            primaryColor: "#8B5CF6",
            textColor: "#333",
            zIndex: 1500,
          },
          tooltip: {
            borderRadius: "8px",
            padding: "16px",
          },
          buttonNext: {
            backgroundColor: "#8B5CF6",
            borderRadius: "4px",
            color: "#fff",
          },
          buttonBack: {
            color: "#8B5CF6",
          },
          buttonSkip: {
            color: "#8B5CF6",
          },
        }}
        locale={{
          next: "Next",
          back: "Back",
          skip: "Skip",
          last: "Got it",
        }}
      />
      <Box>
        <Typography variant="body2" color="textSecondary" paragraph>
          Upload a document file containing text to learn from. Some examples are
          product documentation, slide decks, research papers, employee handbooks,
          an ebook, or any content you can convert to a text file. We will parse
          the content and add it to this bot. Currently we support adding .docx
          and .pdf documents.
        </Typography>

        <Grid container spacing={2}>
          {/* Title */}
          <Grid item xs={12}>
            <TextField
              color="secondary"
              label="Title"
              fullWidth
              value={title}
              onChange={handleTitleChange}
              variant="outlined"
              data-tour="title-field"
            />
          </Grid>

          {/* Upload Field */}
          <Grid item xs={12}>
            <TextField
              color="secondary"
              label="Upload"
              fullWidth
              value={upload}
              variant="outlined"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      component="label"
                      sx={{
                        borderRadius: 2,
                        bgcolor: "#7844D3",
                        textTransform: "capitalize",
                      }}
                      data-tour="upload-file"
                    >
                      <FileUploadOutlinedIcon sx={{ marginRight: 1 }} />
                      Upload
                      <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                        accept=".docx,.pdf"
                      />
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default UploadFile;