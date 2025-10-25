import express from "express"
import { createAticles, DeletAticles, getAllArticles,updateArticles,ViewAticles } from "./articles.controller.js"

const router=express.Router()

router.post("/create",createAticles)
router.put("/update/:id",updateArticles)
router.get("/all",getAllArticles)
router.get("/get/:id",ViewAticles)
router.delete("/delete/:id",DeletAticles)

export default router  

