(function () {
  "use strict";

  const SAVE_KEY = "brawl-clicker-save-v1";

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
    };
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
        levels: { ...base.levels, ...data.levels },
      };
      recomputeStats(merged);
      merged.coins = typeof data.coins === "number" ? data.coins : 0;
      merged.trophies = typeof data.trophies === "number" ? data.trophies : 0;
      maybeAwardTrophy(merged);
      return merged;
    } catch {
      return defaultState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  function costFor(upgrade, level) {
    return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMult, level));
  }

  function effectiveTap(state) {
    return Math.max(1, Math.floor(state.coinsPerClick * state.tapMultiplier));
  }

  function effectiveAuto(state) {
    const raw = state.autoPerSec * state.autoMultiplier;
    return Math.round(raw * 100) / 100;
  }

  function maybeAwardTrophy(state) {
    const milestone = Math.floor(state.coins / 10000);
    if (milestone > state.trophies) {
      state.trophies = milestone;
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
  };

  let state = loadState();
  let lastTick = performance.now();
  let accAuto = 0;

  function formatNum(n) {
    if (n < 1000) return String(Math.floor(n));
    if (n < 1e6) return (n / 1000).toFixed(2).replace(/\.?0+$/, "") + "K";
    if (n < 1e9) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
    return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
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
        u.apply(state);
        maybeAwardTrophy(state);
        saveState(state);
        renderStats();
        renderUpgrades();
      });

      li.appendChild(name);
      li.appendChild(desc);
      li.appendChild(buy);
      els.upgradeList.appendChild(li);
    });
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
    renderStats();
    renderUpgrades();

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
        renderStats();
        renderUpgrades();
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

  els.resetBtn.addEventListener("click", () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    accAuto = 0;
    lastTick = performance.now();
    saveState(state);
    renderStats();
    renderUpgrades();
  });

  renderStats();
  renderUpgrades();
  requestAnimationFrame(tick);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) lastTick = performance.now();
  });
})();
