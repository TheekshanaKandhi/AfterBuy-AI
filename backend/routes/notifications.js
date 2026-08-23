const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

router.get(
    "/status",
    auth,
    async (req, res) => {
        res.json({
            success: true,
            enabled:
                req.user.notificationEnabled
        });
    }
);

router.post(
    "/status",
    auth,
    async (req, res, next) => {
        try {
            const enabled =
                Boolean(
                    req.body.enabled
                );

            req.user.notificationEnabled =
                enabled;

            await req.user.save();

            res.json({
                success: true,
                enabled
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;