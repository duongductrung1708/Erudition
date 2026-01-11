import { CheckCircle } from "@mui/icons-material";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Paper,
  CardMedia,
  Card,
} from "@mui/material";
import Navbar from "../components/Navbar";
import erudition from "../assets/images/erudition.png";
import erudition2 from "../assets/images/erudition2.png";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CircleIcon from "@mui/icons-material/Circle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "../styles/HomePage.css";
import Footer from "../components/Footer";

const features = [
  {
    title: "AI Powered Interactions",
    image:
      "https://storage.googleapis.com/studio-design-asset-files/projects/Jgqe4G1kOk/s-512x512_webp_afaf6b28-03db-41d9-b795-379c51206ded.webp",
  },
  {
    title: "Data Analysis",
    image:
      "https://storage.googleapis.com/studio-design-asset-files/projects/Jgqe4G1kOk/s-512x512_webp_afaf6b28-03db-41d9-b795-379c51206ded.webp",
  },
  {
    title: "Knowledge Training",
    image:
      "https://storage.googleapis.com/studio-design-asset-files/projects/Jgqe4G1kOk/s-512x512_webp_afaf6b28-03db-41d9-b795-379c51206ded.webp",
  },
];

export default function HomePage() {
  return (
    <>
      <title>Erudition - Home</title>
      <Box sx={{ overflowY: "auto", height: "100vh", overflowX: "hidden" }}>
        <Navbar />
        <Container
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minWidth: "80%",
            minHeight: "100vh",
            px: { xs: 2, md: 4, marginTop: "4rem" },
          }}
        >
          <Grid container spacing={6} alignItems="center" mt={{ xs: 4, md: 0 }}>
            <Grid item xs={12} md={6}>
              <Typography
                fontSize={{ xs: "1.5rem", md: "3rem" }}
                fontWeight="bold"
                gutterBottom
                textAlign={{ xs: "center", md: "left" }}
              >
                Enhance your customer experience with AI chatbot
              </Typography>
              <Typography
                variant="h7"
                color="textSecondary"
                sx={{
                  marginBottom: "1rem",
                  textAlign: { xs: "center", md: "left" },
                }}
              >
                Build a ChatGPT for your business. Trained with your website
                content and answer your visitors' questions instantly.
              </Typography>

              <Grid
                container
                spacing={2}
                justifyContent={{
                  md: "center",
                  lg: "flex-start",
                  marginTop: "1rem",
                }}
              >
                <Feature title="Easy train and deploy" />
                <Feature title="No coding required" />
                <Feature title="Cancel anytime" />
              </Grid>

              <Box
                sx={{
                  mt: 4,
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  href="/login"
                  target="_blank"
                  sx={{
                    bgcolor: "#2E2E2E",
                    color: "white",
                    width: "100%",
                    height: "4rem",
                    fontWeight: "bold",
                    "&:hover": { bgcolor: "black" },
                  }}
                >
                  Get Started <ArrowForwardIcon />
                </Button>
              </Box>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <img
                src={erudition}
                alt="Erudition AI"
                loading="lazy"
                style={{ maxWidth: "80%", height: "auto" }}
              />
            </Grid>
          </Grid>
        </Container>

        <Container sx={{ mt: 8, minHeight: "100vh", minWidth: "80%" }}>
          <Typography
            fontSize={{ xs: "1.5rem", md: "3rem" }}
            fontWeight="bold"
            textAlign="center"
            gutterBottom
            marginBottom="4rem"
            sx={{
              background: "linear-gradient(90deg, #9933ff 0%, #ff99cc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Build a chatbot that your customers love
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 5, textAlign: "center", boxShadow: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  AI Chatbot that available for conversation 24/7
                </Typography>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  sx={{ marginTop: "2rem" }}
                >
                  Use the most advanced LLM to build friendly artificial
                  intelligence (AI) powered chatbots that understand and respond
                  to your customers’ needs.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 5, textAlign: "center", boxShadow: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Boost user satisfaction rate with no overhead
                </Typography>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  sx={{ marginTop: "2rem" }}
                >
                  Increase 63.5% of user satisfaction rate with almost no
                  effort. Bots answer common questions quickly and accurately.
                  Leave no one behind.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 5, textAlign: "center", boxShadow: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Instant answer accurately based on your own data
                </Typography>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  sx={{ marginTop: "2rem" }}
                >
                  Reduce 90% of repetitive simple questions from your customers.
                  Save your time and cost. Improve your website customer
                  experience.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* YouTube Video Section */}
          <Box sx={{ mt: 8, display: "flex", justifyContent: "center" }}>
            <iframe
              width="90%"
              height="500"
              src="https://www.youtube.com/embed/ZZ2QUCePgYw?si=hRZMSJBhwiPzrrKZ"
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Box>
        </Container>

        <Container
          sx={{ mt: 8, minHeight: "70vh", marginTop: "7rem", minWidth: "80%" }}
        >
          <Grid
            container
            spacing={6}
            alignItems="center"
            sx={{ minWidth: "100%" }}
          >
            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  alignItems: "center",
                  textTransform: "uppercase",
                  display: "inline-block",
                  bgcolor: "#B88CFF",
                  color: "#E3D2FF",
                  borderRadius: "10px",
                  padding: "10px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                }}
              >
                <CircleIcon sx={{ fontSize: "small", marginRight: "0.3rem" }} />
                Succeed
              </Typography>
              <Typography
                fontSize={{ xs: "1rem", md: "2.5rem" }}
                fontWeight="bold"
                gutterBottom
                textAlign={{ xs: "center", md: "left" }}
              >
                Easy to analyze and track how your Agent performs
              </Typography>
              <Typography
                variant="h7"
                color="textSecondary"
                sx={{ mb: 4, textAlign: { xs: "center", md: "left" } }}
              >
                Erudition offers Insightful statistics tool for you to track how
                your agent performs in conversations with the visitors. You can
                track your website data with multiple charts and graphs. And
                quality check down to every single conversation and make
                corrections to improve your AI.
              </Typography>

              <Box
                sx={{
                  mt: 4,
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  href="/login"
                  target="_blank"
                  sx={{
                    borderColor: "#E3D2FF",
                    bgcolor: "#E3D2FF",
                    color: "black",
                    width: { xs: "100%", sm: "25%" },
                    height: "3rem",
                    fontWeight: "bold",
                    "&:hover": {
                      borderColor: "#B88CFF",
                      bgcolor: "#B88CFF",
                      color: "black",
                    },
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <img
                src={erudition2}
                alt="Erudition AI"
                loading="lazy"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </Grid>
          </Grid>
        </Container>

        <Container sx={{ mt: 8, minHeight: "100vh", minWidth: "80%" }}>
          <Typography
            fontSize={{ xs: "1.5rem", md: "3rem" }}
            fontWeight="bold"
            textAlign="center"
            gutterBottom
            sx={{
              background: "linear-gradient(90deg, #9933ff 0%, #ff99cc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Automate insightful conversations for your brand
          </Typography>

          <Grid
            container
            spacing={4}
            justifyContent="center"
            sx={{
              mt: 8,
              minHeight: "50vh",
              minWidth: "80%",
              position: "relative",
              backgroundImage: `url("https://storage.googleapis.com/studio-design-asset-files/projects/Jgqe4G1kOk/s-1390x621_v-fms_webp_cc385d61-7206-4453-a0c9-1510ed13a478.webp")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              borderRadius: "7rem",
              p: { xs: 3, md: 5 },
            }}
          >
            {/* Left Side Content */}
            <Grid item xs={12} md={5} textAlign="center" sx={{ mt: 7 }}>
              <Typography
                fontSize={{ xs: "1rem", md: "2.5rem" }}
                fontWeight="bold"
                gutterBottom
                color="white"
              >
                Ready to try Erudition?
              </Typography>
              <Typography fontSize="1rem" gutterBottom color="white">
                Find out how an AI agent can help your business in just a few
                minutes.
              </Typography>

              {/* Buttons */}
              <Box
                mt={3}
                display="flex"
                flexDirection={{ xs: "column", sm: "row" }}
                justifyContent="center"
                gap={2}
              >
                <Button
                  variant="contained"
                  target="_blank"
                  href="/login"
                  sx={{
                    bgcolor: "white",
                    color: "#BF98FF",
                    width: { xs: "100%", sm: "35%" },
                    height: "3rem",
                    fontWeight: "bold",
                    "&:hover": { bgcolor: "#C9A9FF" },
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  target="_blank"
                  href="/login"
                  sx={{
                    border: "2px solid white",
                    bgcolor: "transparent",
                    color: "white",
                    width: { xs: "100%", sm: "35%" },
                    height: "3rem",
                    fontWeight: "bold",
                    "&:hover": {
                      borderColor: "white",
                      bgcolor: "#D4BAFF",
                      color: "white",
                    },
                  }}
                >
                  Book a Demo
                </Button>
              </Box>

              {/* Features */}
              <Box
                mt={4}
                display="flex"
                flexWrap="wrap"
                gap={2}
                justifyContent="center"
              >
                {["Custom AI Agent", "Enterprise RAG", "Cancel anytime"].map(
                  (text, index) => (
                    <Box
                      key={index}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      <CheckCircleIcon sx={{ color: "white" }} />
                      <Typography fontSize="0.7rem" color="white">
                        {text}
                      </Typography>
                    </Box>
                  )
                )}
              </Box>
            </Grid>

            {/* Right Side Image (Hidden on Mobile) */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: { xs: "none", md: "block" } }}
            >
              <Box
                component="img"
                src="https://storage.googleapis.com/studio-design-asset-files/projects/Jgqe4G1kOk/s-2400x1601_v-frms_webp_99b2972e-5180-4de8-856a-3fcde45ed6f7_middle.webp"
                alt="Erudition Preview"
                sx={{
                  position: "absolute",
                  width: "50%",
                  height: "80%",
                  right: "-25px",
                  borderRadius: "25rem 20rem 20rem 2rem",
                }}
              />

              {/* Statistics (Adjusted for Responsiveness) */}
              <Box
                mt={6}
                display={{ xs: "none", md: "flex" }}
                justifyContent="center"
                gap={6}
              >
                <Box
                  sx={{
                    textAlign: "center",
                    backdropFilter: "blur(10px)",
                    backgroundColor: "rgba(0,0,0, 0.4)",
                    padding: 2,
                    borderRadius: 2,
                    position: "absolute",
                    top: "2rem",
                    right: "25rem",
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{ color: "#CACACA", fontWeight: "bold" }}
                  >
                    200%
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#CACACA",
                      fontWeight: "bold",
                      whiteSpace: "pre-line",
                    }}
                  >
                    Improved {"\n"} customer engagement
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>

        <Box
          sx={{
            py: 4,
            marginTop: 10,
            background:
              "linear-gradient(180deg, rgba(2,0,36,1) 0%, rgba(255,255,255,1) 0%, rgba(214,200,240,1) 0%, rgba(168,158,188,1) 25%, rgba(124,117,138,1) 50%, rgba(76,72,83,1) 75%, rgba(0,0,0,1) 100%)",
          }}
        >
          <Container>
            <Grid container spacing={4} sx={{ marginTop: "7rem" }}>
              {/* Left Section */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Find the right plan for you
                </Typography>
                <Typography variant="h5" color="textSecondary" gutterBottom>
                  Start for free. No credit card required.
                </Typography>
              </Grid>

              {/* Right Section */}
              <Grid
                item
                xs={12}
                sm={6}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="contained"
                  href="/register"
                  target="_blank"
                  sx={{
                    bgcolor: "#AC41FF",
                    color: "white",
                    width: "10rem",
                    height: "4rem",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    borderRadius: "2rem",
                    "&:hover": { bgcolor: "#9D20FF" },
                  }}
                >
                  Sign Up <ArrowForwardIcon />
                </Button>

                <Button
                  variant="contained"
                  href="/pricing"
                  target="_blank"
                  sx={{
                    bgcolor: "#2E2E2E",
                    color: "white",
                    width: "10rem",
                    height: "4rem",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    borderRadius: "2rem",
                    "&:hover": { bgcolor: "black" },
                  }}
                >
                  Pricing <ArrowForwardIcon />
                </Button>
              </Grid>
            </Grid>
          </Container>

          <Container sx={{ marginTop: "4rem", minHeight: "40vh" }}>
            <Card sx={{ p: 2, borderRadius: "2rem" }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="h6" fontWeight="600" ml={"1rem"}>
                    Included in every plan
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Grid
                    container
                    spacing={2}
                    display={"flex"}
                    alignItems="center"
                    justifyContent={{ sx: "flex-start", md: "space-between" }}
                  >
                    {features.map((feature, index) => (
                      <Grid
                        item
                        key={index}
                        sx={{
                          textAlign: "center",
                          width: "5.9rem",
                          marginRight: "3.5rem",
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={feature.image}
                          alt={feature.title}
                          sx={{
                            width: 30,
                            height: 30,
                            objectFit: "contain",
                            display: "block",
                            margin: "0 auto",
                          }}
                        />
                        <Typography fontSize="0.8rem" sx={{ mt: 1 }}>
                          {feature.title}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </Card>
          </Container>
        </Box>
        <Footer />
      </Box>
    </>
  );
}

function Feature({ title }) {
  return (
    <Grid item xs={12} sm={6}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <CheckCircle sx={{ color: "#B88CFF" }} />
        <Typography
          sx={{ ml: 1, fontWeight: "bold", color: "gray", fontSize: "1rem" }}
        >
          {title}
        </Typography>
      </Box>
    </Grid>
  );
}
