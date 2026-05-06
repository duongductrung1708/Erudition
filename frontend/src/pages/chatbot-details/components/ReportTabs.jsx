import React, { memo } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import DateRangeFilter from "./DateRangeFilter";

const ReportTabs = ({
  isMobile,
  activeReportTab,
  reportTabs,
  currentTabIndex,
  onPrevTab,
  onNextTab,
  onTabChange,
  dateRange,
  onDateRangeChange,
  reportLoading,
  content,
}) => {
  return (
    <Box sx={{ width: "100%" }}>
      {isMobile ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
            pb: 1,
            mt: "6rem",
          }}
        >
          <IconButton
            onClick={onPrevTab}
            disabled={currentTabIndex === 0}
            sx={{ color: currentTabIndex === 0 ? "text.disabled" : "#5E33A8" }}
          >
            <ArrowLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            {reportTabs[currentTabIndex]?.label}
          </Typography>
          <IconButton
            onClick={onNextTab}
            disabled={currentTabIndex === reportTabs.length - 1}
            sx={{
              color:
                currentTabIndex === reportTabs.length - 1
                  ? "text.disabled"
                  : "#5E33A8",
            }}
          >
            <ArrowRightIcon />
          </IconButton>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Tabs
            value={activeReportTab}
            onChange={onTabChange}
            aria-label="report tabs"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              mb: 3,
              "& .MuiTabs-indicator": { backgroundColor: "#5E33A8" },
            }}
          >
            {reportTabs.map((tab) => (
              <Tab
                key={tab.value}
                sx={{
                  "&.Mui-selected": { color: "#5E33A8", fontWeight: "bold" },
                  "&:hover": { backgroundColor: "rgba(216, 202, 242, 0.2)" },
                  textTransform: "none",
                  fontSize: "0.875rem",
                }}
                label={tab.label}
                value={tab.value}
              />
            ))}
          </Tabs>
          <DateRangeFilter dateRange={dateRange} onChange={onDateRangeChange} />
        </Box>
      )}

      {reportLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <CircularProgress sx={{ color: "#7844D3" }} />
          <Typography sx={{ ml: 2 }}>Loading data...</Typography>
        </Box>
      ) : (
        content
      )}
    </Box>
  );
};

export default memo(ReportTabs);

