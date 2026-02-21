// server.js (or index.js)
import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

const FRONTEND_ORIGIN = "https://aiping.netlify.app";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in env. Exiting.");
  process.exit(1);
}

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// helper to wrap async route handlers so errors go to next()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ----------------------
// ADD SCORE
// ----------------------
app.post(
  "/add-score",
  asyncHandler(async (req, res) => {
    const { name, score } = req.body;

    // Basic validation / sanitization
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Invalid name" });
    }

    // parse/validate score
    const parsedScore = Number(score);
    if (!Number.isFinite(parsedScore) || parsedScore < 0) {
      return res.status(400).json({ error: "Invalid score" });
    }

    // Insert into Supabase and return inserted row(s)
    const { data, error } = await supabase
      .from("scores")
      .insert([{ name: name.trim(), score: parsedScore }])
      .select(); // .select() to return the inserted row on Postgres

    if (error) {
      // Log the error server-side for debugging
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to add score" });
    }

    res.json({ success: true, data });
  })
);

// ----------------------
// GET SCORES
// ----------------------
app.get(
  "/scores",
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(100); // optional limit to avoid huge responses

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "Failed to fetch scores" });
    }

    res.json(data);
  })
);

// ----------------------
// LIVE CHECK
// ----------------------
app.get("/", (req, res) => {
  res.send("PingPong API is running.");
});

// Centralized error handler (must be after routes)
app.use((err, req, res, next) => {
  console.error("Unhandled route error:", err && err.stack ? err.stack : err);
  // Don't expose internals to the client in production
  res.status(err?.status || 500).json({
    error: err?.message || "Internal Server Error",
  });
});

// Catch unhandled rejections / exceptions so process doesn't silently die
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at Promise:", p, "reason:", reason);
  // Note: in production you might want to restart the process gracefully.
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
  // Note: consider graceful shutdown + restart in production.
});

// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});