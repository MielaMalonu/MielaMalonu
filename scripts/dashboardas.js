document.addEventListener('DOMContentLoaded', function () {
    // --- Konfiguracija ---
    const config = {
        API: {
            BASE_URL: "https://supa.mielamalonu.com/api/supabase", // Tavo API adresas
            API_KEY: "cbb" // Tavo API raktas (jei tavo API jo reikalauja)
        },
        DISCORD: {
            CLIENT_ID: "1263389179249692693",
            GUILD_ID: "1325850250027597845", // Tavo serverio ID
            REDIRECT_URI: window.location.origin + window.location.pathname,
            SCOPE: "identify guilds.members.read",
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
        const headers = {
            'Content-Type': 'application/json',
            'apikey': config.API.API_KEY,
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `API klaida: ${response.status}`);
        }
        if (response.status === 204) return;
        return response.json();
    }

    // --- VARTOTOJO SĄSAJOS (UI) FUNKCIJOS ---

    function updateProfileUI(username, avatarUrl, guildTag, serverId, badgeHash) {
        if (serverId && badgeHash && guildTag) {
            userNameElement.innerHTML = `
                <div class="user-container">
                    <span class="primary-user-badge">
                        <img class="badge-icon" src="https://cdn.discordapp.com/clan-badges/${serverId}/${badgeHash}.png?size=16" onerror="this.onerror=null; this.src='/api/placeholder/16/16';" alt="badge">
                        <span class="badge-text">${guildTag}</span>
                    </span>
                    <span class="username-text">${username || "User"}</span>
                </div>`;
        } else {
            userNameElement.textContent = username || "User";
        }
        userAvatar.src = avatarUrl || "/api/placeholder/40/40";
    }

    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboardScreen.classList.add("active");
        navButtons[0].classList.add("active");
        logoutBtn.style.display = 'inline-block';
    }

    function showLoginScreen() {
        loginScreen.style.display = 'block';
        dashboardScreen.classList.remove("active");
        tabContents.forEach(tab => tab.classList.remove("active"));
        navButtons.forEach(button => button.classList.remove("active"));
        logoutBtn.style.display = 'none';
    }

    function displayWarnings(warnings) {
        if (!warningsContainer) return;
        warningsContainer.innerHTML = '';
        if (warnings && warnings.length > 0) {
            warnings.forEach((warning, index) => {
                const item = document.createElement("div");
                item.className = "warning-item";
                item.style.setProperty('--item-delay', index);
                let formattedDate = "Nežinoma data";
                if (warning.DATA) {
                    try {
                        formattedDate = new Date(warning.DATA).toLocaleDateString("lt-LT", { month: "short", day: 'numeric', year: "numeric" });
                    } catch (e) { console.error("Klaida formatuojant datą:", e); }
                }
                item.innerHTML = `
                    <div class="warning-reason">${warning.PRIEŽASTIS || "Nežinoma priežastis"}</div>
                    <div class="warning-date">${formattedDate}</div>`;
                warningsContainer.appendChild(item);
            });
        } else {
            const noWarningsItem = document.createElement("div");
            noWarningsItem.className = "warning-item";
            noWarningsItem.innerHTML = `<div class="warning-reason">Neturi Įspėjimų</div>`;
            warningsContainer.appendChild(noWarningsItem);
        }
    }

    function displayIcData(icData) {
        if (icStatusContainer && gangDetailsContainer) {
            icStatusContainer.innerHTML = `
                <div class="icinfo-item">
                    <div>Statusas:</div>
                    <div class="icinfo-status ${icData.STATUSAS === 'UŽPILDYTA' ? 'active-status' : 'inactive-status'}">${icData.STATUSAS || "Unknown"}</div>
                </div>
                <div class="icinfo-item">
                    <div>Vardas Pavardė:</div>
                    <div>${icData.VARDAS || "Unknown"} ${icData.PAVARDĖ || ''}</div>
                </div>
                <div class="icinfo-item">
                    <div>Steam Nickas:</div>
                    <div>${icData["STEAM NICKAS"] || "Unknown"}</div>
                </div>`;
            gangDetailsContainer.innerHTML = `
                <div class="icinfo-item">
                    <div>Rankas:</div>
                    <div>${icData.RANKAS || "None"}</div>
                </div>`;
        }
    }
    
    function displayEmptyIcForm() {
        if (icStatusContainer && gangDetailsContainer) {
            icStatusContainer.innerHTML = `
                <div class="icinfo-item">
                    <div>Statusas:</div>
                    <div class="icinfo-status inactive-status">Not Found</div>
                </div>`;
            gangDetailsContainer.innerHTML = `
                <div class="icinfo-item ic-missing-info">
                    <div>No character information found for your Discord account.</div>
                    <button id="fill-ic-info-btn" class="fill-ic-btn">Užpildyti IC informaciją</button>
                </div>`;
            document.getElementById("fill-ic-info-btn")?.addEventListener("click", openIcFormPopup);
        }
    }

    function createIcFormPopup() {
        if (document.getElementById("ic-form-popup")) return;
        document.body.insertAdjacentHTML("beforeend", `
            <div id="ic-form-popup" class="popup-container">
                <div class="popup-content">
                    <div class="popup-header">
                        <h3>IC Info anketa</h3>
                        <span class="close-btn">&times;</span>
                    </div>
                    <div class="popup-body">
                        <div class="form-group"><label for="vardas">Vardas</label><input type="text" id="vardas" placeholder="Įveskite vardą" required></div>
                        <div class="form-group"><label for="pavarde">Pavardė</label><input type="text" id="pavarde" placeholder="Įveskite pavardę" required></div>
                        <div class="form-group"><label for="steam-nick">Steam Nickas</label><input type="text" id="steam-nick" placeholder="Įveskite Steam slapyvardį" required></div>
                        <div class="form-group"><label for="steam-link">Steam Nuoroda</label><input type="url" id="steam-link" placeholder="https://steamcommunity.com/id/..." required></div>
                        <div id="ic-form-status" class="form-status"></div>
                        <button id="ic-submit-button" class="submit-button"><span id="submit-text">Pateikti</span><span id="loading-spinner" class="spinner hidden"></span></button>
                    </div>
                </div>
            </div>`);

        const popup = document.getElementById('ic-form-popup');
        popup.querySelector(".close-btn").addEventListener("click", () => popup.style.display = 'none');
        window.addEventListener('click', e => { if (e.target === popup) popup.style.display = 'none'; });
        document.getElementById("ic-submit-button").addEventListener('click', handleIcFormSubmit);
    }

    function openIcFormPopup() {
        createIcFormPopup();
        document.getElementById("ic-form-popup").style.display = "flex";
    }
    
    // --- DUOMENŲ KROVIMO FUNKCIJOS ---

    async function loadDashboardData(userId) {
        try {
            await Promise.all([
                loadWarnings(userId),
                loadIcData(userId),
                loadServerInfo()
            ]);
        } catch (error) {
            console.error("Klaida kraunant panelės duomenis:", error);
        }
    }

    async function loadWarnings(userId) {
        try {
            const warnings = await apiFetch(`/Ispejimai?ID=eq.${userId}&order=DATA.desc`);
            displayWarnings(warnings);
        } catch (error) {
            console.error("Klaida gaunant įspėjimus:", error);
            displayWarnings([]);
        }
    }

    async function loadIcData(userId) {
        try {
            const icDataArray = await apiFetch(`/IC?DISCORD_ID=eq.${userId}`);
            icDataArray && icDataArray.length > 0 ? displayIcData(icDataArray[0]) : displayEmptyIcForm();
        } catch (error) {
            console.error("Klaida gaunant IC duomenis:", error);
            displayEmptyIcForm();
        }
    }

    async function loadServerInfo() {
        try {
            const response = await fetch(config.DISCORD_INVITE_API);
            const data = await response.json();
            const membersElement = document.querySelector(".server-members");
            if (membersElement) {
                membersElement.innerHTML = `<span class="online-indicator"></span> <span>${data.approximate_presence_count} Online</span> <span style="margin: 0 4px;">•</span> <span>${data.approximate_member_count} Members</span>`;
            }
        } catch (e) { console.error("Klaida gaunant serverio info:", e); }
    }
    
    async function handleIcFormSubmit() {
        // ... validacijos logika
        
        const formData = { /* ... formos duomenys ... */ };

        try {
            await apiFetch('/IC', { method: 'POST', body: JSON.stringify(formData) });
            // ... sėkmės atvejo logika ...
        } catch (error) {
            // ... klaidos atvejo logika ...
        }
    }
    
    // --- AUTENTIFIKACIJA ---

    async function handleDiscordRedirect() {
        try {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = params.get("access_token");
            if (!accessToken) throw new Error("Nerastas prieigos raktas");

            const [userData, memberData] = await Promise.all([
                fetch("https://discord.com/api/users/@me", { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(res => res.json()),
                fetch(`https://discord.com/api/users/@me/guilds/${config.DISCORD.GUILD_ID}/member`, { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(res => res.ok ? res.json() : null)
            ]);

            if (!userData.id) throw new Error("Nepavyko gauti Discord profilio");

            localStorage.setItem("discord_id", userData.id);
            localStorage.setItem("discord_username", userData.global_name || userData.username);
            localStorage.setItem("discord_avatar", userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : '/api/placeholder/40/40');
            
            if (memberData) {
                localStorage.setItem("discord_guild_tag", "Member");
                localStorage.setItem("discord_server_id", memberData.guild_id);
                localStorage.setItem("discord_badge_hash", "a_390be3fdaab65e28c28d150ca21d93bb"); // Pavyzdys
            }
            
            window.history.replaceState({}, document.title, window.location.pathname);
            initializeApp();
        } catch (error) {
            console.error("Klaida Discord autorizacijos metu:", error);
            if(loginError) loginError.textContent = "Autorizacija nepavyko. Bandykite dar kartą.";
            showLoginScreen();
        }
    }

    function initializeApp() {
        const userId = localStorage.getItem('discord_id');
        if (userId) {
            updateProfileUI(
                localStorage.getItem('discord_username'),
                localStorage.getItem('discord_avatar'),
                localStorage.getItem('discord_guild_tag'),
                localStorage.getItem('discord_server_id'),
                localStorage.getItem('discord_badge_hash')
            );
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

    // --- PROGRAMOS PALEIDIMAS ---
    if (window.location.hash.includes("access_token=")) {
        handleDiscordRedirect();
    } else {
        initializeApp();
    }
});
