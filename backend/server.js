require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");

const connectDatabase = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const purchaseRoutes = require("./routes/purchases");
const dashboardRoutes = require("./routes/dashboard");
const aiRoutes = require("./routes/ai");
const notificationRoutes = require("./routes/notifications");
const dataRoutes = require("./routes/data");

const { runReminderCheck } = require("./services/reminderService");

const app = express();
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is missing from .env");
    process.exit(1);
}

const requiredDatabaseVariables = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME"
];

for (const variable of requiredDatabaseVariables) {
    if (!process.env[variable]) {
        console.error(`❌ ${variable} is missing from .env`);
        process.exit(1);
    }
}

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin"
        }
    })
);

app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
    })
);

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

app.use("/api", apiLimiter);

app.use((req, res, next) => {
    console.log(
        `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
    );
    next();
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/api/health", async (req, res) => {
    res.json({
        success: true,
        name: "AfterBuy AI API",
        version: "1.0.0",
        status: "running",
        database: "MySQL",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/data", dataRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

app.use(errorHandler);

async function startServer() {
    try {
        console.log("");
        console.log("========================================");
        console.log("        AFTERBUY AI BACKEND");
        console.log("========================================");
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`Port: ${PORT}`);
        console.log(`Frontend: ${CLIENT_URL}`);
        console.log("Database: MySQL");
        console.log(`Database Host: ${process.env.DB_HOST}`);
        console.log(`Database Port: ${process.env.DB_PORT}`);
        console.log(`Database Name: ${process.env.DB_NAME}`);
        console.log("");
        console.log("Connecting to MySQL...");

        await connectDatabase();

        console.log("✅ MySQL connection successful");

        const server = app.listen(PORT, () => {
            console.log("");
            console.log("========================================");
            console.log(`🚀 AfterBuy AI API running on port ${PORT}`);
            console.log(`🌐 http://localhost:${PORT}`);
            console.log(`❤️  http://localhost:${PORT}/api/health`);
            console.log("========================================");
            console.log("");
        });

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`❌ Port ${PORT} is already in use.`);
            } else {
                console.error("❌ HTTP server error:", error);
            }

            process.exit(1);
        });

        cron.schedule("0 9 * * *", async () => {
            try {
                console.log(
                    "Running daily AfterBuy AI reminder check..."
                );

                await runReminderCheck();

                console.log("✅ Reminder check completed");
            } catch (error) {
                console.error(
                    "❌ Reminder check failed:",
                    error
                );
            }
        });

        console.log("⏰ Daily reminder scheduler enabled.");
    } catch (error) {
        console.error("");
        console.error("========================================");
        console.error("❌ AFTERBUY AI BACKEND FAILED TO START");
        console.error("========================================");
        console.error("");
        console.error(error);
        console.error("");

        process.exit(1);
    }
}

process.on("unhandledRejection", (error) => {
    console.error("❌ Unhandled Promise Rejection:", error);
});

process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    process.exit(1);
});

startServer();

module.exports = app;