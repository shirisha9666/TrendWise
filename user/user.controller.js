import { oauth2client } from "../config/googleConfig.js";
import sendToken from "../config/jwttoken.js";
import { User } from "./user.model.js";
import axios from "axios";

export const googleSigninAndLogin = async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res
      .status(400)
      .json({ success: false, message: "Google idToken  is required" });
  }
  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;
    // Check if the user already exists in your database
    let user = await User.findOne({ email });
    if (!user) {
      // First-time login: create a new user
      user = await User.create({
        name,
        email,
        googleId: uid,

        avatar: {
          public_id: uid,
          url: picture,
        },
      });
    }

    console.log("google authtication doing.....");
    sendToken(user, 200, res);
  } catch (error) {
    console.error("Error verifying ID token:", error);
    if (error.code === "auth/id-token-expired") {
      return res
        .status(401)
        .json({ success: false, message: "id-token-expired" });
    }
    if (error.code === "auth/invalid-id-token") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid-id-token-expired" });
    }
    if (error.message?.includes("Decoding Firebase ID token failed")) {
      return res
        .status(401)
        .json({ success: false, message: "Decoding Firebase ID token failed" });
    }
    if (error.message?.includes("Firebase ID token has expired")) {
      return res
        .status(401)
        .json({ success: false, message: "Firebase ID token has expired" });
    }
    if (error.message?.includes("Firebase ID token is invalid")) {
      return res
        .status(401)
        .json({ success: false, message: "Firebase ID token is invalid" });
    }
    if (error.code === "auth/argument-error") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Google ID token format. Please retrieve a valid token from Firebase client SDK.",
      });
    }

    res
      .status(401)
      .json({ success: false, message: "Google Authentication failed" });
    // res.status(401).json({ success: false, message: error.message });
  }
};

export const signup = async (req, res) => {
  const { name, email, avatar } = req.body;

  try {
    const data = { name, email, role };
    await User.create(data);
  } catch (error) {
    console.log("error in signup");
    return res.status(500).json({ message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { code } = req.query;
    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);
    const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);
    const { name, email, picture } = userRes.data;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, avatar:picture });
    }
    sendToken(user, 200, res);
    // return res.status(200).json({message:"Success",token,user})
  } catch (error) {
    console.log("error in googleLogin", error);
    return res.status(500).json({ message: error.message });
  }
};
