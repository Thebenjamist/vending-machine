"use client";

import Link from "next/link";
import { useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { PRODUCTS, type Product } from "@/lib/products";
import type { PurchaseResult } from "@/lib/types";
import { MachineScrew } from "./MachineScrew";
import { type Outcome } from "./OutcomePanel";
import { PaymentPanel, type FormErrors } from "./PaymentPanel";
import { ProductGrid } from "./ProductGrid";

export function VendingMachine() {
  const [selected, setSelected] = useState<Product | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [paidPence, setPaidPence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  function validateForm(): FormErrors {
    const next: FormErrors = {};
    if (!customerId.trim()) {
      next.customerId = "Enter your customer ID.";
    }
    return next;
  }

  async function handleVend() {
    if (loading || !selected) {
      return;
    }

    setOutcome(null);

    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId.trim(),
          pricePence: selected.pricePence,
          paidPence,
        }),
      });

      const result = (await response.json()) as PurchaseResult;

      if (result.ok) {
        setOutcome({
          kind: "success",
          itemName: selected.name,
          change: result.change,
          changePence: result.changePence,
        });
      } else {
        setOutcome({
          kind: "error",
          reason: result.reason,
          message: result.message,
        });
      }
    } catch {
      setOutcome({
        kind: "error",
        reason: "INVALID_INPUT",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      data-testid="vending-machine"
      sx={{
        maxWidth: 1100,
        mx: "auto",
        px: { xs: 2, md: 3 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          p: { xs: 2, md: 2.75 },
          borderRadius: 3.5,
          background:
            "linear-gradient(160deg, #C5CCD4 0%, #9AA4AF 28%, #7E8894 62%, #A7B0BA 100%)",
          border: "2px solid rgba(28,35,43,0.28)",
          boxShadow:
            "0 22px 48px rgba(28,35,43,0.28), inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -3px 8px rgba(0,0,0,0.18)",
        }}
      >
        <MachineScrew top={14} left={14} />
        <MachineScrew top={14} right={14} />
        <MachineScrew bottom={14} left={14} />
        <MachineScrew bottom={14} right={14} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.35fr 1fr" },
            gap: { xs: 2, md: 2.5 },
            alignItems: "stretch",
            p: { xs: 1.5, md: 2 },
            borderRadius: 2.5,
            background:
              "linear-gradient(180deg, #F2F4F6 0%, #E2E7EC 55%, #D3DAE1 100%)",
            border: "1px solid rgba(28,35,43,0.14)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
          }}
        >
          <ProductGrid
            products={PRODUCTS}
            selectedId={selected?.id ?? null}
            onSelect={(product) => {
              setSelected(product);
              setPaidPence(0);
              setOutcome(null);
              setFormErrors({});
            }}
          />

          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              p: 2,
              borderRadius: 1.5,
              height: "100%",
              minHeight: { xs: 420, md: "100%" },
              background: "#F7F8FA",
              border: "1px solid rgba(28,35,43,0.1)",
            }}
          >
            <PaymentPanel
              locked={selected === null}
              customerId={customerId}
              onCustomerIdChange={(value) => {
                setCustomerId(value);
                setFormErrors((prev) =>
                  prev.customerId ? { ...prev, customerId: undefined } : prev,
                );
              }}
              pricePence={selected?.pricePence ?? null}
              paidPence={paidPence}
              onPaidPenceChange={(value) => {
                setPaidPence(value);
                setFormErrors((prev) =>
                  prev.paid ? { ...prev, paid: undefined } : prev,
                );
              }}
              onVend={handleVend}
              loading={loading}
              errors={formErrors}
              outcome={outcome}
              idleMessage={
                selected
                  ? "Ready — enter ID, pay, then Buy"
                  : "Select a product to begin"
              }
            />
          </Box>
        </Box>
      </Paper>

      <Link
        href="/status"
        data-testid="service-panel-link"
        style={{ display: "inline-block", marginTop: 16 }}
      >
        <Typography
          component="span"
          sx={{
            color: "text.secondary",
            textDecoration: "none",
            fontSize: "0.875rem",
            borderBottom: "1px solid transparent",
            "&:hover": {
              color: "text.primary",
              borderBottomColor: "text.secondary",
            },
          }}
        >
          Service panel — back of machine
        </Typography>
      </Link>
    </Box>
  );
}
