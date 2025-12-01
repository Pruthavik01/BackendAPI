import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// CORS — allow all during dev, restrict later
app.use(cors({ origin: "*" }));
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ----------------------
// ADD SCORE
// ----------------------
app.post("/add-score", async (req, res) => {
  const { name, score } = req.body;

  const { data, error } = await supabase
    .from("scores")
    .insert([{ name, score }]);

  if (error) return res.status(400).json({ error });

  res.json({ success: true, data });
});

// ----------------------
// GET SCORES
// ----------------------
app.get("/scores", async (req, res) => {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false });

  if (error) return res.status(400).json({ error });

  res.json(data);
});

// ----------------------
// LIVE CHECK
// ----------------------
app.get("/", (req, res) => {
  res.send("PingPong API is running.");
});

// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
