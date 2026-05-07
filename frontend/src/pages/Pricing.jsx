import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Box,
} from "@mui/material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Lottie from "react-lottie-player";
import animationData2 from "../assets/animation2.json";

export default function Pricing() {
  // const plans = [
  //   {
  //     title: "Hobby",
  //     description:
  //       "Enjoy unlimited access to Erudition platform with full functionalities on single AI Agent build and deployment. Start today with no credit card needed.",
  //     price: "Free",
  //     buttonText: "Get started",
  //     features: ["Unlimited build"],
  //   },
  //   {
  //     title: "Startup",
  //     description:
  //       "Want to have more AI Agent work for your needs? This plan is perfect for in-depth development and transform your business. Cancel anytime.",
  //     price: "$19/month",
  //     originalPrice: "$23",
  //     buttonText: "Get started",
  //     features: ["Unlimited build"],
  //   },
  //   {
  //     title: "Pro",
  //     description:
  //       "Grow with Erudition. This most popular plan offers high concurrency and high scalability with no knowledge restriction to fuel your growth.",
  //     price: "$59/month",
  //     originalPrice: "$74",
  //     buttonText: "Get started",
  //     features: ["Unlimited build"],
  //     popular: true,
  //   },
  //   {
  //     title: "Scale",
  //     description:
  //       "Scale with Erudition. We provide the enterprise grade robust infrastructure to make sure your AI is always available to your customers.",
  //     price: "$199/month",
  //     originalPrice: "$239",
  //     buttonText: "Get started",
  //     features: ["Unlimited build"],
  //   },
  // ];

  return (
    <>
      <title>Erudition | Pricing</title>
      <Box sx={{ overflowY: "auto", height: "100vh", overflowX: "hidden" }}>
        <Navbar />
        <Container
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "90vh",
            px: { xs: 2, md: 4 },
            marginTop: "6rem",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h2"
            fontSize={{ xs: "2rem", md: "4rem" }}
            fontWeight="bold"
            gutterBottom
          >
            Flexible plans for all size companies
          </Typography>
          <Typography variant="body1">
            Find the right plan for your business
          </Typography>
          <Typography variant="body1">
            Not sure? Talk to us to find the right plan for you
          </Typography>

          {/* Enterprise Card */}
          <Card
            sx={{
              maxWidth: 800,
              width: "100%",
              mt: 4,
              p: 3,
              borderRadius: "25px",
              border: "6px solid #5E33A8",
              backgroundColor: "#fff",
              color: "#333",
            }}
          >
            <CardContent>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Enterprise
                  </Typography>
                  <Box component="ul" sx={{ listStyle: "none", padding: 0 }}>
                    {[
                      "Security compliance",
                      "Regular health monitoring & backups",
                      "Single Sign-On (SSO)",
                      "Unique workflows",
                      "A dedicated team for customization",
                    ].map((item, index) => (
                      <Box
                        component="li"
                        key={index}
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <span style={{ color: "#4CAF50", marginRight: 8 }}>
                          ✔
                        </span>
                        <Typography variant="body1" sx={{ color: "#555" }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={5} sx={{ textAlign: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Starts
                  </Typography>
                  <Typography variant="body2" color="gray">
                    *Annual commitment
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      href="/login"
                      variant="contained"
                      sx={{
                        backgroundColor: "#BA48FF",
                        color: "#fff",
                        borderRadius: "8px",
                        textTransform: "none",
                        px: 3,
                        "&:hover": { backgroundColor: "#BA48FF" },
                      }}
                    >
                      Talk to us →
                    </Button>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 2,
                      color: "#555",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Schedule a demo
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Typography
            variant="h2"
            sx={{ pt: "2rem" }}
            fontSize={{ xs: "2rem", md: "4rem", mt: 2 }}
            fontWeight="bold"
          >
            Not sure? Give it a test
          </Typography>

          {/* Pricing Plans */}
          {/* <Grid container spacing={4} sx={{ mt: 4 }}>
            {plans.map((plan, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={3}
                key={index}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    borderRadius: "15px",
                    border: plan.popular
                      ? "2px solid #5E33A8"
                      : "1px solid #ddd",
                    backgroundColor: "#fff",
                    color: "#333",
                    p: 3,
                    boxShadow: plan.popular
                      ? "0px 4px 12px rgba(87, 59, 255, 0.3)"
                      : "0px 2px 8px rgba(0,0,0,0.1)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    width: 250,
                    height: 420,
                    textAlign: "center",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: plan.popular
                        ? "0px 6px 16px rgba(87, 59, 255, 0.4)"
                        : "0px 4px 12px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      {plan.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#555", mb: 2, flexGrow: 1 }}
                    >
                      {plan.description}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                      {plan.price}
                    </Typography>
                    {plan.originalPrice && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#777",
                          textDecoration: "line-through",
                          mb: 1,
                        }}
                      >
                        {plan.originalPrice}
                      </Typography>
                    )}
                    <Box sx={{ mt: "auto", width: "100%" }}>
                      <Button
                        href="/login"
                        variant="contained"
                        sx={{
                          backgroundColor: "#BA48FF",
                          color: "#fff",
                          width: "100%",
                        }}
                      >
                        {plan.buttonText}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid> */}
          <Grid
            container
            spacing={6}
            alignItems="center"
            sx={{ minWidth: "100%", mt: 4, mb: 4 }}
          >
            <Grid item xs={12} md={6}>
              <Typography
                fontSize={{ xs: "2rem", md: "3rem" }}
                fontWeight="bold"
                gutterBottom
                textAlign={{ xs: "center", md: "left" }}
              >
                Integrations made easy
              </Typography>
              <Typography
                variant="h6"
                color="textSecondary"
                sx={{ mb: 4, textAlign: { xs: "center", md: "left" } }}
              >
                Empower your retail website with AI Chatbot widget in 1 minute.
                Erudition support all website integrations by providing
                Javascript embedding script that is compatible for all websites
                and platforms. Such as Shopify, Wordpress, Wix, Square Space and
                more.
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
                    width: { xs: "100%", sm: "30%" },
                    height: "4rem",
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
              <Lottie
                loop
                play
                animationData={animationData2}
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </Grid>
          </Grid>
        </Container>
        <Footer />
      </Box>
    </>
  );
}
