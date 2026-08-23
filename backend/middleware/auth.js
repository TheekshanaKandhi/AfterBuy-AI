const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticate(req, res, next) {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required."
            });
        }

        const token =
            authHeader.substring(7);

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication token is missing."
            });
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        if (
            !decoded ||
            !decoded.userId
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authentication token."
            });
        }

        const user =
            await User.findById(
                decoded.userId
            );

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "User account no longer exists."
            });
        }

        req.user = user;

        next();

    } catch (error) {
        console.error(
            "Authentication error:",
            error
        );

        if (
            error.name ===
            "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication token has expired."
            });
        }

        if (
            error.name ===
            "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authentication token."
            });
        }

        next(error);
    }
}

module.exports = authenticate;