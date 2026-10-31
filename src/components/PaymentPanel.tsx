"use client";

import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { formatPence } from "@/lib/coins";
import { OutcomePanel, type Outcome } from "./OutcomePanel";

export type FormErrors = {
  customerId?: string;
  paid?: string;
};

type Props = {
  awaitingRetry: boolean;
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  pricePence: number | null;
  paidPence: number;
  onPaidPenceChange: (value: number) => void;
  onVend: () => void;
  onRetry: () => void;
  loading: boolean;
  errors: FormErrors;
  locked: boolean;
  outcome: Outcome | null;
  idleMessage: string;
};

const QUICK_ADDS = [20, 50, 100, 200] as const;

export function PaymentPanel({
  awaitingRetry,
  customerId,
  onCustomerIdChange,
  pricePence,
  paidPence,
  onPaidPenceChange,
  onVend,
  onRetry,
  loading,
  errors,
  locked,
  outcome,
  idleMessage,
}: Props) {
  const changePreview =
    pricePence !== null && paidPence >= pricePence
      ? paidPence - pricePence
      : null;

  return (
    <Box
      data-testid="payment-panel"
      sx={{
        position: "relative",
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        spacing={2}
        aria-hidden={locked}
        sx={{
          flex: 1,
          filter: locked ? "grayscale(0.4)" : "none",
          opacity: locked ? 0.45 : 1,
          pointerEvents: locked ? "none" : "auto",
          transition: "opacity 160ms ease, filter 160ms ease",
        }}
      >
        <Box>
          <Stack spacing={0.5} sx={{ mb: 2.5 }}>
            <Row
              label="Price"
              value={pricePence === null ? "—" : formatPence(pricePence)}
            />
            <Row label="Paying" value={formatPence(paidPence)} emphasize />
            <Row
              label="Change"
              value={changePreview === null ? "—" : formatPence(changePreview)}
              testId="change-preview"
            />
          </Stack>

          <TextField
            fullWidth
            size="small"
            label="Customer ID"
            value={customerId}
            onChange={(e) => onCustomerIdChange(e.target.value)}
            error={Boolean(errors.customerId)}
            disabled={locked || awaitingRetry}
            slotProps={{
              htmlInput: { "data-testid": "customer-id" },
            }}
          />
          <Box sx={{ mt: 0.5 }}>
            {errors.customerId ? (
              <Typography
                data-testid="customer-id-error"
                variant="caption"
                color="error"
                sx={{ fontWeight: 700 }}
              >
                {errors.customerId}
              </Typography>
            ) : null}
          </Box>

          <TextField
            fullWidth
            size="small"
            label="Amount"
            type="number"
            value={(paidPence / 100).toFixed(2)}
            disabled={locked}
            error={Boolean(errors.paid)}
            onChange={(e) => {
              const pounds = Number(e.target.value);
              if (Number.isNaN(pounds) || pounds < 0) {
                return;
              }
              onPaidPenceChange(Math.round(pounds * 100));
            }}
            slotProps={{
              htmlInput: {
                "data-testid": "pay-custom",
                min: 0,
                step: 0.01,
              },
            }}
            sx={{ mt: 1 }}
          />
          <Box sx={{ mt: 0.5 }}>
            {errors.paid ? (
              <Typography
                data-testid="paid-error"
                variant="caption"
                color="error"
                sx={{ fontWeight: 700 }}
              >
                {errors.paid}
              </Typography>
            ) : null}
          </Box>

          <Stack direction="row" sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              data-testid="pay-exact"
              disabled={locked || pricePence === null}
              onClick={() =>
                pricePence !== null && onPaidPenceChange(pricePence)
              }
            >
              Exact
            </Button>
            {QUICK_ADDS.map((pence) => (
              <Button
                key={pence}
                size="small"
                variant="outlined"
                data-testid={`pay-add-${pence}`}
                disabled={locked}
                onClick={() => onPaidPenceChange(paidPence + pence)}
              >
                +{formatPence(pence)}
              </Button>
            ))}
            <Button
              size="small"
              variant="text"
              data-testid="pay-clear"
              disabled={locked || awaitingRetry}
              onClick={() => onPaidPenceChange(0)}
            >
              Clear
            </Button>
          </Stack>
        </Box>

        <Button
          fullWidth
          size="large"
          variant="contained"
          color="primary"
          data-testid="vend-button"
          disabled={locked || loading || outcome?.kind === "network-error"}
          onClick={onVend}
        >
          {loading ? "Buying…" : "Buy"}
        </Button>

        <OutcomePanel
          outcome={outcome}
          idleMessage={idleMessage}
          onRetry={onRetry}
          retrying={loading}
        />
      </Stack>

      {locked && (
        <Box
          data-testid="payment-locked"
          sx={{
            position: "absolute",
            // Extend over parent padding so the whole right bay is covered.
            inset: -16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            borderRadius: 1.5,
            background: "rgba(247, 248, 250, 0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 2,
          }}
        >
          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 700,
              color: "text.secondary",
              maxWidth: 220,
              lineHeight: 1.35,
            }}
          >
            Please select a product
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function Row({
  label,
  value,
  emphasize,
  testId,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  testId?: string;
}) {
  return (
    <Stack
      direction="row"
      sx={{ justifyContent: "space-between", alignItems: "baseline" }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        data-testid={testId}
        sx={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontWeight: emphasize ? 700 : 600,
          fontSize: emphasize ? "1.15rem" : "1rem",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
