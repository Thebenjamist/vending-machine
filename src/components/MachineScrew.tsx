import { Box } from "@mui/material";

type Props = {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
};

/** Decorative rivet/screw for the metal bezel. */
export function MachineScrew({ top, right, bottom, left }: Props) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top,
        right,
        bottom,
        left,
        width: 14,
        height: 14,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 32% 28%, #D8DEE5 0%, #8A949E 42%, #4A5560 78%, #2A3138 100%)",
        border: "1px solid rgba(20,28,36,0.55)",
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -1px 2px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)",
        zIndex: 2,
        "&::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          left: "18%",
          right: "18%",
          height: 1.5,
          transform: "translateY(-50%) rotate(-18deg)",
          background: "rgba(20,28,36,0.55)",
          borderRadius: 1,
        },
      }}
    />
  );
}
