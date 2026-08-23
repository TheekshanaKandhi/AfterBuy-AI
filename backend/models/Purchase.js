const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);

const purchaseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        productName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },

        productUrl: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2000
        },

        purchasePrice: {
            type: Number,
            required: true,
            min: 0.01
        },

        purchaseDate: {
            type: String,
            required: true
        },

        returnPeriod: {
            type: Number,
            required: true,
            min: 1
        },

        warranty: {
            type: Number,
            required: true,
            min: 1
        },

        currentPrice: {
            type: Number,
            required: true,
            min: 0.01
        },

        priceHistory: {
            type: [priceHistorySchema],
            default: []
        },

        lastReminderDate: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

purchaseSchema.index({
    user: 1,
    purchaseDate: -1
});

module.exports = mongoose.model(
    "Purchase",
    purchaseSchema
);