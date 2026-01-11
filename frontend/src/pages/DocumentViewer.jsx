import React, { useState, useEffect, useRef } from "react";
import Markdown from "markdown-to-jsx";
import {
  Box,
  Menu,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Drawer,
  TextField,
  Divider,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import TableViewIcon from "@mui/icons-material/TableView";
import Joyride, { STATUS } from "react-joyride";

const DocumentViewer = ({
  documentData,
  setDocumentData,
  currentDocument,
  isViewOnly,
  onReconstructTables,
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [tableOfContents, setTableOfContents] = useState([]);
  const [tocOpen, setTocOpen] = useState(false);
  const [runTour, setRunTour] = useState(false);

  // Joyride steps
  const steps = [
    !isViewOnly(currentDocument.status) && {
      target: '[data-tour="markdown-editor"]',
      content: "Edit your document content here using Markdown syntax.",
      disableBeacon: false,
      placement: "top",
    },
    {
      target: '[data-tour="toc-button"]',
      content:
        "Click this button to view the table of contents for your document.",
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: '[data-tour="preview-area"]',
      content:
        "Select text in the preview area, right-click to open the context menu, and choose 'Toggle H1-H6' to set headers or 'Clear Header' to unset them.",
      disableBeacon: true,
      placement: "top",
    },
  ].filter(Boolean); // Remove falsy steps (for view-only mode)

  // Start tour if not previously completed
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(
      `documentViewerTour_${currentDocument.id}`
    );
    if (!hasSeenTour && currentDocument.id) {
      setTimeout(() => setRunTour(true), 300); // Delay to ensure DOM is ready
    }
  }, [currentDocument.id]);

  // Handle tour completion or skip
  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      localStorage.setItem(`documentViewerTour_${currentDocument.id}`, "true");
    }
  };

  // Generate table of contents
  useEffect(() => {
    const headers = documentData
      .split("\n")
      .filter((line) => line.match(/^#+\s/));
    const tocEntries = headers.map((header) => {
      const level = header.match(/^(#+)/)[1].length;
      const text = header.replace(/^#+\s*/, "").trim();
      return { level, text };
    });
    setTableOfContents(tocEntries);
  }, [documentData]);

  const handleContextMenu = (event) => {
    event.preventDefault();
    const selection = window.getSelection();
    const selectedString = selection.toString().trim();

    if (selectedString) {
      const selectedNode = selection.anchorNode.parentElement;
      setSelectedText({ text: selectedString, node: selectedNode });
      setContextMenu({
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
      });
    }
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const getHeaderLevel = (text) => {
    const headerMatch = text.match(/^(#+)\s/);
    return headerMatch ? headerMatch[1].length : 0;
  };

  const handleHeading = (level) => {
    if (selectedText && selectedText.node) {
      const paragraphs = documentData.split("\n\n");
      const updatedParagraphs = paragraphs.map((paragraph) => {
        if (paragraph.includes(selectedText.text)) {
          const cleanedText = paragraph.replace(/^#+\s*/, "");
          const currentHeaderLevel = getHeaderLevel(paragraph);
          return currentHeaderLevel === level
            ? cleanedText
            : `${"#".repeat(level)} ${cleanedText}`;
        }
        return paragraph;
      });

      setDocumentData(updatedParagraphs.join("\n\n"));
    }
    handleClose();
  };

  const clearHeading = () => {
    const updatedData = documentData
      .split("\n")
      .map((line) => line.replace(/^#+\s*/, ""))
      .join("\n");

    setDocumentData(updatedData);
    handleClose();
  };

  const findSelectedTextHeaderLevel = () => {
    if (!selectedText || !selectedText.text) return 0;
    const paragraphs = documentData.split("\n\n");
    const matchedParagraph = paragraphs.find((p) =>
      p.includes(selectedText.text)
    );
    return matchedParagraph ? getHeaderLevel(matchedParagraph) : 0;
  };

  const editorRef = useRef(null);
  const previewRef = useRef(null);

  // Synchronize scrolling between editor and preview
  useEffect(() => {
    const editor = editorRef.current;
    const preview = previewRef.current;

    if (!editor || !preview) return;

    const handleScroll = (source, target) => {
      const ratio =
        source.scrollTop / (source.scrollHeight - source.clientHeight);
      target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
    };

    const onEditorScroll = () => handleScroll(editor, preview);
    const onPreviewScroll = () => handleScroll(preview, editor);

    editor.addEventListener("scroll", onEditorScroll);
    preview.addEventListener("scroll", onPreviewScroll);

    return () => {
      editor.removeEventListener("scroll", onEditorScroll);
      preview.removeEventListener("scroll", onPreviewScroll);
    };
  }, []);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Joyride Tour */}
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
            zIndex: 1500, // Above MUI Dialog (zIndex: 1300)
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

      {/* Toggle TOC Drawer */}
      <Tooltip title="Table of Contents" placement="top">
        <IconButton
          onClick={() => setTocOpen(true)}
          sx={{
            position: "absolute",
            top: !isViewOnly(currentDocument.status) ? 0 : "1rem",
            right: !isViewOnly(currentDocument.status) ? "50%" : "0",
            zIndex: 1300,
            transform: "translateX(-50%)",
            backgroundColor: "#8B5CF6",
            borderRadius: "50%",
            boxShadow: 2,
            color: "white",
            ":hover": { backgroundColor: "#7C3AED" },
          }}
          data-tour="toc-button"
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>

      {/* Reconstruct Tables Button */}
      {/* {!isViewOnly(currentDocument.status) && (
        <Tooltip title="Click here to reconstruct table" placement="top">
          <IconButton
            variant="outlined"
            onClick={onReconstructTables}
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              zIndex: 1300,
              transform: "translateX(-50%)",
              backgroundColor: "#8B5CF6",
              borderRadius: "50%",
              boxShadow: 2,
              color: "white",
              ":hover": { backgroundColor: "#7C3AED" },
            }}
            data-tour="reconstruct-tables"
          >
            <TableViewIcon />
          </IconButton>
        </Tooltip>
      )} */}

      {/* TOC Drawer */}
      <Drawer
        anchor="left"
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        ModalProps={{
          sx: {
            zIndex: (theme) => theme.zIndex.modal + 1,
          },
        }}
      >
        <Box sx={{ width: 300, padding: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Table of Contents
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <List>
            {tableOfContents.map((header, index) => (
              <ListItem
                key={index}
                sx={{
                  pl: `${(header.level - 1) * 16}px`,
                  py: 0.5,
                }}
              >
                <ListItemText
                  primary={header.text}
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: {
                      fontWeight: header.level === 1 ? "bold" : "normal",
                      fontSize: `${1 - header.level * 0.01}rem`,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ display: "flex", width: "100%", height: "60vh", gap: 2 }}>
        {/* Markdown Editor */}
        {!isViewOnly(currentDocument.status) && (
          <Box
            ref={editorRef}
            sx={{
              flex: 1,
              overflow: "auto",
              padding: 2,
              borderRight: "1px solid #ccc",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, fontWeight: 600 }}
              data-tour="markdown-editor"
            >
              Markdown Editor
            </Typography>
            <TextField
              disabled={isViewOnly(currentDocument.status)}
              value={documentData}
              onChange={(e) => setDocumentData(e.target.value)}
              multiline
              fullWidth
              variant="outlined"
              sx={{
                flex: 1,
                fontFamily: "monospace",
              }}
            />
          </Box>
        )}

        {/* Markdown Viewer */}
        <Box
          ref={previewRef}
          onContextMenu={handleContextMenu}
          sx={{
            flex: 1,
            overflow: "auto",
            padding: 2,
            backgroundColor: "#fdfdfd",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.1)",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ mb: 1, fontWeight: 600 }}
            data-tour="preview-area"
          >
            Preview
          </Typography>
          <Box className="tiptap">
            <Markdown>{documentData}</Markdown>
          </Box>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">
            {findSelectedTextHeaderLevel() > 0 ? "UNSET HEADER" : "SET HEADER"}
          </Typography>
        </MenuItem>
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <MenuItem key={level} onClick={() => handleHeading(level)}>
            {findSelectedTextHeaderLevel() === level
              ? "Unset"
              : `Toggle H${level}`}
          </MenuItem>
        ))}
        <MenuItem onClick={clearHeading}>Clear Header</MenuItem>
      </Menu>
    </Box>
  );
};

export default DocumentViewer;
