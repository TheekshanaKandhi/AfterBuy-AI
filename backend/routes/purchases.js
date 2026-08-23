const express = require("express");
const Purchase = require("../models/Purchase");
const auth = require("../middleware/auth");
const {
    validatePurchaseBody
} = require("../middleware/validate");
const {
    formatDateInput
} = require("../utils/dates");

const router = express.Router();

router.use(auth);

function sanitizePurchaseInput(body) {
    return {
        productName:
            String(body.productName).trim(),

        productUrl:
            body.productUrl
                ? String(body.productUrl).trim()
                : "",

        purchasePrice:
            Number(body.purchasePrice),

        purchaseDate:
            body.purchaseDate,

        returnPeriod:
            Number(body.returnPeriod),

        warranty:
            Number(body.warranty),

        currentPrice:
            Number(body.currentPrice)
    };
}

router.get("/", async (req, res, next) => {
    try {
        const purchases =
            await Purchase.find({
                user: req.user._id
            }).sort({
                purchaseDate: -1
            });

        res.json({
            success: true,
            purchases
        });
    } catch (error) {
        next(error);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const purchase =
            await Purchase.findOne({
                _id: req.params.id,
                user: req.user._id
            });

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message:
                    "Purchase not found."
            });
        }

        res.json({
            success: true,
            purchase
        });
    } catch (error) {
        next(error);
    }
});

router.post(
    "/",
    validatePurchaseBody,
    async (req, res, next) => {
        try {
            const input =
                sanitizePurchaseInput(req.body);

            const purchase =
                await Purchase.create({
                    user: req.user._id,
                    ...input,
                    priceHistory: [
                        {
                            date:
                                input.purchaseDate,
                            price:
                                input.currentPrice
                        }
                    ]
                });

            res.status(201).json({
                success: true,
                purchase
            });
        } catch (error) {
            next(error);
        }
    }
);

router.put(
    "/:id",
    validatePurchaseBody,
    async (req, res, next) => {
        try {
            const purchase =
                await Purchase.findOne({
                    _id: req.params.id,
                    user: req.user._id
                });

            if (!purchase) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase not found."
                });
            }

            const input =
                sanitizePurchaseInput(req.body);

            const oldPrice =
                Number(
                    purchase.currentPrice
                );

            purchase.productName =
                input.productName;

            purchase.productUrl =
                input.productUrl;

            purchase.purchasePrice =
                input.purchasePrice;

            purchase.purchaseDate =
                input.purchaseDate;

            purchase.returnPeriod =
                input.returnPeriod;

            purchase.warranty =
                input.warranty;

            purchase.currentPrice =
                input.currentPrice;

            if (
                !Array.isArray(
                    purchase.priceHistory
                )
            ) {
                purchase.priceHistory = [];
            }

            if (
                oldPrice !==
                input.currentPrice
            ) {
                purchase.priceHistory.push({
                    date:
                        formatDateInput(
                            new Date()
                        ),
                    price:
                        input.currentPrice
                });
            }

            await purchase.save();

            res.json({
                success: true,
                purchase
            });
        } catch (error) {
            next(error);
        }
    }
);

router.patch(
    "/:id/price",
    async (req, res, next) => {
        try {
            const price =
                Number(
                    req.body.price
                );

            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price must be greater than zero."
                });
            }

            const purchase =
                await Purchase.findOne({
                    _id: req.params.id,
                    user: req.user._id
                });

            if (!purchase) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase not found."
                });
            }

            const oldPrice =
                Number(
                    purchase.currentPrice
                );

            purchase.currentPrice =
                price;

            if (
                !Array.isArray(
                    purchase.priceHistory
                )
            ) {
                purchase.priceHistory = [];
            }

            if (
                oldPrice !== price
            ) {
                purchase.priceHistory.push({
                    date:
                        formatDateInput(
                            new Date()
                        ),
                    price
                });
            }

            await purchase.save();

            res.json({
                success: true,
                purchase
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    "/:id/history",
    async (req, res, next) => {
        try {
            const purchase =
                await Purchase.findOne({
                    _id: req.params.id,
                    user: req.user._id
                });

            if (!purchase) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase not found."
                });
            }

            res.json({
                success: true,
                history:
                    purchase.priceHistory || []
            });
        } catch (error) {
            next(error);
        }
    }
);

router.delete(
    "/:id",
    async (req, res, next) => {
        try {
            const result =
                await Purchase.deleteOne({
                    _id: req.params.id,
                    user: req.user._id
                });

            if (
                result.deletedCount === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase not found."
                });
            }

            res.json({
                success: true,
                message:
                    "Purchase deleted successfully."
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;