import { Article } from "../articles/articles.model.js"
import { Comment } from "./comment.model.js"

export const createComment =async(req,res)=>{
    const {id}=req.params // articlId
    const {comment,userId}=req.body
    try {
     
        const commentdata=await Article.findById(id)
        if(!commentdata){
            return res.status(404).json({message:"Article not found"})
        }
        const data={
            articleId:id,
            userId,
            comment
        }
       const newComment = await Comment.create(data);
return res.status(200).json({ 
  message: "Comment Created Successfully", 
  comment: newComment 
});
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
        const comment=await Comment.findOne({userId:id})
        if(!comment){
            return res.status(404).json({message:"Comment not found"})
        }
       let commentHistroy= await Comment.find({userId:id}).populate("articleId").populate("userId")
        return res.status(200).json({message:"Comment Fetchd Succssfully",commentHistroy})
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}

export const likeArticle = async (req, res) => {
  try {
    const { id } = req.params; // article ID
    const userId = req.body.userId; // user who is liking

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Initialize likes array if not present
    if (!article.likes) article.likes = [];

    // Toggle like
    const index = article.likes.indexOf(userId);
    if (index === -1) {
      // user has not liked yet → add
      article.likes.push(userId);
    } else {
      // user already liked → remove
      article.likes.splice(index, 1);
    }

    await article.save();

    return res.status(200).json({
      message: index === -1 ? "Article liked successfully" : "Article unliked successfully",
      likes: article.likes,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
