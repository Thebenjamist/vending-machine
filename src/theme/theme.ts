"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#C9842F",
      dark: "#A66A1F",
      light: "#E0A85A",
      contrastText: "#1A1A1A",
    },
    secondary: {
      main: "#3D4A55",
      contrastText: "#F5F3EF",
    },
    background: {
      default: "#D8DDE3",
      paper: "#ECEFF2",
    },
    text: {
      primary: "#1C232B",
      secondary: "#5A6570",
    },
    success: {
      main: "#2F6F4E",
    },
    error: {
      main: "#B33A3A",
    },
    divider: "rgba(28, 35, 43, 0.12)",
  },
  typography: {
    fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
    h1: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55), transparent 45%), linear-gradient(160deg, #C9D0D8 0%, #B7C0C9 45%, #A8B2BD 100%)",
          minHeight: "100vh",
        },
      },
    },
  },
});
