import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Provider defaults or environment variables override
const PROVIDER_API_URL = process.env.PROVIDER_API_URL || "https://www.karanktech.com/api/v2";
const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY || "1085e536f1703a6cd812cb0f8ba76fe6d6b165ce";

// Keep a simple in-memory cache for provider services indexed by margin percentage
let servicesCacheMap: Record<string, { data: any; expiry: number }> = {};
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes cache

// Helper function to map category names to beautiful Lucide icon names
function inferIconName(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("instagram") || name.includes("ig")) return "Heart";
  if (name.includes("youtube") || name.includes("yt")) return "Youtube";
  if (name.includes("telegram") || name.includes("tg")) return "MessageSquare";
  if (name.includes("tiktok")) return "Music";
  if (name.includes("facebook") || name.includes("fb")) return "Facebook";
  if (name.includes("twitter") || name.includes(" x ")) return "MessageCircle";
  return "Briefcase";
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Middlewares to parse JSON and urlencoded requests
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- API proxy routes ---

  // 1. Get Provider Wallet Balance (API key checking and status indicator)
  app.get("/api/provider/balance", async (req, res) => {
    try {
      const response = await fetch(PROVIDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: PROVIDER_API_KEY,
          action: "balance"
        })
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Provider API responded with HTTP status ${response.status}` });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error("Error checking SMM key balance:", err);
      return res.status(500).json({ error: err.message || "Failed to contact SMM provider API" });
    }
  });

  // 2. Fetch Services and Group them by category with profit margin mark-up
  app.get("/api/provider/services", async (req, res) => {
    // Determine dynamic margin percent (default is 15%)
    const marginParam = req.query.margin;
    const marginPercent = marginParam ? parseFloat(marginParam as string) : 15;
    const cacheKey = marginPercent.toFixed(1);
    
    // Check if cache is still valid
    const now = Date.now();
    const cached = servicesCacheMap[cacheKey];
    if (cached && now < cached.expiry) {
      return res.json(cached.data);
    }

    try {
      console.log(`Fetching raw services from provider SMM panel: ${PROVIDER_API_URL} with margin ${marginPercent}%...`);
      const response = await fetch(PROVIDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: PROVIDER_API_KEY,
          action: "services"
        })
      });

      if (!response.ok) {
        throw new Error(`Provider API responded with HTTP status ${response.status}`);
      }

      const rawServices = await response.json();
      
      if (!Array.isArray(rawServices)) {
        console.warn("Invalid services format returned from SMM provider:", rawServices);
        return res.status(400).json({ error: "SMM Provider returned invalid response context." });
      }

      // Group by category, sanitize rates, adjust minimums and maximums
      const grouped: Record<string, any[]> = {};
      let index = 1;

      for (const item of rawServices) {
        const categoryName = item.category || "General Services";
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }

        // Parse rate (normally in rupees if the provider is Indian, or dollars)
        // Rate from provider is typically per 1000 items
        const providerRate = parseFloat(item.rate) || 0;
        
        // Add a beautiful retail profit markup (customized dynamically)
        const markupPercent = 1 + (marginPercent / 100); 
        const retailRate = parseFloat((providerRate * markupPercent).toFixed(4));

        grouped[categoryName].push({
          id: parseInt(item.service) || index++,
          name: item.name,
          rate: retailRate, // markup applied
          min: parseInt(item.min) || 10,
          max: parseInt(item.max) || 100000,
          description: item.description || item.desc || "Ultra-high quality & stability with rapid automated launch on target campaigns link. Ensure URL parameters matches instructions."
        });
      }

      // Format as Category hierarchy
      const categories = Object.keys(grouped).map((categoryName, idx) => {
        return {
          id: `live-cat-${idx}-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          name: categoryName,
          icon: inferIconName(categoryName),
          services: grouped[categoryName]
        };
      });

      // Save to memory cache Map
      servicesCacheMap[cacheKey] = {
        data: categories,
        expiry: now + CACHE_DURATION_MS
      };

      return res.json(categories);
    } catch (err: any) {
      console.error("Error aggregating services:", err);
      // Fallback: If any cache exists, return that instead of absolute failing
      const safeFallback = Object.values(servicesCacheMap)[0];
      if (safeFallback) {
        console.log("Serving stale services cache due to connection failure");
        return res.json(safeFallback.data);
      }
      return res.status(500).json({ error: err.message || "Failed to aggregate live services SMM dashboard categories." });
    }
  });

  // 3. Placing Campaign Order
  app.post("/api/provider/order", async (req, res) => {
    const { serviceId, link, quantity } = req.body;

    if (!serviceId || !link || !quantity) {
      return res.status(400).json({ error: "Required parameters are missing (serviceId, link, quantity)" });
    }

    try {
      console.log(`Forwarding order request to SMM provider: ServiceID ${serviceId}, link ${link}, quantity ${quantity}...`);
      const response = await fetch(PROVIDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: PROVIDER_API_KEY,
          action: "add",
          service: serviceId.toString(),
          link: link,
          quantity: quantity.toString()
        })
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Provider API responded with HTTP status ${response.status}` });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error("Error during order forwarding:", err);
      return res.status(500).json({ error: err.message || "Failed to lodge automated transaction with SMM backend" });
    }
  });

  // 4. Check Order status via provider
  app.get("/api/provider/order-status/:id", async (req, res) => {
    const orderId = req.params.id;

    try {
      const response = await fetch(PROVIDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: PROVIDER_API_KEY,
          action: "status",
          order: orderId
        })
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Provider HTTP error ${response.status}` });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error("Error querying check order status:", err);
      return res.status(500).json({ error: err.message || "Failed to trace transaction on provider API" });
    }
  });

  // 5. Send Welcome Email via Resend API with smart fallbacks
  app.post("/api/send-welcome-email", async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Required parameters are missing (name, email)" });
    }

    let resendApiKey = process.env.RESEND_API_KEY || "re_NFvUCV_dzUwM4gp3-sGkt";
    if (resendApiKey && !resendApiKey.startsWith("re_")) {
      resendApiKey = `re_${resendApiKey}`;
    }

    const trySendEmail = async (fromAddress: string) => {
      const emailBody = {
        from: fromAddress,
        to: [email],
        subject: "Welcome to Dadhich SMM Panel 🚀",
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2f6f7; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://res.cloudinary.com/dhbnbp0ax/image/upload/f_auto,q_auto/29230_nlstyo" alt="Dadhich SMM" style="max-height: 60px; object-fit: contain;" />
            <h1 style="color: #0c8085; font-size: 24px; margin-top: 10px; margin-bottom: 5px;">Dadhich SMM Panel</h1>
          </div>
          <hr style="border: none; border-top: 1px solid #e2f6f7; margin-bottom: 20px;" />
          <p style="font-size: 16px; margin-bottom: 15px;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 15px;">Welcome to Dadhich SMM Panel 🚀</p>
          <p style="font-size: 16px; margin-bottom: 15px;">Your account has been created successfully.</p>
          <p style="font-size: 16px; margin-bottom: 25px;">Thank you for joining us ❤️</p>
          <div style="background-color: #f0fdfa; padding: 15px; border-radius: 8px; border-left: 4px solid #14b8a6; text-align: center;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0f766e;">Need support or have questions?</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #115e59;">Contact us via our live dashboard support tickets or WhatsApp support channel!</p>
          </div>
        </div>`
      };

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emailBody)
      });

      const resText = await response.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(resText);
      } catch (e) {
        responseData = { message: resText };
      }

      return {
        ok: response.ok,
        status: response.status,
        data: responseData
      };
    };

    try {
      console.log(`Sending welcome email via Resend to: ${email} for user: ${name}...`);
      
      // Attempt 1: Using the requested gmail address
      let result = await trySendEmail("Dadhich SMM Panel <dadhichsmmpanel@gmail.com>");
      
      // Auto fallback to onboarding@resend.dev if Gmail sending yields validation / unauthorized domain errors
      const isDomainOrFromError = 
        !result.ok && 
        ((result.data.message && result.data.message.toLowerCase().includes("from")) ||
         (result.data.message && result.data.message.toLowerCase().includes("domain")) ||
         (result.data.message && result.data.message.toLowerCase().includes("authorized")) ||
         result.status === 403 ||
         result.data.name === "validation_error");

      if (isDomainOrFromError) {
        console.warn("First send attempt failed due to unauthorized 'from' address domain. Retrying with onboarding@resend.dev...");
        result = await trySendEmail("Dadhich SMM Panel <onboarding@resend.dev>");
      }

      if (!result.ok) {
        console.error("Resend API eventually failed:", result.data);
        
        let message = `Resend Error: ${result.data.message || 'Validation Failure: ' + result.status}`;
        
        // Translate Resend sandbox/public domain restrictions into clear directions for the dashboard owner
        if (result.status === 403 || (result.data.message && result.data.message.toLowerCase().includes("domain") && !result.data.message.toLowerCase().includes("sandbox"))) {
          message = "Domain Verification Required: Resend does not allow sending emails from public helper domains like '@gmail.com'. To send from a custom address, you must verify your custom domain in your Resend Dashboard.";
        } else if (
          result.data.name === "validation_error" ||
          result.status === 422 ||
          (result.data.message && (
            result.data.message.toLowerCase().includes("sandbox") || 
            result.data.message.toLowerCase().includes("restriction") || 
            result.data.message.toLowerCase().includes("test") || 
            result.data.message.toLowerCase().includes("authorized") ||
            result.data.message.toLowerCase().includes("registered") ||
            result.data.message.toLowerCase().includes("add a domain")
          ))
        ) {
          message = `Resend Sandbox Restriction: By default, Resend API key is in Sandbox mode. In Sandbox mode, emails can ONLY be sent to your registered Resend account email address. Verify your custom domain in the Resend Dashboard to send emails to any target recipient like Trendwithus@gmail.com.`;
        }

        return res.status(result.status).json({ 
          error: message,
          details: result.data 
        });
      }

      console.log("Welcome email sent successfully!", result.data);
      return res.json({ success: true, data: result.data });
    } catch (err: any) {
      console.error("Error calling Resend API:", err);
      return res.status(500).json({ error: err.message || "Failed to communicate with Resend API servers" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
    console.log(`★ Dadhich SMM backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
