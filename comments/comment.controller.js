import { Article } from "../articles/articles.model.js"
import { Comment } from "./comment.model.js"

export const createCommet=async(req,res)=>{
    const {id}=req.params // articlId
    const {comment,userId}=req.body
    try {
        const {id}=req.params
        const commentdata=await Article.findById(id)
        if(!commentdata){
            return res.status(404).json({message:"Article not found"})
        }
        const data={
            articleId:id,
            userId,
            comment
        }
        await Comment.create(data)
        return res.status(200).json({message:"Comment Deleted Succssfully"})
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}



export const deelteComment=async(req,res)=>{
    try {
        const {id}=req.params
        const comment=await Comment.findById(id)
        if(!comment){
            return res.status(404).json({message:"Comment not found"})
        }
        await Comment.findByIdAndDelete(id)
        return res.status(200).json({message:"Comment Deleted Succssfully"})
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}

export const UpdateComment=async(req,res)=>{
    const {id}=req.params // articlId
    const {comment,userId}=req.body
    try {
        const {id}=req.params
        const commentdata=await Article.findById(id)
        if(!commentdata){
            return res.status(404).json({message:"Article not found"})
        }
        const data={
            articleId:id,
            userId,
            comment
        }
        await Comment.findByIdAndUpdate(userId,data,{new:true})
        return res.status(200).json({message:"Comment Update Succssfully"})
     
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}

export const userCommentHistroy=async(req,res)=>{
    try {
        const {id}=req.params //userId
        const comment=await Comment.findById(id)
        if(!comment){
            return res.status(404).json({message:"Comment not found"})
        }
       let commentHistroy= await Comment.find({userId:id})
        return res.status(200).json({message:"Comment Updated Succssfully",commentHistroy})
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}

export const LikeArticle=async(req,res)=>{
    try {
        const {id}=req.params //article id
        const comment=await Article.findById(id)
        if(!comment){
            return res.status(404).json({message:"Article not found"})
        }
        await Article.findByIdAndDelete(id)
        return res.status(200).json({message:"Comment Deleted Succssfully"})
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}