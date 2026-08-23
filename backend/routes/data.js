const express = require("express");
const auth = require("../middleware/auth");
const Purchase = require("../models/Purchase");
const {
    formatDateInput
} = require("../utils/dates");

const router = express.Router();

router.get(
    "/export",
    auth,
    async (req, res, next) => {
        try {
            const purchases =
                await Purchase.find({
                    user: req.user._id
                }).lean();

            res.json({
                app: "AfterBuy AI",
                version: "1.0",
                exportedAt:
                    new Date().toISOString(),
                purchases
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/import",
    auth,
    async (req, res, next) => {
        try {
            const data =
                req.body;

            const imported =
                Array.isArray(data)
                    ? data
                    : data.purchases;

            if (
                !Array.isArray(imported)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid backup format."
                });
            }

            for (const item of imported) {
                if (
                    !item.productName ||
                    Number(item.purchasePrice) <= 0 ||
                    !item.purchaseDate ||
                    Number(item.returnPeriod) <= 0 ||
                    Number(item.warranty) <= 0 ||
                    Number(item.currentPrice) <= 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Backup contains invalid purchase data."
                    });
                }
            }

            const purchases =
                imported.map(item => ({
                    user:
                        req.user._id,

                    productName:
                        String(
                            item.productName
                        ).trim(),

                    productUrl:
                        item.productUrl || "",

                    purchasePrice:
                        Number(
                            item.purchasePrice
                        ),

                    purchaseDate:
                        item.purchaseDate,

                    returnPeriod:
                        Number(
                            item.returnPeriod
                        ),

                    warranty:
                        Number(
                            item.warranty
                        ),

                    currentPrice:
                        Number(
                            item.currentPrice
                        ),

                    priceHistory:
                        Array.isArray(
                            item.priceHistory
                        ) &&
                        item.priceHistory.length
                            ? item.priceHistory
                            : [
                                {
                                    date:
                                        item.purchaseDate,
                                    price:
                                        Number(
                                            item.currentPrice
                                        )
                                }
                            ]
                }));

            await Purchase.deleteMany({
                user:
                    req.user._id
            });

            await Purchase.insertMany(
                purchases
            );

            res.json({
                success: true,
                message:
                    `${purchases.length} purchases imported successfully.`,
                count:
                    purchases.length
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;