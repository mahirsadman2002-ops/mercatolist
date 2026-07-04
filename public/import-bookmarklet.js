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
    field("Neighborhood", "mlHood", "") +
    '<label style="display:block;margin:8px 0 2px;font-weight:600">Borough</label>' +
    '<select id="mlBorough" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px">' + boroughs.map(function (b) { return '<option value="' + b + '">' + b + '</option>'; }).join("") + '</select>' +
    field("ZIP", "mlZip", "") +
    field("Description", "mlDesc", guess.description, true) +
    '<div id="mlStatus" style="margin:10px 0;font-size:12px;color:#666"></div>' +
    '<button id="mlGo" style="width:100%;padding:10px;background:#0d9488;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Create listing</button>';
  document.body.appendChild(panel);
  document.getElementById("mlClose").onclick = function () { panel.remove(); window.__mlImportOpen = false; };

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
