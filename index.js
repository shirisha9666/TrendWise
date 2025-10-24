import dotenv from "dotenv";
dotenv.config();

import express from "express";

import cors from "cors";
import { dbConnect } from "./db/db.js";
import CommentRoute from "./comments/comment.route.js";
import ArticleRoute from "./articles/articles.route.js";
import UserRoute from "./user/user.route.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
dbConnect();

// routes

app.use("/comment", CommentRoute);
app.use("/article", ArticleRoute);
app.use("/user", UserRoute);
