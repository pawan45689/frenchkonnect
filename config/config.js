import dotenv from "dotenv";
dotenv.config();

const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URL: process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Email configuration (OPTIONAL)
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",
  APP_NAME: process.env.APP_NAME || "College Management System",
};

// ✅ CHANGED: Email is now OPTIONAL, only MONGO_URL and JWT_SECRET are required
const requiredEnvVars = ["MONGO_URL", "JWT_SECRET"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Check if email is configured
config.EMAIL_ENABLED = !!(config.EMAIL_USER && config.EMAIL_PASS);

if (!config.EMAIL_ENABLED) {
  console.log("⚠️  Email not configured - OTP features will be disabled");
}

export default config;