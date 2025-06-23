document.addEventListener("DOMContentLoaded", async function () {
    console.log("✅ DOM fully loaded!");

    const _0x2212ab = {
        'API': {
            'STATUS_ENDPOINT': "https://supa.mielamalonu.com/api/supabase/Status",
            'BLACKLIST_ENDPOINT': "https://supa.mielamalonu.com/api/supabase/Blacklist",
            'ROLE_CHECK_ENDPOINT': "https://mmapi-production.up.railway.app/api/check-role",
            'SUBMIT_ENDPOINT': "https://botas-production.up.railway.app/webhook",
            'API_KEY': "MIELAMALONU"
        },
        'DISCORD': {
            'CLIENT_ID': "1263389179249692693",
            'REDIRECT_URI': window.location.origin + window.location.pathname,
            'SCOPES': ["identify", "guilds.members.read", 'guilds.join'],
            'WEBHOOK_URL': "https://canary.discord.com/api/webhooks/1346529699081490472/k-O-v4wKDiUjsj1w-Achvrej1Kr-W-rXqZVibcftwWFn5sMZyhIMSb9E4r975HbQI3tF",
            'GUILD_ID': "1325850250027597845",
            'PROXY_URL': "https://add.mielamalonu.com/api/discord/join-server"
        }
    };

    const _0x3430c9 = {
        'form': document.getElementById('applicationForm'),
        'statusDisplay': document.getElementById("statusDisplay"),
        'discordButton': document.getElementById("discord-login"),
        'profileContainer': document.getElementById('profile-container'),
        'responseMessage': document.createElement('p'),
        'notification': document.getElementById("notification"),
        'notificationMessage': document.querySelector(".notification-message"),
        'notificationIcon': document.querySelector(".notification-icon"),
        'steps': document.querySelectorAll(".step"),
        'formSteps': document.querySelectorAll('.form-step'),
        'nextStep1Button': document.getElementById('next-step-1'),
        'nextStep2Button': document.getElementById("next-step-2"),
        'prevStep2Button': document.getElementById('prev-step-2'),
        'prevStep3Button': document.getElementById("prev-step-3"),
        'submitButton': document.getElementById("submitButton"),
        'plStars': document.querySelectorAll("#pl-stars i"),
        'klStars': document.querySelectorAll("#kl-stars i"),
        'pcToggle': document.getElementById('pc-toggle'),
        'ispToggle': document.getElementById("isp-toggle"),
        'ageInput': document.getElementById('age'),
        'plInput': document.getElementById('pl'),
        'klInput': document.getElementById('kl'),
        'whyJoinInput': document.getElementById('whyJoin'),
        'pcInput': document.getElementById('pc'),
        'ispInput': document.getElementById('isp'),
        'reviewDiscord': document.getElementById("review-discord"),
        'reviewAge': document.getElementById("review-age"),
        'reviewPl': document.getElementById("review-pl"),
        'reviewKl': document.getElementById('review-kl'),
        'reviewWhyJoin': document.getElementById("review-whyJoin"),
        'reviewPc': document.getElementById("review-pc"),
        'reviewIsp': document.getElementById("review-isp")
    };

    let _0x4b3fcb = {
        'blacklist': [],
        'lastStatus': null,
        'currentUser': null,
        'updateInterval': null,
        'isSubmitting': false,
        'currentStep': 0x1,
        'formData': {
            'pl': 0x0,
            'kl': 0x0
        }
    };

    _0x3430c9.form.appendChild(_0x3430c9.responseMessage);
    _0x3430c9.form.addEventListener('submit', _0x31bb48);
    _0x3430c9.discordButton.addEventListener('click', _0x4dd50a);

    _0x3430c9.nextStep1Button.addEventListener("click", () => {
        _0x56d2a6(0x2);
    });

    _0x3430c9.nextStep2Button.addEventListener("click", () => {
        if (!!function () {
                if (!_0x3430c9.ageInput.value || _0x3430c9.ageInput.value < 0xd) {
                    return void _0x382ef6("❌ Amžius privalo būti bent 13 metų");
                }
                if (!_0x3430c9.plInput.value || '0' === _0x3430c9.plInput.value) {
                    return void _0x382ef6("❌ Prašome įvertinti savo pašaudimo lygį");
                }
                if (!_0x3430c9.klInput.value || '0' === _0x3430c9.klInput.value) {
                    return void _0x382ef6("❌ Prašome įvertinti savo komunikacijos lygį");
                }
                if (!_0x3430c9.whyJoinInput.value || _0x3430c9.whyJoinInput.value.trim().length < 0xa) {
                    return void _0x382ef6("❌ Prašome išsamiau aprašyti kodėl norite prisijungti");
                }
                if (!_0x3430c9.pcInput.value.trim()) {
                    _0x3430c9.pcInput.value = 'Ne';
                }
                if (!_0x3430c9.ispInput.value.trim()) {
                    _0x3430c9.ispInput.value = 'Ne';
                }
                _0x21ff48("success", "✅ Visi laukai užpildyti teisingai!");
                _0x2981f8();
                return 0x1;
            }()) {
            if (_0x3430c9.reviewAge) {
                _0x3430c9.reviewAge.textContent = _0x3430c9.ageInput.value || 'N/A';
            }
            if (_0x3430c9.reviewPl) {
                _0x3430c9.reviewPl.textContent = (_0x3430c9.plInput.value || '0') + "/10";
            }
            if (_0x3430c9.reviewKl) {
                _0x3430c9.reviewKl.textContent = (_0x3430c9.klInput.value || '0') + "/10";
            }
            if (_0x3430c9.reviewWhyJoin) {
                _0x3430c9.reviewWhyJoin.textContent = _0x3430c9.whyJoinInput.value || "N/A";
            }
            if (_0x3430c9.reviewPc) {
                _0x3430c9.reviewPc.textContent = _0x3430c9.pcInput.value || 'N/A';
            }
            if (_0x3430c9.reviewIsp) {
                _0x3430c9.reviewIsp.textContent = _0x3430c9.ispInput.value || 'N/A';
            }
            _0x56d2a6(0x3);
        }
    });

    _0x3430c9.prevStep2Button.addEventListener('click', () => _0x56d2a6(0x1));
    _0x3430c9.prevStep3Button.addEventListener("click", () => _0x56d2a6(0x2));
    _0x3430c9.submitButton.addEventListener("click", _0x55d992 => {
        _0x55d992.preventDefault();
        _0x3430c9.form.dispatchEvent(new Event("submit", {
            'cancelable': true
        }));
    });

    (_0x2cfc1a = (_0x329138, _0x31e0ba) => {
        _0x329138.forEach(_0x1b9fbe => {
            _0x1b9fbe.addEventListener("click", function () {
                var _0x232142 = parseInt(this.getAttribute('data-value'));
                _0x3bbd30(_0x329138, _0x232142);
                _0x31e0ba.value = _0x232142;
            });
            _0x1b9fbe.addEventListener("mouseover", function () {
                var _0x29909f = parseInt(this.getAttribute('data-value'));
                _0x42f781(_0x329138, _0x29909f);
            });
            _0x1b9fbe.addEventListener('mouseout', function () {
                var _0x3ad01d = parseInt(_0x31e0ba.value) || 0x0;
                _0x42f781(_0x329138, _0x3ad01d);
            });
        });
    })(_0x3430c9.plStars, _0x3430c9.plInput);
    _0x2cfc1a(_0x3430c9.klStars, _0x3430c9.klInput);

    _0x3430c9.pcToggle.addEventListener('change', function () {
        _0x3430c9.pcInput.value = this.checked ? "Taip" : 'Ne';
    });

    _0x3430c9.ispToggle.addEventListener("change", function () {
        _0x3430c9.ispInput.value = this.checked ? 'Taip' : 'Ne';
    });

    _0x3430c9.whyJoinInput.addEventListener("input", function () {
        _0x5a8e93(this);
    });

    if (window.location.hash) {
        var _0x2cfc1a = new URLSearchParams(window.location.hash.substring(0x1));
        var _0x57243e = _0x2cfc1a.get("access_token");
        const _0x140886 = _0x2cfc1a.get('state');
        _0x2cfc1a = localStorage.getItem("discord_auth_state");
        localStorage.removeItem('discord_auth_state');
        if (_0x57243e && _0x140886 && _0x140886 === _0x2cfc1a) {
            console.log("Successfully obtained token from URL fragment");
            _0x289b72(_0x57243e);
        } else if (_0x57243e) {
            console.warn("State validation failed, potential CSRF attack");
            _0x21ff48("error", "Authentication failed: security check failed");
        }
    } else {
        _0x29e9d4(_0x4b3fcb.currentUser); // Perduodame dabartinį vartotoją, kuris gali būti null
    }

    function _0x1421e7(_0x3e9156, _0x157ad9) {
        console.log("Checking blacklist for user:", _0x3e9156);
        console.log("Blacklist array:", _0x157ad9);
        return !(!_0x3e9156 || !Array.isArray(_0x157ad9) || 0x0 === _0x157ad9.length) && (_0x3e9156 = String(_0x3e9156).trim(), _0x157ad9 = _0x157ad9.includes(_0x3e9156), console.log("Is user " + _0x3e9156 + " blacklisted?", _0x157ad9), _0x157ad9);
    }

    async function _0x513be1() {
        try {
            console.log("Fetching status and blacklist...");
            var _0x1b5fb9 = await fetch(_0x2212ab.API.STATUS_ENDPOINT);
            if (!_0x1b5fb9.ok) {
                throw new Error("Failed to fetch status");
            }
            var _0x4bee21 = await _0x1b5fb9.json();
            console.log("Status data received:", _0x4bee21);
            let _0x17e1c7 = "offline";
            if (Array.isArray(_0x4bee21) && 0x0 < _0x4bee21.length && _0x4bee21[0x0] && _0x4bee21[0x0].status) {
                _0x17e1c7 = "online" === _0x4bee21[0x0].status.toLowerCase() ? "online" : "offline";
            }
            var _0x1dfcce = await fetch(_0x2212ab.API.BLACKLIST_ENDPOINT);
            if (!_0x1dfcce.ok) {
                throw new Error("Failed to fetch blacklist");
            }
            var _0x50c0ae = await _0x1dfcce.json();
            console.log("Raw blacklist data received:", _0x50c0ae);
            let _0x5f0ef3 = [];
            var _0x5e5482;
            var _0x555b2d;
            var _0x3a815e;
            var _0x45c973 = _0x449e38 => 'string' == typeof _0x449e38 ? _0x449e38.split(',').map(_0x3db398 => _0x3db398.trim()).filter(_0x356f9e => _0x356f9e) : Array.isArray(_0x449e38) ? _0x449e38.map(_0x47c59b => String(_0x47c59b).trim()).filter(_0x28596f => _0x28596f) : [];
            if (Array.isArray(_0x50c0ae) && 0x0 < _0x50c0ae.length) {
                if ("object" == typeof (_0x5e5482 = _0x50c0ae[0x0]) && null !== _0x5e5482) {
                    if (_0x555b2d = _0x5e5482.blacklistedIds || _0x5e5482.ids || _0x5e5482.blacklist) {
                        _0x5f0ef3 = _0x45c973(_0x555b2d);
                    }
                } else {
                    _0x5f0ef3 = _0x45c973(_0x50c0ae);
                }
            } else if ("object" == typeof _0x50c0ae && null !== _0x50c0ae) {
                if (_0x3a815e = _0x50c0ae.blacklistedIds || _0x50c0ae.ids || _0x50c0ae.blacklist) {
                    _0x5f0ef3 = _0x45c973(_0x3a815e);
                }
            } else if ("string" == typeof _0x50c0ae) {
                _0x5f0ef3 = _0x45c973(_0x50c0ae);
            }
            console.log("Processed blacklist into array:", _0x5f0ef3);
            _0x59d400({
                'status': _0x17e1c7,
                'blacklist': _0x5f0ef3
            });
        } catch (_0x302a45) {
            console.error("❌ Status fetch error:", _0x302a45);
            _0x59d400({
                'status': "offline",
                'blacklist': _0x4b3fcb.blacklist || []
            });
            _0x21ff48("error", "Nepavyko gauti aplikacijos statuso. Bandykite vėliau.");
        }
    }

    function _0x59d400(_0x324b51) {
        var _0x12e567 = _0x324b51.blacklist || [];
        if (!(_0x4b3fcb.lastStatus === _0x324b51.status && JSON.stringify(_0x4b3fcb.blacklist) === JSON.stringify(_0x12e567))) { // Patikrinti, ar būsena ar juodasis sąrašas pasikeitė
            _0x4b3fcb.lastStatus = _0x324b51.status;
            _0x4b3fcb.blacklist = _0x12e567;

            // Atnaujinkite statuso rodymą
            if (_0x4b3fcb.lastStatus === "online") {
                _0x3430c9.statusDisplay.textContent = "✅ Atidaryta ✅";
                _0x3430c9.statusDisplay.className = "status-online";
            } else {
                _0x3430c9.statusDisplay.textContent = "❌ Uždaryta ❌";
                _0x3430c9.statusDisplay.className = "status-offline";
            }
            _0x54f5c3();
        }
    }

    function _0x54f5c3() {
        if (_0x3430c9.form) {
            console.log("Form state check - User logged in:", _0x4b3fcb.currentUser !== null);
            let _0x2383ad = false;
            if (_0x4b3fcb.currentUser && _0x4b3fcb.currentUser.id) {
                _0x2383ad = _0x1421e7(_0x4b3fcb.currentUser.id, _0x4b3fcb.blacklist);
                console.log("Form state check - User blacklisted:", _0x2383ad);
            }

            // Pakeista logika: mygtukai išjungiami, jei aplikacija neprisijungusi ARBA vartotojas yra juodajame sąraše
            var _0x3ce2c0 = _0x4b3fcb.lastStatus !== "online" || _0x2383ad;
            console.log("Form state check - App online:", _0x4b3fcb.lastStatus === "online");

            if (_0x3430c9.submitButton) {
                _0x3430c9.submitButton.disabled = _0x3ce2c0;
            }
            console.log("Submit button disabled:", _0x3ce2c0);

            if (_0x3430c9.nextStep1Button) {
                _0x3430c9.nextStep1Button.disabled = _0x3ce2c0; // Vartojame tą pačią logiką pirmam žingsniui
            }

            if (_0x2383ad) {
                _0x21ff48("error", "🚫 Jūs esate įtrauktas į juodąjį sąrašą ir negalite teikti anketos!");
                if (_0x3430c9.form) {
                    _0x3430c9.form.style.pointerEvents = "none";
                    _0x3430c9.form.style.opacity = '0.5';
                }
            } else if (_0x3430c9.form) {
                _0x3430c9.form.style.pointerEvents = "auto";
                _0x3430c9.form.style.opacity = '1';
            }
        }
    }

    async function _0x31bb48(_0x21bce4) {
        _0x21bce4.preventDefault();
        _0x4b3fcb.isSubmitting = true;
        _0x2981f8();
        const _0xdda39f = _0x3430c9.submitButton;
        _0xdda39f.disabled = true;
        _0xdda39f.textContent = "Pateikiama...";
        document.getElementById("formLoader").style.display = "flex";
        document.body.style.overflow = "hidden";

        try {
            console.log("Validating all requirements...");
            // Pataisyta: Patikrinimas, ar vartotojas prisijungęs per Discord
            if (!_0x4b3fcb.currentUser || !_0x4b3fcb.currentUser.id) {
                throw new Error("Discord authentication required");
            }

            var _0x437c3b = _0x1421e7(_0x4b3fcb.currentUser.id, _0x4b3fcb.blacklist); // Pataisyta: Naudoja currentUser.id
            console.log("Final blacklist check before submission:", _0x437c3b);
            if (_0x437c3b) {
                _0x21ff48("error", "🚫 Jūs esate užblokuotas ir negalite pateikti anketos!");
                throw new Error("User blacklisted");
            }

            try {
                var _0xd2a6a4 = await fetch(_0x2212ab.API.ROLE_CHECK_ENDPOINT, {
                    'method': 'POST',
                    'headers': {
                        'Content-Type': "application/json"
                    },
                    'body': JSON.stringify({
                        'userId': _0x4b3fcb.currentUser.id // Pataisyta: Naudoja currentUser.id
                    })
                });
                if (!_0xd2a6a4.ok) {
                    _0x21ff48("error", "Serverio klaida tikrinant naudotojo rolę");
                    throw new Error("Server error while checking role");
                }
                if ((await _0xd2a6a4.json()).hasRole) {
                    throw new Error('LA'); // Čia "LA" tikriausiai reiškia "Local Application" arba "Already a member"
                }
            } catch (_0x5cd52b) {
                if ('LA' !== _0x5cd52b.message) {
                    _0x21ff48("error", "Nepavyko patikrinti naudotojo informacijos");
                }
                throw _0x5cd52b;
            }

            await new Promise(resolve => setTimeout(resolve, 0)); // Maža pauzė
            var _0x40a207 = {
                'userId': _0x4b3fcb.currentUser.id, // Pataisyta: Naudoja currentUser.id
                'age': _0x3430c9.ageInput.value.trim(),
                'reason': _0x3430c9.whyJoinInput.value.trim(),
                'pl': _0x3430c9.plInput.value.trim(),
                'kl': _0x3430c9.klInput.value.trim(),
                'pc': _0x3430c9.pcInput.value.trim(),
                'isp': _0x3430c9.ispInput.value.trim()
            };

            try {
                var _0x223af1 = _0x4b3fcb.currentUser.id.slice(0x0, 0x10) + '-' + Date.now(); // Pataisyta: Naudoja currentUser.id
                var _0x5dd76f = {
                    'variables': [{
                        'name': 'userId',
                        'variable': "{event_userId}",
                        'value': '' + _0x40a207.userId
                    }, {
                        'name': "age",
                        'variable': "{event_age}",
                        'value': '' + _0x40a207.age
                    }, {
                        'name': 'reason',
                        'variable': "{event_reason}",
                        'value': '' + _0x40a207.reason
                    }, {
                        'name': 'pl',
                        'variable': "{event_pl}",
                        'value': _0x40a207.pl + "/10"
                    }, {
                        'name': 'kl',
                        'variable': '{event_kl}',
                        'value': _0x40a207.kl + "/10"
                    }, {
                        'name': 'pc',
                        'variable': "{event_pc}",
                        'value': '' + _0x40a207.pc
                    }, {
                        'name': "isp",
                        'variable': "{event_isp}",
                        'value': '' + _0x40a207.isp
                    }, {
                        'name': "applicationId",
                        'variable': "{event_appId}",
                        'value': _0x223af1
                    }]
                };

                if (!(await fetch(_0x2212ab.API.SUBMIT_ENDPOINT, {
                        'method': "POST",
                        'headers': {
                            'Content-Type': "application/json",
                            'X-Webhook-Secret': _0x2212ab.API.API_KEY
                        },
                        'body': JSON.stringify(_0x5dd76f)
                    })).ok) {
                    _0x21ff48("error", "API klaida pateikiant anketą");
                    throw new Error("API error");
                }
            } catch (_0x425a6f) {
                console.error("Submission error:", _0x425a6f);
                throw _0x425a6f;
            }

            await new Promise(resolve => setTimeout(resolve, 0)); // Maža pauzė
            _0xdda39f.textContent = "Pateikta!";
            _0x21ff48("success", "✅ Aplikacija sėkmingai pateikta!");
            _0x3430c9.form.reset();
            _0x3bbd30(_0x3430c9.plStars, 0x0);
            _0x3bbd30(_0x3430c9.klStars, 0x0);
            _0x3430c9.plInput.value = '0';
            _0x3430c9.klInput.value = '0';
            _0x3430c9.pcToggle.checked = false;
            _0x3430c9.ispToggle.checked = false;
            _0x5a8e93(_0x3430c9.whyJoinInput);
            _0x2981f8();
            _0x56d2a6(0x1);
        } catch (_0x31e858) {
            console.error("Submission error:", _0x31e858);
            switch (_0x31e858.message) {
                case "Discord authentication required":
                    _0x382ef6("❌ Prieš pateikiant anketą, reikia prisijungti per Discord!");
                    break;
                case "Applications closed":
                    _0x382ef6("❌ Anketų pildymas šiuo metu yra sustabdytas.");
                    break;
                case "User blacklisted":
                    _0x382ef6("🚫 Jūs esate užblokuotas ir negalite pateikti anketos!");
                    break;
                case 'LA':
                    _0x382ef6("❌ Jūs jau esate mūsų gaujos narys arba jūsų anketa yra peržiūrima!");
                    break;
                default:
                    _0x382ef6("❌ Įvyko klaida pateikiant anketą. Bandykite dar kartą.");
            }
            _0xdda39f.textContent = "Bandykite dar kartą";
        } finally {
            document.getElementById('formLoader').style.display = 'none';
            document.body.style.overflow = "auto";
            setTimeout(() => {
                _0x4b3fcb.isSubmitting = false;
                _0xdda39f.textContent = "Pateikti aplikaciją";
                _0xdda39f.disabled = false;
                _0x54f5c3();
            }, 0xbb8);
        }
    }

    function _0x4dd50a() {
        localStorage.removeItem('discord_token');
        localStorage.removeItem("discord_token_expiry");
        var _0x304b92 = new URL("https://discord.com/api/oauth2/authorize");
        _0x304b92.searchParams.append("client_id", _0x2212ab.DISCORD.CLIENT_ID);
        _0x304b92.searchParams.append("redirect_uri", _0x2212ab.DISCORD.REDIRECT_URI);
        _0x304b92.searchParams.append("response_type", "token");
        _0x304b92.searchParams.append("scope", _0x2212ab.DISCORD.SCOPES.join(" "));
        var _0x3d7777 = Math.random().toString(0x24).substring(0x2, 0xf) + Math.random().toString(0x24).substring(0x2, 0xf);
        localStorage.setItem("discord_auth_state", _0x3d7777);
        _0x304b92.searchParams.append('state', _0x3d7777);
        console.log("Redirecting to Discord OAuth:", _0x304b92.toString());
        window.location.href = _0x304b92.toString();
    }

    async function _0x289b72(_0x3a61b) {
        try {
            _0x21ff48("info", "Authenticating with Discord...");
            var _0x509d72 = await _0x8f2b5a(_0x3a61b);
            if (!_0x509d72 || !_0x509d72.id) {
                throw new Error("Failed to fetch user data");
            }
            _0x4b3fcb.currentUser = {
                ..._0x509d72,
                'accessToken': _0x3a61b
            };
            console.log("User authenticated, ID:", _0x509d72.id);
            _0x29e9d4(_0x4b3fcb.currentUser); // Pataisyta: Perduodame _0x4b3fcb.currentUser
            _0x21ff48("info", "Attempting to add you to Discord server...");
            if (await async function (_0x118a2d, _0x4979e5) {
                    try {
                        _0x21ff48('info', "Connecting to Discord server...");
                        var _0x968b4f;
                        var _0x14dbde;
                        var _0x27a315 = {
                            'userId': _0x118a2d,
                            'accessToken': _0x4979e5
                        };
                        console.log("Sending join request to proxy:", {
                            'userId': _0x118a2d,
                            'tokenPresent': !!_0x4979e5,
                            'proxyUrl': _0x2212ab.DISCORD.PROXY_URL
                        });
                        var _0x2ca14d = await fetch(_0x2212ab.DISCORD.PROXY_URL, {
                            'method': "POST",
                            'headers': {
                                'Content-Type': "application/json"
                            },
                            'body': JSON.stringify(_0x27a315)
                        });
                        if (_0x2ca14d.ok) {
                            _0x14dbde = await _0x2ca14d.json();
                            console.log("Proxy server response:", _0x14dbde);
                            return _0x14dbde.success;
                        }
                        try {
                            _0x968b4f = await _0x2ca14d.json();
                            console.error("Error from proxy server:", _0x968b4f);
                            if (_0x968b4f.error && 0xc369 === _0x968b4f.error.code) {
                                _0x21ff48("error", "Invalid OAuth token. Try logging out and in again.");
                            } else {
                                _0x21ff48('error', "Server error: " + (_0x968b4f.message || "Unknown error"));
                            }
                        } catch (_0x24213c) {
                            console.error("Failed to parse error response:", _0x24213c);
                            _0x21ff48("error", "Server error (" + _0x2ca14d.status + "): Could not process response");
                        }
                        return false;
                    } catch (_0x526786) {
                        console.error("Error adding user to server via proxy:", _0x526786);
                        _0x21ff48("error", "Connection error. Please try again later.");
                        return false;
                    }
                }(_0x509d72.id, _0x3a61b)) {
                _0x21ff48("success", "Successfully joined Discord server!");
            } else {
                _0x21ff48("warning", "Could not add you to the server automatically. Please join manually if needed.");
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            clearInterval(_0x4b3fcb.updateInterval); // Pataisyta: Naudoja _0x4b3fcb.updateInterval
            _0x4b3fcb.updateInterval = setInterval(_0x359bcd, 0x2faf080);
            _0x54f5c3();
        } catch (_0x2a44cf) {
            console.error("Auth redirect error:", _0x2a44cf);
            _0x382ef6("Failed to authenticate with Discord: " + _0x2a44cf.message);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    async function _0x8f2b5a(_0x231e9e) {
        try {
            var _0x24deb9;
            var _0x587452;
            var _0x5e3d59;
            var [_0x1ad4b4, _0x266251] = await Promise.all([fetch("https://discord.com/api/users/@me", {
                'headers': {
                    'Authorization': "Bearer " + _0x231e9e
                }
            }), fetch("https://discord.com/api/v10/users/@me/guilds/" + _0x2212ab.DISCORD.GUILD_ID + "/member", {
                'headers': {
                    'Authorization': "Bearer " + _0x231e9e
                }
            })]);
            var _0x32ad9a = await _0x1ad4b4.json();
            var _0x447e2a = await _0x266251.json();
            if (_0x32ad9a.id) {
                _0x24deb9 = _0x447e2a.presence?.['status'] || "offline";
                _0x5e3d59 = (_0x587452 = _0x447e2a.activities || []).find(_0x428f9d => 0x0 === _0x428f9d.type) || {};
                return {
                    ..._0x32ad9a,
                    'avatar': 'https://cdn.discordapp.com/avatars/' + _0x32ad9a.id + '/' + _0x32ad9a.avatar + ".png?size=256",
                    'status': _0x24deb9,
                    'activities': _0x587452,
                    'activity': {
                        'name': _0x5e3d59.name || '',
                        'details': _0x5e3d59.details || '',
                        'state': _0x5e3d59.state || '',
                        'emoji': _0x5e3d59.emoji?.['name'] || '🎮'
                    }
                };
            }
            _0x21ff48('error', "Nepavyko gauti Discord naudotojo informacijos");
            throw new Error("Invalid user data");
        } catch (_0x4c8fe2) {
            console.error("Discord API error:", _0x4c8fe2);
            _0x21ff48('error', "Nepavyko prisijungti prie Discord. Bandykite vėliau.");
            return {
                'status': "offline",
                'activities': []
            };
        }
    }

    async function _0x359bcd() {
        try {
            // Pataisyta: Naudoja _0x4b3fcb.currentUser.accessToken ir patikrina egzistavimą
            if (_0x4b3fcb.currentUser && _0x4b3fcb.currentUser.accessToken) {
                var _0x30a440 = await _0x8f2b5a(_0x4b3fcb.currentUser.accessToken);
                if (!(_0x30a440.status === _0x4b3fcb.currentUser.status && JSON.stringify(_0x30a440.activities) === JSON.stringify(_0x4b3fcb.currentUser.activities))) {
                    _0x4b3fcb.currentUser = {
                        ..._0x30a440,
                        'accessToken': _0x4b3fcb.currentUser.accessToken
                    };
                    _0x29e9d4(_0x4b3fcb.currentUser); // Perduodame atnaujintą currentUser
                }
            } else {
                console.warn("Cannot update presence: currentUser or accessToken is missing.");
                clearInterval(_0x4b3fcb.updateInterval); // Sustabdome atnaujinimą, jei nėra vartotojo
                _0x29e9d4(null); // Atstatome profilio rodymą, jei vartotojo nėra
            }
        } catch (_0x4a8ab7) {
            console.error("Presence update error:", _0x4a8ab7);
        }
    }

    function _0x238277() {
        clearInterval(_0x4b3fcb.updateInterval); // Pataisyta: Naudoja _0x4b3fcb.updateInterval
        _0x29e9d4(_0x4b3fcb.currentUser = null);
        localStorage.removeItem('discord_token'); // Išvalome tokeną
        localStorage.removeItem('discord_token_expiry'); // Išvalome tokeno galiojimo laiką
        location.reload();
    }

    function _0x29e9d4(_0x35e873) {
        if (_0x35e873) {
            _0x3430c9.profileContainer.innerHTML = `
                <div class="avatar-wrapper">
                    <img src="${_0x35e873.avatar}" alt="Avatar">
                    <div class="status-dot ${_0x35e873.status}"></div>
                </div>
                <div class="user-info">
                    <p class="username">${_0x35e873.global_name || _0x35e873.username}</p>
                    ${"dnd" === _0x35e873.status ? "<div class=\"dnd-banner\">Do Not Disturb</div>" : ''}
                </div>
                <button id="logout">Atsijungti</button>
            `;
            document.getElementById("logout").addEventListener("click", _0x238277);
            if (_0x3430c9.reviewDiscord) {
                _0x3430c9.reviewDiscord.textContent = _0x35e873.global_name || _0x35e873.username;
            }
            _0x21ff48("success", "Sėkmingai prisijungta prie Discord!");
        } else {
            // Kai nėra prisijungusio vartotojo, išvalome profilį
            _0x3430c9.profileContainer.innerHTML = "";
        }
        _0x35e873 = !!_0x35e873;
        _0x3430c9.discordButton.style.display = _0x35e873 ? "none" : "block";
        _0x3430c9.profileContainer.style.display = _0x35e873 ? "flex" : "none";
        _0x54f5c3();
    }

    function _0x2981f8() {
        _0x3430c9.responseMessage.textContent = '';
        _0x3430c9.responseMessage.className = '';
        _0x2d4008();
    }

    function _0x382ef6(_0x4963c5) {
        _0x3430c9.responseMessage.textContent = _0x4963c5;
        _0x3430c9.responseMessage.className = "error-message";
        _0x21ff48("error", _0x4963c5);
    }

    function _0x21ff48(_0x5ed464, _0x4c7716) {
        if (_0x3430c9.notification && _0x3430c9.notificationMessage && _0x3430c9.notificationIcon) {
            _0x3430c9.notificationMessage.textContent = _0x4c7716;
            _0x3430c9.notification.className = "notification";
            _0x3430c9.notification.classList.add("notification-" + _0x5ed464);
            switch (_0x5ed464) {
                case "success":
                    _0x3430c9.notificationIcon.className = "notification-icon fas fa-check-circle";
                    break;
                case "error":
                    _0x3430c9.notificationIcon.className = "notification-icon fas fa-exclamation-circle";
                    break;
                case "warning":
                    _0x3430c9.notificationIcon.className = "notification-icon fas fa-exclamation-triangle";
                    break;
                default:
                    _0x3430c9.notificationIcon.className = "notification-icon fas fa-info-circle";
            }
            _0x3430c9.notification.classList.add('show');
            if (!("success" !== _0x5ed464 && "info" !== _0x5ed464)) {
                setTimeout(_0x2d4008, 0x1388);
            }
        }
    }

    function _0x2d4008() {
        if (_0x3430c9.notification) {
            _0x3430c9.notification.classList.remove("show");
        }
    }

    function _0x56d2a6(_0x993b52) {
        _0x4b3fcb.currentStep = _0x993b52;
        _0x3430c9.formSteps.forEach(_0x127648 => {
            _0x127648.style.display = 'none';
        });
        document.getElementById('step-' + _0x993b52).style.display = "block";
        _0x3430c9.steps.forEach(_0x42ee34 => {
            var _0x35d3f1 = parseInt(_0x42ee34.getAttribute("data-step"));
            _0x42ee34.classList.remove("active", "completed");
            if (_0x35d3f1 < _0x993b52) {
                _0x42ee34.classList.add("completed");
            } else if (_0x35d3f1 === _0x993b52) {
                _0x42ee34.classList.add('active');
            }
        });
        _0x2981f8();
    }

    // Pataisytos žvaigždučių funkcijos, kad jos veiktų teisingai
    function _0x3bbd30(_0x53720b, _0x591a86) {
        _0x42f781(_0x53720b, _0x591a86);
    }

    function _0x42f781(_0x5b37a5, _0x1b525b) {
        _0x5b37a5.forEach(_0x22cb92 => {
            if (parseInt(_0x22cb92.getAttribute("data-value")) <= _0x1b525b) {
                _0x22cb92.classList.remove("far");
                _0x22cb92.classList.add('fas');
            } else {
                _0x22cb92.classList.remove("fas");
                _0x22cb92.classList.add("far");
            }
        });
    }

    function _0x5a8e93(_0x3648d8) {
        var _0x42f36c = _0x3648d8.value.length;
        var _0x2466c3 = _0x3648d8.parentElement.querySelector('.char-count');
        if (_0x2466c3) {
            _0x2466c3.textContent = _0x42f36c + "/200";
            if (0xc8 < _0x42f36c) {
                _0x2466c3.classList.add("char-limit-exceeded");
                _0x3648d8.value = _0x3648d8.value.substring(0x0, 0xc8);
                _0x5a8e93(_0x3648d8); // Pakartotinai iškviečiame, kad atnaujintų skaitiklį po nukirpimo
                _0x21ff48("warning", "Pasiektas maksimalus simbolių skaičius (200)");
            } else {
                _0x2466c3.classList.remove("char-limit-exceeded");
            }
        }
    }

    // Nustatykite pradinę būseną ir reguliariai ją atnaujinkite
    setInterval(_0x513be1, 5000); // Atnaujinimas kas 5 sekundes
    _0x513be1(); // Iškviečiame iš karto, kad gautume pradinę būseną
});
