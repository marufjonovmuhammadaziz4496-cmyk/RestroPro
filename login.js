  const loginForm = document.getElementById("loginForm");

        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;

            // Talab qilingan login va parol
            const ADMIN_LOGIN = "admin";
            const ADMIN_PASSWORD = "123456";

            if (usernameInput === ADMIN_LOGIN && passwordInput === ADMIN_PASSWORD) {
                // Tizimga kirganini saqlaymiz
                localStorage.setItem("restopro_admin", "true");
                // admin.html sahifasiga o'tamiz
                window.location.href = "admin.html";
            } else {
                alert("Login yoki parol noto‘g‘ri! (Login: admin, Parol: 123456)");
            }
        });