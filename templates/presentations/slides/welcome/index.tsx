import type { Page, SlideMeta } from "@open-slide/core";

const frame: React.CSSProperties = {
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  padding: 120,
  background: "#0b1020",
  color: "#f8fafc",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
};

const Cover: Page = () => (
  <main style={{ ...frame, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <p style={{ fontSize: 26, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7dd3fc" }}>
      SmallForce presentations
    </p>
    <div>
      <h1 style={{ margin: 0, maxWidth: 1450, fontSize: 156, lineHeight: 0.94, letterSpacing: "-0.055em" }}>
        Replace this deck with the customer's story.
      </h1>
      <p style={{ margin: "48px 0 0", maxWidth: 980, fontSize: 40, lineHeight: 1.35, color: "#cbd5e1" }}>
        Ask the agent to create a polished presentation, then deploy it as an immutable SmallForce application.
      </p>
    </div>
    <p style={{ margin: 0, fontSize: 28, color: "#94a3b8" }}>01 / 02</p>
  </main>
);

const Workflow: Page = () => (
  <main style={frame}>
    <p style={{ margin: 0, fontSize: 26, color: "#7dd3fc", letterSpacing: "0.14em" }}>WORKFLOW</p>
    <h2 style={{ margin: "40px 0 80px", fontSize: 112, lineHeight: 1, letterSpacing: "-0.045em" }}>
      Author. Review. Deploy.
    </h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
      {["Create the deck in slides/", "Review with bun run dev", "Publish with smallforce app deploy"].map((label, index) => (
        <section key={label} style={{ minHeight: 380, padding: 48, border: "1px solid #334155", borderRadius: 28, background: "#111a31" }}>
          <p style={{ margin: 0, fontSize: 28, color: "#7dd3fc" }}>0{index + 1}</p>
          <p style={{ margin: "120px 0 0", fontSize: 42, lineHeight: 1.2 }}>{label}</p>
        </section>
      ))}
    </div>
  </main>
);

export const meta: SlideMeta = { title: "SmallForce presentation starter" };

export default [Cover, Workflow] satisfies Page[];
