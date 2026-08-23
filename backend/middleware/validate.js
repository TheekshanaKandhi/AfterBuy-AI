function validatePurchaseBody(req, res, next) {
    const {
        productName,
        purchasePrice,
        purchaseDate,
        returnPeriod,
        warranty,
        currentPrice
    } = req.body;

    if (
        typeof productName !== "string" ||
        !productName.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Product name is required."
        });
    }

    if (
        !Number.isFinite(Number(purchasePrice)) ||
        Number(purchasePrice) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Purchase price must be greater than zero."
        });
    }

    if (
        typeof purchaseDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)
    ) {
        return res.status(400).json({
            success: false,
            message: "Purchase date must use YYYY-MM-DD format."
        });
    }

    if (
        !Number.isInteger(Number(returnPeriod)) ||
        Number(returnPeriod) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Return period must be greater than zero."
        });
    }

    if (
        !Number.isInteger(Number(warranty)) ||
        Number(warranty) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Warranty must be greater than zero."
        });
    }

    if (
        !Number.isFinite(Number(currentPrice)) ||
        Number(currentPrice) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Current price must be greater than zero."
        });
    }

    next();
}

module.exports = {
    validatePurchaseBody
};