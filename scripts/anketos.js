function debug(..._0x4e5b61) {
  console.log("DEBUG:", ..._0x4e5b61);
}
debug("Script started");
const DISCORD_REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname);
let discordToken = null;
let discordUserId = null;
let pendingAppIdToDelete = null;
let authWindow = null;
function getQueryParam(_0x1b8912) {
  return new URLSearchParams(window.location.search).get(_0x1b8912);
}
function getStatusClass(_0x2bd4f7) {
  return _0x2bd4f7 ? (_0x2bd4f7 = _0x2bd4f7.toLowerCase()).includes("patvirtinta") || _0x2bd4f7.includes("priimtas") || _0x2bd4f7.includes("accepted") ? "status-accepted" : _0x2bd4f7.includes("atmesta") || _0x2bd4f7.includes("atmestas") || _0x2bd4f7.includes("rejected") ? 'status-rejected' : _0x2bd4f7.includes("laukiama") || _0x2bd4f7.includes("pending") ? "status-pending" : 'status-reviewing' : "status-reviewing";
}
function formatDate(_0x3d4f69) {
  if (!_0x3d4f69) {
    return "N/A";
  }
  try {
    return new Date(_0x3d4f69).toISOString().split('T')[0x0];
  } catch (_0x4f9db8) {
    return _0x3d4f69;
  }
}
function showOAuthPopup() {
  debug("Showing OAuth popup");
  document.getElementById("oauth-popup").classList.remove("hidden");
}
function hideOAuthPopup() {
  debug("Hiding OAuth popup");
  document.getElementById('oauth-popup').classList.add('hidden');
}
function showStatusMessage(_0xc8e8ac, _0x2ef62e = false) {
  debug("Status message:", _0xc8e8ac, _0x2ef62e ? "(error)" : '');
  const _0x274839 = document.getElementById("status-message");
  _0x274839.textContent = _0xc8e8ac;
  _0x274839.classList.remove("hidden", 'success-message', "error-message");
  _0x274839.classList.add(_0x2ef62e ? "error-message" : "success-message");
  setTimeout(() => {
    _0x274839.classList.add("hidden");
  }, 0x1388);
}
function openDiscordAuthPopup() {
  debug("Opening Discord OAuth popup");
  var _0x1f76ae = window.screenX + (window.outerWidth - 0x258) / 0x2;
  var _0xddc36f = window.screenY + (window.outerHeight - 0x320) / 0x2;
  var _0x1c78c6 = 'https://discord.com/api/oauth2/authorize?client_id=1263389179249692693&redirect_uri=' + DISCORD_REDIRECT_URI + "&response_type=token&scope=identify";
  authWindow = window.open(_0x1c78c6, "Discord Authentication", "width=600,height=800,left=" + _0x1f76ae + ',top=' + _0xddc36f + ',resizable=yes,scrollbars=yes');
  const _0x46eff1 = setInterval(() => {
    try {
      var _0x1a596f;
      if (authWindow.closed) {
        clearInterval(_0x46eff1);
      } else if (authWindow.location.href.includes('access_token=') && (clearInterval(_0x46eff1), _0x1a596f = new URLSearchParams(authWindow.location.hash.substring(0x1)).get("access_token"), authWindow.close(), _0x1a596f)) {
        debug("Got access token from popup:", _0x1a596f.substring(0x0, 0xa) + "...");
        handleDiscordAuth(_0x1a596f);
      }
    } catch (_0x479845) {}
  }, 0x1f4);
}
async function handleDiscordAuth(_0x558ad2) {
  debug("Handling Discord auth with token");
  hideOAuthPopup();
  var _0xcf4957 = await getUserInfo(_0x558ad2);
  if (_0xcf4957) {
    discordToken = _0x558ad2;
    discordUserId = _0xcf4957.id;
    debug("Auth successful:", _0xcf4957.username, discordUserId);
    debug("Is admin?", discordUserId === "959449311366766622");
    if (pendingAppIdToDelete) {
      debug("Processing pending deletion:", pendingAppIdToDelete);
      _0x558ad2 = pendingAppIdToDelete;
      pendingAppIdToDelete = null;
      await deleteApplication(_0x558ad2);
    }
  } else {
    showStatusMessage("Discord authentication failed. Please try again.", true);
  }
}
async function getUserInfo(_0x2d626d) {
  debug("Getting user info with token:", _0x2d626d.substring(0x0, 0xa) + '...');
  try {
    var _0x4cce43;
    var _0xc81a95;
    var _0x1a88bc = await fetch('https://discord.com/api/users/@me', {
      'headers': {
        'Authorization': "Bearer " + _0x2d626d
      }
    });
    if (_0x1a88bc.ok) {
      debug("User info received:", (_0xc81a95 = await _0x1a88bc.json()).username, _0xc81a95.id);
      return _0xc81a95;
    }
    _0x4cce43 = await _0x1a88bc.text();
    debug("Discord API error:", _0x1a88bc.status, _0x4cce43);
    throw new Error("Failed to get user info from Discord: " + _0x1a88bc.status);
  } catch (_0x154108) {
    debug("Error getting Discord user info:", _0x154108);
    console.error("Error getting Discord user info:", _0x154108);
    return null;
  }
}
async function deleteApplication(_0x9fadd3) {
  debug("Attempting to delete application:", _0x9fadd3);
  debug("Current user ID:", discordUserId);
  debug("Admin ID:", "959449311366766622");
  try {
    if (discordUserId !== "959449311366766622") {
      debug("Delete failed: Not admin");
      showStatusMessage("Negalite to padaryti. Jūs neturite administratoriaus teisių.", true);
      return false;
    }
    debug("User is admin, proceeding with deletion");
    var _0x4a5a79 = "https://supa.mielamalonu.com/api/supabase/Anketos?ID=eq." + encodeURIComponent(_0x9fadd3.trim());
    debug("Fetching application details:", _0x4a5a79);
    var _0x2d1759 = await fetch(_0x4a5a79, {
      'headers': {
        'apikey': "cbb",
        'Authorization': "Bearer cbb"
      }
    });
    if (!_0x2d1759.ok) {
      throw new Error("Failed to fetch application details. Status: " + _0x2d1759.status);
    }
    var _0x51c746 = await _0x2d1759.json();
    debug("Found applications:", _0x51c746.length);
    if (0x0 === _0x51c746.length) {
      throw new Error("Application not found");
    }
    var _0x1026be = document.querySelector(".application-item[data-id=\"" + _0x9fadd3 + "\"]");
    if (!_0x1026be) {
      throw new Error("Could not locate the clicked application in the DOM");
    }
    const _0x472959 = {
      'nick': _0x1026be.querySelector(".user-id")?.['textContent']["trim"]()["replace"]('@', ''),
      'status': _0x1026be.querySelector(".status-tag")?.["textContent"]["trim"](),
      'date': _0x1026be.querySelector(".application-date")?.['textContent']["trim"]()
    };
    _0x1026be.querySelectorAll(".field-name").forEach(_0x5dee4d => {
      var _0x27906d = _0x5dee4d.textContent.trim();
      var _0x5dee4d = _0x5dee4d.nextElementSibling;
      if (_0x27906d.includes("Amžius") && _0x5dee4d) {
        _0x472959.metai = _0x5dee4d.textContent.trim();
      } else {
        if (_0x27906d.includes("pc check") && _0x5dee4d) {
          _0x472959.pccheck = _0x5dee4d.textContent.trim();
        } else {
          if (_0x27906d.includes("įspėjimą") && _0x5dee4d) {
            _0x472959.isp = _0x5dee4d.textContent.trim();
          } else if (_0x27906d.includes("Atmetimo priežastis") && _0x5dee4d) {
            _0x472959.priezastis = _0x5dee4d.textContent.trim();
          }
        }
      }
    });
    _0x1026be.querySelectorAll(".rating-label").forEach(_0x8f4b6d => {
      var _0x3e5f4c = _0x8f4b6d.textContent.trim();
      var _0x8f4b6d = _0x8f4b6d.nextElementSibling;
      if (_0x3e5f4c.includes("Pašaudymo lygis") && _0x8f4b6d) {
        _0x472959.pl = _0x8f4b6d.textContent.trim();
      } else if (_0x3e5f4c.includes("Komunikavimo lygis") && _0x8f4b6d) {
        _0x472959.kl = _0x8f4b6d.textContent.trim();
      }
    });
    debug("Clicked element data:", _0x472959);
    let _0xa9739 = null;
    let _0x3533c5 = 0x0;
    for (const _0x324741 of _0x51c746) {
      let _0x3753bf = 0x0;
      if (_0x324741.NICK === _0x472959.nick) {
        _0x3753bf += 0xa;
      }
      if (_0x324741.STATUS === _0x472959.status) {
        _0x3753bf += 0x5;
      }
      if (formatDate(_0x324741.DATA) === _0x472959.date) {
        _0x3753bf += 0x8;
      }
      if (_0x324741.METAI && _0x472959.metai && _0x324741.METAI.toString() === _0x472959.metai) {
        _0x3753bf += 0x3;
      }
      if (_0x324741.PL && _0x472959.pl && _0x324741.PL.toString() === _0x472959.pl) {
        _0x3753bf += 0x3;
      }
      if (_0x324741.KL && _0x472959.kl && _0x324741.KL.toString() === _0x472959.kl) {
        _0x3753bf += 0x3;
      }
      if (_0x324741.PCCHECK === _0x472959.pccheck) {
        _0x3753bf += 0x3;
      }
      if (_0x324741.ISP === _0x472959.isp) {
        _0x3753bf += 0x3;
      }
      if (_0x324741.PRIEŽASTIS === _0x472959.priezastis) {
        _0x3753bf += 0x3;
      }
      debug("App match score (" + _0x324741.NICK + ", " + formatDate(_0x324741.DATA) + "): " + _0x3753bf);
      if (_0x3753bf > _0x3533c5) {
        _0x3533c5 = _0x3753bf;
        _0xa9739 = _0x324741;
      }
    }
    if (!_0xa9739) {
      throw new Error("Could not identify the specific application to delete");
    }
    debug("Found target application for deletion:", _0xa9739);
    let _0x5ded9d = "https://supa.mielamalonu.com/api/supabase/Anketos?ID=eq." + encodeURIComponent(_0x9fadd3.trim());
    if (_0xa9739.DATA) {
      _0x5ded9d += "&DATA=eq." + encodeURIComponent(_0xa9739.DATA);
    }
    if (_0xa9739.NICK) {
      _0x5ded9d += "&NICK=eq." + encodeURIComponent(_0xa9739.NICK);
    }
    if (_0xa9739.STATUS) {
      _0x5ded9d += "&STATUS=eq." + encodeURIComponent(_0xa9739.STATUS);
    }
    if (null !== _0xa9739.METAI && undefined !== _0xa9739.METAI) {
      _0x5ded9d += "&METAI=eq." + encodeURIComponent(_0xa9739.METAI);
    }
    if (null !== _0xa9739.PL && undefined !== _0xa9739.PL) {
      _0x5ded9d += "&PL=eq." + encodeURIComponent(_0xa9739.PL);
    }
    if (null !== _0xa9739.KL && undefined !== _0xa9739.KL) {
      _0x5ded9d += "&KL=eq." + encodeURIComponent(_0xa9739.KL);
    }
    if (_0xa9739.PCCHECK) {
      _0x5ded9d += "&PCCHECK=eq." + encodeURIComponent(_0xa9739.PCCHECK);
    }
    if (_0xa9739.ISP) {
      _0x5ded9d += "&ISP=eq." + encodeURIComponent(_0xa9739.ISP);
    }
    if (_0xa9739.PRIEŽASTIS) {
      _0x5ded9d += "&PRIEŽASTIS=eq." + encodeURIComponent(_0xa9739.PRIEŽASTIS);
    }
    debug("Delete URL with all filters:", _0x5ded9d);
    var _0x52c188 = await fetch(_0x5ded9d, {
      'method': "DELETE",
      'headers': {
        'apikey': "cbb",
        'Authorization': "Bearer cbb",
        'Content-Type': "application/json"
      }
    });
    debug("Delete response status:", _0x52c188.status);
    try {
      debug("Delete response text:", await _0x52c188.text());
    } catch (_0x4e9c0c) {
      debug("Could not get response text:", _0x4e9c0c);
    }
    if (_0x52c188.ok) {
      showStatusMessage("Aplikacija sėkmingai ištrinta!");
      debug("Delete successful");
      _0x1026be.remove();
      return true;
    }
    throw new Error("Failed to delete. Status: " + _0x52c188.status);
  } catch (_0x5afb1f) {
    debug("Error deleting application:", _0x5afb1f);
    console.error("Error deleting application:", _0x5afb1f);
    showStatusMessage("Klaida trinant aplikaciją: " + _0x5afb1f.message, true);
    return false;
  }
}
async function removeApplication(_0x238f34) {
  debug("Remove application clicked:", _0x238f34);
  pendingAppIdToDelete = _0x238f34;
  if (!discordToken || !discordUserId) {
    debug("No Discord token/user ID, showing auth popup");
    showOAuthPopup();
    return false;
  }
  debug("Has Discord auth, confirming deletion");
  if (confirm("Ar tikrai norite ištrinti šią aplikaciją?")) {
    await deleteApplication(_0x238f34);
  } else {
    debug("User cancelled deletion");
    pendingAppIdToDelete = null;
  }
}
function createDiscordEmbeds(_0x290708) {
  debug("Creating embeds for", _0x290708 ? _0x290708.length : 0x0, "applications");
  if (!_0x290708 || 0x0 === _0x290708.length) {
    return "<div class=\"error\">No applications found.</div>";
  }
  let _0x49180c = '';
  _0x290708.forEach(_0x170c1c => {
    var _0x43416c = getStatusClass(_0x170c1c.STATUS);
    var _0x33db13 = formatDate(_0x170c1c.DATA);
    var _0x30997c = _0x170c1c.STATUS && (_0x170c1c.STATUS.toLowerCase().includes("atmesta") || _0x170c1c.STATUS.toLowerCase().includes("atmestas") || _0x170c1c.STATUS.toLowerCase().includes("rejected"));
    var _0x172dcb = "<button class=\"remove-btn\" data-id=\"" + (_0x170c1c.ID || _0x170c1c.id) + "\">Pašalinti</button>";
    _0x49180c += "\n            <div class=\"application-item\" data-id=\"" + (_0x170c1c.ID || _0x170c1c.id) + "\">\n                <div class=\"application-header\">\n                    <div class=\"application-id\">\n                        <img src=\"https://cdn.discordapp.com/icons/1325850250027597845/a_390be3fdaab65e28c28d150ca21d93bb.gif?size=1024\" alt=\"MM\" class=\"header-logo\">\n                        <div class=\"user-info\">\n                            <span class=\"username\">Anketos</span>\n                            <span class=\"user-id\">@" + (_0x170c1c.NICK || "N/A") + "</span>\n                        </div>\n                        <span class=\"status-tag " + _0x43416c + "\">" + (_0x170c1c.STATUS || "Peržiūrima") + "</span>\n                    </div>\n                    <div class=\"application-actions\">\n                        <div class=\"application-date\">" + _0x33db13 + "</div>\n                        " + _0x172dcb + "\n                    </div>\n                </div>\n                \n                <div class=\"application-field\">\n                    <div class=\"field-name\">Amžius</div>\n                    <div class=\"field-value\">" + (_0x170c1c.METAI || "N/A") + "</div>\n                </div>\n\n                <div class=\"application-field\">\n                    <div class=\"field-name\">Dėl ko nori i Ganga</div>\n                    <div class=\"field-value\">" + (_0x170c1c.REASON || "N/A") + "</div>\n                </div>\n                \n                " + (_0x30997c ? "\n                <div class=\"application-field\">\n                    <div class=\"field-name\"></div>\n                    <div class=\"field-value rejection-reason\">" + (_0x170c1c.PRIEŽASTIS || "Nepateikta") + "</div>\n                </div>\n                " : '') + "\n                \n                <div class=\"application-field\">\n                    <div class=\"field-name\">Ar sutiktumėte pasidaryti pc check?</div>\n                    <div class=\"field-value\">" + (_0x170c1c.PCCHECK || "Taip") + "</div>\n                </div>\n                \n                <div class=\"application-field\">\n                    <div class=\"field-name\">Ar išpirkumėte įspėjimą jei jis būtų dėl jūsų kaltės?</div>\n                    <div class=\"field-value\">" + (_0x170c1c.ISP || "Taip") + "</div>\n                </div>\n                \n                <div class=\"rating-row\">\n                    <div class=\"rating-item\">\n                        <div class=\"rating-label\">Pašaudymo lygis</div>\n                        <div class=\"rating-value\">" + (_0x170c1c.PL || '0') + "</div>\n                    </div>\n                    <div class=\"rating-item\">\n                        <div class=\"rating-label\">Komunikavimo lygis</div>\n                        <div class=\"rating-value\">" + (_0x170c1c.KL || '0') + "</div>\n                    </div>\n                </div>\n                \n                <div class=\"bottom-info\">\n                    <img src=\"https://cdn.discordapp.com/icons/1325850250027597845/a_390be3fdaab65e28c28d150ca21d93bb.gif?size=1024\" alt=\"MM\" class=\"footer-logo\">\n                    Miela Malonu | Anketos\n                </div>\n            </div>\n        ";
  });
  return _0x49180c;
}
function setupRemoveButtons() {
  debug("Setting up remove button event listeners");                            
  var _0x322314 = document.querySelectorAll('.remove-btn');
  _0x322314.forEach(_0x56fb60 => {
    var _0x2f2984 = _0x56fb60.cloneNode(true);
    _0x56fb60.parentNode.replaceChild(_0x2f2984, _0x56fb60);
    _0x2f2984.addEventListener("click", function (_0x1ffc6f) {
      _0x1ffc6f.preventDefault();
      _0x1ffc6f.stopPropagation();
      _0x1ffc6f = this.getAttribute("data-id");
      debug("Remove button clicked for ID:", _0x1ffc6f);
      if (_0x1ffc6f) {
        removeApplication(_0x1ffc6f);
      }
    });
  });
  debug("Total remove buttons with listeners:", _0x322314.length);
}
async function fetchApplications(_0x43b758 = null) {
  debug("Fetching applications for user:", _0x43b758);
  var _0x2d78f7 = document.getElementById('content');
  _0x2d78f7.innerHTML = "<div class=\"loading\">Loading application data...</div>";
  try {
    let _0x208c46 = "https://supa.mielamalonu.com/api/supabase/Anketos?select=ID,METAI,PL,KL,PCCHECK,ISP,STATUS,DATA,NICK,REASON";
    if (_0x43b758) {
      _0x208c46 += "&ID=eq." + encodeURIComponent(_0x43b758);
    }
    debug("Fetch URL:", _0x208c46);
    var _0x4fe81c = await fetch(_0x208c46, {
      'headers': {
        'apikey': "cbb",
        'Authorization': "Bearer cbb"
      }
    });
    if (!_0x4fe81c.ok) {
      throw new Error("HTTP error! Status: " + _0x4fe81c.status);
    }
    var _0x4160b9 = await _0x4fe81c.json();
    debug('Received', _0x4160b9.length, "applications");
    _0x2d78f7.innerHTML = createDiscordEmbeds(_0x4160b9);
    setupRemoveButtons();
  } catch (_0x41a8dc) {
    debug("Error fetching data:", _0x41a8dc);
    console.error("Error fetching data:", _0x41a8dc);
    _0x2d78f7.innerHTML = "<div class=\"error\">Failed to load applications: " + _0x41a8dc.message + "</div>";
  }
}
function setupSearchButton() {
  const _0x40a2d8 = document.getElementById('searchButton');
  const _0x441af1 = document.getElementById("userId");
  _0x40a2d8.addEventListener("click", () => {
    var _0x307be8 = _0x441af1.value.trim();
    if (_0x307be8) {
      window.location.href = "anketos.html?user=" + _0x307be8;
    }
  });
  _0x441af1.addEventListener("keypress", _0x3e0033 => {
    if ("Enter" === _0x3e0033.key) {
      _0x40a2d8.click();
    }
  });
}
function setupAuthButtons() {
  var _0x19610e = document.getElementById("authenticate-btn");
  var _0x5d7917 = document.getElementById("cancel-auth-btn");
  _0x19610e.addEventListener("click", () => {
    debug("Auth button clicked, opening Discord OAuth popup");
    hideOAuthPopup();
    openDiscordAuthPopup();
  });
  _0x5d7917.addEventListener("click", () => {
    debug("Cancel auth button clicked");
    pendingAppIdToDelete = null;
    hideOAuthPopup();
  });
}
document.addEventListener("click", function (_0xe4c1e9) {
  if (_0xe4c1e9.target && _0xe4c1e9.target.classList.contains("remove-btn") && (_0xe4c1e9.preventDefault(), _0xe4c1e9.stopPropagation(), debug("Remove button clicked via delegation for ID:", _0xe4c1e9 = _0xe4c1e9.target.getAttribute('data-id')), _0xe4c1e9)) {
    removeApplication(_0xe4c1e9);
  }
});
window.addEventListener("message", function (_0x4c6250) {
  if (_0x4c6250.data && "discord_auth" === _0x4c6250.data.type) {
    debug("Received message from auth popup:", _0x4c6250.data);
    handleDiscordAuth(_0x4c6250.data.token);
  }
});
document.addEventListener("DOMContentLoaded", async () => {
  debug("DOM loaded");
  setupSearchButton();
  setupAuthButtons();
  var _0x178780 = new URLSearchParams(window.location.search).get("user");
  debug("User ID from URL:", _0x178780);
  if (_0x178780) {
    document.getElementById("userId").value = _0x178780;
  }
  await fetchApplications(_0x178780);
});
