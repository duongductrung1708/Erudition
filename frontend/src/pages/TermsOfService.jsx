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

const TermsOfService = () => {
  return (
    <>
      <title>Terms of service | Erudition</title>
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
              Terms of Service
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" mt={2}>
              Effective Date: March 29, 2025 | Last Updated: March 29, 2025
            </Typography>
          </Box>

          {/* Introduction */}
          <StyledPaper>
            <SectionHeader variant="h5">Welcome to Erudition!</SectionHeader>
            <Typography variant="body1" color="text.secondary" paragraph>
              By using our services, you agree to these Terms of Service
              (&quot;Terms&quot;) and our related policies, including the Privacy Policy
              and Acceptable Use Policy. These Terms are designed to ensure a
              safe, respectful, and legally compliant environment for all users
              and developers.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              If you do not agree with these Terms, please do not use our
              services.
            </Typography>
          </StyledPaper>

          {/* Section 1: Your Agreement to These Terms */}
          <StyledPaper>
            <SectionHeader variant="h5">
              1. Your Agreement to These Terms
            </SectionHeader>
            <Typography variant="body1" color="text.secondary">
              By accessing or using Erudition, you agree to comply with these
              Terms. If you do not agree, do not use our services.
            </Typography>
          </StyledPaper>

          {/* Section 2: Who These Terms Apply To */}
          <StyledPaper>
            <SectionHeader variant="h5">
              2. Who These Terms Apply To
            </SectionHeader>
            <Typography variant="body1" color="text.secondary" paragraph>
              These Terms apply to all users of Erudition, including:
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="General users who interact with chatbots" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Developers who build applications or chatbots using Erudition" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Organizations integrating Erudition into their workflows" />
              </ListItem>
            </List>
            <Typography variant="body1" color="text.secondary">
              We have general policies that apply to everyone and additional
              policies specific to developers.
            </Typography>
          </StyledPaper>

          {/* Section 3: Acceptable Use */}
          <StyledPaper>
            <SectionHeader variant="h5">3. Acceptable Use</SectionHeader>
            <Typography variant="body1" color="text.secondary" paragraph>
              We want you to use our tools safely and responsibly. You may only
              use our services if you agree to the following:
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>a. Follow the Law</strong>
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Do not violate applicable laws or regulations" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not infringe on others’ privacy or rights" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not engage in or promote illegal activities, including child exploitation, drug trafficking, or harmful substances" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not use our services to create, process, or distribute personal data unlawfully" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not facilitate spyware, unauthorized surveillance, or interception of communications" />
              </ListItem>
            </List>

            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>b. Prevent Harm</strong>
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Do not use Erudition to harm yourself or others" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not promote self-harm, suicide, violence, or weapon development" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not engage in activities that compromise system or service security" />
              </ListItem>
            </List>

            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>c. Avoid Misuse of Outputs</strong>
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Do not share outputs to mislead, defraud, spam, bully, harass, or spread hate" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not promote child exploitation or glorify violence or suffering" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not provide legal, financial, or medical advice without professional oversight and proper disclaimers" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not use outputs to support gambling, payday loans, or high-risk decision-making without safeguards" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not engage in political campaigning or targeted demographic manipulation" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not interfere with democratic processes or misrepresent voting eligibility" />
              </ListItem>
            </List>

            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>d. Be Honest and Respectful</strong>
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Do not impersonate individuals or organizations without permission" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not spread misinformation or fake interactions (e.g., reviews or testimonials)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not use Erudition for academic dishonesty" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not create services targeting children under 13" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Do not exploit Erudition to mislead about political, territorial, or sovereign matters" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Respect the Erudition team and our platform guidelines" />
              </ListItem>
            </List>
          </StyledPaper>

          {/* Section 4: Enforcement */}
          <StyledPaper>
            <SectionHeader variant="h5">4. Enforcement</SectionHeader>
            <Typography variant="body1" color="text.secondary" paragraph>
              We use a combination of automated systems, human review, and user
              reports to detect potential policy violations. If your chatbot or
              account violates these Terms, we may:
            </Typography>
            <List sx={{ pl: 4 }}>
              <ListItem>
                <ListItemText primary="Issue warnings" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Restrict access" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Suspend or terminate accounts or chatbots" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Report illegal activities to authorities if necessary" />
              </ListItem>
            </List>
          </StyledPaper>

          {/* Section 5: Policy Development and Feedback */}
          <StyledPaper>
            <SectionHeader variant="h5">
              5. Policy Development and Feedback
            </SectionHeader>
            <Typography variant="body1" color="text.secondary">
              We are continuously learning from real-world usage to build safer
              AI systems. As such, our policies may evolve over time to reflect
              new risks or misuse trends.
            </Typography>
          </StyledPaper>

          {/* Section 6: Modifications to These Terms */}
          <StyledPaper>
            <SectionHeader variant="h5">
              6. Modifications to These Terms
            </SectionHeader>
            <Typography variant="body1" color="text.secondary">
              We may update these Terms from time to time. When we make material
              changes, we will notify you by updating the effective date and,
              when appropriate, sending a notice through the platform or via
              email.
            </Typography>
          </StyledPaper>

          {/* Section 7: Contact Us */}
          <StyledPaper>
            <SectionHeader variant="h5">7. Contact Us</SectionHeader>
            <Typography variant="body1" color="text.secondary">
              If you have any questions or need to report a violation, please
              contact us:
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

          {/* Changelog */}
          <StyledPaper>
            <SectionHeader variant="h5">Changelog</SectionHeader>
            <Typography variant="body1" color="text.secondary">
              <strong>2025-03-29:</strong> Updated for improved clarity and to
              include service-specific guidance.
            </Typography>
          </StyledPaper>
        </Container>
      </Box>
    </>
  );
};

export default TermsOfService;
