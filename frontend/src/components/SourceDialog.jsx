import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
} from "@mui/material";
import React, { useState } from "react";
import Markdown from "markdown-to-jsx";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const SourceDialog = ({ open, onClose, sourceData, isLoading }) => {
  const [expandedDocs, setExpandedDocs] = useState({}); // Track which documents' full content is expanded

  const markdownOptions = {
    overrides: {
      h1: {
        component: Typography,
        props: {
          variant: "h6",
          sx: { mt: 2, mb: 1, fontWeight: "bold", color: "#1976d2" },
        },
      },
      h2: {
        component: Typography,
        props: {
          variant: "subtitle1",
          sx: { mt: 2, mb: 1, fontWeight: "bold", color: "#1976d2" },
        },
      },
      p: {
        component: Typography,
        props: {
          variant: "body2",
          sx: { mb: 1, lineHeight: 1.6 },
        },
      },
      strong: {
        component: Typography,
        props: {
          component: "span",
          sx: { fontWeight: "bold", color: "#424242" },
        },
      },
    },
  };

  const handleToggleExpand = (index) => {
    setExpandedDocs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="source-dialog-title"
    >
      <DialogTitle id="source-dialog-title">Source information</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading source data...
          </Typography>
        ) : sourceData && sourceData.length > 0 ? (
          <Box>
            {sourceData.map((source, index) => (
              <Box
                key={index}
                sx={{ mb: 4, p: 2, borderRadius: 2, bgcolor: "#f5f5f5" }}
              >
                {/* Document Title */}
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: "bold", color: "#424242" }}
                >
                  {source.doc_title}
                </Typography>

                {/* Relevant Chunks */}

                <List dense disablePadding>

                  {source.chunks_data.map((chunk, chunkIdx) => (

                    <ListItem
                      key={chunkIdx}
                      sx={{
                        display: "flow",
                        py: 1,
                        px: 2,
                        borderBottom:
                          chunkIdx < source.chunks_data.length - 1
                            ? "1px solid #e0e0e0"
                            : "none",
                        bgcolor: "white",
                        borderRadius: 1,
                        mb: 1,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                          sx={{ fontStyle: "italic" }}
                      >
                        Relevant chunks:
                      </Typography>
                      <ListItemText
                        primary={
                          <Markdown options={markdownOptions}>
                            {chunk.length > 5000
                              ? `${chunk.substring(0, 5000)}... [Truncated]`
                              : chunk}
                          </Markdown>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Full Document Content (Collapsible) */}
                {source.full_doc_content && (
                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        bgcolor: "#e0e0e0",
                        p: 1,
                        borderRadius: 1,
                      }}
                      onClick={() => handleToggleExpand(index)}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "medium", color: "#424242" }}
                      >
                        Full document content
                      </Typography>
                      <IconButton size="small">
                        {expandedDocs[index] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={expandedDocs[index]}>
                      <Box
                        sx={{
                          mt: 1,
                          p: 2,
                          bgcolor: "#fafafa",
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        <Markdown options={markdownOptions}>
                          {source.full_doc_content}
                        </Markdown>
                      </Box>
                    </Collapse>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No source data available.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SourceDialog;