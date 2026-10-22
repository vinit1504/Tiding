import { ImageResponse } from "next/og";
import { SITE_CONFIG } from "@/lib/constants/site-config";

export const runtime = "edge";
export const alt = "Tiding - Instant Grocery Delivery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#081828",
          padding: "60px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(24, 168, 24, 0.4), transparent 70%)",
          }}
        />

        {/* Header with Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Logo icon representation */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              backgroundColor: "#18A818",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              color: "#FFFFFF",
              fontWeight: "bold",
            }}
          >
            ⚡
          </div>
          <span style={{ fontSize: "42px", fontWeight: "bold", color: "#FFFFFF", letterSpacing: "-1px" }}>
            Tiding
          </span>
          <div
            style={{
              backgroundColor: "rgba(24, 168, 24, 0.2)",
              border: "1px solid #18A818",
              color: "#4ADE80",
              fontSize: "16px",
              fontWeight: 600,
              padding: "6px 16px",
              borderRadius: "20px",
            }}
          >
            Express Doorstep Delivery
          </div>
        </div>

        {/* Main Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "900px" }}>
          <h1
            style={{
              fontSize: "58px",
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Fresh Groceries, Fruits & Vegetables Delivered to Your Door
          </h1>
          <p style={{ fontSize: "24px", color: "#94A3B8", margin: 0 }}>
            Farm fresh harvests, daily milk, dairy, bakery & instant pantry staples delivered fresh.
          </p>
        </div>

        {/* Feature Pills Footer */}
        <div style={{ display: "flex", gap: "24px", width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#111827",
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid #1F2937",
              color: "#FFFFFF",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            🥦 Farm-to-Fork Fresh
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#111827",
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid #1F2937",
              color: "#FFFFFF",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            ⚡ Under 15-Minute Delivery
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#111827",
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid #1F2937",
              color: "#FFFFFF",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            🛡️ 100% Quality Guarantee
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
