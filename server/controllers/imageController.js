import axios from 'axios';
import FormData from 'form-data';
import userModel from '../models/userModel.js';

export const generateImage = async (req, res) => {
  try {
    const userId = req.userId; // ✅ from auth middleware
    const { prompt } = req.body;

    if (!prompt) return res.json({ success: false, message: "Prompt is required" });

    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    if (user.creditBalance <= 0) {
      return res.json({ success: false, message: "Insufficient credits", creditBalance: user.creditBalance });
    }

    // Prepare FormData for ClipDrop API
    const formData = new FormData();
    formData.append('prompt', prompt);

    const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
      headers: {
        'x-api-key': process.env.CLIPDROP_API,
        ...formData.getHeaders(),
      },
      responseType: 'arraybuffer'
    });

    const base64Image = Buffer.from(data, 'binary').toString('base64');
    const resultImage = `data:image/png;base64,${base64Image}`;

    // Deduct credit
    user.creditBalance -= 1;
    await user.save();

    res.json({
      success: true,
      message: "Image generated",
      creditBalance: user.creditBalance,
      resultImage, // ✅ matches frontend
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
