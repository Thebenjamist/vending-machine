import { ServicePanel } from "@/components/ServicePanel";

export default function StatusPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 70% 10%, rgba(201,132,47,0.12), transparent 40%), linear-gradient(180deg, #12171C 0%, #0B0E11 100%)",
      }}
    >
      <ServicePanel />
    </div>
  );
}
