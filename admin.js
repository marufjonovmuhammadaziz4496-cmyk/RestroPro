// ==========================================
// RESTROPRO — ADMIN PANEL
// ==========================================

let tables = [];
let selectedAdminTable = null;
let currentFilter = "all";


// ==========================================
// START
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    loadTheme();

    renderAdminTables();
    updateAdminStats();
    renderActiveOrders();
    updateAdminDate();
});


// ==========================================
// DATA
// ==========================================

function loadData() {
    const saved = localStorage.getItem("resto_tables");

    if (saved) {
        try {
            tables = JSON.parse(saved);
        } catch {
            tables = [];
        }
    }

    // Agar hali stol bo'lmasa
    if (!tables.length) {
        tables = Array.from(
            { length: 12 },
            (_, index) => ({
                id: index + 1,
                status: "free",
                room: "Asosiy zal",
                customers: 0,
                orders: [],
                total: 0
            })
        );

        saveData();
    }
}


// ==========================================
// SAVE
// ==========================================

function saveData() {
    localStorage.setItem(
        "resto_tables",
        JSON.stringify(tables)
    );
}


// ==========================================
// RENDER TABLES
// ==========================================

function renderAdminTables() {
    const grid = document.getElementById("adminTablesGrid");

    if (!grid) return;

    grid.innerHTML = "";

    let filteredTables = tables;

    if (currentFilter !== "all") {
        filteredTables = tables.filter(
            table => table.status === currentFilter
        );
    }

    if (!filteredTables.length) {
        grid.innerHTML = `
            <div class="empty-admin">
                Hozircha stol yo‘q
            </div>
        `;
        return;
    }

    filteredTables.forEach(table => {
        const card = document.createElement("button");

        card.className = `admin-table-card ${table.status}`;

        card.onclick = () => openAdminTable(table.id);

        card.innerHTML = `
            <span class="admin-table-number">
                ${table.id}
            </span>

            <span class="admin-table-status">
                ${
                    table.status === "free"
                    ? "BO‘SH"
                    : "BAND"
                }
            </span>

            <span class="admin-table-total">
                ${
                    table.status === "busy"
                    ? formatMoney(table.total)
                    : (table.room || "Asosiy zal")
                }
            </span>
        `;

        grid.appendChild(card);
    });
}


// ==========================================
// FILTER
// ==========================================

function filterTables(filter, button) {
    currentFilter = filter;

    document
        .querySelectorAll(".filter")
        .forEach(btn => {
            btn.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
    }

    renderAdminTables();
}


// ==========================================
// ADD TABLE
// ==========================================

function addTable() {
    const nextId = tables.length
        ? Math.max(...tables.map(t => Number(t.id))) + 1
        : 1;

    tables.push({
        id: nextId,
        status: "free",
        room: "Asosiy zal",
        customers: 0,
        orders: [],
        total: 0
    });

    saveData();
    renderAdminTables();
    updateAdminStats();
    
    showAdminToast(`Stol #${nextId} qo‘shildi ✓`);
}


// ==========================================
// REMOVE TABLE
// ==========================================

function removeTable() {
    if (!tables.length) {
        showAdminToast("O‘chirish uchun stol yo‘q");
        return;
    }

    const lastTable = tables[tables.length - 1];

    if (lastTable.status === "busy") {
        showAdminToast("Band stolni o‘chirib bo‘lmaydi!");
        return;
    }

    const confirmed = confirm(`Stol #${lastTable.id} ni o‘chirasizmi?`);

    if (!confirmed) return;

    tables.pop();
    saveData();
    renderAdminTables();
    updateAdminStats();

    showAdminToast(`Stol #${lastTable.id} o‘chirildi`);
}


// ==========================================
// OPEN TABLE
// ==========================================

function openAdminTable(tableId) {
    selectedAdminTable = tables.find(
        table => Number(table.id) === Number(tableId)
    );

    if (!selectedAdminTable) return;

    document.getElementById("adminModalTitle").textContent = `Stol #${selectedAdminTable.id}`;
    document.getElementById("adminCustomerCount").textContent = selectedAdminTable.customers || 0;
    document.getElementById("adminRoom").textContent = selectedAdminTable.room || "Asosiy zal";

    updateAdminStatus();
    renderAdminOrders();
    updateAdminTotal();

    document
        .getElementById("adminTableModal")
        .classList.remove("hidden");
}


// ==========================================
// STATUS
// ==========================================

function updateAdminStatus() {
    if (!selectedAdminTable) return;

    const status = document.getElementById("adminModalStatus");

    if (selectedAdminTable.status === "busy") {
        status.textContent = "BAND";
        status.style.background = "#fef2f2";
        status.style.color = "#dc2626";
    } else {
        status.textContent = "BO‘SH";
        status.style.background = "#ecfdf5";
        status.style.color = "#047857";
    }
}


// ==========================================
// CLOSE TABLE
// ==========================================

function closeAdminTable() {
    const modal = document.getElementById("adminTableModal");

    if (modal) {
        modal.classList.add("hidden");
    }

    selectedAdminTable = null;
}


// ==========================================
// CUSTOMER COUNT
// ==========================================

function changeCustomers(amount) {
    if (!selectedAdminTable) return;

    const current = Number(selectedAdminTable.customers || 0);
    const next = Math.max(0, current + amount);

    selectedAdminTable.customers = next;

    if (next > 0) {
        selectedAdminTable.status = "busy";
    }

    document.getElementById("adminCustomerCount").textContent = next;

    saveData();
    renderAdminTables();
    updateAdminStats();
    updateAdminStatus();
}


// ==========================================
// RENDER ORDERS
// ==========================================

function renderAdminOrders() {
    if (!selectedAdminTable) return;

    const list = document.getElementById("adminOrdersList");
    const orders = selectedAdminTable.orders || [];

    if (!orders.length) {
        list.innerHTML = `
            <div class="empty-orders">
                Hozircha buyurtma yo‘q 🍽️
            </div>
        `;
        return;
    }

    list.innerHTML = orders.map(order => {
        const total = Number(order.price) * Number(order.qty);

        return `
            <div class="admin-order-item">
                <div>
                    <strong>${escapeHTML(order.name)}</strong>
                    <span>${order.qty} dona × ${formatMoney(order.price)}</span>
                </div>
                <strong>${formatMoney(total)}</strong>
            </div>
        `;
    }).join("");
}


// ==========================================
// TOTAL
// ==========================================

function updateAdminTotal() {
    if (!selectedAdminTable) return;

    document.getElementById("adminTotal").textContent =
        formatMoney(selectedAdminTable.total || 0);
}


// ==========================================
// OPEN ORDER
// ==========================================

function openAdminOrder() {
    if (!selectedAdminTable) return;

    document
        .getElementById("adminOrderModal")
        .classList.remove("hidden");

    document
        .getElementById("adminFoodName")
        .focus();
}


// ==========================================
// CLOSE ORDER
// ==========================================

function closeAdminOrder() {
    document
        .getElementById("adminOrderModal")
        .classList.add("hidden");
}


// ==========================================
// ADD ORDER
// ==========================================

function addAdminOrder(event) {
    event.preventDefault();

    if (!selectedAdminTable) return;

    const name = document.getElementById("adminFoodName").value.trim();
    const qty = Number(document.getElementById("adminFoodQty").value);
    const price = Number(document.getElementById("adminFoodPrice").value);

    if (!name || qty <= 0 || price < 0) {
        showAdminToast("Ma’lumotlarni to‘g‘ri kiriting");
        return;
    }

    if (!selectedAdminTable.orders) {
        selectedAdminTable.orders = [];
    }

    selectedAdminTable.orders.push({
        id: Date.now(),
        name: name,
        qty: qty,
        price: price
    });

    selectedAdminTable.total = selectedAdminTable.orders.reduce(
        (sum, order) => {
            return sum + Number(order.price) * Number(order.qty);
        },
        0
    );

    selectedAdminTable.status = "busy";

    if (!selectedAdminTable.customers) {
        selectedAdminTable.customers = 1;
    }

    saveData();

    renderAdminTables();
    updateAdminStats();
    renderActiveOrders();
    renderAdminOrders();
    updateAdminTotal();
    updateAdminStatus();

    document.getElementById("adminFoodName").value = "";
    document.getElementById("adminFoodQty").value = 1;
    document.getElementById("adminFoodPrice").value = "";

    closeAdminOrder();

    showAdminToast("Buyurtma qo‘shildi ✓");
}


// ==========================================
// CLEAR TABLE
// ==========================================

function clearAdminTable() {
    if (!selectedAdminTable) return;

    const total = Number(selectedAdminTable.total || 0);

    if (total > 0) {
        const confirmed = confirm(`Stol hisobini yopasizmi?\n\nJami: ${formatMoney(total)}`);
        if (!confirmed) return;
    }

    selectedAdminTable.status = "free";
    selectedAdminTable.orders = [];
    selectedAdminTable.total = 0;
    selectedAdminTable.customers = 0;

    saveData();

    renderAdminTables();
    updateAdminStats();
    renderActiveOrders();
    closeAdminTable();

    showAdminToast("Stol bo‘shatildi ✓");
}


// ==========================================
// STATISTICS
// ==========================================

function updateAdminStats() {
    const free = tables.filter(table => table.status === "free").length;
    const busy = tables.filter(table => table.status === "busy").length;
    
    const total = tables.reduce(
        (sum, table) => sum + Number(table.total || 0),
        0
    );

    const freeElement = document.getElementById("freeCount");
    const busyElement = document.getElementById("busyCount");
    const totalElement = document.getElementById("todayTotal");
    const tablesElement = document.getElementById("totalTables");

    if (freeElement) freeElement.textContent = free;
    if (busyElement) busyElement.textContent = busy;
    if (totalElement) totalElement.textContent = formatShortMoney(total);
    if (tablesElement) tablesElement.textContent = tables.length;
}


// ==========================================
// ACTIVE ORDERS
// ==========================================

function renderActiveOrders() {
    const container = document.getElementById("activeOrders");

    if (!container) return;

    const busyTables = tables.filter(table => table.status === "busy");

    if (!busyTables.length) {
        container.innerHTML = `
            <div class="empty-admin">
                Hozircha faol buyurtmalar yo‘q 🍽️
            </div>
        `;
        return;
    }

    container.innerHTML = busyTables.map(table => {
        const orders = table.orders || [];

        return `
            <div class="active-order-card">
                <div class="active-order-header">
                    <strong>Stol #${table.id}</strong>
                    <span>BAND</span>
                </div>

                ${
                    orders.length
                    ? orders.map(order => `
                        <div class="active-order-item">
                            <span>${escapeHTML(order.name)} × ${order.qty}</span>
                            <strong>${formatMoney(order.price * order.qty)}</strong>
                        </div>
                    `).join("")
                    : `
                        <div class="active-order-item">
                            <span>Mijozlar bor</span>
                        </div>
                    `
                }

                <div class="active-order-total">
                    <span>Jami</span>
                    <strong>${formatMoney(table.total)}</strong>
                </div>
            </div>
        `;
    }).join("");
}


// ==========================================
// DATE
// ==========================================

function updateAdminDate() {
    const element = document.getElementById("adminDate");
    if (!element) return;

    const now = new Date();
    element.textContent = now.toLocaleDateString(
        "uz-UZ",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


// ==========================================
// MONEY
// ==========================================

function formatMoney(number) {
    return Number(number || 0).toLocaleString("uz-UZ") + " so‘m";
}

function formatShortMoney(number) {
    number = Number(number || 0);

    if (number >= 1000000) {
        return (number / 1000000).toFixed(1).replace(".0", "") + " mln";
    }

    if (number >= 1000) {
        return Math.round(number / 1000) + " ming";
    }

    return number.toString();
}


// ==========================================
// DARK / LIGHT
// ==========================================

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");

    localStorage.setItem("resto_theme", isDark ? "dark" : "light");
    updateThemeButton();
}

function loadTheme() {
    const saved = localStorage.getItem("resto_theme");

    if (saved === "dark") {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }

    updateThemeButton();
}

function updateThemeButton() {
    const button = document.getElementById("themeBtn");
    if (!button) return;

    const isDark = document.body.classList.contains("dark");
    button.textContent = isDark ? "☀️" : "🌙";
}


// ==========================================
// TOAST
// ==========================================

function showAdminToast(message) {
    const toast = document.getElementById("adminToast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showAdminToast.timer);
    showAdminToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}


// ==========================================
// SECURITY
// ==========================================

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
