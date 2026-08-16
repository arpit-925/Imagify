import axios from 'axios';
import FormData from 'form-data';
import userModel from '../models/userModel.js';

export const generateImage = async (req, res) => {
  try {
    const userId = req.userId; // ✅ from auth middleware
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: "Prompt is required" });
    }

    const apiKey = process.env.CLIPDROP_API;
    if (!apiKey) {
      console.error("CLIPDROP_API is not configured. Add it to server/.env");
      return res.status(500).json({ success: false, message: "Image generation service is not configured on the server" });
    }

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.creditBalance <= 0) {
      return res.status(403).json({ success: false, message: "Insufficient credits", creditBalance: user.creditBalance });
    }

    // Prepare FormData for ClipDrop API
    const formData = new FormData();
    formData.append('prompt', prompt.trim());

    const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
      headers: {
        'x-api-key': apiKey,
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
    console.error("IMAGE GENERATION ERROR:", error?.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data ? Buffer.from(error.response.data).toString('utf8').slice(0, 500) : null,
    } : error.message);

    if (error?.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        return res.status(status).json({ success: false, message: "Image generation service rejected the request. Check the configured API key." });
      }
      if (status === 429) {
        return res.status(429).json({ success: false, message: "Image generation rate limit reached. Please try again later." });
      }
      return res.status(502).json({ success: false, message: "Image generation service error" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};
