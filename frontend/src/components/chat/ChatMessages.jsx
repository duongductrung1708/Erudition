import React, { memo, useMemo } from "react";
import { Box, Stack, Tooltip, Paper, Typography } from "@mui/material";
import Markdown from "markdown-to-jsx";

const TypingDots = memo(() => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      "& span": {
        width: 6,
        height: 6,
        backgroundColor: "#888",
        borderRadius: "50%",
        display: "inline-block",
        marginRight: "5px",
        animation: "blink 1.4s infinite both",
      },
      "& span:nth-of-type(2)": { animationDelay: "0.2s" },
      "& span:nth-of-type(3)": { animationDelay: "0.4s" },
      "& span:nth-of-type(4)": { animationDelay: "0.6s" },
      "& span:nth-of-type(5)": { animationDelay: "0.8s" },
      "@keyframes blink": {
        "0%, 80%, 100%": { opacity: 0 },
        "40%": { opacity: 1 },
      },
    }}
  >
    <span />
    <span />
    <span />
    <span />
    <span />
  </Box>
));

const StreamingCursor = memo(() => (
  <Box
    component="span"
    sx={{
      display: "inline-block",
      width: "2px",
      height: "1em",
      backgroundColor: "#000",
      marginLeft: "2px",
      animation: "cursor-blink 1s infinite",
      verticalAlign: "middle",
      "@keyframes cursor-blink": {
        "0%, 100%": { opacity: 1 },
        "50%": { opacity: 0 },
      },
    }}
  />
));

const ChatMessageItem = ({
  msg,
  idx,
  chatHistoryLength,
  formatDateTime,
  renderActions,
}) => {
  return (
    <Stack
      key={msg.id || idx}
      direction={msg.sender === "user" ? "row-reverse" : "row"}
      spacing={2}
      mb={2}
    >
      <Box sx={{ position: "relative", maxWidth: "70%" }}>
        <Tooltip title={formatDateTime(msg.date_time)} placement="top" arrow>
          <Paper
            sx={{
              px: 2,
              py: 1.5,
              bgcolor:
                msg.sender === "user"
                  ? "rgba(120, 68, 211, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
              boxShadow: "none",
              borderRadius: "12px",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {msg.text === "" && msg.isStreaming ? (
              <TypingDots />
            ) : msg.isStreaming ? (
              <Box>
                <Markdown>{msg.text}</Markdown>
                <StreamingCursor />
              </Box>
            ) : (
              <Markdown>{msg.text}</Markdown>
            )}
          </Paper>
        </Tooltip>

        {renderActions?.(msg, idx, chatHistoryLength)}
      </Box>
    </Stack>
  );
};

const areEqual = (prev, next) => {
  const p = prev.msg;
  const n = next.msg;
  return (
    p.id === n.id &&
    p.text === n.text &&
    p.sender === n.sender &&
    p.isStreaming === n.isStreaming &&
    p.is_favorite === n.is_favorite &&
    p.date_time === n.date_time &&
    prev.idx === next.idx &&
    prev.chatHistoryLength === next.chatHistoryLength
  );
};

const MemoChatMessageItem = memo(ChatMessageItem, areEqual);

const ChatMessages = ({
  chatHistory,
  formatDateTime,
  renderActions,
  messagesEndRef,
  emptyState,
  maxMessages = 300,
}) => {
  if (!chatHistory?.length) {
    return emptyState;
  }

  const { visibleMessages, hiddenCount } = useMemo(() => {
    const total = chatHistory.length;
    const start = total > maxMessages ? total - maxMessages : 0;
    return {
      visibleMessages: chatHistory.slice(start),
      hiddenCount: start,
    };
  }, [chatHistory, maxMessages]);

  return (
    <>
      {hiddenCount > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing last {visibleMessages.length} messages (hidden: {hiddenCount})
          </Typography>
        </Box>
      )}

      {visibleMessages.map((msg, idx) => (
        <MemoChatMessageItem
          key={msg.id || `${hiddenCount}-${idx}`}
          msg={msg}
          idx={idx}
          chatHistoryLength={visibleMessages.length}
          formatDateTime={formatDateTime}
          renderActions={renderActions}
        />
      ))}
      <div ref={messagesEndRef} />
    </>
  );
};

export default memo(ChatMessages);

