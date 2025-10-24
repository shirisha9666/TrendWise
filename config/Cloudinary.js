import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import path from "path";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Framejii",
  },
});



export const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("File type not supported!"), false);
      return;
    }
    cb(null, true);
  },
});

export const deleteOldImage = async (public_id) => {
  if (!public_id) return;
  try {
    await cloudinary.v2.uploader.destroy(public_id);
    console.log(" Deleted old image:", public_id);
  } catch (err) {
    console.error("Failed to delete old image:", err.message);
  }
};
export default cloudinary;
