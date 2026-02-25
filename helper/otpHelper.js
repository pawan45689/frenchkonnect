import crypto from "crypto";

// Generate 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Hash OTP for security (optional but recommended)
export const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

// Verify OTP
export const verifyOTP = (inputOTP, hashedOTP) => {
  const hashedInput = crypto.createHash("sha256").update(inputOTP).digest("hex");
  return hashedInput === hashedOTP;
};