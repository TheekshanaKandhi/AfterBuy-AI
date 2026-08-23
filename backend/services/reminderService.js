const Purchase = require("../models/Purchase");
const User = require("../models/User");

const {
    formatDateInput,
    getReturnDeadline,
    getWarrantyDeadline,
    getDaysRemaining
} = require("../utils/dates");

const {
    getSavings
} = require("./aiDecisionEngine");

async function runReminderCheck() {
    console.log(
        "[AfterBuy AI] Running reminder check..."
    );

    const users =
        await User.find({
            notificationEnabled: true
        });

    const today =
        formatDateInput(
            new Date()
        );

    for (const user of users) {
        const purchases =
            await Purchase.find({
                user: user._id
            });

        const reminders = [];

        for (const purchase of purchases) {
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

            const savings =
                getSavings(purchase);

            if (
                returnDays > 0 &&
                returnDays <= 3
            ) {
                reminders.push(
                    `${purchase.productName}: return window closes in ${returnDays} days.`
                );
            }

            if (
                warrantyDays > 0 &&
                warrantyDays <= 7
            ) {
                reminders.push(
                    `${purchase.productName}: warranty expires in ${warrantyDays} days.`
                );
            }

            if (savings > 0) {
                reminders.push(
                    `${purchase.productName}: price dropped by ₹${savings.toLocaleString("en-IN")}.`
                );
            }
        }

        if (reminders.length) {
            /*
             * This is intentionally logged for now.
             *
             * A production deployment should connect this
             * function to an email/push notification provider.
             */
            console.log(
                `[Reminder for ${user.email}]`,
                reminders.join(" ")
            );

            await Purchase.updateMany(
                {
                    user: user._id
                },
                {
                    $set: {
                        lastReminderDate:
                            today
                    }
                }
            );
        }
    }
}

module.exports = {
    runReminderCheck
};