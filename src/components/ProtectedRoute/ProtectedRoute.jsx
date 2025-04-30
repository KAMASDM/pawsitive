import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../../firebase";
import { alpha, Box, Container, useTheme } from "@mui/material";
import MeetingDetailsSkeleton from "../../UI/MeetingDetailsSkeleton";

const ProtectedRoute = ({ children }) => {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user ? user : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: alpha(theme.palette.background.default, 0.97),
          backgroundImage: `radial-gradient(${alpha(
            theme.palette.primary.main,
            0.05
          )} 1px, transparent 0)`,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0",
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, flexGrow: 1 }}>
          <MeetingDetailsSkeleton />
        </Container>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;
