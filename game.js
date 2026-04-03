(function () {
  "use strict";

  const SAVE_KEY = "brawl-clicker-save-v2";

  const RARITY_ORDER = ["common", "rare", "epic", "mythic", "legendary"];

  const RARITY = {
    common: { label: "Common", weight: 520, power: 1, css: "rarity-common" },
    rare: { label: "Rare", weight: 280, power: 1.35, css: "rarity-rare" },
    epic: { label: "Epic", weight: 120, power: 1.75, css: "rarity-epic" },
    mythic: { label: "Mythic", weight: 60, power: 2.2, css: "rarity-mythic" },
    legendary: { label: "Legendary", weight: 20, power: 2.85, css: "rarity-legendary" },
  };

  const DUPE_STRENGTH = 0.35;

  const BRAWLERS = [
    { id: "shelly", name: "Shelly", rarity: "common", kind: "tap", base: 1.5 },
    { id: "colt", name: "Colt", rarity: "common", kind: "auto", base: 0.35 },
    { id: "nita", name: "Nita", rarity: "common", kind: "tapMult", base: 0.012 },
    { id: "bull", name: "Bull", rarity: "common", kind: "autoMult", base: 0.01 },
    { id: "jessie", name: "Jessie", rarity: "rare", kind: "tap", base: 2.5 },
    { id: "brock", name: "Brock", rarity: "rare", kind: "auto", base: 0.85 },
    { id: "bo", name: "Bo", rarity: "rare", kind: "tapMult", base: 0.02 },
    { id: "poco", name: "Poco", rarity: "rare", kind: "autoMult", base: 0.018 },
    { id: "rico", name: "Rico", rarity: "epic", kind: "tap", base: 4 },
    { id: "pam", name: "Pam", rarity: "epic", kind: "auto", base: 1.6 },
    { id: "frank", name: "Frank", rarity: "epic", kind: "tapMult", base: 0.032 },
    { id: "bea", name: "Bea", rarity: "epic", kind: "autoMult", base: 0.028 },
    { id: "mortis", name: "Mortis", rarity: "mythic", kind: "tap", base: 7 },
    { id: "tara", name: "Tara", rarity: "mythic", kind: "auto", base: 3.2 },
    { id: "gene", name: "Gene", rarity: "mythic", kind: "tapMult", base: 0.048 },
    { id: "max", name: "Max", rarity: "mythic", kind: "autoMult", base: 0.045 },
    { id: "spike", name: "Spike", rarity: "legendary", kind: "tap", base: 12 },
    { id: "crow", name: "Crow", rarity: "legendary", kind: "auto", base: 6 },
    { id: "leon", name: "Leon", rarity: "legendary", kind: "tapMult", base: 0.065 },
    { id: "sandy", name: "Sandy", rarity: "legendary", kind: "autoMult", base: 0.06 },
  ];

  const UPGRADES = [
    {
      id: "tap",
      name: "Sharper Fingers",
      desc: "+1 coin per tap. Stackable.",
      baseCost: 25,
      costMult: 1.18,
      apply: (s) => {
        s.coinsPerClick += 1;
      },
    },
    {
      id: "auto_small",
      name: "AFK Teammate",
      desc: "+0.5 coins per second each level.",
      baseCost: 80,
      costMult: 1.22,
      apply: (s) => {
        s.autoPerSec += 0.5;
      },
    },
    {
      id: "multi",
      name: "Star Power Vibes",
      desc: "+10% tap damage per level (multiplicative).",
      baseCost: 200,
      costMult: 1.35,
      apply: (s) => {
        s.tapMultiplier *= 1.1;
      },
    },
    {
      id: "auto_big",
      name: "Gadget Spam",
      desc: "+3 coins per second each level.",
      baseCost: 500,
      costMult: 1.28,
      apply: (s) => {
        s.autoPerSec += 3;
      },
    },
    {
      id: "hyper",
      name: "Hypercharge Meter",
      desc: "+25% passive income per level.",
      baseCost: 1200,
      costMult: 1.4,
      apply: (s) => {
        s.autoMultiplier *= 1.25;
      },
    },
  ];

  function defaultState() {
    return {
      coins: 0,
      trophies: 0,
      coinsPerClick: 1,
      autoPerSec: 0,
      tapMultiplier: 1,
      autoMultiplier: 1,
      levels: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
      brawlerCounts: {},
      brawlBoxesOpened: 0,
      rollsSinceLegendary: 0,
      brawlerTapAdd: 0,
      brawlerAutoAdd: 0,
      brawlerTapMult: 1,
      brawlerAutoMult: 1,
    };
  }

  function applyBrawlerBonuses(s) {
    s.brawlerTapAdd = 0;
    s.brawlerAutoAdd = 0;
    s.brawlerTapMult = 1;
    s.brawlerAutoMult = 1;
    BRAWLERS.forEach((b) => {
      const count = s.brawlerCounts[b.id] || 0;
      const pow = RARITY[b.rarity].power;
      for (let i = 0; i < count; i++) {
        const w = i === 0 ? 1 : DUPE_STRENGTH;
        const mag = b.base * pow * w;
        switch (b.kind) {
          case "tap":
            s.brawlerTapAdd += mag;
            break;
          case "auto":
            s.brawlerAutoAdd += mag;
            break;
          case "tapMult":
            s.brawlerTapMult *= 1 + mag;
            break;
          case "autoMult":
            s.brawlerAutoMult *= 1 + mag;
            break;
          default:
            break;
        }
      }
    });
  }

  function recomputeStats(s) {
    s.coinsPerClick = 1;
    s.autoPerSec = 0;
    s.tapMultiplier = 1;
    s.autoMultiplier = 1;
    UPGRADES.forEach((u) => {
      const n = s.levels[u.id] || 0;
      for (let i = 0; i < n; i++) u.apply(s);
    });
    applyBrawlerBonuses(s);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultState();
      const data = JSON.parse(raw);
      const base = defaultState();
      const merged = {
        ...base,
        ...data,
        levels: { ...base.levels, ...(data.levels || {}) },
        brawlerCounts: { ...base.brawlerCounts, ...(data.brawlerCounts || {}) },
      };
      merged.coins = typeof data.coins === "number" ? data.coins : 0;
      merged.trophies = typeof data.trophies === "number" ? data.trophies : 0;
      merged.brawlBoxesOpened =
        typeof data.brawlBoxesOpened === "number" ? data.brawlBoxesOpened : 0;
      merged.rollsSinceLegendary =
        typeof data.rollsSinceLegendary === "number" ? data.rollsSinceLegendary : 0;
      recomputeStats(merged);
      maybeAwardTrophy(merged);
      return merged;
    } catch {
      return defaultState();
    }
  }

  function migrateV1IfNeeded() {
    try {
      const old = localStorage.getItem("brawl-clicker-save-v1");
      if (!old || localStorage.getItem(SAVE_KEY)) return;
      const data = JSON.parse(old);
      const s = defaultState();
      s.coins = typeof data.coins === "number" ? data.coins : 0;
      s.trophies = typeof data.trophies === "number" ? data.trophies : 0;
      s.levels = { ...s.levels, ...(data.levels || {}) };
      recomputeStats(s);
      maybeAwardTrophy(s);
      saveState(s);
    } catch {
      /* ignore */
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  function brawlBoxCost(state) {
    return Math.floor(120 * Math.pow(1.082, state.brawlBoxesOpened || 0));
  }

  function totalRarityWeight(pityExtraLegendary) {
    let sum = 0;
    RARITY_ORDER.forEach((id) => {
      sum += RARITY[id].weight;
    });
    return sum + pityExtraLegendary;
  }

  function rollRarity(state) {
    const pity = Math.min(100, (state.rollsSinceLegendary || 0) * 2);
    const table = RARITY_ORDER.map((id) => ({
      id,
      w: RARITY[id].weight + (id === "legendary" ? pity : 0),
    }));
    const total = table.reduce((a, t) => a + t.w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < table.length; i++) {
      r -= table[i].w;
      if (r <= 0) return table[i].id;
    }
    return table[table.length - 1].id;
  }

  function rollBrawlerFromRarity(rarityId) {
    const pool = BRAWLERS.filter((b) => b.rarity === rarityId);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function costFor(upgrade, level) {
    return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMult, level));
  }

  function effectiveTap(state) {
    const raw =
      (state.coinsPerClick + state.brawlerTapAdd) *
      state.tapMultiplier *
      state.brawlerTapMult;
    return Math.max(1, Math.floor(raw));
  }

  function effectiveAuto(state) {
    const raw =
      (state.autoPerSec + state.brawlerAutoAdd) *
      state.autoMultiplier *
      state.brawlerAutoMult;
    return Math.round(raw * 100) / 100;
  }

  function maybeAwardTrophy(state) {
    const milestone = Math.floor(state.coins / 10000);
    if (milestone > state.trophies) {
      state.trophies = milestone;
    }
  }

  function perkSummary(b) {
    const pow = RARITY[b.rarity].power;
    const mag = b.base * pow;
    switch (b.kind) {
      case "tap":
        return `+${mag.toFixed(1)} tap (first copy; dupes ${(100 * DUPE_STRENGTH).toFixed(0)}%)`;
      case "auto":
        return `+${mag.toFixed(2)}/s passive (dupes weaker)`;
      case "tapMult":
        return `+${(mag * 100).toFixed(1)}% tap mult per strong copy`;
      case "autoMult":
        return `+${(mag * 100).toFixed(1)}% passive mult per strong copy`;
      default:
        return "";
    }
  }

  const els = {
    coins: document.getElementById("coins"),
    perTap: document.getElementById("perTap"),
    perSec: document.getElementById("perSec"),
    trophies: document.getElementById("trophies"),
    clickBtn: document.getElementById("clickBtn"),
    upgradeList: document.getElementById("upgradeList"),
    resetBtn: document.getElementById("resetBtn"),
    openBoxBtn: document.getElementById("openBoxBtn"),
    boxCost: document.getElementById("boxCost"),
    pullToast: document.getElementById("pullToast"),
    brawlerList: document.getElementById("brawlerList"),
    rarityOdds: document.getElementById("rarityOdds"),
  };

  migrateV1IfNeeded();

  let state = loadState();
  let lastTick = performance.now();
  let accAuto = 0;
  let toastTimer = null;

  function formatNum(n) {
    if (n < 1000) return String(Math.floor(n));
    if (n < 1e6) return (n / 1000).toFixed(2).replace(/\.?0+$/, "") + "K";
    if (n < 1e9) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
    return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  }

  function showPullToast(text, variant) {
    els.pullToast.textContent = text;
    els.pullToast.classList.remove("is-dup", "is-legend");
    if (variant === "dup") els.pullToast.classList.add("is-dup");
    if (variant === "legend") els.pullToast.classList.add("is-legend");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.pullToast.textContent = "";
      els.pullToast.classList.remove("is-dup", "is-legend");
    }, 3200);
  }

  function renderRarityOdds() {
    els.rarityOdds.innerHTML = "";
    const pity = Math.min(100, (state.rollsSinceLegendary || 0) * 2);
    const total = totalRarityWeight(pity);
    RARITY_ORDER.forEach((id) => {
      const w = RARITY[id].weight + (id === "legendary" ? pity : 0);
      const pct = ((100 * w) / total).toFixed(1);
      const li = document.createElement("li");
      const lab = document.createElement("span");
      lab.textContent = RARITY[id].label;
      const pc = document.createElement("span");
      pc.className = "pct";
      pc.textContent = `${pct}%`;
      li.appendChild(lab);
      li.appendChild(pc);
      els.rarityOdds.appendChild(li);
    });
  }

  function renderStats() {
    els.coins.textContent = formatNum(state.coins);
    els.perTap.textContent = formatNum(effectiveTap(state));
    els.perSec.textContent = formatNum(effectiveAuto(state));
    els.trophies.textContent = String(state.trophies);
  }

  function renderUpgrades() {
    els.upgradeList.innerHTML = "";
    UPGRADES.forEach((u) => {
      const level = state.levels[u.id] || 0;
      const nextCost = costFor(u, level);
      const li = document.createElement("li");
      li.className = "upgrade-item";
      if (state.coins < nextCost) li.classList.add("disabled");

      const name = document.createElement("div");
      name.className = "upgrade-name";
      name.textContent = `${u.name} (Lv.${level})`;

      const desc = document.createElement("div");
      desc.className = "upgrade-desc";
      desc.textContent = u.desc;

      const buy = document.createElement("button");
      buy.type = "button";
      buy.className = "upgrade-buy";
      buy.textContent = `${formatNum(nextCost)} ¤`;
      buy.disabled = state.coins < nextCost;
      buy.addEventListener("click", () => {
        if (state.coins < nextCost) return;
        state.coins -= nextCost;
        state.levels[u.id] = level + 1;
        recomputeStats(state);
        maybeAwardTrophy(state);
        saveState(state);
        renderAll();
      });

      li.appendChild(name);
      li.appendChild(desc);
      li.appendChild(buy);
      els.upgradeList.appendChild(li);
    });
  }

  function renderBrawlerPanel() {
    const cost = brawlBoxCost(state);
    els.boxCost.textContent = formatNum(cost);
    els.openBoxBtn.disabled = state.coins < cost;
    renderRarityOdds();

    els.brawlerList.innerHTML = "";
    const owned = BRAWLERS.filter((b) => (state.brawlerCounts[b.id] || 0) > 0);
    const order = { common: 0, rare: 1, epic: 2, mythic: 3, legendary: 4 };
    owned.sort((a, b) => {
      const rd = order[b.rarity] - order[a.rarity];
      if (rd !== 0) return rd;
      return a.name.localeCompare(b.name);
    });

    if (owned.length === 0) {
      const empty = document.createElement("li");
      empty.className = "brawler-perk";
      empty.style.padding = "0.5rem";
      empty.textContent = "No brawlers yet — open a box!";
      els.brawlerList.appendChild(empty);
      return;
    }

    owned.forEach((b) => {
      const n = state.brawlerCounts[b.id] || 0;
      const li = document.createElement("li");
      li.className = "brawler-row";

      const top = document.createElement("div");
      top.className = "brawler-row-top";

      const nm = document.createElement("span");
      nm.className = "brawler-name";
      nm.textContent = b.name;

      const tag = document.createElement("span");
      tag.className = `rarity-tag ${RARITY[b.rarity].css}`;
      tag.textContent = RARITY[b.rarity].label;

      top.appendChild(nm);
      top.appendChild(tag);

      const stack = document.createElement("span");
      stack.className = "brawler-stack";
      stack.textContent = `×${n}`;

      const perk = document.createElement("div");
      perk.className = "brawler-perk";
      perk.textContent = perkSummary(b);

      li.appendChild(top);
      li.appendChild(stack);
      li.appendChild(perk);
      els.brawlerList.appendChild(li);
    });
  }

  function renderAll() {
    renderStats();
    renderUpgrades();
    renderBrawlerPanel();
  }

  function spawnFloater(x, y, amount) {
    const el = document.createElement("div");
    el.className = "floater";
    el.textContent = `+${formatNum(amount)}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  function onTap(ev) {
    const gain = effectiveTap(state);
    state.coins += gain;
    maybeAwardTrophy(state);
    saveState(state);
    renderAll();

    const rect = els.clickBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const px = (ev.clientX ?? cx) - 20;
    const py = (ev.clientY ?? cy) - 10;
    spawnFloater(px, py, gain);

    els.clickBtn.classList.add("is-pressed");
    clearTimeout(els.clickBtn._t);
    els.clickBtn._t = setTimeout(() => els.clickBtn.classList.remove("is-pressed"), 90);
  }

  function openBrawlBox() {
    const cost = brawlBoxCost(state);
    if (state.coins < cost) return;

    state.coins -= cost;
    state.brawlBoxesOpened = (state.brawlBoxesOpened || 0) + 1;

    const rarityId = rollRarity(state);
    const brawler = rollBrawlerFromRarity(rarityId);
    const prev = state.brawlerCounts[brawler.id] || 0;
    state.brawlerCounts[brawler.id] = prev + 1;

    if (rarityId === "legendary") state.rollsSinceLegendary = 0;
    else state.rollsSinceLegendary = (state.rollsSinceLegendary || 0) + 1;

    recomputeStats(state);
    maybeAwardTrophy(state);
    saveState(state);

    const isDupe = prev > 0;
    const variant = rarityId === "legendary" ? "legend" : isDupe ? "dup" : null;
    const rarityLabel = RARITY[rarityId].label;
    showPullToast(
      isDupe
        ? `${brawler.name} again! (${rarityLabel} dupe — ${(100 * DUPE_STRENGTH).toFixed(0)}% boost)`
        : `New: ${brawler.name} (${rarityLabel})!`,
      variant
    );

    renderAll();
  }

  function tick(now) {
    const dt = Math.min(0.25, (now - lastTick) / 1000);
    lastTick = now;
    const rate = effectiveAuto(state);
    if (rate > 0) {
      accAuto += rate * dt;
      const whole = Math.floor(accAuto);
      if (whole > 0) {
        accAuto -= whole;
        state.coins += whole;
        maybeAwardTrophy(state);
        saveState(state);
        renderAll();
      }
    }
    requestAnimationFrame(tick);
  }

  els.clickBtn.addEventListener("click", onTap);
  els.clickBtn.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      els.clickBtn.click();
    }
  });

  els.openBoxBtn.addEventListener("click", openBrawlBox);

  els.resetBtn.addEventListener("click", () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    accAuto = 0;
    lastTick = performance.now();
    saveState(state);
    renderAll();
  });

  renderAll();
  requestAnimationFrame(tick);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) lastTick = performance.now();
  });
})();
