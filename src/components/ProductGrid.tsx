"use client";

import Image from "next/image";
import { Box, Typography } from "@mui/material";
import type { Product } from "@/lib/products";
import { formatPence } from "@/lib/coins";

type Props = {
  products: Product[];
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (product: Product) => void;
};

export function ProductGrid({ products, selectedId, disabled = false, onSelect }: Props) {
  return (
    <Box
      data-testid="product-grid"
      sx={(theme) => ({
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr",
        [theme.breakpoints.up(375)]: {
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        },
        [theme.breakpoints.up("sm")]: {
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        },
        gap: { xs: 1.25, md: 1.5 },
        p: { xs: 1.5, md: 2 },
        borderRadius: 1.75,
        background:
          "linear-gradient(180deg, rgba(36,48,60,0.1) 0%, rgba(20,28,36,0.18) 100%)",
        border: "1px solid rgba(20,28,36,0.28)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 2px 8px rgba(0,0,0,0.12)",
        minHeight: 520,
      })}
    >
        {products.map((product, index) => {
          const selected = product.id === selectedId;
          const aboveTheFold = index < 3;
          return (
            <Box
              key={product.id}
              component="button"
              type="button"
              data-testid={`product-${product.id}`}
              disabled={disabled}
              aria-disabled={disabled}
              onClick={() => onSelect(product)}
              sx={{
                appearance: "none",
                position: "relative",
                zIndex: selected ? 2 : 1,
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: selected ? "#C9842F" : "rgba(28,35,43,0.18)",
                borderRadius: 1.75,
                p: 0,
                overflow: "hidden",
                cursor: disabled ? "not-allowed" : "pointer",
                textAlign: "left",
                background: selected
                  ? "linear-gradient(180deg, #FFF8EE 0%, #F3E7D2 100%)"
                  : "linear-gradient(180deg, #FBFCFD 0%, #E8ECF0 100%)",
                boxShadow: selected
                  ? "0 0 0 3px rgba(201,132,47,0.28), 0 8px 18px rgba(28,35,43,0.16)"
                  : "0 2px 6px rgba(0,0,0,0.08)",
                transition:
                  "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease",
                transform: selected ? "scale(1.03)" : "scale(1)",
                transformOrigin: "center",
                filter: selected ? "none" : "saturate(0.92)",
                opacity: disabled ? 0.75 : 1,
                "&:hover": {
                  transform:
                    disabled || selected ? "scale(1.03)" : "scale(1.02)",
                  filter: disabled ? "saturate(0.92)" : "none",
                  boxShadow:
                    disabled
                      ? selected
                        ? "0 0 0 3px rgba(201,132,47,0.28), 0 8px 18px rgba(28,35,43,0.16)"
                        : "0 2px 6px rgba(0,0,0,0.08)"
                      : selected
                        ? "0 0 0 3px rgba(201,132,47,0.28), 0 8px 18px rgba(28,35,43,0.16)"
                        : "0 4px 12px rgba(28,35,43,0.14)",
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  height: { xs: 140, md: 168 },
                  background: "#FFFFFF",
                  borderBottom: "1px solid rgba(28,35,43,0.08)",
                }}
              >
                <Image
                  src={product.imageSrc}
                  alt={product.name}
                  fill
                  sizes="(max-width: 900px) 33vw, 220px"
                  loading={aboveTheFold ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  style={{ objectFit: "contain", objectPosition: "center" }}
                />
                <Typography
                  component="span"
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    px: 0.75,
                    py: 0.15,
                    borderRadius: 0.75,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: "#F5F3EF",
                    background: "rgba(28,35,43,0.72)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {product.slot}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    px: 0.85,
                    py: 0.2,
                    borderRadius: 0.75,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    color: selected ? "#1A1A1A" : "#F5F3EF",
                    background: selected
                      ? "linear-gradient(180deg, #E0A85A 0%, #C9842F 100%)"
                      : "rgba(28,35,43,0.72)",
                    boxShadow: selected ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  {formatPence(product.pricePence)}
                </Typography>
                {selected && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 3,
                      background: "linear-gradient(90deg, #C9842F, #E0A85A, #C9842F)",
                    }}
                  />
                )}
              </Box>

              <Box sx={{ px: 1.25, py: 1.1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.25,
                    fontSize: { xs: "0.8rem", md: "0.875rem" },
                  }}
                >
                  {product.name}
                </Typography>
              </Box>
            </Box>
          );
        })}
    </Box>
  );
}
