"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  DENOMINATIONS,
  formatDenomination,
  formatPence,
} from "@/lib/coins";
import type { MachineState } from "@/lib/types";

export function ServicePanel() {
  const [state, setState] = useState<MachineState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/machine", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load machine state");
        }
        return (await response.json()) as MachineState;
      })
      .then((data) => {
        setState(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError("Could not read hopper state.");
      });

    return () => controller.abort();
  }, []);

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      const response = await fetch("/api/machine/reset", { method: "POST" });
      if (!response.ok) {
        throw new Error("Reset failed");
      }
      const data = (await response.json()) as MachineState & { ok: boolean };
      setState({ supply: data.supply, cashBoxPence: data.cashBoxPence });
    } catch {
      setError("Could not reset the machine.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
        px: { xs: 2, md: 3 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Typography
        component={Link}
        href="/"
        data-testid="front-link"
        sx={{
          display: "inline-block",
          mb: 2,
          color: "#C8D0D8",
          textDecoration: "none",
          fontSize: "0.875rem",
          "&:hover": { color: "#F5F3EF" },
        }}
      >
        ← Front of machine
      </Typography>

      <Paper
        elevation={0}
        data-testid="service-panel"
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 2,
          background:
            "linear-gradient(180deg, #2A3138 0%, #1C232B 55%, #151A20 100%)",
          color: "#E8EDF2",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 16px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
          position: "relative",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #6A737C, #2E353C)",
            border: "1px solid rgba(0,0,0,0.4)",
          },
          "&::before": { top: 14, left: 14 },
          "&::after": { top: 14, right: 14 },
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: "#C9842F", letterSpacing: "0.16em" }}
        >
          Service access
        </Typography>
        <Typography variant="h2" sx={{ fontSize: "1.75rem", mt: 0.5, mb: 1 }}>
          Back of machine
        </Typography>
        <Typography variant="body2" sx={{ color: "#A8B2BD", mb: 3, maxWidth: 52 * 8 }}>
          Technician view. The change hopper only decreases and is never refilled.
          Customer payments go into the sealed cash box and never feed the hopper.
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Stack spacing={3}>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ letterSpacing: "0.08em", color: "#C9842F", mb: 1.25 }}
            >
              Change hopper
            </Typography>
            <Stack
              direction="row"
              data-testid="hopper-supply"
              sx={{ flexWrap: "wrap", gap: 1 }}
            >
              {DENOMINATIONS.map((denom) => {
                const count = state?.supply[denom] ?? null;
                const empty = count === 0;
                return (
                  <Chip
                    key={denom}
                    data-testid={`hopper-${denom}`}
                    label={
                      count === null
                        ? `${formatDenomination(denom)} …`
                        : `${formatDenomination(denom)} ×${count}`
                    }
                    sx={{
                      bgcolor: empty ? "rgba(179,58,58,0.2)" : "rgba(255,255,255,0.06)",
                      color: empty ? "#F0C7C7" : "#E8EDF2",
                      border: empty
                        ? "1px solid rgba(179,58,58,0.5)"
                        : "1px solid rgba(255,255,255,0.12)",
                      opacity: empty ? 0.7 : 1,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Box
            data-testid="cash-box"
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px dashed rgba(201,132,47,0.45)",
              background: "rgba(0,0,0,0.25)",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ letterSpacing: "0.08em", color: "#C9842F", mb: 0.75 }}
            >
              Sealed cash box
            </Typography>
            <Typography variant="h4" data-testid="cash-box-total" sx={{ fontFamily: "ui-monospace, monospace" }}>
              {state ? formatPence(state.cashBoxPence) : "—"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#8A949E", display: "block", mt: 0.75 }}>
              Locked. Does not dispense change.
            </Typography>
          </Box>

          <Box
            sx={{
              pt: 1,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography variant="body2" sx={{ color: "#8A949E", mb: 1.5 }}>
              Demo control — restores 10 of each coin, empties the cash box, and
              clears rate-limit windows. Not part of normal vending operation.
            </Typography>
            <Button
              variant="outlined"
              color="warning"
              data-testid="reset-machine"
              disabled={resetting}
              onClick={handleReset}
              sx={{
                borderColor: "rgba(201,132,47,0.55)",
                color: "#E0A85A",
                "&:hover": {
                  borderColor: "#C9842F",
                  background: "rgba(201,132,47,0.08)",
                },
              }}
            >
              {resetting ? "Resetting…" : "Reset machine"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
