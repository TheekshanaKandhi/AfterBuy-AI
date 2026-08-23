const {
    getReturnDeadline,
    getWarrantyDeadline,
    getDaysRemaining
} = require("../utils/dates");

function getSavings(purchase) {
    const difference =
        Number(purchase.purchasePrice) -
        Number(purchase.currentPrice);

    return difference > 0
        ? difference
        : 0;
}

function calculateAIDecision(purchase) {
    const savings = getSavings(purchase);

    const purchasePrice =
        Number(purchase.purchasePrice);

    const savingsPercent =
        purchasePrice > 0
            ? (savings / purchasePrice) * 100
            : 0;

    const returnDays =
        getDaysRemaining(
            getReturnDeadline(purchase)
        );

    const warrantyDays =
        getDaysRemaining(
            getWarrantyDeadline(purchase)
        );

    let score = 0;

    const factors = [];

    if (savingsPercent >= 20) {
        score += 40;

        factors.push({
            name: "Price Drop",
            value: "Very high",
            positive: true
        });
    } else if (savingsPercent >= 10) {
        score += 30;

        factors.push({
            name: "Price Drop",
            value: "High",
            positive: true
        });
    } else if (savingsPercent >= 5) {
        score += 20;

        factors.push({
            name: "Price Drop",
            value: "Moderate",
            positive: true
        });
    } else if (savings > 0) {
        score += 10;

        factors.push({
            name: "Price Drop",
            value: "Small",
            positive: true
        });
    } else {
        factors.push({
            name: "Price Drop",
            value: "None",
            positive: false
        });
    }

    if (
        returnDays > 0 &&
        returnDays <= 3
    ) {
        score += 30;

        factors.push({
            name: "Return Window",
            value: `${returnDays} days left`,
            positive: true
        });
    } else if (
        returnDays > 0 &&
        returnDays <= 7
    ) {
        score += 20;

        factors.push({
            name: "Return Window",
            value: `${returnDays} days left`,
            positive: true
        });
    } else if (returnDays > 7) {
        score += 10;

        factors.push({
            name: "Return Window",
            value: `${returnDays} days left`,
            positive: true
        });
    } else {
        factors.push({
            name: "Return Window",
            value: "Expired",
            positive: false
        });
    }

    if (
        warrantyDays > 0 &&
        warrantyDays <= 30
    ) {
        score += 15;

        factors.push({
            name: "Warranty",
            value: `${warrantyDays} days left`,
            positive: true
        });
    } else if (warrantyDays > 30) {
        score += 5;

        factors.push({
            name: "Warranty",
            value: `${warrantyDays} days left`,
            positive: true
        });
    } else {
        factors.push({
            name: "Warranty",
            value: "Expired",
            positive: false
        });
    }

    let title;
    let message;
    let priority;

    if (savings <= 0) {
        priority = "LOW";

        title = "No action required";

        message =
            "The current price is not lower than your purchase price. Continue monitoring the product.";
    } else if (
        score >= 65 &&
        returnDays > 0
    ) {
        priority = "HIGH";

        title =
            "Contact the seller immediately";

        message =
            "A meaningful price drop has been detected while your return period is still active. Ask the seller about a price adjustment, refund of the difference, or return/replacement options.";
    } else if (
        savingsPercent >= 10 &&
        returnDays > 0
    ) {
        priority = "MEDIUM";

        title =
            "Check for a price adjustment";

        message =
            "The product is now significantly cheaper. Because your return period is active, check the seller's price-adjustment policy.";
    } else if (
        savings > 0 &&
        returnDays <= 0
    ) {
        priority = "MEDIUM";

        title =
            "Check price-adjustment policy";

        message =
            "Your return window has expired, but the current price is lower. Check whether the seller offers post-purchase price protection.";
    } else {
        priority = "LOW";

        title = "Monitor the price";

        message =
            "There is a price difference, but the situation does not currently require urgent action.";
    }

    return {
        score: Math.min(score, 100),
        priority,
        title,
        message,
        savings,
        savingsPercent,
        returnDays,
        warrantyDays,
        factors
    };
}

module.exports = {
    calculateAIDecision,
    getSavings
};