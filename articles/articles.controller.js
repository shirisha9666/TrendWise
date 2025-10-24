import { scrapeGoogle, scrapeGoogleNewsRSS, scrapeGoogleNewsRSSNew } from "../config/scraper.js"

export const createAticles=async(req,res)=>{
  const {contentType}=req.body
  console.log(req.body)
  try {
    let result=await scrapeGoogleNewsRSSNew(contentType)
    return res.status(200).json(result)
  } catch (error) {
    console.log("createAticles",error)
    return res.status(500).json({message:error.message})
  }
}