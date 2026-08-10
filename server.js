// ==========================================================
// RESTROPRO — BACKEND SERVER
// ==========================================================

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = 3000;


// ==========================================================
// MIDDLEWARE
// ==========================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ==========================================================
// DATABASE
// ==========================================================

const DB_PATH = path.join(
    __dirname,
    "data",
    "database.json"
);


// ==========================================================
// DATABASE READ
// ==========================================================

function readDatabase() {

    try {

        if (!fs.existsSync(DB_PATH)) {

            createDatabase();

        }

        const data =
            fs.readFileSync(
                DB_PATH,
                "utf8"
            );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "Database o'qishda xato:",
            error
        );

        return createDefaultDatabase();

    }

}


// ==========================================================
// DATABASE WRITE
// ==========================================================

function writeDatabase(data) {

    try {

        fs.writeFileSync(
            DB_PATH,
            JSON.stringify(
                data,
                null,
                4
            ),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "Database yozishda xato:",
            error
        );

        return false;

    }

}


// ==========================================================
// DEFAULT DATABASE
// ==========================================================

function createDefaultDatabase() {

    return {

        tables: Array.from(
            { length: 12 },
            (_, index) => ({

                id: index + 1,

                status: "free",

                room: "Asosiy zal",

                customers: 0,

                orders: [],

                total: 0

            })
        ),

        dailyIncome: {

            date: getToday(),

            amount: 0

        },

        admin: {

            username: "admin",

            password: "1234"

        }

    };

}


// ==========================================================
// CREATE DATABASE FILE
// ==========================================================

function createDatabase() {

    const database =
        createDefaultDatabase();

    const dataFolder =
        path.dirname(DB_PATH);


    if (!fs.existsSync(dataFolder)) {

        fs.mkdirSync(
            dataFolder,
            {
                recursive: true
            }
        );

    }


    writeDatabase(database);

}


// ==========================================================
// TODAY
// ==========================================================

function getToday() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


// ==========================================================
// CHECK DAILY INCOME
// ==========================================================

function checkDailyIncome(database) {

    const today =
        getToday();


    if (
        !database.dailyIncome ||
        database.dailyIncome.date !== today
    ) {

        database.dailyIncome = {

            date: today,

            amount: 0

        };

        writeDatabase(database);

    }


    return database.dailyIncome;

}


// ==========================================================
// HOME
// ==========================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "RESTROPRO Backend ishlayapti 🚀",
        server: `http://localhost:${PORT}`
    });
});




// ==========================================================
// HEALTH CHECK
// ==========================================================

app.get("/api/health", (req, res) => {

    res.json({

        success: true,

        message: "Backend online",

        time: new Date().toISOString()

    });

});


// ==========================================================
// GET ALL TABLES
// ==========================================================

app.get("/api/tables", (req, res) => {

    const database =
        readDatabase();


    res.json({

        success: true,

        tables:
            database.tables || []

    });

});


// ==========================================================
// GET ONE TABLE
// ==========================================================

app.get(
    "/api/tables/:id",
    (req, res) => {

        const database =
            readDatabase();


        const id =
            Number(req.params.id);


        const table =
            database.tables.find(
                item =>
                    Number(item.id) === id
            );


        if (!table) {

            return res.status(404).json({

                success: false,

                message:
                    "Stol topilmadi"

            });

        }


        res.json({

            success: true,

            table

        });

    }
);


// ==========================================================
// UPDATE TABLE
// ==========================================================

app.put(
    "/api/tables/:id",
    (req, res) => {

        const database =
            readDatabase();


        const id =
            Number(req.params.id);


        const table =
            database.tables.find(
                item =>
                    Number(item.id) === id
            );


        if (!table) {

            return res.status(404).json({

                success: false,

                message:
                    "Stol topilmadi"

            });

        }


        const {
            status,
            room,
            customers
        } = req.body;


        if (status !== undefined) {

            table.status =
                status;

        }


        if (room !== undefined) {

            table.room =
                room;

        }


        if (customers !== undefined) {

            table.customers =
                Number(customers);

        }


        writeDatabase(database);


        res.json({

            success: true,

            message:
                "Stol yangilandi",

            table

        });

    }
);


// ==========================================================
// ADD ORDER
// ==========================================================

app.post(
    "/api/tables/:id/orders",
    (req, res) => {

        const database =
            readDatabase();


        const id =
            Number(req.params.id);


        const table =
            database.tables.find(
                item =>
                    Number(item.id) === id
            );


        if (!table) {

            return res.status(404).json({

                success: false,

                message:
                    "Stol topilmadi"

            });

        }


        const name =
            String(
                req.body.name || ""
            ).trim();


        const qty =
            Number(
                req.body.qty
            );


        const price =
            Number(
                req.body.price
            );


        if (
            !name ||
            !Number.isFinite(qty) ||
            qty <= 0 ||
            !Number.isFinite(price) ||
            price < 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Buyurtma ma'lumotlari noto'g'ri"

            });

        }


        if (!Array.isArray(table.orders)) {

            table.orders = [];

        }


        const order = {

            id: Date.now(),name,

            qty,

            price,

            createdAt:
                new Date().toISOString()

        };


        table.orders.push(order);


        const orderTotal =
            qty * price;


        table.total =
            table.orders.reduce(
                (sum, item) => {

                    return sum +
                        Number(item.price) *
                        Number(item.qty);

                },
                0
            );


        table.status =
            "busy";


        if (
            !table.customers ||
            table.customers < 1
        ) {

            table.customers = 1;

        }


        // Bugungi tushum
        const income =
            checkDailyIncome(
                database
            );


        income.amount =
            Number(income.amount || 0) +
            orderTotal;


        writeDatabase(database);


        res.status(201).json({

            success: true,

            message:
                "Buyurtma qo'shildi",

            order,

            table,

            dailyIncome:
                income.amount

        });

    }
);


// ==========================================================
// CLEAR TABLE
// ==========================================================

app.post(
    "/api/tables/:id/clear",
    (req, res) => {

        const database =
            readDatabase();


        const id =
            Number(req.params.id);


        const table =
            database.tables.find(
                item =>
                    Number(item.id) === id
            );


        if (!table) {

            return res.status(404).json({

                success: false,

                message:
                    "Stol topilmadi"

            });

        }


        table.status =
            "free";


        table.customers =
            0;


        table.orders =
            [];


        table.total =
            0;


        writeDatabase(database);


        res.json({

            success: true,

            message:
                "Stol bo'shatildi",

            table

        });

    }
);


// ==========================================================
// DAILY INCOME
// ==========================================================

app.get(
    "/api/income/today",
    (req, res) => {

        const database =
            readDatabase();


        const income =
            checkDailyIncome(
                database
            );


        res.json({

            success: true,

            date:
                income.date,

            amount:
                Number(income.amount || 0)

        });

    }
);


// ==========================================================
// ADD INCOME
// ==========================================================

app.post(
    "/api/income/add",
    (req, res) => {

        const database =
            readDatabase();


        const amount =
            Number(
                req.body.amount
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Summa noto'g'ri"

            });

        }


        const income =
            checkDailyIncome(
                database
            );


        income.amount =
            Number(income.amount || 0) +
            amount;


        writeDatabase(database);


        res.json({

            success: true,

            message:
                "Tushum qo'shildi",

            amount:
                income.amount

        });

    }
);


// ==========================================================
// SUBTRACT INCOME
// ==========================================================

app.post(
    "/api/income/subtract",
    (req, res) => {

        const database =
            readDatabase();


        const amount =
            Number(
                req.body.amount
            );if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Summa noto'g'ri"

            });

        }


        const income =
            checkDailyIncome(
                database
            );


        const current =
            Number(
                income.amount || 0
            );


        if (amount > current) {

            return res.status(400).json({

                success: false,

                message:
                    "Tushumdan ko'p ayirib bo'lmaydi"

            });

        }


        income.amount =
            current - amount;


        writeDatabase(database);


        res.json({

            success: true,

            message:
                "Tushum ayirildi",

            amount:
                income.amount

        });

    }
);


// ==========================================================
// ADMIN LOGIN
// ==========================================================

app.post(
    "/api/login",
    (req, res) => {

        const database =
            readDatabase();


        const username =
            String(
                req.body.username || ""
            ).trim();


        const password =
            String(
                req.body.password || ""
            );


        if (
            username ===
                database.admin.username &&
            password ===
                database.admin.password
        ) {

            return res.json({

                success: true,

                message:
                    "Login muvaffaqiyatli",

                user: {

                    username,

                    role: "admin"

                }

            });

        }


        res.status(401).json({

            success: false,

            message:
                "Login yoki parol noto'g'ri"

        });

    }
);


// ==========================================================
// 404
// ==========================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API topilmadi"

        });

    }
);


// ==========================================================
// ERROR HANDLER
// ==========================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Serverda xatolik yuz berdi"

        });

    }
);


// ==========================================================
// START SERVER
// ==========================================================

app.listen(
    PORT,
    () => {

        console.log(
            "================================"
        );

        console.log(
            "RESTROPRO BACKEND 🚀"
        );

        console.log(
            "Server: http://localhost:" +
            PORT
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);