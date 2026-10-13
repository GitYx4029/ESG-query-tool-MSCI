import "dotenv/config";
import express from "express";
import { createCommunityRouter } from "./community";
const app = express();
if (process.env.TRUST_PROXY)
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
app.use(express.json({ limit: "16kb" }));
app.use("/api/community", createCommunityRouter());
app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
  console.info("Community service started")
);
