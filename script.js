// ==========================================================
// RESTROPRO — FRONTEND + BACKEND
// ==========================================================

const API_URL = "http://localhost:3000";

const TABLE_COUNT = 12;

let tables = [];
let selectedTable = null;


// ==========================================================
// START
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {

    loadTheme();

    updateTime();

    setInterval(updateTime, 1000);

    // Backenddan dastlabki ma'lumot
    await loadData();

    // Har 1 sekundda backendni tekshirish
    setInterval(async () => {

        await loadData();

    }, 1000);

});


// ==========================================================
// LOAD DATA FROM BACKEND
// ==========================================================

async function loadData() {

    try {

        const response =
            await fetch(
                ${API_URL}/api/tables
            );


        if (!response.ok) {

            throw new Error(
                "Stollarni olishda xato"
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                "Backend ma'lumot qaytarmadi"
            );

        }


        tables =
            data.tables || [];


        renderTables();

        updateStats();


        // Modal ochiq bo'lsa,
        // tanlangan stolni yangilaymiz

        if (selectedTable) {

            const updatedTable =
                tables.find(
                    table =>
                        Number(table.id) ===
                        Number(selectedTable.id)
                );


            if (updatedTable) {

                selectedTable =
                    updatedTable;


                updateTableModal();

            }

        }

    } catch (error) {

        console.error(
            "BACKEND ERROR:",
            error
        );

    }

}


// ==========================================================
// UPDATE OPEN MODAL
// ==========================================================

function updateTableModal() {

    if (!selectedTable) return;


    const title =
        document.getElementById(
            "modalTitle"
        );


    if (title) {

        title.textContent =
            Stol #${selectedTable.id};

    }


    const status =
        document.getElementById(
            "modalStatus"
        );


    if (status) {

        if (
            selectedTable.status ===
            "busy"
        ) {

            status.textContent =
                "BAND";

            status.style.background =
                "#fef2f2";

            status.style.color =
                "#dc2626";

        } else {

            status.textContent =
                "BO'SH";

            status.style.background =
                "#ecfdf3";

            status.style.color =
                "#047857";

        }

    }


    const room =
        document.getElementById(
            "roomNumber"
        );


    if (room) {

        room.textContent =
            selectedTable.room ||
            "Asosiy zal";

    }


    const customers =
        document.getElementById(
            "customerCount"
        );


    if (customers) {

        customers.textContent =
            selectedTable.customers ||
            "—";

    }


    renderOrders();

}


// ==========================================================
// DEFAULT TABLES
// ==========================================================

function createDefaultTables() {

    return Array.from(
        {
            length: TABLE_COUNT
        },
        (_, index) => {

            return {

                id: index + 1,

                status: "free",

                room: "Asosiy zal",

                customers: 0,

                orders: [],

                total: 0

            };

        }
    );

}
// ==========================================================
// RENDER TABLES
// ==========================================================

function renderTables() {

    const grid =
        document.getElementById(
            "tablesGrid"
        );


    if (!grid) return;


    grid.innerHTML = "";


    tables.forEach(table => {

        const card =
            document.createElement(
                "button"
            );


        card.type =
            "button";


        card.className =
            table-card ${table.status};


        card.onclick = () =>
            openTable(table.id);


        const total =
            formatMoney(
                table.total
            );


        card.innerHTML = 

            <span class="table-status">

                ${
                    table.status === "free"
                    ? "BO'SH"
                    : "BAND"
                }

            </span>


            <span class="table-number">

                ${table.id}

            </span>


            <span class="table-label">

                Stol

            </span>


            ${
                table.status === "busy"
                ? 
                    <span class="table-total">
                        ${total}
                    </span>
                
                : ""
            }

        ;


        grid.appendChild(card);

    });


    updateTableCount();

}


// ==========================================================
// TABLE COUNT
// ==========================================================

function updateTableCount() {

    const element =
        document.getElementById(
            "tableCount"
        );


    if (!element) return;


    element.textContent =
        tables.length;

}


// ==========================================================
// OPEN TABLE
// ==========================================================

function openTable(tableId) {

    const table =
        tables.find(
            item =>
                Number(item.id) ===
                Number(tableId)
        );


    if (!table) return;


    selectedTable =
        table;


    updateTableModal();


    const modal =
        document.getElementById(
            "tableModal"
        );


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }

}


// ==========================================================
// CLOSE TABLE
// ==========================================================

function closeTable() {

    const modal =
        document.getElementById(
            "tableModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }


    selectedTable = null;

}


// ==========================================================
// RENDER ORDERS
// ==========================================================

function renderOrders() {

    if (!selectedTable) return;


    const list =
        document.getElementById(
            "ordersList"
        );


    if (!list) return;


    if (
        !selectedTable.orders ||
        selectedTable.orders.length === 0
    ) {

        list.innerHTML = 

            <div class="empty-orders">

                Hozircha buyurtma yo'q 🍽️

            </div>

        ;

    } else {

        list.innerHTML =
            selectedTable.orders
                .map(order => {

                    const total =
                        Number(order.price) *
                        Number(order.qty);


                    return `

                        <div class="order-item">

                            <div>

                                <div class="order-name">

                                    ${escapeHTML(
                                        order.name
                                    )}

                                </div>


                                <div class="order-qty">
                                ${order.qty} dona
                                    ×
                                    ${formatMoney(
                                        order.price
                                    )}

                                </div>

                            </div>


                            <div class="order-price">

                                ${formatMoney(
                                    total
                                )}

                            </div>

                        </div>

                    ;

                })
                .join("");

    }


    const total =
        document.getElementById(
            "totalPrice"
        );


    if (total) {

        total.textContent =
            formatMoney(
                selectedTable.total
            );

    }

}


// ==========================================================
// OPEN ORDER FORM
// ==========================================================

function openOrderForm() {

    if (!selectedTable) {

        showToast(
            "Avval stolni tanlang"
        );

        return;

    }


    const modal =
        document.getElementById(
            "orderModal"
        );


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }


    const input =
        document.getElementById(
            "foodName"
        );


    if (input) {

        input.focus();

    }

}


// ==========================================================
// CLOSE ORDER FORM
// ==========================================================

function closeOrderForm() {

    const modal =
        document.getElementById(
            "orderModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


// ==========================================================
// ADD ORDER — BACKEND
// ==========================================================

async function addOrder(event) {

    event.preventDefault();


    if (!selectedTable) {

        showToast(
            "Stol tanlanmagan"
        );

        return;

    }


    const name =
        document
            .getElementById("foodName")
            .value
            .trim();


    const qty =
        Number(
            document.getElementById(
                "foodQty"
            ).value
        );


    const price =
        Number(
            document.getElementById(
                "foodPrice"
            ).value
        );


    if (
        !name ||
        qty <= 0 ||
        price < 0
    ) {

        showToast(
            "Ma'lumotlarni to'g'ri kiriting"
        );

        return;

    }


    try {

        const response =
            await fetch(
                ${API_URL}/api/tables/${selectedTable.id}/orders`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            name,
                            qty,
                            price

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Buyurtma qo'shilmadi"
            );

        }


        // Yangi ma'lumotni backenddan olish

        await loadData();


        // Formani tozalash

        const form =
            document.getElementById(
                "orderForm"
            );


        if (form) {

            form.reset();

        }


        const qtyInput =
            document.getElementById(
                "foodQty"
            );


        if (qtyInput) {

            qtyInput.value = 1;

        }


        closeOrderForm();


        showToast(
            "Buyurtma qo'shildi ✓"
        );


    } catch (error) {

        console.error(error);
    showToast(
            error.message ||
            "Server xatosi"
        );

    }

}


// ==========================================================
// CLEAR TABLE — BACKEND
// ==========================================================

async function clearTable() {

    if (!selectedTable) return;


    const total =
        Number(
            selectedTable.total || 0
        );


    if (total > 0) {

        const confirmed =
            confirm(
                Stol hisobini yopasizmi?\n\nJami: ${formatMoney(total)}
            );


        if (!confirmed) return;

    }


    try {

        const response =
            await fetch(
                ${API_URL}/api/tables/${selectedTable.id}/clear,
                {

                    method: "POST"

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Stolni bo'shatib bo'lmadi"
            );

        }


        selectedTable = null;


        closeTable();


        await loadData();


        showToast(
            "Stol bo'shatildi ✓"
        );


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Server xatosi"
        );

    }

}


// ==========================================================
// STATISTICS
// ==========================================================

async function updateStats() {

    const free =
        tables.filter(
            table =>
                table.status === "free"
        ).length;


    const busy =
        tables.filter(
            table =>
                table.status === "busy"
        ).length;


    const freeElement =
        document.getElementById(
            "freeCount"
        );


    const busyElement =
        document.getElementById(
            "busyCount"
        );


    if (freeElement) {

        freeElement.textContent =
            free;

    }


    if (busyElement) {

        busyElement.textContent =
            busy;

    }


    // Bugungi tushumni backenddan olamiz

    await loadTodayIncome();

}


// ==========================================================
// LOAD TODAY INCOME
// ==========================================================

async function loadTodayIncome() {

    try {

        const response =
            await fetch(
                ${API_URL}/api/income/today
            );


        if (!response.ok) return;


        const data =
            await response.json();


        const totalElement =
            document.getElementById(
                "todayTotal"
            );


        if (totalElement) {

            totalElement.textContent =
                formatShortMoney(
                    data.amount
                );

        }

    } catch (error) {

        console.error(
            "Tushumni olishda xato:",
            error
        );

    }

}


// ==========================================================
// SUBTRACT INCOME
// ==========================================================

async function subtractIncome() {

    try {

        const incomeResponse =
            await fetch(
                ${API_URL}/api/income/today
            );


        const incomeData =
            await incomeResponse.json();


        const current =
            Number(
                incomeData.amount || 0
            );


        if (current <= 0) {

            showToast(
                "Bugungi tushum yo'q"
            );

            return;

        }


        const input =
            prompt(
                "Qancha tushumni ayirmoqchisiz?\n\n" +
                "Bugungi tushum: " +
                formatMoney(current)
            );


        if (input === null) return;


        const amount =
            Number(input);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showToast(
                "Summani to'g'ri kiriting"
            );

            return;

        }
        if (amount > current) {

            showToast(
                "Tushumdan ko'p ayirib bo'lmaydi"
            );

            return;

        }


        const response =
            await fetch(
                ${API_URL}/api/income/subtract,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            amount
                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Ayirishda xato"
            );

        }


        await loadTodayIncome();


        showToast(
            formatMoney(amount) +
            " ayirildi ✓"
        );


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Server xatosi"
        );

    }

}


// ==========================================================
// ADD INCOME
// ==========================================================

async function addDailyIncome(amount) {

    try {

        const response =
            await fetch(
                ${API_URL}/api/income/add,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            amount
                        })

                }
            );


        if (!response.ok) {

            throw new Error(
                "Tushum qo'shilmadi"
            );

        }


        await loadTodayIncome();


    } catch (error) {

        console.error(error);

    }

}


// ==========================================================
// MONEY FORMAT
// ==========================================================

function formatMoney(number) {

    return Number(number || 0)
        .toLocaleString("uz-UZ")
        + " so'm";

}


function formatShortMoney(number) {

    number =
        Number(number || 0);


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
            Math.round(
                number / 1000
            )
            + " ming"
        );

    }


    return number.toString();

}


// ==========================================================
// TIME
// ==========================================================

function updateTime() {

    const now =
        new Date();


    const time =
        now.toLocaleTimeString(
            "uz-UZ",
            {

                hour: "2-digit",

                minute: "2-digit"

            }
        );


    const element =
        document.getElementById(
            "currentTime"
        );


    if (element) {

        element.textContent =
            time;

    }

}


// ==========================================================
// DARK / LIGHT MODE
// ==========================================================

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const dark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "resto_theme",
        dark
            ? "dark"
            : "light"
    );


    updateThemeButton();

}


// ==========================================================
// LOAD THEME
// ==========================================================

function loadTheme() {

    const theme =
        localStorage.getItem(
            "resto_theme"
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

    } else {
        document.body.classList.remove(
            "dark"
        );

    }


    updateThemeButton();

}


// ==========================================================
// THEME BUTTON
// ==========================================================

function updateThemeButton() {

    const button =
        document.getElementById(
            "themeBtn"
        );


    if (!button) return;


    const dark =
        document.body.classList.contains(
            "dark"
        );


    button.textContent =
        dark
            ? "☀️"
            : "🌙";

}


// ==========================================================
// TOAST
// ==========================================================

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 2200);

}


// ==========================================================
// SECURITY
// ==========================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}
