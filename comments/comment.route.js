import express from "express"
import { createComment , deelteComment, likeArticle, UpdateComment, userCommentHistroy } from "./comment.controller.js"

const router=express.Router()

router.post("/create/:id",createComment )
router.put("/update/:id",UpdateComment)
router.get("/all/:id",userCommentHistroy)
router.delete("/delete/:id",deelteComment)
router.post("/like/:id",likeArticle)

export default router