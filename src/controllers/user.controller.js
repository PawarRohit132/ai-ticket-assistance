import { User } from "../models/user.model.js";
import { inngest } from "../inngest/client.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "../utils/sendEmail.js";

export const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found when generating tokens");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Something went wrong while generating tokens");
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, password, skills = [], role } = req.body;

    if ([email, password].some((field) => field?.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existedUser = await User.findOne({
      email,
    });
    if (existedUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      email,
      password,
      skills,
      role,
      isEmailVerified: false,
    });

    user.emailVerificationOTP = user.generateEmailOTP();
    user.emailVerificationOTPExpiry = user.generateEmailOTPExpiry();

    await user.save();

    await sendOTPEmail(user.email, user.emailVerificationOTP);

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );
    if (!createdUser) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong while creating User",
      });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          createdUser,
          "OTP sent to your email. Please verify your email.",
        ),
      );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "something went wrong",
    });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "email and password are required",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Invalid details User not found",
    });
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    return res.status(400).json({
      success: false,
      message: "password incorrect",
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!loggedInUser) {
    return res.status(404).json({
      success: false,
      message: "User not exist",
    });
  }

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logedin",
      ),
    );
};

export const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Log Out"));
};

export const updateUser = async (req, res) => {
  const { email, skills = [], role } = req.body;

  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      role: role || user.role,
      skills: skills,
    },
    {
      new: true,
    },
  ).select("-password -refereshToken");

  if (!updatedUser) {
    return res.status(500).json({
      success: false,
      message: "Something wents wrong while updating user",
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Account details changed successfully"),
    );
};

export const getUsers = async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Users fetched successfully"));
};

export const getAllUsers = async (req, res) => {
  try {
    const user = req.user;
    console.log(user);

    if (user.role !== "admin") {
      return res.status(404).json({
        success: false,
        message: "This feature can only use admin ",
      });
    }
    const allUsers = await User.find({});

    return res
      .status(200)
      .json(new ApiResponse(200, allUsers, "All users fetched"));
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error?.message || "something went wrong while fetched all users",
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({
      success: false,
      message: "!unauthorised request",
    });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    if (!decodedToken) {
      return res.status(401).json({
        success: false,
        message: "!unauthorised request",
      });
    }

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "invalid refreshToken",
      });
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is expired or used",
      });
    }

    const { accessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user?._id,
    );

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "refreshToken refreshed",
        ),
      );
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error?.message || "invalid refresh token",
    });
  }
};

export const changeCurrentPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password change successfully"));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "something went wrong",
    });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (req.user?._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You can not delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User deleted successfully"));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "something went wrong",
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: "Email already verified",
    });
  }

  if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {

      return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  if (user.emailVerificationOTPExpiry < new Date()) {
    
    await User.findByIdAndDelete(userId)
    
    return res.status(400).json({
      success: false,
      message: "OTP expired",
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationOTPExpiry = undefined;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
};
