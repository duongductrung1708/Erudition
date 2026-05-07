import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  boxShadow: theme.shadows[3],
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

const PrivacyPolicy = () => {
  return (
    <>
      <title>Privacy policy | Erudition</title>
      <Box
        sx={{
          bgcolor: "grey.100",
          minHeight: "100vh",
          py: 6,
          overflow: "auto",
          height: "100vh",
        }}
      >
        <Container maxWidth="lg">
          {/* Header */}
          <Box textAlign="center" mb={6}>
            <Typography
              variant="h3"
              component="h1"
              fontWeight="bold"
              color="text.primary"
            >
              Privacy Policy
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" mt={2}>
              Last Updated: April 20, 2025
            </Typography>
          </Box>

          {/* Introduction */}
          <StyledPaper>
            <SectionHeader variant="h5">Introduction</SectionHeader>
            <Typography variant="body1" color="text.secondary">
              At Erudition, we are committed to protecting your privacy and
              personal data. This Privacy Policy explains how we collect, use,
              store, and protect your information when you use our services.
            </Typography>
          </StyledPaper>

          {/* Section 1: Information We Collect */}
          <StyledPaper>
            <SectionHeader variant="h5">
              1. Information We Collect
            </SectionHeader>
            <Typography variant="body1" color="text.secondary" paragraph>
              We may collect the following types of information:
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>a. User Information</strong>
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Name, email address, and login credentials" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Subscription or service package information" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Transaction and payment history" />
              </ListItem>
            </List>
            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>b. Usage Data</strong>
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Chat history with chatbots" />
              </ListItem>
              <ListItem>
                <ListItemText primary="User-generated content for chatbot training (documents, Q&A, etc.)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Token usage, access frequency, and user interaction behavior" />
              </ListItem>
            </List>
          </StyledPaper>

          {/* Section 2: How We Use Your Information */}
          <StyledPaper>
            <SectionHeader variant="h5">
              2. How We Use Your Information
            </SectionHeader>
            <Typography variant="body1" color="text.secondary" paragraph>
              We use your information to:
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Provide and maintain the Erudition service" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Improve chatbot performance and user experience" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Analyze system usage and generate reports" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Send important notifications and provide technical support" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Ensure system security and prevent violations of our Terms of Service" />
              </ListItem>
            </List>
          </StyledPaper>

          {/* Section 3: Sharing of Information */}
          <StyledPaper>
            <SectionHeader variant="h5">
              3. Sharing of Information
            </SectionHeader>
            <Typography variant="body1" color="text.secondary" paragraph>
              We do not share your personal data with third parties, except in
              the following situations:
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="With your explicit consent" />
              </ListItem>
              <ListItem>
                <ListItemText primary="To comply with legal obligations or official authorities" />
              </ListItem>
              <ListItem>
                <ListItemText primary="With third-party service providers (e.g., cloud storage, email services) – all of which are bound by strict confidentiality agreements" />
              </ListItem>
            </List>
          </StyledPaper>

          {/* Section 4: Data Storage & Security */}
          <StyledPaper>
            <SectionHeader variant="h5">
              4. Data Storage & Security
            </SectionHeader>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Your data is stored on secure servers with high-level protection" />
              </ListItem>
              <ListItem>
                <ListItemText primary="We use encryption, access control, and activity logging to safeguard your data" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Data is retained for as long as necessary to fulfill the intended purposes or legal obligations" />
              </ListItem>
            </List>
          </StyledPaper>

          {/* Section 5: Your Rights */}
          <StyledPaper>
            <SectionHeader variant="h5">5. Your Rights</SectionHeader>
            <Typography variant="body1" color="text.secondary" paragraph>
              You have the right to:
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Access, update, or delete your personal data" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Request a copy of your data (data portability)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Restrict or object to data processing" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Withdraw consent at any time" />
              </ListItem>
            </List>
            <Typography variant="body1" color="text.secondary">
              For requests, contact us at: support@erudition.ai
            </Typography>
          </StyledPaper>

          {/* Section 6: Third-Party Services */}
          <StyledPaper>
            <SectionHeader variant="h5">6. Third-Party Services</SectionHeader>
            <Typography variant="body1" color="text.secondary">
              This policy does not apply to third-party websites or services you
              may access through Erudition. Please review their privacy policies
              separately.
            </Typography>
          </StyledPaper>

          {/* Section 7: Policy Changes */}
          <StyledPaper>
            <SectionHeader variant="h5">7. Policy Changes</SectionHeader>
            <Typography variant="body1" color="text.secondary">
              We may update this Privacy Policy periodically. If there are
              significant changes, we will notify you via email or in-app
              messages.
            </Typography>
          </StyledPaper>

          {/* Section 8: Contact Us */}
          <StyledPaper>
            <SectionHeader variant="h5">8. Contact Us</SectionHeader>
            <Typography variant="body1" color="text.secondary">
              If you have any questions or concerns regarding your privacy, feel
              free to contact us:
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Email: dungpdhe172010@fpt.edu.vn" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Website: https://erudition.pcasys.tech/" />
              </ListItem>
            </List>
          </StyledPaper>
        </Container>
      </Box>
    </>
  );
};

export default PrivacyPolicy;
