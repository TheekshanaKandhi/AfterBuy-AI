const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./database");

const app = express();

const PORT = 3001;
const JWT_SECRET =
    process.env.JWT_SECRET || "afterbuy-development-secret-change-this";

app.use(cors());
app.use(express.json());

function authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const token = header.substring(7);

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}

/* -------------------------
   HEALTH
------------------------- */

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "AfterBuy AI backend is running!",
        database: "connected"
    });
});

/* -------------------------
   REGISTER
------------------------- */

app.post("/api/auth/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const existing = db
            .prepare("SELECT id FROM users WHERE email = ?")
            .get(email.toLowerCase());

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const passwordHash =
            await bcrypt.hash(password, 10);

        const result = db.prepare(`
            INSERT INTO users
            (name, email, password_hash)
            VALUES (?, ?, ?)
        `).run(
            name,
            email.toLowerCase(),
            passwordHash
        );

        const token = jwt.sign(
            {
                id: result.lastInsertRowid,
                email: email.toLowerCase()
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: result.lastInsertRowid,
                name,
                email: email.toLowerCase()
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
});

/* -------------------------
   LOGIN
------------------------- */

app.post("/api/auth/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        const user = db.prepare(`
            SELECT *
            FROM users
            WHERE email = ?
        `).get(email?.toLowerCase());

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const valid =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!valid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
});

/* -------------------------
   GET PURCHASES
------------------------- */

app.get("/api/purchases", authenticate, (req, res) => {

    const purchases = db.prepare(`
        SELECT *
        FROM purchases
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).all(req.user.id);

    const historyQuery = db.prepare(`
        SELECT price, recorded_at
        FROM price_history
        WHERE purchase_id = ?
        ORDER BY recorded_at ASC
    `);

    const result = purchases.map(purchase => ({
        ...purchase,
        priceHistory:
            historyQuery.all(purchase.id)
    }));

    res.json({
        success: true,
        purchases: result
    });
});

/* -------------------------
   CREATE PURCHASE
------------------------- */

app.post("/api/purchases", authenticate, (req, res) => {

    const {
        product_name,
        purchase_price,
        purchase_date,
        return_period,
        warranty_period,
        current_price,
        return_deadline,
        warranty_deadline,
        notes
    } = req.body;

    if (
        !product_name ||
        purchase_price == null ||
        current_price == null ||
        !purchase_date
    ) {
        return res.status(400).json({
            success: false,
            message: "Required purchase information missing"
        });
    }

    const transaction = db.transaction(() => {

        const result = db.prepare(`
            INSERT INTO purchases (
                user_id,
                product_name,
                purchase_price,
                purchase_date,
                return_period,
                warranty_period,
                current_price,
                return_deadline,
                warranty_deadline,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            req.user.id,
            product_name,
            Number(purchase_price),
            purchase_date,
            Number(return_period || 0),
            Number(warranty_period || 0),
            Number(current_price),
            return_deadline || null,
            warranty_deadline || null,
            notes || ""
        );

        db.prepare(`
            INSERT INTO price_history
            (purchase_id, price)
            VALUES (?, ?)
        `).run(
            result.lastInsertRowid,
            Number(current_price)
        );

        return result.lastInsertRowid;
    });

    const id = transaction();

    const purchase = db.prepare(`
        SELECT *
        FROM purchases
        WHERE id = ?
    `).get(id);

    res.status(201).json({
        success: true,
        purchase
    });
});

/* -------------------------
   UPDATE PURCHASE
------------------------- */

app.put("/api/purchases/:id", authenticate, (req, res) => {

    const id = Number(req.params.id);

    const existing = db.prepare(`
        SELECT *
        FROM purchases
        WHERE id = ? AND user_id = ?
    `).get(id, req.user.id);

    if (!existing) {
        return res.status(404).json({
            success: false,
            message: "Purchase not found"
        });
    }

    const {
        product_name,
        purchase_price,
        purchase_date,
        return_period,
        warranty_period,
        current_price,
        return_deadline,
        warranty_deadline,
        notes
    } = req.body;

    db.prepare(`
        UPDATE purchases
        SET
            product_name = ?,
            purchase_price = ?,
            purchase_date = ?,
            return_period = ?,
            warranty_period = ?,
            current_price = ?,
            return_deadline = ?,
            warranty_deadline = ?,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    `).run(
        product_name,
        Number(purchase_price),
        purchase_date,
        Number(return_period || 0),
        Number(warranty_period || 0),
        Number(current_price),
        return_deadline || null,
        warranty_deadline || null,
        notes || "",
        id,
        req.user.id
    );

    if (
        Number(current_price) !==
        Number(existing.current_price)
    ) {
        db.prepare(`
            INSERT INTO price_history
            (purchase_id, price)
            VALUES (?, ?)
        `).run(
            id,
            Number(current_price)
        );
    }

    const purchase = db.prepare(`
        SELECT *
        FROM purchases
        WHERE id = ?
    `).get(id);

    res.json({
        success: true,
        purchase
    });
});

/* -------------------------
   DELETE PURCHASE
------------------------- */

app.delete("/api/purchases/:id", authenticate, (req, res) => {

    const result = db.prepare(`
        DELETE FROM purchases
        WHERE id = ? AND user_id = ?
    `).run(
        Number(req.params.id),
        req.user.id
    );

    if (result.changes === 0) {
        return res.status(404).json({
            success: false,
            message: "Purchase not found"
        });
    }

    res.json({
        success: true,
        message: "Purchase deleted"
    });
});

/* -------------------------
   PRICE HISTORY
------------------------- */

app.get(
    "/api/purchases/:id/history",
    authenticate,
    (req, res) => {

        const purchase = db.prepare(`
            SELECT id
            FROM purchases
            WHERE id = ? AND user_id = ?
        `).get(
            Number(req.params.id),
            req.user.id
        );

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found"
            });
        }

        const history = db.prepare(`
            SELECT price, recorded_at
            FROM price_history
            WHERE purchase_id = ?
            ORDER BY recorded_at ASC
        `).all(purchase.id);

        res.json({
            success: true,
            history
        });
    }
);

/* -------------------------
   NOTIFICATIONS
------------------------- */

app.get("/api/notifications", authenticate, (req, res) => {

    const notifications = db.prepare(`
        SELECT *
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({
        success: true,
        notifications
    });
});

app.listen(PORT, () => {
    console.log(
        `AfterBuy AI API running at http://localhost:${PORT}`
    );
});