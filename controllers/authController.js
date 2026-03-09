import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helper/authHelper.js";
import { generateOTP, hashOTP, verifyOTP } from "../helper/otpHelper.js";
import { sendOTPEmail } from "../services/emailService.js";
import JWT from "jsonwebtoken";
import config from "../config/config.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// ==========================================
// SIGNUP/REGISTER CONTROLLER
// ==========================================
export const signupController = async (req, res) => {

  try {
    const {
      fullName,
      email,
      mobile,
      password,
      confirmPassword,
      acceptTerms,
      role,
    } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(422).json({
        success: false,
        error: "Please fill all fields",
      });
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(422).json({
        success: false,
        error: "Please enter a valid email",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(422).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(422).json({
        success: false,
        error: "Passwords do not match",
      });
    }

    if (!acceptTerms) {
      return res.status(422).json({
        success: false,
        error: "Please accept terms and conditions",
      });
    }

    // Check if email already exists
    const emailExist = await userModel.findOne({ email });
    if (emailExist) {
      return res.status(422).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Set role (admin or user)
    const userRole = role === "admin" ? "admin" : "user";

    // Create new user
    const user = new userModel({
      fullName,
      email,
      mobile: mobile || "",
      password: hashedPassword,
      role: userRole,
    });

    await user.save();

    // Create JWT token
    const token = JWT.sign(
      { _id: user._id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error. Please try again",
    });
  }
};

// ==========================================
// LOGIN CONTROLLER
// ==========================================
export const loginController = async (req, res) => {
  try {
    const { email, password, rememberMe, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Role-based access control
    if (role === "admin" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "⚠️ Access Denied! Admin privileges required.",
      });
    }

    if (role === "user" && user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "⚠️ Access Denied! User account required.",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google login. Please sign in with Google.",
      });
    }

    // Compare password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const tokenExpiry = rememberMe ? "30d" : "7d";
    const token = JWT.sign(
      { _id: user._id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: tokenExpiry },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GOOGLE AUTHENTICATION CONTROLLER
// ==========================================
export const googleAuthController = async (req, res) => {
  try {
    const { email, fullName, googleId, role, isSignupAttempt } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        error: "Missing required Google authentication data",
      });
    }

    // Check if user already exists
    let user = await userModel.findOne({ email });

    if (user) {
      // If user exists and this is SIGNUP attempt, return error
      if (isSignupAttempt === true) {
        return res.status(422).json({
          success: false,
          error: "Email already registered. Please login instead.",
        });
      }

      // User exists - LOGIN flow - Check role compatibility
      const requestedRole = role === "admin" ? "admin" : "user";

      if (requestedRole === "admin" && user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error:
            "⚠️ This email is registered as a user account. Admin access denied.",
        });
      }

      if (requestedRole === "user" && user.role !== "user") {
        return res.status(403).json({
          success: false,
          error:
            "⚠️ This email is registered as an admin account. Please use admin login.",
        });
      }

      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        await user.save();
      }

      // Create JWT token
      const token = JWT.sign(
        { _id: user._id, role: user.role },
        config.JWT_SECRET,
        { expiresIn: "30d" },
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
        token,
      });
    } else {
      if (isSignupAttempt === false) {
        return res.status(404).json({
          success: false,
          error: "No account found with this email. Please sign up first.",
        });
      }

      const userRole = role === "admin" ? "admin" : "user";

      user = new userModel({
        fullName,
        email,
        googleId,
        role: userRole,
        isVerified: true,
        mobile: "",
      });
      await user.save();

      // Create JWT token
      const token = JWT.sign(
        { _id: user._id, role: user.role },
        config.JWT_SECRET,
        { expiresIn: "30d" },
      );

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
        token,
      });
    }
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({
      success: false,
      error: "Google authentication failed",
    });
  }
};

// ==========================================
// SEND OTP FOR PASSWORD RESET
// ==========================================
export const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If your email is registered, you will receive an OTP shortly",
      });
    }

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      await sendOTPEmail(user.email, otp, user.fullName);
    } catch (emailError) {
      console.error("Email Error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again later",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent to your email successfully",
      ...(config.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// ==========================================
// VERIFY OTP
// ==========================================
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits",
      });
    }

    const user = await userModel
      .findOne({
        email,
        resetPasswordOTPExpire: { $gt: Date.now() },
      })
      .select("+resetPasswordOTP +resetPasswordOTPExpire");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const isValidOTP = verifyOTP(otp, user.resetPasswordOTP);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const resetToken = JWT.sign(
      { _id: user._id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================
export const resetPasswordController = async (req, res) => {
  try {
    const { resetToken, password, confirmPassword } = req.body;

    if (!resetToken || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    let decoded;
    try {
      decoded = JWT.verify(resetToken, config.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await userModel
      .findById(decoded._id)
      .select("+resetPasswordOTP +resetPasswordOTPExpire");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hashedPassword = await hashPassword(password);

    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// ==========================================
// LOGOUT CONTROLLER
// ==========================================
export const logoutController = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Logout error",
    });
  }
};

// ==========================================
// GET ALL USERS
// ==========================================
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const searchQuery = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    const users = await userModel
      .find(searchQuery)
      .select("-password -resetPasswordOTP -resetPasswordOTPExpire")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await userModel.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: parseInt(page),
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// ==========================================
// GET SINGLE USER BY ID
// ==========================================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "me") {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const user = await userModel
      .findById(id)
      .select("-password -resetPasswordOTP -resetPasswordOTPExpire");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

// ==========================================
// DELETE USER
// ==========================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// ==========================================
// UPDATE USER
// ==========================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, mobile } = req.body;

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (fullName) user.fullName = fullName;
    if (mobile) user.mobile = mobile;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// ==========================================
// GET USER STATISTICS
// ==========================================
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments();
    const totalAdmins = await userModel.countDocuments({ role: "admin" });
    const totalRegularUsers = await userModel.countDocuments({ role: "user" });
    const verifiedUsers = await userModel.countDocuments({ isVerified: true });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await userModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalUsers,
        admins: totalAdmins,
        users: totalRegularUsers,
        verified: verifiedUsers,
        lastWeek: recentUsers,
      },
    });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

// ==========================================
// GET CURRENT USER (/auth/me)
// ==========================================
export const getCurrentUser = async (req, res) => {
  try {
      console.log("req.user:", req.user);
    console.log("req.user._id:", req.user._id);
    console.log("req.user.role:", req.user.role);
    const user = await userModel
      .findById(req.user._id)
      .select("-password -resetPasswordOTP -resetPasswordOTPExpire");
      console.log("DB user:", user);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// UPDATE PROFILE (/auth/update-profile)
// ✅ UPDATED: Cloudinary se purani image delete karta hai
// User aur Admin dono ke liye kaam karta hai
// ==========================================
export const updateProfileController = async (req, res) => {
  try {
    const { name, username, email, phone, location, bio, avatar, removeAvatar } = req.body;

    const user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Avatar handle — removeAvatar true ho to Cloudinary se delete karo
    if (removeAvatar === true || removeAvatar === "true") {
      if (user.avatar && user.avatar.startsWith("http")) {
        try {
          await deleteFromCloudinary(user.avatar);
        } catch (err) {
          console.error("Cloudinary delete error:", err);
          // Delete fail ho to bhi aage badho
        }
      }
      user.avatar = "";
    } else if (avatar !== undefined && avatar !== "") {
      user.avatar = avatar;
    }

    // fullName — sirf tab update kro jab non-empty ho
    if (name !== undefined && name.trim() !== "") user.fullName = name.trim();

    if (username !== undefined) user.username = username;
    if (phone    !== undefined) user.phone    = phone;
    if (location !== undefined) user.location = location;
    if (bio      !== undefined) user.bio      = bio;

    // Email change
    if (email && email.trim() !== "" && email !== user.email) {
      const exists = await userModel.findOne({ email });
      if (exists) return res.status(422).json({ success: false, message: "Email already in use" });
      user.email = email;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id:       user._id,
        fullName:  user.fullName,
        username:  user.username,
        email:     user.email,
        phone:     user.phone,
        mobile:    user.mobile,
        location:  user.location,
        bio:       user.bio,
        avatar:    user.avatar,
        role:      user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// ==========================================
// UPLOAD AVATAR (/auth/upload-avatar)
// ✅ UPDATED: Local disk ki jagah Cloudinary pe upload
// User aur Admin dono ke liye kaam karta hai
// ==========================================
export const uploadAvatarController = async (req, res) => {
  try {
    if (!req.files || !req.files.avatar)
      return res.status(400).json({ success: false, message: "No file uploaded" });

    const file = req.files.avatar;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype))
      return res.status(400).json({ success: false, message: "Only images allowed (jpg, png, webp)" });

    if (file.size > 5 * 1024 * 1024)
      return res.status(400).json({ success: false, message: "Image must be under 5MB" });

    // Purani avatar Cloudinary se delete karo (user ya admin dono ka)
    const user = await userModel.findById(req.user._id);
    if (user?.avatar && user.avatar.startsWith("http")) {
      try {
        await deleteFromCloudinary(user.avatar);
      } catch (err) {
        console.error("Old avatar delete error:", err);
      }
    }

    // Nai image Cloudinary pe upload karo — folder "avatars"
    const cloudinaryUrl = await uploadToCloudinary(file.data, "avatars");

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      url: cloudinaryUrl,
    });
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    res.status(500).json({ success: false, message: "Failed to upload avatar" });
  }
};