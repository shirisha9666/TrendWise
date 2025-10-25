import express from "express"
import { createCommet, deelteComment, LikeArticle, UpdateComment, userCommentHistroy } from "./comment.controller.js"

const router=express.Router()

router.post("/create/:id",createCommet)
router.put("/update/:id",UpdateComment)
router.post("/comment/all/:id",userCommentHistroy)
router.delete("/delete/:id",deelteComment)
router.post("/like/:id",LikeArticle)

export default router