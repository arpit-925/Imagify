import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Please provide all required fields" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      creditBalance: 5, // ✅ Default credits on register
    });

    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        creditBalance: user.creditBalance,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();
    const user = await userModel.findOne({ email });

    if (!user) return res.json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        creditBalance: user.creditBalance,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const userCredits = async (req, res) => {
  try {
    // ✅ Fix: get userId from middleware, not req.body
    const userId = req.userId;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      credits: user.creditBalance,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        creditBalance: user.creditBalance,
      },
    });
  } catch (error) {
    console.error("Error fetching user credits:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { registerUser, loginUser, userCredits };
