/* MercatoList import bookmarklet.
 * Runs in the admin's browser on a source listing tab (e.g. BizBuySell),
 * extracts what it can, shows a review panel to confirm/fill the fields and
 * seller, then posts to /api/admin/import with the admin import token.
 * Loaded via a tiny javascript: bookmarklet so it can be updated server-side.
 */
(function () {
  if (window.__mlImportOpen) return;
  window.__mlImportOpen = true;

  var LS = "mlImportConfig";
  function getConfig() {
    try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { return {}; }
  }
  function saveConfig(c) { try { localStorage.setItem(LS, JSON.stringify(c)); } catch (e) {} }

  var cfg = getConfig();
  if (!cfg.base || !cfg.token) {
    cfg.base = (cfg.base || prompt("Your MercatoList URL (e.g. https://mercatolist.vercel.app)", "https://mercatolist.vercel.app") || "").replace(/\/$/, "");
    cfg.token = cfg.token || prompt("Admin import token", "") || "";
    if (!cfg.base || !cfg.token) { window.__mlImportOpen = false; return; }
    saveConfig(cfg);
  }

  // ---- Extraction (best-effort) ----
  function meta(p) {
    var el = document.querySelector('meta[property="' + p + '"], meta[name="' + p + '"]');
    return el ? el.getAttribute("content") : "";
  }
  function jsonLd() {
    var out = {};
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
      try {
        var d = JSON.parse(s.textContent);
        (Array.isArray(d) ? d : [d]).forEach(function (o) {
          var arr = o["@graph"] ? o["@graph"] : [o];
          arr.forEach(function (n) {
            if (n.name && !out.name) out.name = n.name;
            if (n.description && !out.description) out.description = n.description;
            if (n.image && !out.image) out.image = Array.isArray(n.image) ? n.image[0] : n.image;
            var offer = n.offers || (n.offer);
            if (offer && offer.price && !out.price) out.price = offer.price;
          });
        });
      } catch (e) {}
    });
    return out;
  }
  function money(label) {
    // Find "$1,234,000" appearing near a label in the page text.
    var text = document.body.innerText || "";
    var re = new RegExp(label + "[^$]{0,40}\\$([0-9][0-9,]*)", "i");
    var m = re.exec(text);
    return m ? m[1].replace(/,/g, "") : "";
  }
  function collectImages() {
    var urls = {};
    var og = meta("og:image"); if (og) urls[og] = 1;
    document.querySelectorAll("img").forEach(function (img) {
      var s = img.currentSrc || img.src || "";
      if (/^https?:\/\//.test(s) && (img.naturalWidth > 300 || img.width > 300)) urls[s] = 1;
    });
    return Object.keys(urls).slice(0, 15);
  }

  // Non-money page-text matches (year established, employee count, sqft, …).
  function rawMatch(re) {
    var m = re.exec(document.body.innerText || "");
    return m ? m[1].replace(/,/g, "") : "";
  }

  var ld = jsonLd();
  var guess = {
    title: ld.name || meta("og:title") || document.title || "",
    description: ld.description || meta("og:description") || "",
    askingPrice: ld.price || money("Asking Price") || money("Price"),
    cashFlowSDE: money("Cash Flow") || money("SDE"),
    annualRevenue: money("Gross Revenue") || money("Revenue") || money("Sales"),
    netIncome: money("Net Income") || money("EBITDA"),
    monthlyRent: money("Monthly Rent") || money("Rent"),
    annualPayroll: money("Payroll"),
    inventoryValue: money("Inventory"),
    ffeValue: money("FF&E") || money("FFE"),
    yearEstablished: rawMatch(/(?:established|est\.?)[^0-9]{0,20}((?:19|20)\d{2})/i),
    numberOfEmployees: rawMatch(/employees?[^0-9]{0,15}(\d{1,3})\b/i),
    squareFootage: rawMatch(/([\d,]{3,7})\s*(?:sq\.?\s*ft|square\s*f[e]*t)/i),
  };
  var imageUrls = collectImages();
  // Snapshot the SOURCE page text now, before we inject our panel — otherwise
  // the panel's own labels/options pollute category matching.
  var sourceText = ((document.body.innerText || "") + " " + (guess.title || "") + " " + (guess.description || "")).toLowerCase();

  // ---- Panel UI ----
  var panel = document.createElement("div");
  panel.setAttribute("style", "position:fixed;top:16px;right:16px;z-index:2147483647;width:380px;max-height:92vh;overflow:auto;background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;padding:14px");
  function field(label, id, val, ta) {
    return '<label style="display:block;margin:8px 0 2px;font-weight:600">' + label + '</label>' +
      (ta ? '<textarea id="' + id + '" rows="4" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid #ccc;border-radius:6px">' + (val || "").replace(/</g, "&lt;") + '</textarea>'
          : '<input id="' + id + '" value="' + String(val || "").replace(/"/g, "&quot;") + '" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid #ccc;border-radius:6px"/>');
  }
  // Checkbox row (defaults to unchecked → false).
  function check(label, id) {
    return '<label style="display:flex;align-items:center;gap:6px;margin:8px 0 2px;font-weight:600;cursor:pointer"><input type="checkbox" id="' + id + '" style="margin:0"/>' + label + '</label>';
  }
  // Tri-state Yes/No/blank select — blank means "unknown", stored as null.
  function triSelect(label, id) {
    return '<label style="display:block;margin:8px 0 2px;font-weight:600">' + label + '</label>' +
      '<select id="' + id + '" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px"><option value="">—</option><option value="yes">Yes</option><option value="no">No</option></select>';
  }
  // Collapsible group of optional fields, styled like the section headers.
  function section(title, inner) {
    return '<details style="border-top:1px solid #eee;margin:10px 0 4px;padding-top:4px">' +
      '<summary style="font-weight:700;color:#0d9488;cursor:pointer">' + title + ' <span style="font-weight:400;color:#999;font-size:11px">(optional)</span></summary>' +
      inner + '</details>';
  }
  var boroughs = ["MANHATTAN", "BROOKLYN", "QUEENS", "BRONX", "STATEN_ISLAND"];
  panel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center"><strong>Import to MercatoList</strong><button id="mlClose" style="border:none;background:none;font-size:18px;cursor:pointer">&times;</button></div>' +
    '<div style="font-size:11px;color:#666;margin:2px 0 6px">' + imageUrls.length + ' photo(s) detected. Review fields, then Create.</div>' +
    '<div style="border-top:1px solid #eee;margin:6px 0;padding-top:4px;font-weight:700;color:#0d9488">Seller / Advisor</div>' +
    '<label style="display:block;margin:8px 0 2px;font-weight:600">Find existing (search name/email)</label>' +
    '<input id="mlSSearch" placeholder="Start typing to reuse an account…" autocomplete="off" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid #ccc;border-radius:6px"/>' +
    '<div id="mlSResults" style="position:relative"></div>' +
    '<div style="font-size:11px;color:#666;margin:3px 0 0">Pick one to reuse their account, or just fill the fields below to create a new one.</div>' +
    field("Name", "mlSName", cfg.sellerName) +
    field("Email", "mlSEmail", cfg.sellerEmail) +
    field("Phone", "mlSPhone", cfg.sellerPhone) +
    '<label style="display:block;margin:8px 0 2px;font-weight:600">Account type</label>' +
    '<select id="mlSType" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px"><option value="SELLER">Direct Seller</option><option value="ADVISOR"' + (cfg.sellerType === "ADVISOR" ? " selected" : "") + '>Advisor / Broker</option></select>' +
    field("Brokerage (if advisor)", "mlSBrokerage", cfg.sellerBrokerage) +
    '<div style="border-top:1px solid #eee;margin:10px 0 4px;padding-top:4px;font-weight:700;color:#0d9488">Listing</div>' +
    field("Title", "mlTitle", guess.title) +
    '<label style="display:block;margin:8px 0 2px;font-weight:600">Category</label>' +
    '<select id="mlCategory" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px"><option value="">Loading categories…</option></select>' +
    field("Asking Price ($)", "mlPrice", guess.askingPrice) +
    field("Annual Revenue ($)", "mlRev", guess.annualRevenue) +
    field("Cash Flow / SDE ($)", "mlCf", guess.cashFlowSDE) +
    field("Description", "mlDesc", guess.description, true) +
    '<div style="border-top:1px solid #eee;margin:10px 0 4px;padding-top:4px;font-weight:700;color:#0d9488">Location</div>' +
    '<label style="display:block;margin:8px 0 2px;font-weight:600">Full address (optional)</label>' +
    '<input id="mlAddress" placeholder="Start typing an address…" autocomplete="off" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid #ccc;border-radius:6px"/>' +
    '<div id="mlAddrResults" style="position:relative"></div>' +
    '<div style="font-size:11px;color:#666;margin:2px 0 0">Leave blank if the source doesn\'t show it — the public page then shows a circle around the general area instead of an exact pin.</div>' +
    check("Hide address from the public site", "mlHideAddr") +
    field("Neighborhood", "mlHood", "") +
    '<label style="display:block;margin:8px 0 2px;font-weight:600">Borough</label>' +
    '<select id="mlBorough" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px">' + boroughs.map(function (b) { return '<option value="' + b + '">' + b + '</option>'; }).join("") + '</select>' +
    field("ZIP", "mlZip", "") +
    section("More financials",
      field("Net Income ($)", "mlNet", guess.netIncome) +
      field("Monthly Rent ($)", "mlRent", guess.monthlyRent) +
      field("Rent Escalation", "mlRentEsc", "") +
      field("Annual Payroll ($)", "mlPayroll", guess.annualPayroll) +
      field("Total Expenses ($)", "mlExpenses", "") +
      field("Inventory Value ($)", "mlInv", guess.inventoryValue) +
      triSelect("Inventory included in price?", "mlInvInc") +
      field("FF&amp;E Value ($)", "mlFfe", guess.ffeValue) +
      triSelect("FF&amp;E included in price?", "mlFfeInc") +
      check("Seller financing available", "mlSellerFin") +
      check("SBA financing available", "mlSba") +
      check("Asset sale", "mlAsset")
    ) +
    section("Business details",
      field("Year Established", "mlYear", guess.yearEstablished) +
      field("Number of Employees", "mlEmp", guess.numberOfEmployees) +
      triSelect("Employees willing to stay?", "mlEmpStay") +
      '<label style="display:block;margin:8px 0 2px;font-weight:600">Owner Involvement</label>' +
      '<select id="mlOwnerInv" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px"><option value="">—</option><option value="OWNER_OPERATED">Owner-operated</option><option value="ABSENTEE">Absentee</option></select>' +
      field("Owner Hours / Week", "mlOwnerHrs", "") +
      field("Square Footage", "mlSqft", guess.squareFootage) +
      field("Lease Terms", "mlLease", "") +
      triSelect("Lease renewal option?", "mlLeaseRenew") +
      field("Reason for Selling", "mlReason", "", true) +
      field("Licenses &amp; Permits", "mlLicenses", "", true) +
      field("Training &amp; Support", "mlTraining", "", true)
    ) +
    '<div style="border-top:1px solid #eee;margin:10px 0 4px;padding-top:4px;font-weight:700;color:#0d9488">Photos</div>' +
    '<div style="font-size:11px;color:#666;margin-bottom:6px">Click a photo to cycle: <b style="color:#3b82f6">Listing</b> → <b style="color:#0d9488">Profile pic</b> → <b style="color:#999">Skip</b>. Profile pic is optional.</div>' +
    '<div id="mlPhotoGrid" style="display:flex;flex-wrap:wrap;gap:6px"></div>' +
    '<div id="mlPasteZone" tabindex="0" style="margin-top:8px;padding:10px;border:2px dashed #cbd5d1;border-radius:6px;font-size:11px;color:#666;text-align:center;cursor:pointer;outline:none">' +
    '\ud83d\udccb If photos fail to auto-import (this site blocks it): right-click a photo \u2192 <b>Copy Image</b>, click here, press <b>\u2318V</b> \u2014 repeat per photo.' +
    '</div>' +
    '<div id="mlStatus" style="margin:10px 0;font-size:12px;color:#666"></div>' +
    '<button id="mlGo" style="width:100%;padding:10px;background:#0d9488;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Create listing</button>';
  document.body.appendChild(panel);
  document.getElementById("mlClose").onclick = function () { panel.remove(); window.__mlImportOpen = false; };

  // ---- Clipboard paste → listing photo. Copy Image hands us the decoded
  //      bitmap, sidestepping both CORS and server-side bot walls. ----
  var pasteZone = document.getElementById("mlPasteZone");
  pasteZone.onclick = function () { pasteZone.focus(); pasteZone.style.borderColor = "#0d9488"; };
  // Re-opening the panel re-evals this whole script — drop the previous
  // document-level listener so pastes aren't handled twice with stale state.
  if (window.__mlPasteHandler) document.removeEventListener("paste", window.__mlPasteHandler);
  window.__mlPasteHandler = function (e) {
    if (!document.getElementById("mlPhotoGrid")) return; // panel closed
    var items = (e.clipboardData || {}).items || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf("image/") === 0) {
        e.preventDefault();
        var f = items[i].getAsFile();
        var fr = new FileReader();
        fr.onload = function () {
          pastedImages.push(fr.result);
          pastedRoles.push("listing");
          renderPhotos();
          pasteZone.innerHTML = '\u2705 ' + pastedImages.length + ' pasted \u2014 copy the next photo and \u2318V again.';
        };
        fr.readAsDataURL(f);
        return;
      }
    }
  };
  document.addEventListener("paste", window.__mlPasteHandler);

  // ---- Photo picker: each detected image is a listing photo (default), the
  //      one profile pic (optional, exclusive), or skipped. ----
  var imgRoles = {};
  imageUrls.forEach(function (u) { imgRoles[u] = "listing"; });
  // Photos pasted from the clipboard (for sites whose CDNs block both CORS
  // reads and server-side fetches, e.g. BizBuySell). Each entry is a data URL;
  // pastedRoles mirrors imgRoles ("listing" | "profile" | "skip").
  var pastedImages = [];
  var pastedRoles = [];
  function renderPhotos() {
    var grid = document.getElementById("mlPhotoGrid");
    if (!grid) return;
    if (!imageUrls.length && !pastedImages.length) { grid.innerHTML = '<div style="font-size:11px;color:#888">No photos detected — paste some below, or add them later in Admin.</div>'; return; }
    grid.innerHTML = imageUrls.map(function (u, i) {
      var role = imgRoles[u];
      var col = role === "profile" ? "#0d9488" : (role === "skip" ? "#bbb" : "#3b82f6");
      var label = role === "profile" ? "PFP" : (role === "skip" ? "Skip" : "Listing");
      var op = role === "skip" ? "0.45" : "1";
      return '<div class="mlThumb" data-i="' + i + '" title="Click to change" style="position:relative;width:58px;height:58px;border-radius:6px;overflow:hidden;border:2px solid ' + col + ';cursor:pointer;opacity:' + op + '">' +
        '<img src="' + u + '" style="width:100%;height:100%;object-fit:cover"/>' +
        '<div style="position:absolute;left:0;right:0;bottom:0;background:' + col + ';color:#fff;font-size:8px;font-weight:700;text-align:center;line-height:13px">' + label + '</div>' +
        '</div>';
    }).join("") + pastedImages.map(function (d, i) {
      var role = pastedRoles[i];
      var col = role === "profile" ? "#0d9488" : (role === "skip" ? "#bbb" : "#3b82f6");
      var label = role === "profile" ? "PFP" : (role === "skip" ? "Skip" : "Pasted");
      var op = role === "skip" ? "0.45" : "1";
      return '<div class="mlThumb" data-p="' + i + '" title="Click to change" style="position:relative;width:58px;height:58px;border-radius:6px;overflow:hidden;border:2px solid ' + col + ';cursor:pointer;opacity:' + op + '">' +
        '<img src="' + d + '" style="width:100%;height:100%;object-fit:cover"/>' +
        '<div style="position:absolute;left:0;right:0;bottom:0;background:' + col + ';color:#fff;font-size:8px;font-weight:700;text-align:center;line-height:13px">' + label + '</div>' +
        '</div>';
    }).join("");
    Array.prototype.forEach.call(grid.querySelectorAll(".mlThumb[data-p]"), function (el) {
      el.onclick = function () {
        var i = +el.getAttribute("data-p");
        var cur = pastedRoles[i];
        var next = cur === "listing" ? "profile" : (cur === "profile" ? "skip" : "listing");
        if (next === "profile") {
          Object.keys(imgRoles).forEach(function (k) { if (imgRoles[k] === "profile") imgRoles[k] = "listing"; });
          pastedRoles = pastedRoles.map(function (r) { return r === "profile" ? "listing" : r; });
        }
        pastedRoles[i] = next;
        renderPhotos();
      };
    });
    Array.prototype.forEach.call(grid.querySelectorAll(".mlThumb:not([data-p])"), function (el) {
      el.onclick = function () {
        var u = imageUrls[+el.getAttribute("data-i")];
        var cur = imgRoles[u];
        var next = cur === "listing" ? "profile" : (cur === "profile" ? "skip" : "listing");
        if (next === "profile") {
          // Only one profile pic — demote any other back to a listing photo.
          Object.keys(imgRoles).forEach(function (k) { if (imgRoles[k] === "profile") imgRoles[k] = "listing"; });
          pastedRoles = pastedRoles.map(function (r) { return r === "profile" ? "listing" : r; });
        }
        imgRoles[u] = next;
        renderPhotos();
      };
    });
  }
  renderPhotos();

  // ---- Seller search (reuse an existing account instead of re-typing) ----
  (function sellerSearch() {
    var input = document.getElementById("mlSSearch");
    var box = document.getElementById("mlSResults");
    if (!input || !box) return;
    var timer = null;
    function render(list) {
      if (!list.length) { box.innerHTML = ""; return; }
      box.innerHTML = '<div style="border:1px solid #ccc;border-top:none;border-radius:0 0 6px 6px;max-height:180px;overflow:auto;background:#fff">' +
        list.map(function (u, i) {
          var tag = u.status === "unclaimed" ? ' · unclaimed' : (u.status === "active" ? ' · active' : '');
          return '<div data-i="' + i + '" class="mlSOpt" style="padding:6px 8px;cursor:pointer;border-top:1px solid #f0f0f0">' +
            '<div style="font-weight:600">' + (u.name || "").replace(/</g, "&lt;") + '<span style="font-weight:400;color:#888;font-size:11px"> · ' + (u.accountType === "ADVISOR" ? "Advisor" : "Seller") + tag + '</span></div>' +
            '<div style="font-size:11px;color:#666">' + (u.email || "").replace(/</g, "&lt;") + ' · ' + u.listingCount + ' listing(s)</div></div>';
        }).join("") + '</div>';
      Array.prototype.forEach.call(box.querySelectorAll(".mlSOpt"), function (el) {
        el.onmouseover = function () { el.style.background = "#f3f4f6"; };
        el.onmouseout = function () { el.style.background = "#fff"; };
        el.onclick = function () {
          var u = list[+el.getAttribute("data-i")];
          document.getElementById("mlSName").value = u.name || "";
          document.getElementById("mlSEmail").value = u.email || "";
          document.getElementById("mlSPhone").value = u.phone || "";
          document.getElementById("mlSType").value = u.accountType || "SELLER";
          document.getElementById("mlSBrokerage").value = u.brokerageName || "";
          box.innerHTML = "";
          input.value = "";
        };
      });
    }
    input.oninput = function () {
      var q = input.value.trim();
      clearTimeout(timer);
      if (q.length < 2) { box.innerHTML = ""; return; }
      timer = setTimeout(function () {
        fetch(cfg.base + "/api/admin/import/sellers?q=" + encodeURIComponent(q), {
          headers: { "Authorization": "Bearer " + cfg.token }, mode: "cors"
        }).then(function (r) { return r.json(); }).then(function (d) {
          render((d && d.data) || []);
        }).catch(function () { box.innerHTML = ""; });
      }, 250);
    };
  })();

  // ---- Address autocomplete (same UX as the listing form's Mapbox autofill,
  //      proxied through the server so the Mapbox token stays private).
  //      Picking a suggestion also fills neighborhood/borough/ZIP and pins the
  //      exact coordinates so the server doesn't have to re-geocode. ----
  var mlGeo = { lat: null, lng: null };
  (function addressAutocomplete() {
    var input = document.getElementById("mlAddress");
    var box = document.getElementById("mlAddrResults");
    if (!input || !box) return;
    var timer = null;
    function render(list) {
      if (!list.length) { box.innerHTML = ""; return; }
      box.innerHTML = '<div style="border:1px solid #ccc;border-top:none;border-radius:0 0 6px 6px;max-height:180px;overflow:auto;background:#fff">' +
        list.map(function (s, i) {
          return '<div data-i="' + i + '" class="mlAOpt" style="padding:6px 8px;cursor:pointer;border-top:1px solid #f0f0f0;font-size:12px">' + (s.label || "").replace(/</g, "&lt;") + '</div>';
        }).join("") + '</div>';
      Array.prototype.forEach.call(box.querySelectorAll(".mlAOpt"), function (el) {
        el.onmouseover = function () { el.style.background = "#f3f4f6"; };
        el.onmouseout = function () { el.style.background = "#fff"; };
        el.onclick = function () {
          var s = list[+el.getAttribute("data-i")];
          input.value = s.address || s.label || "";
          if (s.zipCode) document.getElementById("mlZip").value = s.zipCode;
          if (s.neighborhood) document.getElementById("mlHood").value = s.neighborhood;
          if (s.borough) document.getElementById("mlBorough").value = s.borough;
          mlGeo.lat = s.latitude; mlGeo.lng = s.longitude;
          box.innerHTML = "";
        };
      });
    }
    input.oninput = function () {
      // Typing again invalidates a previously picked point — the server will
      // geocode whatever free text is submitted instead.
      mlGeo.lat = null; mlGeo.lng = null;
      var q = input.value.trim();
      clearTimeout(timer);
      if (q.length < 3) { box.innerHTML = ""; return; }
      timer = setTimeout(function () {
        fetch(cfg.base + "/api/admin/import/geocode?q=" + encodeURIComponent(q), {
          headers: { "Authorization": "Bearer " + cfg.token }, mode: "cors"
        }).then(function (r) { return r.json(); }).then(function (d) {
          render((d && d.data) || []);
        }).catch(function () { box.innerHTML = ""; });
      }, 300);
    };
  })();

  // Populate the Category dropdown from MercatoList's canonical list so the
  // import always lands in a real category. Falls back to a free-text input if
  // the list can't be fetched (offline / CORS blocked by the source site).
  (function loadCategories() {
    var sel = document.getElementById("mlCategory");
    if (!sel) return;
    var pageText = sourceText;
    fetch(cfg.base + "/api/categories", { mode: "cors" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var cats = (d && d.data) || [];
        if (!cats.length) throw new Error("empty");
        // Best-guess: score each category by how many of its distinctive words
        // appear in the source page (handling simple singular/plural), and
        // preselect the best match. The admin still reviews it.
        var STOP = ["shop", "shops", "store", "stores", "service", "services", "and", "the", "for", "with"];
        var guessCat = "", best = 0;
        cats.forEach(function (c) {
          if (c === "Other") return;
          var words = c.toLowerCase().replace(/&/g, " ").split(/[^a-z0-9]+/).filter(function (w) {
            return w.length >= 4 && STOP.indexOf(w) === -1;
          });
          var hits = 0;
          words.forEach(function (w) {
            var sing = w.replace(/ies$/, "y").replace(/s$/, "");
            if (pageText.indexOf(w) !== -1 || (sing.length >= 4 && pageText.indexOf(sing) !== -1)) hits++;
          });
          if (hits > best) { best = hits; guessCat = c; }
        });
        sel.innerHTML = '<option value="">— Select category —</option>' +
          cats.map(function (c) {
            return '<option value="' + c.replace(/"/g, "&quot;") + '"' + (c === guessCat ? " selected" : "") + '>' + c + '</option>';
          }).join("");
      })
      .catch(function () {
        // Fallback: replace the select with a plain input (same id) so the
        // admin can still type a category manually.
        var inp = document.createElement("input");
        inp.id = "mlCategory";
        inp.placeholder = "Type a category (couldn't load list)";
        inp.setAttribute("style", "width:100%;box-sizing:border-box;padding:6px;border:1px solid #ccc;border-radius:6px");
        sel.parentNode.replaceChild(inp, sel);
      });
  })();

  // Try to read image bytes in-browser (works only for CORS-enabled images).
  function toDataUrls(urls, done) {
    var out = [], failed = [], pending = urls.length;
    if (!pending) return done(out, failed);
    urls.forEach(function (u) {
      fetch(u, { mode: "cors" }).then(function (r) { return r.blob(); }).then(function (b) {
        var fr = new FileReader();
        fr.onload = function () { out.push(fr.result); if (--pending === 0) done(out, failed); };
        fr.onerror = function () { failed.push(u); if (--pending === 0) done(out, failed); };
        fr.readAsDataURL(b);
      }).catch(function () { failed.push(u); if (--pending === 0) done(out, failed); });
    });
  }
  // Read a single image → data URL, or null if it can't be read (CORS).
  function readOne(u, done) {
    fetch(u, { mode: "cors" }).then(function (r) { return r.blob(); }).then(function (b) {
      var fr = new FileReader();
      fr.onload = function () { done(fr.result); };
      fr.onerror = function () { done(null); };
      fr.readAsDataURL(b);
    }).catch(function () { done(null); });
  }

  document.getElementById("mlGo").onclick = function () {
    var status = document.getElementById("mlStatus");
    var v = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; };
    var cb = function (id) { var e = document.getElementById(id); return e ? !!e.checked : false; };
    // Tri-state select → true/false/null (null = unknown, left blank).
    var tri = function (id) { var s = v(id); return s === "yes" ? true : (s === "no" ? false : null); };
    // Remember seller defaults for the next listing.
    cfg.sellerName = v("mlSName"); cfg.sellerEmail = v("mlSEmail"); cfg.sellerPhone = v("mlSPhone");
    cfg.sellerType = v("mlSType"); cfg.sellerBrokerage = v("mlSBrokerage"); saveConfig(cfg);

    // Split detected images by the role picked in the grid.
    var listingUrls = imageUrls.filter(function (u) { return imgRoles[u] === "listing"; });
    var profileUrl = imageUrls.filter(function (u) { return imgRoles[u] === "profile"; })[0] || null;

    var payloadBase = {
      seller: { name: v("mlSName"), email: v("mlSEmail"), phone: v("mlSPhone"), accountType: v("mlSType"), brokerageName: v("mlSBrokerage") },
      listing: {
        title: v("mlTitle"), category: v("mlCategory"), askingPrice: v("mlPrice"),
        annualRevenue: v("mlRev"), cashFlowSDE: v("mlCf"),
        description: v("mlDesc"),
        // Location — address is optional; without one the server forces
        // hideAddress so the public map shows a general-area circle, no pin.
        address: v("mlAddress"), hideAddress: cb("mlHideAddr"),
        neighborhood: v("mlHood"), borough: v("mlBorough"), zipCode: v("mlZip"),
        // Exact point from the autocomplete pick (null when typed free-form —
        // the server geocodes the address text in that case).
        latitude: mlGeo.lat, longitude: mlGeo.lng,
        // More financials
        netIncome: v("mlNet"), monthlyRent: v("mlRent"), rentEscalation: v("mlRentEsc"),
        annualPayroll: v("mlPayroll"), totalExpenses: v("mlExpenses"),
        inventoryValue: v("mlInv"), inventoryIncluded: tri("mlInvInc"),
        ffeValue: v("mlFfe"), ffeIncluded: tri("mlFfeInc"),
        sellerFinancing: cb("mlSellerFin"), sbaFinancingAvailable: cb("mlSba"), assetSale: cb("mlAsset"),
        // Business details
        yearEstablished: v("mlYear"), numberOfEmployees: v("mlEmp"), employeesWillingToStay: tri("mlEmpStay"),
        ownerInvolvement: v("mlOwnerInv") || null, ownerHoursPerWeek: v("mlOwnerHrs"),
        squareFootage: v("mlSqft"), leaseTerms: v("mlLease"), leaseRenewalOption: tri("mlLeaseRenew"),
        reasonForSelling: v("mlReason"), licensesPermits: v("mlLicenses"), trainingSupport: v("mlTraining"),
      },
    };

    function send() {
      status.textContent = "Creating listing…";
      fetch(cfg.base + "/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.token },
        body: JSON.stringify(payloadBase),
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.success) {
          var pfp = payloadBase.avatarData || payloadBase.avatarUrl ? ' · profile photo set' : '';
          status.innerHTML = '✅ Created! <a href="' + cfg.base + '/listings/' + d.data.listing.slug + '" target="_blank">View</a> — photos: ' + d.data.photosAttached + '/' + d.data.photosRequested + pfp + (d.data.photosAttached < d.data.photosRequested ? ' (add the rest in admin)' : '');
          document.getElementById("mlGo").textContent = "Create another";
        } else {
          status.textContent = "❌ " + (d.error || "Failed");
        }
      }).catch(function (e) { status.textContent = "❌ " + e.message; });
    }

    var pastedListing = pastedImages.filter(function (d, i) { return pastedRoles[i] === "listing"; });
    var pastedProfile = pastedImages.filter(function (d, i) { return pastedRoles[i] === "profile"; })[0] || null;

    status.textContent = "Reading photos…";
    toDataUrls(listingUrls, function (dataUrls, failed) {
      payloadBase.photoData = dataUrls.concat(pastedListing);   // in-browser reads + clipboard pastes
      payloadBase.photoUrls = failed;     // server best-efforts the rest
      if (pastedProfile) payloadBase.avatarData = pastedProfile;
      if (profileUrl) {
        readOne(profileUrl, function (dataUrl) {
          if (dataUrl) payloadBase.avatarData = dataUrl; else payloadBase.avatarUrl = profileUrl;
          send();
        });
      } else {
        send();  // profile pic is optional
      }
    });
  };
})();
