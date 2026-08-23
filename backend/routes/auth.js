const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authenticate = require("../middleware/auth");

const router = express.Router();

/* ============================================================
   CREATE JWT
============================================================ */

function createToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString()
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN ||
                "7d"
        }
    );
}

/* ============================================================
   REGISTER
============================================================ */

router.post(
    "/register",
    async (req, res, next) => {
        try {
            const {
                name,
                email,
                password
            } = req.body;

            if (
                typeof name !== "string" ||
                !name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Name is required."
                });
            }

            if (
                typeof email !== "string" ||
                !email.trim() ||
                !email.includes("@")
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Valid email is required."
                });
            }

            if (
                typeof password !== "string" ||
                password.length < 8
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password must contain at least 8 characters."
                });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const existing =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message:
                        "An account with this email already exists."
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const user =
                await User.create({
                    name:
                        name.trim(),

                    email:
                        normalizedEmail,

                    passwordHash
                });

            const token =
                createToken(user);

            return res.status(201).json({
                success: true,

                message:
                    "Account created successfully.",

                token,

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

/* ============================================================
   LOGIN
============================================================ */

router.post(
    "/login",
    async (req, res, next) => {
        try {
            const {
                email,
                password
            } = req.body;

            if (
                typeof email !== "string" ||
                !email.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Email is required."
                });
            }

            if (
                typeof password !== "string" ||
                !password
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password is required."
                });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                })
                .select(
                    "+passwordHash"
                );

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });
            }

            const valid =
                await bcrypt.compare(
                    password,
                    user.passwordHash
                );

            if (!valid) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });
            }

            const token =
                createToken(user);

            return res.json({
                success: true,

                message:
                    "Login successful.",

                token,

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

/* ============================================================
   CURRENT USER
============================================================ */

router.get(
    "/me",
    authenticate,
    async (req, res, next) => {
        try {
            return res.json({
                success: true,

                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,

                    notificationEnabled:
                        Boolean(
                            req.user
                                .notificationEnabled
                        )
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

/* ============================================================
   LOGOUT
============================================================ */

router.post(
    "/logout",
    authenticate,
    async (req, res) => {
        /*
         * JWT authentication is stateless.
         * The frontend should remove the stored token.
         */
        return res.json({
            success: true,
            message:
                "Logged out successfully."
        });
    }
);

module.exports = router;