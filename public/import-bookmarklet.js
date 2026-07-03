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

  var ld = jsonLd();
  var guess = {
    title: ld.name || meta("og:title") || document.title || "",
    description: ld.description || meta("og:description") || "",
    askingPrice: ld.price || money("Asking Price") || money("Price"),
    cashFlowSDE: money("Cash Flow") || money("SDE"),
    annualRevenue: money("Gross Revenue") || money("Revenue") || money("Sales"),
  };
  var imageUrls = collectImages();

  // ---- Panel UI ----
  var panel = document.createElement("div");
  panel.setAttribute("style", "position:fixed;top:16px;right:16px;z-index:2147483647;width:380px;max-height:92vh;overflow:auto;background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;padding:14px");
  function field(label, id, val, ta) {
    return '<label style="display:block;margin:8px 0 2px;font-weight:600">' + label + '</label>' +
      (ta ? '<textarea id="' + id + '" rows="4" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid #ccc;border-radius:6px">' + (val || "").replace(/</g, "&lt;") + '</textarea>'
          : '<input id="' + id + '" value="' + String(val || "").replace(/"/g, "&quot;") + '" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid #ccc;border-radius:6px"/>');
  }
  var boroughs = ["MANHATTAN", "BROOKLYN", "QUEENS", "BRONX", "STATEN_ISLAND"];
  panel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center"><strong>Import to MercatoList</strong><button id="mlClose" style="border:none;background:none;font-size:18px;cursor:pointer">&times;</button></div>' +
    '<div style="font-size:11px;color:#666;margin:2px 0 6px">' + imageUrls.length + ' photo(s) detected. Review fields, then Create.</div>' +
    '<div style="border-top:1px solid #eee;margin:6px 0;padding-top:4px;font-weight:700;color:#0d9488">Seller / Advisor</div>' +
    field("Name", "mlSName", cfg.sellerName) +
    field("Email", "mlSEmail", cfg.sellerEmail) +
    field("Phone", "mlSPhone", cfg.sellerPhone) +
    '<label style="display:block;margin:8px 0 2px;font-weight:600">Account type</label>' +
    '<select id="mlSType" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px"><option value="SELLER">Direct Seller</option><option value="ADVISOR"' + (cfg.sellerType === "ADVISOR" ? " selected" : "") + '>Advisor / Broker</option></select>' +
    field("Brokerage (if advisor)", "mlSBrokerage", cfg.sellerBrokerage) +
    '<div style="border-top:1px solid #eee;margin:10px 0 4px;padding-top:4px;font-weight:700;color:#0d9488">Listing</div>' +
    field("Title", "mlTitle", guess.title) +
    field("Category (must match your list)", "mlCategory", "") +
    field("Asking Price ($)", "mlPrice", guess.askingPrice) +
    field("Annual Revenue ($)", "mlRev", guess.annualRevenue) +
    field("Cash Flow / SDE ($)", "mlCf", guess.cashFlowSDE) +
    field("Neighborhood", "mlHood", "") +
    '<label style="display:block;margin:8px 0 2px;font-weight:600">Borough</label>' +
    '<select id="mlBorough" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px">' + boroughs.map(function (b) { return '<option value="' + b + '">' + b + '</option>'; }).join("") + '</select>' +
    field("ZIP", "mlZip", "") +
    field("Description", "mlDesc", guess.description, true) +
    '<div id="mlStatus" style="margin:10px 0;font-size:12px;color:#666"></div>' +
    '<button id="mlGo" style="width:100%;padding:10px;background:#0d9488;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Create listing</button>';
  document.body.appendChild(panel);
  document.getElementById("mlClose").onclick = function () { panel.remove(); window.__mlImportOpen = false; };

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

  document.getElementById("mlGo").onclick = function () {
    var status = document.getElementById("mlStatus");
    var v = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; };
    // Remember seller defaults for the next listing.
    cfg.sellerName = v("mlSName"); cfg.sellerEmail = v("mlSEmail"); cfg.sellerPhone = v("mlSPhone");
    cfg.sellerType = v("mlSType"); cfg.sellerBrokerage = v("mlSBrokerage"); saveConfig(cfg);

    var payloadBase = {
      seller: { name: v("mlSName"), email: v("mlSEmail"), phone: v("mlSPhone"), accountType: v("mlSType"), brokerageName: v("mlSBrokerage") },
      listing: {
        title: v("mlTitle"), category: v("mlCategory"), askingPrice: v("mlPrice"),
        annualRevenue: v("mlRev"), cashFlowSDE: v("mlCf"),
        neighborhood: v("mlHood"), borough: v("mlBorough"), zipCode: v("mlZip"),
        description: v("mlDesc"),
      },
      photoUrls: imageUrls,
    };
    status.textContent = "Reading photos…";
    toDataUrls(imageUrls, function (dataUrls, failed) {
      payloadBase.photoData = dataUrls;               // images we could read in-browser
      payloadBase.photoUrls = failed;                 // let the server best-effort the rest
      status.textContent = "Creating listing…";
      fetch(cfg.base + "/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.token },
        body: JSON.stringify(payloadBase),
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.success) {
          status.innerHTML = '✅ Created! <a href="' + cfg.base + '/listings/' + d.data.listing.slug + '" target="_blank">View</a> — photos: ' + d.data.photosAttached + '/' + d.data.photosRequested + (d.data.photosAttached < d.data.photosRequested ? ' (add the rest in admin)' : '');
          document.getElementById("mlGo").textContent = "Create another";
        } else {
          status.textContent = "❌ " + (d.error || "Failed");
        }
      }).catch(function (e) { status.textContent = "❌ " + e.message; });
    });
  };
})();
