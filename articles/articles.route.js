import express from "express"
import { createAticles } from "./articles.controller.js"

const router=express.Router()

router.post("/create",createAticles)

export default router