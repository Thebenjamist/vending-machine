"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { formatDenomination, formatPence, nonZeroChange } from "@/lib/coins";
import type { CoinCounts, PurchaseReason } from "@/lib/types";

export type Outcome =
  | {
      kind: "success";
      itemName: string;
      change: CoinCounts;
      changePence: number;
    }
  | {
      kind: "error";
      reason: PurchaseReason;
      message: string;
    };

type Props = {
  outcome: Outcome | null;
  idleMessage?: string;
};

export function OutcomePanel({
  outcome,
  idleMessage = "Select a product to begin",
}: Props) {
  const isError = outcome?.kind === "error";
  const isSuccess = outcome?.kind === "success";

  return (
    <Box
      data-testid="outcome-panel"
      aria-live="polite"
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        minHeight: 132,
        background: isError
          ? "linear-gradient(180deg, #3A2222 0%, #2A1818 100%)"
          : isSuccess
            ? "linear-gradient(180deg, #1F3328 0%, #16261D 100%)"
            : "linear-gradient(180deg, #1C232B 0%, #141A20 100%)",
        color: "#E8EDF2",
        border: isError
          ? "3px solid #E05A5A"
          : isSuccess
            ? "2px solid rgba(80,160,110,0.55)"
            : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isError
          ? "inset 0 0 0 1px rgba(224,90,90,0.35), 0 0 0 1px rgba(224,90,90,0.2)"
          : "inset 0 0 0 1px rgba(201,132,47,0.15)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: isError ? "#F0A0A0" : "#C9842F",
          letterSpacing: "0.12em",
          display: "block",
          mb: 0.75,
          fontWeight: isError ? 700 : 400,
        }}
      >
        {isError ? "ERROR" : "MACHINE STATUS"}
      </Typography>

      {!outcome && (
        <Typography data-testid="outcome-idle" sx={{ color: "#A8B2BD", fontSize: "0.875rem" }}>
          {idleMessage}
        </Typography>
      )}

      {outcome?.kind === "success" && (
        <Box>
          <Typography data-testid="outcome-success" sx={{ fontSize: "0.875rem" }}>
            Enjoy your {outcome.itemName}
            {outcome.changePence === 0
              ? " — exact payment, no change."
              : `. Change: ${formatPence(outcome.changePence)}`}
          </Typography>
          {outcome.changePence > 0 && (
            <Stack
              direction="row"
              data-testid="change-coins"
              sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}
            >
              {nonZeroChange(outcome.change).map(({ denom, count }) => (
                <Chip
                  key={denom}
                  size="small"
                  label={`${formatDenomination(denom)} ×${count}`}
                  data-testid={`change-coin-${denom}`}
                  sx={{
                    bgcolor: "rgba(201,132,47,0.2)",
                    color: "#F5E6C8",
                    border: "1px solid rgba(201,132,47,0.45)",
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>
      )}

      {outcome?.kind === "error" && (
        <Typography
          data-testid={`outcome-error-${outcome.reason}`}
          sx={{
            color: "#FFE0E0",
            fontSize: "0.9375rem",
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          {outcome.message}
        </Typography>
      )}
    </Box>
  );
}
