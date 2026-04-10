import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Kotak Neo API Proxy
  app.post("/api/kotak/login", async (req, res) => {
    try {
      const { consumerKey, consumerSecret, userId, password, pin } = process.env;
      
      if (!consumerKey || !consumerSecret || !userId || !password || !pin) {
        return res.status(400).json({ error: "Missing Kotak Neo credentials in environment" });
      }

      // 1. Get Access Token
      const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
      const tokenRes = await fetch("https://neo-api.kotaksecurities.com/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      const tokenData = await tokenRes.json() as any;
      const accessToken = tokenData.access_token;

      // 2. Login
      const loginRes = await fetch("https://neo-api.kotaksecurities.com/login/1.0/login/v2/user", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userid: userId, password }),
      });
      const loginData = await loginRes.json() as any;
      const sid = loginData.data?.sid;

      // 3. 2FA
      const validateRes = await fetch("https://neo-api.kotaksecurities.com/login/1.0/login/v2/validate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "sid": sid,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mpins: pin }),
      });
      const validateData = await validateRes.json() as any;
      const sessionToken = validateData.data?.token;

      res.json({ success: true, sessionToken, accessToken, sid });
    } catch (error) {
      console.error("Kotak Login Error:", error);
      res.status(500).json({ error: "Failed to connect to Kotak Neo" });
    }
  });

  app.post("/api/kotak/quotes", async (req, res) => {
    try {
      const { sessionToken, accessToken, sid, symbols } = req.body;
      
      const response = await fetch("https://neo-api.kotaksecurities.com/quotes/1.0/quotes/v1/getQuote", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "sid": sid,
          "Neo-API": sessionToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instruments: symbols.map((s: string) => ({ instrument_token: s, exchange_segment: "nse_cm" }))
        }),
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
