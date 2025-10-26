import express from "express"
import { getloginUser, googleLogin, signup,createRole } from "./user.controller.js";
import { authorizeRoles, isAuthenticatedUser } from "../config/middlware.js";

const router=express.Router()

router
  .route("/add")
  .post(isAuthenticatedUser, authorizeRoles("admin", "Customer"), signup);

  router
  .route("/google")
  .get(googleLogin);

  
  router
  .route("/login/:id")
  .get(getloginUser);

    router
  .route("/role")
  .put(createRole);




export default router