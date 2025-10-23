import express from "express"
import { googleLogin, signup } from "./user.controller.js";
import { authorizeRoles, isAuthenticatedUser } from "../config/middlware.js";

const router=express.Router()

router
  .route("/add")
  .post(isAuthenticatedUser, authorizeRoles("admin", "Customer"), signup);

  router
  .route("/google")
  .get(googleLogin);


export default router