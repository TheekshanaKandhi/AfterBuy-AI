const mysql = require("mysql2/promise");

let pool;

async function connectDatabase() {
    try {
        if (!process.env.DB_HOST) {
            throw new Error("DB_HOST is missing.");
        }

        if (!process.env.DB_USER) {
            throw new Error("DB_USER is missing.");
        }

        if (!process.env.DB_PASSWORD) {
            throw new Error("DB_PASSWORD is missing.");
        }

        if (!process.env.DB_NAME) {
            throw new Error("DB_NAME is missing.");
        }

        pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,

            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const connection = await pool.getConnection();

        await connection.ping();

        connection.release();

        console.log("✅ MySQL connection successful");

        return pool;

    } catch (error) {
        console.error("❌ MySQL connection failed:");
        console.error(error.message);

        throw error;
    }
}

function getDatabase() {
    if (!pool) {
        throw new Error(
            "MySQL database has not been initialized. Call connectDatabase() first."
        );
    }

    return pool;
}

module.exports = connectDatabase;
module.exports.getDatabase = getDatabase;
module.exports.pool = () => pool;