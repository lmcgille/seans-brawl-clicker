(function () {
  "use strict";

  const SAVE_KEY = "brawl-clicker-save-v3";
  const DUPE_STRENGTH = 0.35;

  const RARITY_ORDER = ["common", "rare", "epic", "mythic", "legendary"];

  const RARITY = {
    common: { label: "Common", weight: 520, css: "rarity-common", revealClass: "" },
    rare: { label: "Rare", weight: 280, css: "rarity-rare", revealClass: "is-rare" },
    epic: { label: "Epic", weight: 120, css: "rarity-epic", revealClass: "is-epic" },
    mythic: { label: "Mythic", weight: 60, css: "rarity-mythic", revealClass: "is-mythic" },
    legendary: {
      label: "Legendary",
      weight: 20,
      css: "rarity-legendary",
      revealClass: "is-legendary",
    },
  };

  function stackStrength(count) {
    let s = 0;
    for (let i = 0; i < count; i++) s += i === 0 ? 1 : DUPE_STRENGTH;
    return s;
  }

  const BRAWLERS = [
    {
      id: "shelly",
      name: "Shelly",
      rarity: "common",
      emoji: "🐚",
      ability: "buckshot",
      blurb: "Chance to double a tap’s coins.",
    },
    {
      id: "colt",
      name: "Colt",
      rarity: "common",
      emoji: "🤠",
      ability: "fullClip",
      blurb: "Every few taps fires an extra burst of coins.",
    },
    {
      id: "nita",
      name: "Nita",
      rarity: "common",
      emoji: "🐻",
      ability: "bearPulse",
      blurb: "Bear swipes grant bonus coins on a timer.",
    },
    {
      id: "bull",
      name: "Bull",
      rarity: "common",
      emoji: "🐂",
      ability: "charge",
      blurb: "Taps can critically smash for huge bonus.",
    },
    {
      id: "jessie",
      name: "Jessie",
      rarity: "rare",
      emoji: "🔧",
      ability: "turret",
      blurb: "Turret pings bonus coins over time.",
    },
    {
      id: "brock",
      name: "Brock",
      rarity: "rare",
      emoji: "🚀",
      ability: "rocket",
      blurb: "Rockets sometimes add a fat coin splash.",
    },
    {
      id: "bo",
      name: "Bo",
      rarity: "rare",
      emoji: "🏹",
      ability: "tripwire",
      blurb: "Tripwire triggers bonus coins now and then.",
    },
    {
      id: "poco",
      name: "Poco",
      rarity: "rare",
      emoji: "🎸",
      ability: "serenade",
      blurb: "Healing beats drop coins on a rhythm.",
    },
    {
      id: "rico",
      name: "Rico",
      rarity: "epic",
      emoji: "🤖",
      ability: "ricochet",
      blurb: "Shots can bounce and pay the tap twice.",
    },
    {
      id: "pam",
      name: "Pam",
      rarity: "epic",
      emoji: "🩹",
      ability: "discount",
      blurb: "Her station shaves Brawl Box prices.",
    },
    {
      id: "frank",
      name: "Frank",
      rarity: "epic",
      emoji: "🔨",
      ability: "hammer",
      blurb: "A heavy swing every few taps smashes extra value.",
    },
    {
      id: "bea",
      name: "Bea",
      rarity: "epic",
      emoji: "🐝",
      ability: "supercharged",
      blurb: "Charged shots make some taps worth more.",
    },
    {
      id: "mortis",
      name: "Mortis",
      rarity: "mythic",
      emoji: "🦇",
      ability: "dash",
      blurb: "Quick dashes snag sneaky coin packs.",
    },
    {
      id: "tara",
      name: "Tara",
      rarity: "mythic",
      emoji: "🔮",
      ability: "fortune",
      blurb: "Rare fate draws triple a tap’s payout.",
    },
    {
      id: "gene",
      name: "Gene",
      rarity: "mythic",
      emoji: "🧞",
      ability: "pull",
      blurb: "Magic hand refunds part of each box cost.",
    },
    {
      id: "max",
      name: "Max",
      rarity: "mythic",
      emoji: "⚡",
      ability: "energyDrink",
      blurb: "Energy surges dump a burst of passive income.",
    },
    {
      id: "spike",
      name: "Spike",
      rarity: "legendary",
      emoji: "🌵",
      ability: "needleStorm",
      blurb: "Cactus field sometimes explodes with coins.",
    },
    {
      id: "crow",
      name: "Crow",
      rarity: "legendary",
      emoji: "🪶",
      ability: "poison",
      blurb: "Poison ticks add bonus on passive income.",
    },
    {
      id: "leon",
      name: "Leon",
      rarity: "legendary",
      emoji: "🦎",
      ability: "ambush",
      blurb: "First tap after hiding hits much harder.",
    },
    {
      id: "sandy",
      name: "Sandy",
      rarity: "legendary",
      emoji: "🏜️",
      ability: "sandstorm",
      blurb: "Sandstorm sometimes doubles passive ticks.",
    },
  ];

  const UPGRADES = [
    {
      id: "tap",
      name: "Bigger taps",
      desc: "+1 coin per tap each level.",
      baseCost: 20,
      costMult: 1.2,
    },
    {
      id: "auto",
      name: "Coin drone",
      desc: "+1 coin per second each level.",
      baseCost: 50,
      costMult: 1.22,
    },
  ];

  function defaultState() {
    return {
      coins: 0,
      trophies: 0,
      levels: { tap: 0, auto: 0 },
      brawlerCounts: {},
      brawlBoxesOpened: 0,
      rollsSinceLegendary: 0,
      tapCount: 0,
    };
  }

  function countBrawler(s, id) {
    return s.brawlerCounts[id] || 0;
  }

  let state = defaultState();

  function recomputeBaseStats(s) {
    s._coinsPerClick = 1 + (s.levels.tap || 0);
    s._autoPerSec = s.levels.auto || 0;
  }

  function strengthFromSave(s, brawlerId) {
    return stackStrength(countBrawler(s, brawlerId));
  }

  function pamDiscountMult(s) {
    const st = strengthFromSave(s, "pam");
    if (st <= 0) return 1;
    return 1 - Math.min(0.3, 0.05 * st);
  }

  function brawlBoxCost(s) {
    const base = 75 + (s.brawlBoxesOpened || 0) * 20;
    return Math.max(50, Math.floor(base * pamDiscountMult(s)));
  }

  function effectiveTap(s) {
    return Math.max(1, Math.floor(s._coinsPerClick || 1));
  }

  function effectiveAuto(s) {
    const crow = strengthFromSave(s, "crow");
    const bonus = crow > 0 ? Math.floor(2 * crow) : 0;
    return Math.round(((s._autoPerSec || 0) + bonus) * 100) / 100;
  }

  let pulseBear = 0;
  let pulseTurret = 0;
  let pulseSerenade = 0;
  let leonHiddenUntil = 0;

  function resetPulses() {
    pulseBear = 0;
    pulseTurret = 0;
    pulseSerenade = 0;
    leonHiddenUntil = 0;
  }

  function abilityStrengthById(brawlerId) {
    return stackStrength(countBrawler(state, brawlerId));
  }

  function coinsFromTap(baseGain) {
    let mult = 1;
    let add = 0;
    state.tapCount = (state.tapCount || 0) + 1;
    const tc = state.tapCount;
    const now = performance.now() / 1000;

    const apply = (bid, key) => {
      const str = abilityStrengthById(bid);
      if (str <= 0) return;
      switch (key) {
        case "buckshot":
          if (Math.random() < Math.min(0.42, 0.11 * str)) mult *= 2;
          break;
        case "fullClip":
          if (tc % 7 === 0) add += Math.floor(baseGain * (1 + 0.35 * str));
          break;
        case "charge":
          if (Math.random() < Math.min(0.35, 0.12 * str))
            add += Math.floor(baseGain * (2 + 0.4 * str));
          break;
        case "rocket":
          if (Math.random() < Math.min(0.38, 0.12 * str))
            add += Math.floor(18 + 10 * str);
          break;
        case "tripwire":
          if (Math.random() < Math.min(0.35, 0.11 * str))
            add += Math.floor(12 + 8 * str);
          break;
        case "ricochet":
          if (Math.random() < Math.min(0.4, 0.1 * str)) add += baseGain;
          break;
        case "hammer":
          if (tc % 9 === 0) add += Math.floor(baseGain * (2 + 0.25 * str));
          break;
        case "supercharged":
          if (tc % 5 === 0) mult *= 1 + Math.min(1.2, 0.35 * str);
          break;
        case "dash":
          if (Math.random() < Math.min(0.4, 0.14 * str))
            add += Math.floor(10 + 6 * str);
          break;
        case "fortune":
          if (Math.random() < Math.min(0.12, 0.035 * str)) mult *= 3;
          break;
        case "energyDrink":
          if (Math.random() < Math.min(0.3, 0.09 * str)) {
            const rate = effectiveAuto(state);
            add += Math.max(1, Math.floor(rate * (2.2 + 0.4 * str)));
          }
          break;
        case "needleStorm":
          if (Math.random() < Math.min(0.14, 0.04 * str))
            add += Math.floor(baseGain * (4 + str));
          break;
        case "ambush":
          if (now >= leonHiddenUntil) {
            add += Math.floor(baseGain * (1.5 + 0.4 * str));
            leonHiddenUntil = now + Math.max(4, 9 - str);
          }
          break;
        default:
          break;
      }
    };

    BRAWLERS.forEach((b) => {
      if (!countBrawler(state, b.id)) return;
      apply(b.id, b.ability);
    });

    return Math.max(1, Math.floor(baseGain * mult) + add);
  }

  function tickAbilities(dt) {
    let dirty = false;
    const base = effectiveTap(state);

    const bear = abilityStrengthById("nita");
    if (bear > 0) {
      const iv = Math.max(3.5, 11 / (0.85 + bear * 0.15));
      pulseBear += dt;
      while (pulseBear >= iv) {
        pulseBear -= iv;
        state.coins += Math.max(1, Math.floor(base * (0.35 + 0.2 * bear)));
        maybeAwardTrophy(state);
        dirty = true;
      }
    } else pulseBear = 0;

    const tur = abilityStrengthById("jessie");
    if (tur > 0) {
      const iv = Math.max(4, 9 / (0.9 + tur * 0.12));
      pulseTurret += dt;
      while (pulseTurret >= iv) {
        pulseTurret -= iv;
        state.coins += Math.max(1, Math.floor(base * (0.25 + 0.15 * tur)));
        maybeAwardTrophy(state);
        dirty = true;
      }
    } else pulseTurret = 0;

    const poc = abilityStrengthById("poco");
    if (poc > 0) {
      const iv = Math.max(5, 14 / (0.85 + poc * 0.12));
      pulseSerenade += dt;
      while (pulseSerenade >= iv) {
        pulseSerenade -= iv;
        state.coins += Math.floor(14 + 10 * poc);
        maybeAwardTrophy(state);
        dirty = true;
      }
    } else pulseSerenade = 0;

    return dirty;
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
        levels: {
          tap: typeof data.levels?.tap === "number" ? data.levels.tap : 0,
          auto: typeof data.levels?.auto === "number" ? data.levels.auto : 0,
        },
        brawlerCounts: { ...base.brawlerCounts, ...(data.brawlerCounts || {}) },
      };
      merged.coins = typeof data.coins === "number" ? data.coins : 0;
      merged.trophies = typeof data.trophies === "number" ? data.trophies : 0;
      merged.brawlBoxesOpened =
        typeof data.brawlBoxesOpened === "number" ? data.brawlBoxesOpened : 0;
      merged.rollsSinceLegendary =
        typeof data.rollsSinceLegendary === "number" ? data.rollsSinceLegendary : 0;
      merged.tapCount = typeof data.tapCount === "number" ? data.tapCount : 0;
      recomputeBaseStats(merged);
      maybeAwardTrophy(merged);
      return merged;
    } catch {
      return defaultState();
    }
  }

  function migrateV2IfNeeded() {
    try {
      const oldKey = "brawl-clicker-save-v2";
      const old = localStorage.getItem(oldKey);
      if (!old || localStorage.getItem(SAVE_KEY)) return;
      const data = JSON.parse(old);
      const s = defaultState();
      s.coins = typeof data.coins === "number" ? data.coins : 0;
      s.trophies = typeof data.trophies === "number" ? data.trophies : 0;
      s.brawlerCounts = { ...s.brawlerCounts, ...(data.brawlerCounts || {}) };
      s.brawlBoxesOpened =
        typeof data.brawlBoxesOpened === "number" ? data.brawlBoxesOpened : 0;
      s.rollsSinceLegendary =
        typeof data.rollsSinceLegendary === "number" ? data.rollsSinceLegendary : 0;
      const L = data.levels || {};
      s.levels.tap = typeof L.tap === "number" ? L.tap : 0;
      if (typeof L.multi === "number") s.levels.tap += L.multi;
      s.levels.auto = 0;
      if (typeof L.auto_small === "number") s.levels.auto += Math.ceil(L.auto_small * 0.5);
      if (typeof L.auto_big === "number") s.levels.auto += L.auto_big * 3;
      if (typeof L.auto === "number") s.levels.auto += L.auto;
      recomputeBaseStats(s);
      maybeAwardTrophy(s);
      saveState(s);
    } catch {
      /* ignore */
    }
  }

  function saveState(s) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }

  function maybeAwardTrophy(s) {
    const milestone = Math.floor(s.coins / 10000);
    if (milestone > s.trophies) s.trophies = milestone;
  }

  function rollRarity(s) {
    const pity = Math.min(100, (s.rollsSinceLegendary || 0) * 2);
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

  function costFor(u, level) {
    return Math.ceil(u.baseCost * Math.pow(u.costMult, level));
  }

  function totalRarityWeight(pityExtra) {
    return RARITY_ORDER.reduce((a, id) => a + RARITY[id].weight, 0) + pityExtra;
  }

  function pullDetail(b, prevCount) {
    const n = prevCount + 1;
    const str = stackStrength(n);
    const dupe = prevCount > 0;
    return {
      title: b.blurb,
      meta: dupe
        ? `×${n} on your team. Extra copies add ${(DUPE_STRENGTH * 100).toFixed(0)}% ability strength.`
        : "New on your team — ability is live.",
      strengthLine: `Ability strength: ${str.toFixed(2)} (higher = stronger effects).`,
    };
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

  migrateV2IfNeeded();
  state = loadState();
  recomputeBaseStats(state);

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
    }, 2600);
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
    const dupe = prevCount > 0;
    const d = pullDetail(brawler, prevCount);
    const rc = RARITY[rarityId].revealClass;
    els.revealCard.className = "box-reveal-card" + (rc ? " " + rc : "");
    els.revealRarityBar.textContent = RARITY[rarityId].label;
    els.revealEmoji.textContent = brawler.emoji || "?";
    els.revealKindLabel.textContent = dupe ? "Duplicate" : "Unlocked";
    els.revealName.textContent = brawler.name;
    els.revealBuff.textContent = d.title;
    els.revealMeta.textContent = `${d.strengthLine} ${d.meta}`;
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
      const pct = ((100 * w) / total).toFixed(0);
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
      const next = costFor(u, level);
      const li = document.createElement("li");
      li.className = "upgrade-item";
      if (state.coins < next) li.classList.add("disabled");
      const name = document.createElement("div");
      name.className = "upgrade-name";
      name.textContent = `${u.name} (Lv.${level})`;
      const desc = document.createElement("div");
      desc.className = "upgrade-desc";
      desc.textContent = u.desc;
      const buy = document.createElement("button");
      buy.type = "button";
      buy.className = "upgrade-buy";
      buy.textContent = `${formatNum(next)} coins`;
      buy.disabled = state.coins < next;
      buy.addEventListener("click", () => {
        if (state.coins < next) return;
        state.coins -= next;
        state.levels[u.id] = level + 1;
        recomputeBaseStats(state);
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
    const owned = BRAWLERS.filter((b) => countBrawler(state, b.id) > 0);
    const order = { common: 0, rare: 1, epic: 2, mythic: 3, legendary: 4 };
    owned.sort((a, b) => order[b.rarity] - order[a.rarity] || a.name.localeCompare(b.name));
    if (owned.length === 0) {
      const empty = document.createElement("li");
      empty.className = "brawler-list-empty";
      empty.textContent = "Open a box to recruit brawlers.";
      els.brawlerList.appendChild(empty);
      return;
    }
    owned.forEach((b) => {
      const n = countBrawler(state, b.id);
      const li = document.createElement("li");
      li.className = "brawler-row";
      const av = document.createElement("div");
      av.className = "brawler-avatar";
      av.textContent = b.emoji || "?";
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
      perk.textContent = b.blurb;
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
    [...BRAWLERS]
      .sort((a, b) => order[a.rarity] - order[b.rarity] || a.name.localeCompare(b.name))
      .forEach((b) => {
        const c = countBrawler(state, b.id);
        const owned = c > 0;
        const card = document.createElement("div");
        card.className = "catalog-card" + (owned ? " is-owned" : " is-locked");
        if (!owned) {
          const lock = document.createElement("span");
          lock.className = "catalog-lock";
          lock.textContent = "🔒";
          card.appendChild(lock);
        }
        const em = document.createElement("div");
        em.className = "catalog-card-emoji";
        em.textContent = owned ? b.emoji : "?";
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
          badge.textContent = `×${c}`;
          card.appendChild(badge);
        } else {
          const hint = document.createElement("div");
          hint.className = "catalog-card-rarity";
          hint.style.marginTop = "0.12rem";
          hint.style.opacity = "0.75";
          hint.textContent = b.blurb.length > 42 ? b.blurb.slice(0, 40) + "…" : b.blurb;
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
    recomputeBaseStats(state);
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
    const base = effectiveTap(state);
    const gain = coinsFromTap(base);
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
      showPullToast(`Need ${formatNum(cost - state.coins)} more coins.`, "warn");
      return;
    }
    state.coins -= cost;
    state.brawlBoxesOpened = (state.brawlBoxesOpened || 0) + 1;
    const rarityId = rollRarity(state);
    const brawler = rollBrawlerFromRarity(rarityId);
    const prev = countBrawler(state, brawler.id);
    state.brawlerCounts[brawler.id] = prev + 1;
    const gene = abilityStrengthById("gene");
    if (gene > 0) {
      state.coins += Math.floor(cost * Math.min(0.45, 0.07 * gene));
    }
    if (rarityId === "legendary") state.rollsSinceLegendary = 0;
    else state.rollsSinceLegendary = (state.rollsSinceLegendary || 0) + 1;
    recomputeBaseStats(state);
    maybeAwardTrophy(state);
    saveState(state);
    const isDupe = prev > 0;
    showPullToast(
      isDupe
        ? `${brawler.name} ×${prev + 1}`
        : `${brawler.name} joins the fight!`,
      rarityId === "legendary" ? "legend" : isDupe ? "dup" : null
    );
    openReveal(brawler, rarityId, prev);
    renderAll();
  }

  function tick(now) {
    const dt = Math.min(0.25, (now - lastTick) / 1000);
    lastTick = now;
    const pulseDirty = tickAbilities(dt);
    const rate = effectiveAuto(state);
    let passiveGrant = 0;
    if (rate > 0) {
      accAuto += rate * dt;
      const whole = Math.floor(accAuto);
      if (whole > 0) {
        accAuto -= whole;
        let grant = whole;
        const sand = abilityStrengthById("sandy");
        if (sand > 0 && Math.random() < Math.min(0.35, 0.08 * sand)) grant += whole;
        state.coins += grant;
        passiveGrant = grant;
        maybeAwardTrophy(state);
      }
    }
    if (pulseDirty || passiveGrant > 0) {
      saveState(state);
      renderAll();
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

  if (els.openBoxBtn) els.openBoxBtn.addEventListener("click", openBrawlBox);
  if (els.revealContinue) els.revealContinue.addEventListener("click", closeReveal);
  if (els.boxReveal) {
    els.boxReveal.querySelectorAll("[data-close-reveal]").forEach((n) => {
      n.addEventListener("click", closeReveal);
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
      if (!confirm("Reset all progress?")) return;
      localStorage.removeItem(SAVE_KEY);
      state = defaultState();
      accAuto = 0;
      lastTick = performance.now();
      resetPulses();
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
