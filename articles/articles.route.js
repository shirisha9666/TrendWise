import express from "express"
import { createAticles, getAllArticles } from "./articles.controller.js"

const router=express.Router()

router.post("/create",createAticles)
router.get("/all",getAllArticles)

export default router