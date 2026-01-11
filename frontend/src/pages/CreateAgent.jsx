import React from "react";
import { Box, CircularProgress } from "@mui/material";
import ChatbotForm from "../components/forms/ChatbotForm";

const CreateAgent = () => {
  const [loading, setLoading] = React.useState(false);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#7844D3" }} />
      </Box>
    );
  }
  return (
    <>
      <title>Erudition | Create agent</title>
      <Box
        display={"flex"}
        flexDirection={"column"}
        width={"100%"}
        height={"112vh"}
        mt={"5rem"}
        mb={"10rem"}
      >
        <ChatbotForm action={"add"} setLoading={setLoading} />
      </Box>
    </>
  );
};

export default CreateAgent;
