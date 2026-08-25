import express from "express";
import { verifyJWT } from "../middlwares/auth.middlerware.js";
import {
  createUser,
  deleteUser,
  loginUser,
  logoutUser,
  updateUser,
  getUsers,
  refreshAccessToken,
  getAllUsers,
  changeCurrentPassword,
  verifyEmail,
  forgottenPassword,
  verifyForgottenPassword,
  setForgottenPassword,
  resendOtp
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/signup", createUser);
router.post("/login", loginUser);
router.post("/forgotten-password", forgottenPassword);
router.post("/verify-otp", verifyForgottenPassword);
router.post("/set-password", setForgottenPassword);
router.post("/resendOtp", resendOtp);

//secure routes
router.post("/verify-email", verifyEmail);
router.post("/logout", verifyJWT, logoutUser);
router.put("/update-user-details", verifyJWT, updateUser);
router.get("/getUsers", verifyJWT, getUsers);
router.get("/getAllUsers", verifyJWT, getAllUsers);
router.post("/refreshAccessToken", verifyJWT, refreshAccessToken);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.delete("/delete-user/:id", verifyJWT, deleteUser);

export default router;
