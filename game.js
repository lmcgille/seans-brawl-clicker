(function () {
  "use strict";

  const SAVE_KEY = "brawl-clicker-save-v2";

  const RARITY_ORDER = ["common", "rare", "epic", "mythic", "legendary"];

  const RARITY = {
    common: {
      label: "Common",
      weight: 520,
      power: 1,
      css: "rarity-common",
      revealClass: "",
    },
    rare: {
      label: "Rare",
      weight: 280,
      power: 1.35,
      css: "rarity-rare",
      revealClass: "is-rare",
    },
    epic: {
      label: "Epic",
      weight: 120,
      power: 1.75,
      css: "rarity-epic",
      revealClass: "is-epic",
    },
    mythic: {
      label: "Mythic",
      weight: 60,
      power: 2.2,
      css: "rarity-mythic",
      revealClass: "is-mythic",
    },
    legendary: {
      label: "Legendary",
      weight: 20,
      power: 2.85,
      css: "rarity-legendary",
      revealClass: "is-legendary",
    },
  };

  const DUPE_STRENGTH = 0.35;

  const BRAWLERS = [
    { id: "shelly", name: "Shelly", rarity: "common", kind: "tap", base: 1.5, emoji: "🐚" },
    { id: "colt", name: "Colt", rarity: "common", kind: "auto", base: 0.35, emoji: "🤠" },
    { id: "nita", name: "Nita", rarity: "common", kind: "tapMult", base: 0.012, emoji: "🐻" },
    { id: "bull", name: "Bull", rarity: "common", kind: "autoMult", base: 0.01, emoji: "🐂" },
    { id: "jessie", name: "Jessie", rarity: "rare", kind: "tap", base: 2.5, emoji: "🔧" },
    { id: "brock", name: "Brock", rarity: "rare", kind: "auto", base: 0.85, emoji: "🚀" },
    { id: "bo", name: "Bo", rarity: "rare", kind: "tapMult", base: 0.02, emoji: "🏹" },
    { id: "poco", name: "Poco", rarity: "rare", kind: "autoMult", base: 0.018, emoji: "🎸" },
    { id: "rico", name: "Rico", rarity: "epic", kind: "tap", base: 4, emoji: "🤖" },
    { id: "pam", name: "Pam", rarity: "epic", kind: "auto", base: 1.6, emoji: "🩹" },
    { id: "frank", name: "Frank", rarity: "epic", kind: "tapMult", base: 0.032, emoji: "🔨" },
    { id: "bea", name: "Bea", rarity: "epic", kind: "autoMult", base: 0.028, emoji: "🐝" },
    { id: "mortis", name: "Mortis", rarity: "mythic", kind: "tap", base: 7, emoji: "🦇" },
    { id: "tara", name: "Tara", rarity: "mythic", kind: "auto", base: 3.2, emoji: "🔮" },
    { id: "gene", name: "Gene", rarity: "mythic", kind: "tapMult", base: 0.048, emoji: "🧞" },
    { id: "max", name: "Max", rarity: "mythic", kind: "autoMult", base: 0.045, emoji: "⚡" },
    { id: "spike", name: "Spike", rarity: "legendary", kind: "tap", base: 12, emoji: "🌵" },
    { id: "crow", name: "Crow", rarity: "legendary", kind: "auto", base: 6, emoji: "🪶" },
    { id: "leon", name: "Leon", rarity: "legendary", kind: "tapMult", base: 0.065, emoji: "🦎" },
    { id: "sandy", name: "Sandy", rarity: "legendary", kind: "autoMult", base: 0.06, emoji: "🏜️" },
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

  function buffForCopy(b, copyIndex) {
    const w = copyIndex === 0 ? 1 : DUPE_STRENGTH;
    const pow = RARITY[b.rarity].power;
    return b.base * pow * w;
  }

  function buffDescriptionForPull(b, copyIndexBeforePull) {
    const mag = buffForCopy(b, copyIndexBeforePull);
    switch (b.kind) {
      case "tap":
        return `+${mag.toFixed(1)} coins per tap from this copy (stacks with upgrades & other brawlers).`;
      case "auto":
        return `+${mag.toFixed(2)} coins per second from this copy (stacks with passives).`;
      case "tapMult":
        return `Tap damage ×${(1 + mag).toFixed(4)} from this copy (multiplies your total tap).`;
      case "autoMult":
        return `Passive income ×${(1 + mag).toFixed(4)} from this copy.`;
      default:
        return "";
    }
  }

  function perkSummary(b) {
    const pow = RARITY[b.rarity].power;
    const mag = b.base * pow;
    switch (b.kind) {
      case "tap":
        return `+${mag.toFixed(1)} tap on 1st copy · dupes ${(100 * DUPE_STRENGTH).toFixed(0)}%`;
      case "auto":
        return `+${mag.toFixed(2)}/s on 1st copy · dupes weaker`;
      case "tapMult":
        return `+${(mag * 100).toFixed(1)}% tap mult (1st copy)`;
      case "autoMult":
        return `+${(mag * 100).toFixed(1)}% passive mult (1st copy)`;
      default:
        return "";
    }
  }

  function lockedCatalogHint(b) {
    switch (b.kind) {
      case "tap":
        return "Boost: tap coins";
      case "auto":
        return "Boost: passive /s";
      case "tapMult":
        return "Boost: tap multiplier";
      case "autoMult":
        return "Boost: passive mult";
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
    brawlerCatalog: document.getElementById("brawlerCatalog"),
    boxReveal: document.getElementById("boxReveal"),
    revealCard: document.getElementById("revealCard"),
    revealRarityBar: document.getElementById("revealRarityBar"),
    revealEmoji: document.getElementById("revealEmoji"),
    revealKindLabel: document.getElementById("revealKindLabel"),
    revealName: document.getElementById("revealName"),
    revealBuff: document.getElementById("revealBuff"),
    revealMeta: document.getElementById("revealMeta"),
    revealContinue: document.getElementById("revealContinue"),
  };

  migrateV1IfNeeded();

  let state = loadState();
  let lastTick = performance.now();
  let accAuto = 0;
  let toastTimer = null;
  let revealOpen = false;

  function formatNum(n) {
    if (n < 1000) return String(Math.floor(n));
    if (n < 1e6) return (n / 1000).toFixed(2).replace(/\.?0+$/, "") + "K";
    if (n < 1e9) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
    return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  }

  function showPullToast(text, variant) {
    if (!els.pullToast) return;
    els.pullToast.textContent = text;
    els.pullToast.classList.remove("is-dup", "is-legend", "is-warn");
    if (variant === "dup") els.pullToast.classList.add("is-dup");
    if (variant === "legend") els.pullToast.classList.add("is-legend");
    if (variant === "warn") els.pullToast.classList.add("is-warn");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.pullToast.textContent = "";
      els.pullToast.classList.remove("is-dup", "is-legend", "is-warn");
    }, 2800);
  }

  function closeReveal() {
    if (!els.boxReveal) return;
    revealOpen = false;
    els.boxReveal.hidden = true;
    els.boxReveal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    renderBrawlerPanel();
    if (els.openBoxBtn) els.openBoxBtn.focus();
  }

  function openReveal(brawler, rarityId, prevCount) {
    if (!els.boxReveal || !els.revealCard) return;
    const isDupe = prevCount > 0;
    const newTotal = prevCount + 1;
    const rc = RARITY[rarityId].revealClass;
    els.revealCard.className = "box-reveal-card" + (rc ? " " + rc : "");
    els.revealRarityBar.textContent = RARITY[rarityId].label;
    els.revealEmoji.textContent = brawler.emoji || "?";
    els.revealKindLabel.textContent = isDupe ? "Duplicate brawler" : "New brawler unlocked";
    els.revealName.textContent = brawler.name;
    els.revealBuff.textContent = buffDescriptionForPull(brawler, prevCount);
    els.revealMeta.textContent = isDupe
      ? `You now have ×${newTotal} ${brawler.name}. Dupes give ${(100 * DUPE_STRENGTH).toFixed(0)}% of a first copy’s strength.`
      : `Added to your roster. Open more boxes to power up or find dupes.`;

    revealOpen = true;
    els.boxReveal.hidden = false;
    els.boxReveal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (els.revealContinue) els.revealContinue.focus();
  }

  function renderRarityOdds() {
    if (!els.rarityOdds) return;
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
    if (els.coins) els.coins.textContent = formatNum(state.coins);
    if (els.perTap) els.perTap.textContent = formatNum(effectiveTap(state));
    if (els.perSec) els.perSec.textContent = formatNum(effectiveAuto(state));
    if (els.trophies) els.trophies.textContent = String(state.trophies);
  }

  function renderUpgrades() {
    if (!els.upgradeList) return;
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

  function renderBrawlerList() {
    if (!els.brawlerList) return;
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
      empty.className = "brawler-list-empty";
      empty.textContent = "No brawlers yet — open a Brawl Box!";
      els.brawlerList.appendChild(empty);
      return;
    }

    owned.forEach((b) => {
      const n = state.brawlerCounts[b.id] || 0;
      const li = document.createElement("li");
      li.className = "brawler-row";

      const av = document.createElement("div");
      av.className = "brawler-avatar";
      av.textContent = b.emoji || "?";
      av.setAttribute("aria-hidden", "true");

      const main = document.createElement("div");
      main.className = "brawler-row-main";

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

      const perk = document.createElement("div");
      perk.className = "brawler-perk";
      perk.textContent = perkSummary(b);

      main.appendChild(top);
      main.appendChild(perk);

      const stack = document.createElement("span");
      stack.className = "brawler-stack";
      stack.textContent = `×${n}`;

      li.appendChild(av);
      li.appendChild(main);
      li.appendChild(stack);
      els.brawlerList.appendChild(li);
    });
  }

  function renderCatalog() {
    if (!els.brawlerCatalog) return;
    els.brawlerCatalog.innerHTML = "";
    const order = { common: 0, rare: 1, epic: 2, mythic: 3, legendary: 4 };
    const sorted = [...BRAWLERS].sort((a, b) => {
      const rd = order[a.rarity] - order[b.rarity];
      if (rd !== 0) return rd;
      return a.name.localeCompare(b.name);
    });

    sorted.forEach((b) => {
      const count = state.brawlerCounts[b.id] || 0;
      const owned = count > 0;
      const card = document.createElement("div");
      card.className = "catalog-card" + (owned ? " is-owned" : " is-locked");
      card.setAttribute("role", "listitem");

      if (!owned) {
        const lock = document.createElement("span");
        lock.className = "catalog-lock";
        lock.textContent = "🔒";
        lock.title = "Not unlocked";
        card.appendChild(lock);
      }

      const em = document.createElement("div");
      em.className = "catalog-card-emoji";
      em.textContent = owned ? b.emoji || "?" : "?";
      em.setAttribute("aria-hidden", "true");

      const nm = document.createElement("div");
      nm.className = "catalog-card-name";
      nm.textContent = owned ? b.name : "???";

      const rr = document.createElement("div");
      rr.className = "catalog-card-rarity";
      rr.textContent = RARITY[b.rarity].label;

      card.appendChild(em);
      card.appendChild(nm);
      card.appendChild(rr);

      if (owned) {
        const badge = document.createElement("div");
        badge.className = "catalog-owned-badge";
        badge.textContent = `×${count}`;
        card.appendChild(badge);
      } else {
        const hint = document.createElement("div");
        hint.className = "catalog-card-rarity";
        hint.style.marginTop = "0.15rem";
        hint.style.opacity = "0.7";
        hint.textContent = lockedCatalogHint(b);
        card.appendChild(hint);
      }

      els.brawlerCatalog.appendChild(card);
    });
  }

  function renderBrawlerPanel() {
    const cost = brawlBoxCost(state);
    if (els.boxCost) els.boxCost.textContent = formatNum(cost);
    if (els.openBoxBtn) els.openBoxBtn.disabled = state.coins < cost || revealOpen;
    renderRarityOdds();
    renderBrawlerList();
    renderCatalog();
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

  function openBrawlBox(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    if (revealOpen) return;

    const cost = brawlBoxCost(state);
    if (state.coins < cost) {
      const need = cost - state.coins;
      showPullToast(`Need ${formatNum(need)} more coins to open a box.`, "warn");
      return;
    }

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
        ? `${brawler.name} ×${prev + 1}! (${rarityLabel} dupe)`
        : `${brawler.name} unlocked! (${rarityLabel})`,
      variant
    );

    openReveal(brawler, rarityId, prev);
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

  if (els.clickBtn) {
    els.clickBtn.addEventListener("click", onTap);
    els.clickBtn.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        els.clickBtn.click();
      }
    });
  }

  if (els.openBoxBtn) {
    els.openBoxBtn.addEventListener("click", openBrawlBox);
  }

  if (els.revealContinue) {
    els.revealContinue.addEventListener("click", closeReveal);
  }

  if (els.boxReveal) {
    els.boxReveal.querySelectorAll("[data-close-reveal]").forEach((node) => {
      node.addEventListener("click", closeReveal);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && revealOpen) {
      e.preventDefault();
      closeReveal();
    }
  });

  if (els.resetBtn) {
    els.resetBtn.addEventListener("click", () => {
      if (!confirm("Reset all progress? This cannot be undone.")) return;
      localStorage.removeItem(SAVE_KEY);
      state = defaultState();
      accAuto = 0;
      lastTick = performance.now();
      closeReveal();
      saveState(state);
      renderAll();
    });
  }

  renderAll();
  requestAnimationFrame(tick);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) lastTick = performance.now();
  });
})();
