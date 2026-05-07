import { memo } from "react";
import { Box, Drawer, Grid, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import SidebarNav from "./components/SidebarNav";
import ReportTabs from "./components/ReportTabs";

const ChatBotDetailsView = ({
  theme,
  isSidebarOpen,
  onOpenSidebar,
  onCloseSidebar,
  sidebarButtons,
  sidebarLoading,
  agentName,
  activeComponent,
  onBack,
  onSelectSidebarButton,
  mainContent,
  reportUi,
}) => {
  return (
    <>
      <Grid container sx={{ height: "100%", overflow: "hidden" }}>
        <Box
          sx={{
            position: "absolute",
            display: { xs: "block", sm: "none" },
            marginTop: { xs: "5rem" },
            marginLeft: "1rem",
            zIndex: 1000,
          }}
        >
          <IconButton
            onClick={onOpenSidebar}
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: 1,
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        <Grid
          item
          xs={12}
          sm={2}
          md={2}
          sx={{
            display: { xs: "none", sm: "block" },
            backgroundColor: "#f9f9f9",
          }}
        >
          <SidebarNav
            loading={sidebarLoading}
            agentName={agentName}
            activeComponent={activeComponent}
            buttons={sidebarButtons}
            onBack={onBack}
            onSelectComponent={onSelectSidebarButton}
          />
        </Grid>

        <Drawer
          anchor="left"
          open={isSidebarOpen}
          onClose={onCloseSidebar}
          sx={{
            "& .MuiDrawer-paper": {
              borderTopRightRadius: "20px",
              width: 240,
              boxShadow: "3px 0px 10px rgba(0,0,0,0.1)",
              backgroundColor: "#f9f9f9",
            },
          }}
        >
          <SidebarNav
            loading={sidebarLoading}
            agentName={agentName}
            activeComponent={activeComponent}
            buttons={sidebarButtons}
            onBack={onBack}
            onSelectComponent={onSelectSidebarButton}
          />
        </Drawer>

        <Grid
          item
          xs={12}
          sm={10}
          md={10}
          mt={8}
          sx={{
            borderLeft: "1px solid #e5e5e5",
            marginTop: { xs: 0, md: "64px", lg: "64px" },
            backgroundColor: "#fff",
          }}
        >
          {activeComponent === "agentAnalysis" ? (
            <Box sx={{ flex: 1, p: 3 }}>
              <ReportTabs {...reportUi} />
            </Box>
          ) : (
            mainContent
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default memo(ChatBotDetailsView);

