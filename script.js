const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 12 ta stol uchun ma'lumotlar bazasi (server xotirasida)
let tables = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    status: "free",
    room: "Asosiy zal",
    customers: 0,
    orders: [],
    total: 0
}));

// 1. STOLLARNI OLISH (Har bir ofitsiant har 1 sekundda buni so'raydi)
app.get('/api/tables', (req, res) => {
    res.json({ success: true, tables });
});

// 2. STOLNI BAND QILISH (Ofitsiant stolni bosganda ishlaydi)
app.post('/api/tables/:id/orders', (req, res) => {
    const tableId = Number(req.params.id);
    const { name, qty, price } = req.body;
    
    const table = tables.find(t => t.id === tableId);
    if (!table) return res.status(404).json({ success: false, message: "Stol topilmadi" });

    // Buyurtma qo'shish va stolni band qilish
    table.orders.push({ name, qty, price });
    table.total += Number(qty) * Number(price);
    table.status = "busy"; // Status avtomatik "busy" ga o'zgaradi

    res.json({ success: true, table });
});

// 3. STOLNI BO'SHATISH (Kassir yoki ofitsiant hisobni yopganda)
app.post('/api/tables/:id/clear', (req, res) => {
    const tableId = Number(req.params.id);
    const table = tables.find(t => t.id === tableId);
    
    if (table) {
        table.status = "free";
        table.orders = [];
        table.total = 0;
        return res.json({ success: true, message: "Stol bo'shatildi" });
    }
    res.status(404).json({ success: false, message: "Stol topilmadi" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ishga tushdi: http://localhost:${PORT}`);
    console.log("Ofitsiantlar ushbu IP orqali ulanishi mumkin: http://<KOMPYUTER_IP>:3000");
});
