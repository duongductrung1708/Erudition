import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Pagination,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const FAQList = ({ faqs, onEditFaq, onDeleteFaq }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const faqsPerPage = 5;

  const indexOfLastFaq = currentPage * faqsPerPage;
  const indexOfFirstFaq = indexOfLastFaq - faqsPerPage;
  const currentFaqs = faqs ? faqs.slice(indexOfFirstFaq, indexOfLastFaq) : [];

  const totalPages = faqs ? Math.ceil(faqs.length / faqsPerPage) : 1;

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  if (!faqs || faqs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No frequently asked questions yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {currentFaqs.map((faq) => (
        <Accordion key={faq.id} sx={{ mb: "1rem" }}>
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ flexGrow: 1 }}
            >
              <Typography variant="subtitle1">{faq.question}</Typography>
            </AccordionSummary>
            <Box sx={{ display: "flex", alignItems: "center", pr: 2 }}>
              <Tooltip title="Edit faq" placement="top">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFaq(faq);
                  }}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete faq" placement="top">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFaq(faq.id);
                  }}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              {faq.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Pagination Controls */}
      {faqs.length > faqsPerPage && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 3,
            pb: 2,
          }}
        >
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#8B5CF6",
              },
              "& .Mui-selected": {
                backgroundColor: "#8B5CF6",
                color: "#fff",
              },
              "& .MuiPaginationItem-ellipsis": {
                color: "#8B5CF6",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default FAQList;
