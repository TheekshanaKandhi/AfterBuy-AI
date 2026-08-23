const express = require("express");
const Purchase = require("../models/Purchase");
const auth = require("../middleware/auth");
const {
    getReturnDeadline,
    getWarrantyDeadline,
    getDaysRemaining
} = require("../utils/dates");
const {
    getSavings
} = require("../services/aiDecisionEngine");

const router = express.Router();

router.get(
    "/",
    auth,
    async (req, res, next) => {
        try {
            const purchases =
                await Purchase.find({
                    user: req.user._id
                });

            let totalSavings = 0;
            let totalPurchasePrice = 0;

            let returnsSoon = 0;
            let warrantiesSoon = 0;

            let activeReturns = 0;
            let activeWarranties = 0;

            let priceDrops = 0;

            for (const purchase of purchases) {
                const savings =
                    getSavings(purchase);

                totalSavings += savings;

                totalPurchasePrice +=
                    Number(
                        purchase.purchasePrice
                    );

                const returnDays =
                    getDaysRemaining(
                        getReturnDeadline(
                            purchase
                        )
                    );

                const warrantyDays =
                    getDaysRemaining(
                        getWarrantyDeadline(
                            purchase
                        )
                    );

                if (returnDays > 0) {
                    activeReturns++;
                }

                if (warrantyDays > 0) {
                    activeWarranties++;
                }

                if (
                    returnDays > 0 &&
                    returnDays <= 7
                ) {
                    returnsSoon++;
                }

                if (
                    warrantyDays > 0 &&
                    warrantyDays <= 30
                ) {
                    warrantiesSoon++;
                }

                if (savings > 0) {
                    priceDrops++;
                }
            }

            const averagePrice =
                purchases.length
                    ? totalPurchasePrice /
                      purchases.length
                    : 0;

            res.json({
                success: true,
                dashboard: {
                    totalPurchases:
                        purchases.length,

                    totalSavings,

                    returnsSoon,

                    warrantiesSoon,

                    averagePrice,

                    priceDrops,

                    activeReturns,

                    activeWarranties
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;