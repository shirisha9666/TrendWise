// server/db/db.js
import mongoose from "mongoose";

export const dbConnect = async () => {
  try {
    const dbUrl = process.env.MONGO_URL;
    if (!dbUrl) throw new Error("MONGO_URL is not defined in .env");

    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error(" MongoDB connection error:", error.message);
    process.exit(1); // exit process if DB connection fails
  }
};
