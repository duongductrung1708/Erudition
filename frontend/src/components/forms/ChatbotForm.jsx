import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  Slider,
  MenuItem,
  Button,
  Paper,
  Grid,
  Chip,
  InputAdornment,
  createTheme,
  ThemeProvider,
  Tooltip,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { create, update_chatbot } from "../../services/chatbot_api";
import { useAuth } from "../../hooks/AuthProvider";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { toast } from "react-toastify";
import { ArrowBackIos as ArrowBackIosIcon } from "@mui/icons-material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#8B5CF6",
      contrastText: "#4B5563",
    },
    background: {
      default: "#8B5CF6",
      paper: "#FFFFFF",
    },
  },
});

const customTooltipStyles = {
  sx: {
    bgcolor: "#F1E9FF",
    color: "black",
    paddingX: 1.5,
    paddingY: 0.8,
    borderRadius: 1,
    boxShadow: 2,
  },
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 800,
  margin: "0px auto",
  backgroundColor: "#FFFFFF",
  border: "1px solid #F5F3FF",
  borderRadius: "8px",
}));

const GuardRailSuggestions = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const SuggestionChip = styled(Chip)(({ theme }) => ({
  backgroundColor: "#F5F3FF",
  "&:hover": {
    backgroundColor: "#E9D5FF",
  },
}));

const ChatbotForm = ({ action, setLoading, onRefresh, agentDetails }) => {
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    description: "",
    temperature: 0,
    guard_rails: [],
    quota_limit: 1,
    window_type: "day",
    is_disabled: true,
  });
  const [currentChatbot, setCurrentChatbot] = useState(null);
  const [customGuardRail, setCustomGuardRail] = useState("");
  const [errors, setErrors] = useState({});
  const nav = useNavigate();
  const { chatbotId } = useParams();
  const { user } = useAuth();
  const { refreshChatbots } = useOutletContext();

  useEffect(() => {
    if (agentDetails) {
      const items = Array.isArray(agentDetails.guard_rails)
        ? agentDetails.guard_rails
        : typeof agentDetails.guard_rails === "string"
        ? agentDetails.guard_rails.split("<SEP>").filter(Boolean)
        : [];
      setCurrentChatbot({
        ...agentDetails,
        guard_rails: items,
      });
      setFormData({
        ...agentDetails,
        guard_rails: items,
        is_disabled: agentDetails.is_disabled || false,
        name: agentDetails.name?.trim() || "",
        organization: agentDetails.organization?.trim() || "",
        description: agentDetails.description?.trim() || "",
      });
      setLoading(false);
    }
  }, [agentDetails, setLoading]);

  const guardRailsSuggestions = [
    "No harmful content",
    "No inappropriate language",
    "Keep responses factual",
    "Avoid political opinions",
    "No financial advice",
    "No medical advice",
    "Family-friendly content only",
    "No personal data collection",
    "No promotion of illegal activities",
  ];

  const windowTypeOptions = [
    { value: "minute", label: "Per Minute" },
    { value: "hour", label: "Per Hour" },
    { value: "day", label: "Per Day" },
    { value: "month", label: "Per Month" },
  ];

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTemperatureChange = (event, newValue) => {
    setFormData({
      ...formData,
      temperature: newValue,
    });
  };

  const handleGuardRailDelete = (railToDelete) => {
    setFormData({
      ...formData,
      guard_rails: formData.guard_rails.filter((rail) => rail !== railToDelete),
    });
  };

  const handleGuardRailAdd = (rail) => {
    const trimmedRail = rail.trim();
    if (trimmedRail && !formData.guard_rails.includes(trimmedRail)) {
      setFormData({
        ...formData,
        guard_rails: [...formData.guard_rails, trimmedRail],
      });
      return true;
    }
    return false;
  };

  const handleSuggestionClick = (suggestion) => {
    handleGuardRailAdd(suggestion);
  };

  const handleCustomGuardRailChange = (event) => {
    setCustomGuardRail(event.target.value);
    if (errors.customGuardRail) {
      setErrors((prev) => ({ ...prev, customGuardRail: "" }));
    }
  };

  const handleCustomGuardRailAdd = () => {
    const trimmedRail = customGuardRail.trim();
    if (!trimmedRail) {
      setErrors((prev) => ({
        ...prev,
        customGuardRail: "Guardrail cannot be empty or contain only whitespace",
      }));
      toast.error("Guardrail cannot be empty or contain only whitespace");
      return;
    }
    if (handleGuardRailAdd(trimmedRail)) {
      setCustomGuardRail("");
    } else {
      setErrors((prev) => ({
        ...prev,
        customGuardRail: "This guardrail already exists",
      }));
      toast.error("This guardrail already exists");
    }
  };

  const handleCustomGuardRailKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCustomGuardRailAdd();
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedOrganization = formData.organization.trim();
    const trimmedDescription = formData.description.trim();

    if (!trimmedName) {
      tempErrors.name = "Name cannot be empty or contain only whitespace";
    }
    if (!trimmedOrganization) {
      tempErrors.organization =
        "Organization cannot be empty or contain only whitespace";
    }
    if (!trimmedDescription) {
      tempErrors.description =
        "Description cannot be empty or contain only whitespace";
    }
    if (formData.quota_limit <= 0) {
      tempErrors.quota_limit = "Quota limit must be greater than 0";
    }

    setFormData((prev) => ({
      ...prev,
      name: trimmedName,
      organization: trimmedOrganization,
      description: trimmedDescription,
    }));

    setErrors(tempErrors);

    if (tempErrors.name) toast.error(tempErrors.name);
    if (tempErrors.organization) toast.error(tempErrors.organization);
    if (tempErrors.description) toast.error(tempErrors.description);
    if (tempErrors.quota_limit) toast.error(tempErrors.quota_limit);

    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    if (validateForm()) {
      const token = user.accessToken;
      if (!token) {
        toast.error("Access token is missing. Please log in again.");
        setLoading(false);
        return;
      }
      console.log("Form submitted with data:", formData);
      if (action === "add") {
        create(formData, token)
          .then((res) => {
            console.log(res);
            toast.success("Chatbot created successfully!");
            refreshChatbots();
            nav("/workspace");
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error creating chatbot:", error);
            toast.error(
              "Failed to create chatbot: " +
                (error.response?.data?.detail || error.message)
            );
            setLoading(false);
          });
      } else if (action === "edit") {
        update_chatbot(chatbotId, formData, token)
          .then((res) => {
            console.log(res);
            toast.success("Chatbot updated successfully!");
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error updating chatbot:", error);
            toast.error(
              "Failed to update chatbot: " +
                (error.response?.data?.detail || error.message)
            );
            setLoading(false);
          })
          .finally(() => {
            onRefresh();
          });
      }
    } else {
      setLoading(false);
    }
  };

  const temperatureValueText = (value) => {
    return `${value.toFixed(2)}`;
  };

  const handleResetForm = () => {
    if (currentChatbot) {
      console.log(currentChatbot);
      const guardRails = Array.isArray(currentChatbot.guard_rails)
        ? currentChatbot.guard_rails
        : typeof currentChatbot.guard_rails === "string"
        ? currentChatbot.guard_rails.split("<SEP>").filter(Boolean)
        : [];
      setFormData({
        name: currentChatbot.name?.trim() || "",
        organization: currentChatbot.organization?.trim() || "",
        description: currentChatbot.description?.trim() || "",
        temperature: currentChatbot.temperature || 0,
        guard_rails: guardRails,
        quota_limit: currentChatbot.quota_limit || 1,
        window_type: currentChatbot.window_type || "day",
        is_disabled: currentChatbot.is_disabled || false,
      });
    } else {
      setFormData({
        name: "",
        organization: "",
        description: "",
        temperature: 0.0,
        guard_rails: [],
        quota_limit: 100,
        window_type: "day",
        is_disabled: true,
      });
    }
    setErrors({});
    setCustomGuardRail("");
  };

  if (!agentDetails && chatbotId !== undefined) {
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
    <ThemeProvider theme={theme}>
      <StyledPaper elevation={3}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <IconButton
            sx={{
              color: "#4B5563",
              borderRadius: "10px",
              "&:hover": { backgroundColor: "#f1f1f1" },
            }}
            onClick={() => nav("/workspace")}
          >
            <ArrowBackIosIcon />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ color: "#4B5563" }}>
            Chatbot configuration
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Chatbot name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                error={!!errors.organization}
                helperText={errors.organization}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                required
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom>
                Temperature:{" "}
                <Box component="span">{formData.temperature.toFixed(2)}</Box>
                <Tooltip
                  title={
                    <React.Fragment>
                      Temperature in chatbot configuration is a parameter that
                      controls the level of randomness and creativity in
                      responses based on your description.
                      <br />
                      Low values (0): Responses are more deterministic,
                      accurate, and consistent.
                      <br />
                      Medium values (0 - 0.5): A balance between accuracy and
                      creativity.
                      <br />
                      High values (0.5 - 1): Responses become more random,
                      creative, and diverse but may be less accurate.
                    </React.Fragment>
                  }
                  placement="top"
                  componentsProps={{ tooltip: customTooltipStyles }}
                >
                  <IconButton>
                    <InfoOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#7844D3" }}
                    />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Slider
                name="temperature"
                value={formData.temperature}
                onChange={handleTemperatureChange}
                getAriaValueText={temperatureValueText}
                step={0.01}
                marks={[
                  { value: 0, label: "0" },
                  { value: 0.5, label: "0.5" },
                  { value: 1, label: "1" },
                ]}
                min={0}
                max={1}
                valueLabelDisplay="auto"
                sx={{
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#8B5CF6",
                  },
                  "& .MuiSlider-track": {
                    backgroundColor: "#8B5CF6",
                  },
                  "& .MuiSlider-rail": {
                    backgroundColor: "#DDD6FE",
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Lower values generate more consistent outputs, higher values
                more creative
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom variant="subtitle1">
                Guardrails{" "}
                <Tooltip
                  title="Guardrails are predefined rules or constraints that guide behavior, ensuring systems operate safely, ethically, and within desired boundaries."
                  placement="top"
                  componentsProps={{ tooltip: customTooltipStyles }}
                >
                  <IconButton>
                    <InfoOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#7844D3" }}
                    />
                  </IconButton>
                </Tooltip>
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {Array.isArray(formData.guard_rails) &&
                formData.guard_rails.length > 0 ? (
                  formData.guard_rails.map((rail) => (
                    <Chip
                      key={rail}
                      label={rail}
                      onDelete={() => handleGuardRailDelete(rail)}
                      sx={{
                        backgroundColor: "#EDE9FE",
                        borderColor: "#DDD6FE",
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No guardrails added
                  </Typography>
                )}
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                label="Add custom guardrail"
                value={customGuardRail}
                onChange={handleCustomGuardRailChange}
                onKeyPress={handleCustomGuardRailKeyPress}
                variant="outlined"
                error={!!errors.customGuardRail}
                helperText={
                  errors.customGuardRail ||
                  "Press enter or click 'Add Guardrail' to submit"
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      sx={{ alignSelf: "flex-end", mb: 2 }}
                    >
                      <Button
                        onClick={handleCustomGuardRailAdd}
                        variant="contained"
                        size="medium"
                        sx={{
                          color: "white",
                          borderRadius: "8px",
                          textTransform: "none",
                          px: 3,
                          py: 1,
                          boxShadow: "none",
                        }}
                        disabled={!customGuardRail.trim()}
                      >
                        ADD
                      </Button>
                    </InputAdornment>
                  ),
                  sx: {
                    alignItems: "flex-start",
                    paddingRight: "14px",
                  },
                }}
                margin="normal"
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Suggested guardrails:
              </Typography>
              <GuardRailSuggestions>
                {guardRailsSuggestions
                  .filter(
                    (suggestion) => !formData.guard_rails.includes(suggestion)
                  )
                  .map((suggestion) => (
                    <SuggestionChip
                      key={suggestion}
                      label={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      clickable
                    />
                  ))}
              </GuardRailSuggestions>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quota limit"
                name="quota_limit"
                type="number"
                value={formData.quota_limit}
                onChange={handleChange}
                error={!!errors.quota_limit}
                helperText={
                  errors.quota_limit || "Maximum number of requests allowed"
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">requests</InputAdornment>
                  ),
                }}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Time window"
                name="window_type"
                value={formData.window_type}
                onChange={handleChange}
                margin="normal"
                helperText="Time period for quota limit"
              >
                {windowTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_disabled}
                    onChange={handleChange}
                    name="is_disabled"
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography>Disable Chatbot</Typography>
                    <Tooltip
                      title="When enabled, the chatbot will be disabled and cannot be used for conversations."
                      placement="top"
                      componentsProps={{ tooltip: customTooltipStyles }}
                    >
                      <IconButton>
                        <InfoOutlinedIcon
                          fontSize="small"
                          sx={{ color: "#7844D3" }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleResetForm}
                  sx={{
                    borderColor: "#8B5CF6",
                    color: "#8B5CF6",
                    "&:hover": {
                      borderColor: "#7C3AED",
                      backgroundColor: "#F5F3FF",
                    },
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: "#8B5CF6",
                    "&:hover": { backgroundColor: "#7C3AED" },
                    color: "white",
                  }}
                >
                  Save chatbot
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </StyledPaper>
    </ThemeProvider>
  );
};

export default ChatbotForm;
