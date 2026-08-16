import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRoutes.js';
import imageRouter from './routes/imageRoutes.js'; // ✅ import image router

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.json());

// Enable CORS for frontend
app.use(cors({
  origin: [ 'https://picto-text-front.onrender.com', 'http://localhost:5173' ],
  credentials: true,
}));

// Connect to MongoDB
(async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
})();

// Routes
app.use('/api/users', userRouter);
app.use('/api/image', imageRouter); // ✅ register image router

app.get('/', (req, res) => res.send('Hello, World!'));

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
