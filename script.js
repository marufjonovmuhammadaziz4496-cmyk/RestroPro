const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Xotiradagi stollar bazasi (12 ta stol)
let tables = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    status: "free",
    room: "Asosiy zal",
    customers: 0,
    orders: [],
    total: 0
}));

// Bugungi tushum uchun o'zgaruvchi
let todayIncome = 0;

// ==========================================
// 1. STOLLARNI OLISH (GET)
// ==========================================
app.get('/api/tables', (req, res) => {
    res.json({ success: true, tables });
});

// ==========================================
// 2. STOLGA BUYURTMA QO'SHISH VA BAND QILISH (POST)
// ==========================================
app.post('/api/tables/:id/orders', (req, res) => {
    const tableId = Number(req.params.id);
    const { name, qty, price } = req.body;
    
    const table = tables.find(t => t.id === tableId);
    if (!table) {
        return res.status(404).json({ success: false, message: "Stol topilmadi" });
    }

    // Buyurtmani qo'shamiz
    table.orders.push({ name, qty, price });
    
    const orderTotal = Number(qty) * Number(price);
    table.total += orderTotal;
    table.status = "busy"; // Stolni band qilish

    // Umumiy tushumga ham qo'shib qo'yamiz
    todayIncome += orderTotal;

    res.json({ success: true, table });
});

// ==========================================
// 3. STOLNI BO'SHATISH / HISOBNI YOPISH (POST)
// ==========================================
app.post('/api/tables/:id/clear', (req, res) => {
    const tableId = Number(req.params.id);
    
    const table = tables.find(t => t.id === tableId);
    if (!table) {
        return res.status(404).json({ success: false, message: "Stol topilmadi" });
    }

    // Stolni tozalaymiz va bo'shatamiz
    table.status = "free";
    table.orders = [];
    table.customers = 0;
    table.total = 0;

    res.json({ success: true, message: "Stol bo'shatildi", table });
});

// ==========================================
// 4. BUGUNGI TUSHUMNI OLISH (GET)
// ==========================================
app.get('/api/income/today', (req, res) => {
    res.json({ success: true, amount: todayIncome });
});

// ==========================================
// 5. TUSHUMGA QO'SHISH (POST)
// ==========================================
app.post('/api/income/add', (req, res) => {
    const { amount }  = req.body;
    todayIncome += Number(amount || 0);
    res.json({ success: true, amount: todayIncome });
});

// ==========================================
// 6. TUSHUMDAN AYIRISH (POST)
// ==========================================
app.post('/api/income/subtract', (req, res) => {
    const { amount } = req.body;
    todayIncome -= Number(amount || 0);
    if (todayIncome < 0) todayIncome = 0;
    res.json({ success: true, amount: todayIncome });
});

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Server ishga tushdi: http://localhost:${PORT}`);
});
