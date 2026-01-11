import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { createFaq, updateFaq } from "../../services/faq_api";
import Joyride, { STATUS } from "react-joyride";

const FaqDialog = ({
  open,
  onClose,
  chatbotId,
  token,
  faqToEdit,
  onFaqUpdated,
}) => {
  const [faq, setFaq] = useState({ question: "", answer: "" });
  const [loading, setLoading] = useState(false);
  const [runTour, setRunTour] = useState(false);

  // Joyride steps
  const steps = [
    {
      target: '[data-tour="faq-question"]',
      content: "Enter a question for the FAQ here.",
      disableBeacon: false,
      placement: "top",
    },
    {
      target: '[data-tour="faq-answer"]',
      content: "Enter the answer for the FAQ here.",
      disableBeacon: true,
      placement: "top",
    },
    {
      target: '[data-tour="faq-create"]',
      content: "Click Create to save your FAQ.",
      disableBeacon: true,
      placement: "top",
    },
  ];

  // Start tour when dialog opens
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`faqDialogTour_${chatbotId}`);
    if (!hasSeenTour && open && !faqToEdit) {
      setTimeout(() => setRunTour(true), 300);
    }
  }, [open, chatbotId, faqToEdit]);

  // Handle tour completion
  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      localStorage.setItem(`faqDialogTour_${chatbotId}`, "true");
    }
  };

  useEffect(() => {
    if (faqToEdit) {
      setFaq({ question: faqToEdit.question, answer: faqToEdit.answer });
    } else {
      setFaq({ question: "", answer: "" });
    }
  }, [faqToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFaq((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!faq.question.trim() || !faq.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    setLoading(true);
    try {
      if (faqToEdit) {
        await updateFaq(faqToEdit.id, faq, token);
        toast.success("FAQ updated successfully!");
      } else {
        await createFaq(chatbotId, faq, token);
        toast.success("FAQ created successfully!");
      }
      setFaq({ question: "", answer: "" });
      onFaqUpdated();
      onClose();
    } catch (error) {
      toast.error(
        error.detail || `Failed to ${faqToEdit ? "update" : "create"} FAQ`
      );
    } finally {
      setLoading(false);
    }
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
      <Dialog
        open={open}
        onClose={loading ? () => {} : onClose}
        disableEscapeKeyDown={loading}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{faqToEdit ? "Edit faq" : "Add new faq"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Question"
            name="question"
            color="secondary"
            value={faq.question}
            onChange={handleChange}
            fullWidth
            required
            disabled={loading}
            data-tour="faq-question"
          />
          <TextField
            label="Answer"
            name="answer"
            color="secondary"
            value={faq.answer}
            onChange={handleChange}
            fullWidth
            required
            multiline
            rows={4}
            disabled={loading}
            data-tour="faq-answer"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{ color: "#8B5CF6" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ backgroundColor: "#8B5CF6" }}
            data-tour="faq-create"
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#5E33A8" }} />
            ) : faqToEdit ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FaqDialog;