function parseDate(dateString) {
    return new Date(`${dateString}T00:00:00`);
}

function formatDateInput(date = new Date()) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getReturnDeadline(purchase) {
    const deadline = parseDate(
        purchase.purchaseDate
    );

    deadline.setDate(
        deadline.getDate() +
        Number(purchase.returnPeriod)
    );

    return deadline;
}

function getWarrantyDeadline(purchase) {
    const deadline = parseDate(
        purchase.purchaseDate
    );

    deadline.setMonth(
        deadline.getMonth() +
        Number(purchase.warranty)
    );

    return deadline;
}

function getDaysRemaining(deadline) {
    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const difference =
        deadline.getTime() -
        today.getTime();

    return Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
    );
}

module.exports = {
    parseDate,
    formatDateInput,
    getReturnDeadline,
    getWarrantyDeadline,
    getDaysRemaining
};