import { Box } from "@mui/material";
import ChatbotForm from "../components/forms/ChatbotForm";

const AgentEdit = ({ setLoading, onRefresh, agentDetails }) => {
  return (
    <>
      <title>Erudition | Agent edit</title>
      <Box
        display={"flex"}
        flexDirection={"column"}
        width={"100%"}
        height={"100vh"}
        pt={{ xs: "4rem", md: "0" }}
        pb={"10rem"}
        px={3}
        overflow={"auto"}
      >
        <ChatbotForm
          action={"edit"}
          setLoading={setLoading}
          onRefresh={onRefresh}
          agentDetails={agentDetails}
        />
      </Box>
    </>
  );
};

export default AgentEdit;
