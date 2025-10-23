import { User } from "../user/user.model.js";

export const isAuthenticatedUser = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(400).json({
        success: false,
        message: "Login to Access this resource",
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    let decodedData;
    console.log("token", token);
    if (token.split(".").length === 3) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        decodedData = ticket.getPayload();
      } catch (error) {
        decodedData = jwt.verify(token, process.env.JWT_SECRET);
      }
    } else {
      decodedData = jwt.verify(token, process.env.JWT_SECRET);
    }
    if (!decodedData) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }
    console.log("decodedData", decodedData);
    const userId = decodedData.id || decodedData._id; // _id for your login, sub for Google
    console.log(`google id ${decodedData._id}`);
    console.log(`user id ${decodedData.id}`);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("isAuthenticatedUser", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};


export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {

            return res.status(401).json({ message: `Role: ${req.user.role} is not allowed to access this resouce ` })
        }
        if (!roles.includes(req.user.role)) {


            return res.status(403).json({ message: `Role: ${req.user.role} is not allowed to access this resouce ` })
        }
        next()
    }

}