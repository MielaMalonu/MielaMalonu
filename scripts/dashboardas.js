document.addEventListener('DOMContentLoaded', function () {
    // --- Konfiguracija ---
    const config = {
        API: {
            BASE_URL: "https://supa.mielamalonu.com/api/supabase", // Tavo API adresas
            API_KEY: "cbb" // Tavo API raktas
        },
        DISCORD: {
            CLIENT_ID: "1263389179249692693",
            GUILD_ID: "1325850250027597845",
            REDIRECT_URI: window.location.origin + window.location.pathname,
            AUTH_URL: `https://discord.com/api/oauth2/authorize?client_id=1263389179249692693&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=token&scope=identify guilds.members.read`
        },
        DISCORD_INVITE_API: 'https://discordapp.com/api/invites/VfC3Ay86cW?with_counts=true'
    };

    // --- DOM Elementai ---
    const navButtons = document.querySelectorAll(".nav-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const loginScreen = document.getElementById("loginScreen");
    const dashboardScreen = document.getElementById("dashboard");
    const loginButton = document.getElementById("loginButton");
    const userAvatar = document.getElementById("userAvatar");
    const userNameElement = document.getElementById("userName");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginError = document.getElementById("loginError");
    const warningsContainer = document.getElementById("warningsContainer");
    const icStatusContainer = document.getElementById("icStatusContainer");
    const gangDetailsContainer = document.getElementById('gangDetailsContainer');

    // --- API PAGALBINĖ FUNKCIJA ---
    async function apiFetch(endpoint, options = {}) {
        const url = `${config.API.BASE_URL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json', 'apikey': config.API.API_KEY, ...options.headers };
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `API klaida: ${response.status}`);
        }
        if (response.status === 204) return;
        return response.json();
    }

    // --- UI FUNKCIJOS ---
    function updateProfileUI(username, avatarUrl, guildTag, serverId, badgeHash) {
        if (serverId && badgeHash && guildTag) {
            userNameElement.innerHTML = `<div class="user-container"><span class="primary-user-badge"><img class="badge-icon" src="https://cdn.discordapp.com/clan-badges/${serverId}/${badgeHash}.png?size=16" onerror="this.onerror=null; this.src='/api/placeholder/16/16';" alt="badge"><span class="badge-text">${guildTag}</span></span><span class="username-text">${username || "User"}</span></div>`;
        } else {
            userNameElement.textContent = username || "User";
        }
        userAvatar.src = avatarUrl || "/api/placeholder/40/40";
    }

    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboardScreen.classList.add("active");
        if (navButtons.length > 0) navButtons[0].classList.add("active");
        if (tabContents.length > 0) document.getElementById(navButtons[0].getAttribute('data-tab')).classList.add('active');
        logoutBtn.style.display = 'inline-block';
    }

    function showLoginScreen() {
        loginScreen.style.display = 'block';
        dashboardScreen.classList.remove("active");
        tabContents.forEach(tab => tab.classList.remove("active"));
        navButtons.forEach(button => button.classList.remove("active"));
        logoutBtn.style.display = 'none';
    }

    function displayDataInContainer(container, data, renderFunction) {
        if (!container) return;
        container.innerHTML = '';
        if (data && data.length > 0) {
            data.forEach((item, index) => container.appendChild(renderFunction(item, index)));
        } else {
            const noDataItem = document.createElement("div");
            noDataItem.className = "warning-item";
            noDataItem.innerHTML = `<div class="warning-reason">${container === warningsContainer ? 'Neturi Įspėjimų' : 'Duomenų nėra'}</div>`;
            container.appendChild(noDataItem);
        }
    }

    function createWarningElement(warning, index) {
        const item = document.createElement("div");
        item.className = "warning-item";
        item.style.setProperty('--item-delay', index);
        let formattedDate = "Nežinoma data";
        if (warning.DATA) {
            try {
                formattedDate = new Date(warning.DATA).toLocaleDateString("lt-LT", { month: "short", day: 'numeric', year: "numeric" });
            } catch (e) { console.error("Klaida formatuojant datą:", e); }
        }
        item.innerHTML = `<div class="warning-reason">${warning.PRIEŽASTIS || "Nežinoma priežastis"}</div><div class="warning-date">${formattedDate}</div>`;
        return item;
    }

    // --- DUOMENŲ KROVIMAS ---
    async function loadDashboardData(userId) {
        try {
            await Promise.all([loadWarnings(userId), loadIcData(userId), loadServerInfo()]);
        } catch (error) {
            console.error("Klaida kraunant panelės duomenis:", error);
        }
    }

    async function loadWarnings(userId) {
        try {
            const warnings = await apiFetch(`/Ispejimai?ID=eq.${userId}&order=DATA.desc`);
            const warningCountElement = document.getElementById("warningCount");
            const warningStatusElement = document.getElementById("warningStatus");
            if (warningCountElement) warningCountElement.textContent = warnings.length;
            if (warningStatusElement) {
                if (warnings.length > 0) {
                    warningStatusElement.textContent = warnings.length < 3 ? "Normalus įspėjimų kiekis" : "Per daug įspėjimų";
                    warningStatusElement.className = `status-badge ${warnings.length < 3 ? 'badge-warning' : 'badge-danger'}`;
                } else {
                    warningStatusElement.textContent = "Neturi įspėjimų";
                    warningStatusElement.className = "status-badge badge-success";
                }
            }
            displayDataInContainer(warningsContainer, warnings, createWarningElement);
        } catch (error) {
            console.error("Klaida gaunant įspėjimus:", error);
            displayDataInContainer(warningsContainer, [], createWarningElement);
        }
    }

    async function loadIcData(userId) {
        try {
            const icDataArray = await apiFetch(`/IC?DISCORD_ID=eq.${userId}`);
            // IC logika čia...
        } catch (error) {
            console.error("Klaida gaunant IC duomenis:", error);
        }
    }
    
    async function loadServerInfo() {
        try {
            const response = await fetch(config.DISCORD_INVITE_API);
            const data = await response.json();
            const membersElement = document.querySelector(".server-members");
            if (membersElement) membersElement.innerHTML = `<span class="online-indicator"></span> <span>${data.approximate_presence_count} Online</span> <span style="margin: 0 4px;">•</span> <span>${data.approximate_member_count} Members</span>`;
        } catch (e) { console.error("Klaida gaunant serverio info:", e); }
    }

    // --- AUTENTIFIKACIJA ---
    async function handleDiscordRedirect() {
        try {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = params.get("access_token");
            if (!accessToken) throw new Error("Nerastas prieigos raktas");

            const userData = await fetch("https://discord.com/api/users/@me", { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(res => res.json());
            if (!userData.id) throw new Error("Nepavyko gauti Discord profilio");

            const memberData = await fetch(`https://discord.com/api/users/@me/guilds/${config.DISCORD.GUILD_ID}/member`, { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(res => res.ok ? res.json() : null);

            localStorage.setItem("discord_id", userData.id);
            localStorage.setItem("discord_username", userData.global_name || userData.username);
            localStorage.setItem("discord_avatar", userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : '/api/placeholder/40/40');
            if (memberData) {
                localStorage.setItem("discord_guild_tag", "Narys"); // Pavyzdys
                localStorage.setItem("discord_server_id", memberData.guild_id);
                localStorage.setItem("discord_badge_hash", "a_390be3fdaab65e28c28d150ca21d93bb"); // Pavyzdys
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            initializeApp();
        } catch (error) {
            console.error("Klaida Discord autorizacijos metu:", error);
            if (loginError) loginError.textContent = "Autorizacija nepavyko. Bandykite dar kartą.";
            showLoginScreen();
        }
    }

    function initializeApp() {
        const userId = localStorage.getItem('discord_id');
        if (userId) {
            updateProfileUI(localStorage.getItem('discord_username'), localStorage.getItem('discord_avatar'), localStorage.getItem('discord_guild_tag'), localStorage.getItem('discord_server_id'), localStorage.getItem('discord_badge_hash'));
            showDashboard();
            loadDashboardData(userId);
        } else {
            showLoginScreen();
        }
    }

    // --- MYGTUKŲ PRISKYRIMAS ---
    loginButton.addEventListener('click', () => window.location.href = config.DISCORD.AUTH_URL);
    logoutBtn.addEventListener('click', () => {
        Object.keys(localStorage).forEach(key => { if (key.startsWith('discord_')) localStorage.removeItem(key); });
        updateProfileUI('Neprisijungta', '/api/placeholder/40/40');
        showLoginScreen();
    });

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (loginScreen.style.display === 'none') {
                navButtons.forEach(btn => btn.classList.remove("active"));
                tabContents.forEach(tab => tab.classList.remove("active"));
                button.classList.add("active");
                const tabId = button.getAttribute("data-tab");
                document.getElementById(tabId).classList.add("active");
            }
        });
    });

    // --- PROGRAMOS PALEIDIMAS ---
    if (window.location.hash.includes("access_token=")) {
        handleDiscordRedirect();
    } else {
        initializeApp();
    }
});
