const express = require("express");
const auth = require("../middleware/auth");
const Purchase = require("../models/Purchase");
const {
    calculateAIDecision
} = require("../services/aiDecisionEngine");

const router = express.Router();

router.get(
    "/:purchaseId",
    auth,
    async (req, res, next) => {
        try {
            const purchase =
                await Purchase.findOne({
                    _id:
                        req.params.purchaseId,
                    user:
                        req.user._id
                });

            if (!purchase) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase not found."
                });
            }

            const recommendation =
                calculateAIDecision(
                    purchase
                );

            res.json({
                success: true,
                recommendation
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;