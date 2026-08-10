// ==========================================================
// RESTO PRO — TABLE MANAGEMENT
// ==========================================================

const TABLE_COUNT = 12;

let tables = [];
let selectedTable = null;
let todayIncome = 0;


// ==========================================================
// START
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    loadTheme();

    renderTables();
    updateStats();
    updateTime();

    setInterval(updateTime, 1000);
});


// ==========================================================
// DEFAULT TABLES
// ==========================================================

function createDefaultTables() {
    return Array.from(
        { length: TABLE_COUNT },
        (_, index) => ({
            id: index + 1,
            status: "free",
            room: "Asosiy zal",
            customers: 0,
            orders: [],
            total: 0
        })
    );
}


// ==========================================================
// LOAD DATA
// ==========================================================

function loadData() {
    const savedTables = localStorage.getItem("resto_tables");
    const savedIncome = localStorage.getItem("resto_today_income");

    if (savedTables) {
        try {
            const parsed = JSON.parse(savedTables);
            if (Array.isArray(parsed)) {
                tables = parsed.map(table => ({
                    id: Number(table.id),
                    status: table.status === "busy" ? "busy" : "free",
                    room: table.room || "Asosiy zal",
                    customers: Number(table.customers || 0),
                    orders: Array.isArray(table.orders) ? table.orders : [],
                    total: Number(table.total || 0)
                }));
            } else {
                tables = createDefaultTables();
            }
        } catch (error) {
            console.error("Stollarni yuklashda xatolik:", error);
            tables = createDefaultTables();
        }
    } else {
        tables = createDefaultTables();
    }

    todayIncome = Number(savedIncome || 0);
    saveData();
}


// ==========================================================
// SAVE DATA
// ==========================================================

function saveData() {
    localStorage.setItem("resto_tables", JSON.stringify(tables));
    localStorage.setItem("resto_today_income", String(todayIncome));
}


// ==========================================================
// ADD TABLE
// ==========================================================

function addTable() {
    let newId = 1;

    if (tables.length > 0) {
        newId = Math.max(...tables.map(table => Number(table.id))) + 1;
    }

    const newTable = {
        id: newId,
        status: "free",
        room: "Asosiy zal",
        customers: 0,
        orders: [],
        total: 0
    };

    tables.push(newTable);

    saveData();
    renderTables();
    updateStats();

    showToast(`Stol #${newId} qo‘shildi ✓`);
}


// ==========================================================
// REMOVE LAST TABLE
// ==========================================================

function removeTable() {
    if (tables.length === 0) {
        showToast("O‘chirish uchun stol yo‘q");
        return;
    }

    const lastTable = tables[tables.length - 1];

    if (lastTable.status === "busy") {
        showToast(`Stol #${lastTable.id} band. Avval stolni bo‘shating.`);
        return;
    }

    const confirmed = confirm(`Stol #${lastTable.id} ni o‘chirmoqchimisiz?`);

    if (!confirmed) return;

    tables.pop();

    saveData();
    renderTables();
    updateStats();

    showToast(`Stol #${lastTable.id} o‘chirildi ✓`);
}


// ==========================================================
// RENDER TABLES
// ==========================================================

function renderTables() {
    const grid = document.getElementById("tablesGrid");

    if (!grid) return;

    grid.innerHTML = "";

    tables.forEach(table => {
        const card = document.createElement("button");

        card.type = "button";
        card.className = `table-card ${table.status}`;

        card.onclick = () => openTable(table.id);

        const statusText = table.status === "free" ? "BO‘SH" : "BAND";

        card.innerHTML = `
            <span class="table-status">
                ${statusText}
            </span>
            <span class="table-number">
                ${table.id}
            </span>
            <span class="table-label">
                Stol
            </span>
            ${
                table.status === "busy"
                    ? `<span class="table-total">${formatMoney(table.total)}</span>`
                    : ""
            }
        `;

        grid.appendChild(card);
    });
}


// ==========================================================
// OPEN TABLE
// ==========================================================

function openTable(tableId) {
    selectedTable = tables.find(table => Number(table.id) === Number(tableId));

    if (!selectedTable) return;

    const modal = document.getElementById("tableModal");

    if (!modal) return;

    const title = document.getElementById("modalTitle");

    if (title) {
        title.textContent = `Stol #${selectedTable.id}`;
    }

    const status = document.getElementById("modalStatus");

    if (status) {
        if (selectedTable.status === "free") {
            status.textContent = "BO‘SH";
            status.style.background = "#ecfdf3";
            status.style.color = "#047857";
        } else {
            status.textContent = "BAND";
            status.style.background = "#fef2f2";
            status.style.color = "#dc2626";
        }
    }

    const room = document.getElementById("roomNumber");

    if (room) {
        room.textContent = selectedTable.room || "Asosiy zal";
    }

    const customers = document.getElementById("customerCount");

    if (customers) {
        customers.textContent = selectedTable.customers > 0 ? selectedTable.customers : "—";
    }

    renderOrders();

    modal.classList.remove("hidden");
}


// ==========================================================
// CLOSE TABLE
// ==========================================================

function closeTable() {
    const modal = document.getElementById("tableModal");

    if (modal) {
        modal.classList.add("hidden");
    }

    selectedTable = null;
}


// ==========================================================
// RENDER ORDERS
// ==========================================================

function renderOrders() {
    if (!selectedTable) return;
    
    const list = document.getElementById("ordersList");

    if (!list) return;

    const orders = Array.isArray(selectedTable.orders) ? selectedTable.orders : [];

    if (orders.length === 0) {
        list.innerHTML = `
            <div class="empty-orders">
                Hozircha buyurtma yo‘q 🍽️
            </div>
        `;
    } else {
        list.innerHTML = orders
            .map(order => {
                const price = Number(order.price || 0);
                const qty = Number(order.qty || 0);
                const orderTotal = price * qty;

                return `
                    <div class="order-item">
                        <div>
                            <div class="order-name">
                                ${escapeHTML(order.name)}
                            </div>
                            <div class="order-qty">
                                ${qty} dona × ${formatMoney(price)}
                            </div>
                        </div>
                        <div class="order-price">
                            ${formatMoney(orderTotal)}
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    const totalElement = document.getElementById("totalPrice");

    if (totalElement) {
        totalElement.textContent = formatMoney(selectedTable.total);
    }
}


// ==========================================================
// OPEN ORDER FORM
// ==========================================================

function openOrderForm() {
    if (!selectedTable) {
        showToast("Avval stolni tanlang");
        return;
    }

    const modal = document.getElementById("orderModal");

    if (!modal) return;

    modal.classList.remove("hidden");

    setTimeout(() => {
        const input = document.getElementById("foodName");
        if (input) {
            input.focus();
        }
    }, 100);
}


// ==========================================================
// CLOSE ORDER FORM
// ==========================================================

function closeOrderForm() {
    const modal = document.getElementById("orderModal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


// ==========================================================
// ADD ORDER
// ==========================================================

function addOrder(event) {
    if (event) {
        event.preventDefault();
    }

    if (!selectedTable) {
        showToast("Avval stolni tanlang");
        return;
    }

    const nameInput = document.getElementById("foodName");
    const qtyInput = document.getElementById("foodQty");
    const priceInput = document.getElementById("foodPrice");

    if (!nameInput || !qtyInput || !priceInput) {
        return;
    }

    const name = nameInput.value.trim();
    const qty = Number(qtyInput.value);
    const price = Number(priceInput.value);

    if (
        !name ||
        !Number.isFinite(qty) ||
        qty <= 0 ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        showToast("Ma’lumotlarni to‘g‘ri kiriting");
        return;
    }

    if (!Array.isArray(selectedTable.orders)) {
        selectedTable.orders = [];
    }

    selectedTable.orders.push({
        id: Date.now(),
        name,
        qty,
        price
    });

    calculateTableTotal();

    selectedTable.status = "busy";

    if (!selectedTable.customers || selectedTable.customers < 1) {
        selectedTable.customers = 1;
    }

    saveData();
    renderTables();
    updateStats();
    renderOrders();

    const form = document.getElementById("orderForm");

    if (form) {
        form.reset();
    }

    if (qtyInput) {
        qtyInput.value = 1;
    }

    closeOrderForm();

    showToast("Buyurtma qo‘shildi ✓");
}


// ==========================================================
// CALCULATE TABLE TOTAL
// ==========================================================

function calculateTableTotal() {
    if (!selectedTable) return;

    const orders = Array.isArray(selectedTable.orders) ? selectedTable.orders : [];

    selectedTable.total = orders.reduce((sum, order) => {
        return sum + Number(order.price || 0) * Number(order.qty || 0);
    }, 0);
}


// ==========================================================
// CLEAR TABLE / PAYMENT
// ==========================================================

function clearTable() {
    if (!selectedTable) return;

    const total = Number(selectedTable.total || 0);

    if (total > 0) {
        const confirmed = confirm(`Hisobni yopasizmi?\n\nJami: ${formatMoney(total)}`);

        if (!confirmed) return;

        todayIncome += total;
    }

    selectedTable.status = "free";
    selectedTable.orders = [];
    selectedTable.total = 0;
    selectedTable.customers = 0;

    saveData();
    renderTables();
    updateStats();
    closeTable();

    showToast(
        total > 0
            ? `${formatMoney(total)} tushumga qo‘shildi ✓`
            : "Stol bo‘shatildi ✓"
    );
}


// ==========================================================
// STATISTICS
// ==========================================================

function updateStats() {
    const free = tables.filter(table => table.status === "free").length;
    const busy = tables.filter(table => table.status === "busy").length;

    const freeElement = document.getElementById("freeCount");
    const busyElement = document.getElementById("busyCount");
    const incomeElement = document.getElementById("todayTotal");

    if (freeElement) {
        freeElement.textContent = free;
    }

    if (busyElement) {
        busyElement.textContent = busy;
    }

    if (incomeElement) {
        incomeElement.textContent = formatShortMoney(todayIncome);
    }
}


// ==========================================================
// MONEY FORMAT
// ==========================================================

function formatMoney(number) {
    return Number(number || 0).toLocaleString("uz-UZ") + " so‘m";
}


function formatShortMoney(number) {
    number = Number(number || 0);

    if (number >= 1000000) {
        return (
            (number / 1000000)
                .toFixed(1)
                .replace(".0", "")
            + " mln"
        );
    }

    if (number >= 1000) {
        return (
            Math.round(number / 1000) +
            " ming"
        );
    }

    return number.toString();
}


// ==========================================================
// CURRENT TIME
// ==========================================================

function updateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const element = document.getElementById("currentTime");

    if (element) {
        element.textContent = time;
    }
}


// ==========================================================
// DARK / LIGHT MODE
// ==========================================================

function toggleTheme() {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem(
        "resto_theme",
        isDark ? "dark" : "light"
    );

    updateThemeButton();
}


// ==========================================================
// LOAD THEME
// ==========================================================

function loadTheme() {
    const savedTheme = localStorage.getItem("resto_theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }

    updateThemeButton();
}


// ==========================================================
// THEME BUTTON
// ==========================================================

function updateThemeButton() {
    const button = document.getElementById("themeBtn");

    if (!button) return;

    const isDark = document.body.classList.contains("dark");

    button.textContent = isDark ? "☀️" : "🌙";
}


// ==========================================================
// TOAST
// ==========================================================

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}


// ==========================================================
// SECURITY — ESCAPE HTML
// ==========================================================

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}


// ==========================================================
// ADMIN LOGIN CHECK
// ==========================================================

function goToAdmin() {
    const loggedIn = localStorage.getItem("restopro_admin");

    if (loggedIn === "true") {
        window.location.href = "admin.html";
    } else {
        window.location.href = "login.html";
    }
}


// ==========================================================
// LOGOUT
// ==========================================================

// ==========================================================
// ADMIN LOGIN CHECK
// ==========================================================

function goToAdmin() {
    const loggedIn = localStorage.getItem("restopro_admin");

    if (loggedIn === "true") {
        window.location.href = "admin.html";
    } else {
        window.location.href = "login.html";
    }
}