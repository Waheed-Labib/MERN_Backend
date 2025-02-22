import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // step 1: get user details from frontend
    // step 2: validation - not empty
    // step 3: check if user already exists: username, email
    // step 4: check for images, check for avatar
    // step 5: upload them to cloudinary, check if avatar uploaded
    // step 6: create user object - create entry in db
    // step 7: remove password and refresh token field from response
    // step 8: check for user creation
    // step 9: return res

    // step 1: get user details from frontend
    const { username, fullName, email, password } = req.body;
    console.log("email:", email);

    // step 2: validation - not empty
    if (
        [fullName, username, email, password].some(field => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // step 3: check if user already exists: username, email
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with Email or Username already exist")
    }

    // step 4: check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is required')
    }

    // step 5: upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // step 6: create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        email,
        password,
        username: username.toLowerCase()
    })

    // step 7: remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // step 8: check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // step 9: return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User Registered Successfully')
    )
})

export { registerUser }