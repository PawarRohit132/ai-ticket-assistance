import express from "express"
import {verifyJWT} from "../middlwares/auth.middlerware.js"
import {createUser,deleteUser, loginUser, logoutUser, updateUser, getUsers, refreshAccessToken, getAllUsers, changeCurrentPassword, verifyEmail} from "../controllers/user.controller.js"

const router = express.Router()

router.post("/signup",createUser)
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail)

//secure routes
router.post("/logout", verifyJWT, logoutUser);
router.put("/update-user-details", verifyJWT, updateUser);
router.get("/getUsers", verifyJWT, getUsers);
router.get("/getAllUsers", verifyJWT, getAllUsers )
router.post("/refreshAccessToken", verifyJWT, refreshAccessToken);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.delete("/delete-user/:id", verifyJWT, deleteUser );


export default router