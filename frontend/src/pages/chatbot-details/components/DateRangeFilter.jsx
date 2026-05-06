import React, { memo, useCallback } from "react";
import { Box, Typography } from "@mui/material";

const DateRangeFilter = ({ dateRange, onChange }) => {
  const handleStartDateChange = useCallback(
    (e) => {
      onChange({ ...dateRange, startDate: new Date(e.target.value) });
    },
    [dateRange, onChange]
  );

  const handleEndDateChange = useCallback(
    (e) => {
      onChange({ ...dateRange, endDate: new Date(e.target.value) });
    },
    [dateRange, onChange]
  );

  const formatDateForInput = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        mb: 3,
        alignItems: "center",
        flexWrap: "wrap",
        p: 2,
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body1" sx={{ minWidth: 20 }}>
          From:
        </Typography>
        <input
          type="date"
          value={formatDateForInput(dateRange.startDate)}
          onChange={handleStartDateChange}
          max={formatDateForInput(dateRange.endDate)}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontSize: "14px",
            fontFamily: "inherit",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body1" sx={{ minWidth: 20 }}>
          To:
        </Typography>
        <input
          type="date"
          value={formatDateForInput(dateRange.endDate)}
          onChange={handleEndDateChange}
          min={formatDateForInput(dateRange.startDate)}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontSize: "14px",
            fontFamily: "inherit",
          }}
        />
      </Box>
    </Box>
  );
};

export default memo(DateRangeFilter);

