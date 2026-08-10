const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let tables = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    status: "free",
    room: "Asosiy zal",
    customers: 0,
    orders: [],
    total: 0
}));

app.get('/api/tables', (req, res) => {
    res.json({ success: true, tables });
});

app.post('/api/tables/:id/orders', (req, res) => {
    const tableId = Number(req.params.id);
    const { name, qty, price } = req.body;
    
    const table = tables.find(t => t.id === tableId);
    if (!table) return res.status(404).json({ success: false, message: "Stol topilmadi" });

    table.orders.push({ name, qty, price });
    table.total += Number(qty) * Number(price);
    table.status = "busy";

    res.json({ success: true, table });
});

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
});
