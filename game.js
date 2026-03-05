/* Zen Sparks - idle merge shard breaker
 * Built with vanilla JS using a modular class structure.
 */

class Spark {
  constructor(x, y, level = 1) {
    this.x = x;
    this.y = y;
    this.level = level;
    this.radius = 4 + level * 1.6;
    this.vx = (Math.random() * 2 - 1) * 70;
    this.vy = (Math.random() * 2 - 1) * 70;
    this.trail = [];
    this.trailMax = 9;
  }

  getDamage(baseDamage) {
    return baseDamage * (1 + (this.level - 1) * 0.9);
  }

  getSpeedMultiplier() {
    return 1 + (this.level - 1) * 0.12;
  }

  update(dt, game) {
    const speedBoost = game.upgrades.sparkSpeed.value;
    this.x += this.vx * dt * speedBoost * this.getSpeedMultiplier();
    this.y += this.vy * dt * speedBoost * this.getSpeedMultiplier();

    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -1;
    } else if (this.x > game.width - this.radius) {
      this.x = game.width - this.radius;
      this.vx *= -1;
    }

    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy *= -1;
    } else if (this.y > game.height - this.radius) {
      this.y = game.height - this.radius;
      this.vy *= -1;
    }

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.trailMax) this.trail.shift();
  }

  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const t = i / this.trail.length;
      ctx.beginPath();
      ctx.fillStyle = `rgba(166, 239, 255, ${0.09 + t * 0.2})`;
      ctx.arc(p.x, p.y, this.radius * (0.3 + t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    const glow = 10 + this.level * 4;
    const gradient = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, glow);
    gradient.addColorStop(0, "rgba(214, 252, 255, 0.95)");
    gradient.addColorStop(1, `rgba(84, 186, 255, ${0.2 + this.level * 0.03})`);

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(this.x, this.y, this.radius + this.level * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Shard {
  constructor(x, y, size, health, color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.maxHealth = health;
    this.health = health;
    this.color = color;
    this.flash = 0;
    this.points = Math.floor(health * 2.5 + size * 1.4);
    this.vertices = this.generatePolygon();
  }

  generatePolygon() {
    const vertices = [];
    const sides = Math.floor(5 + Math.random() * 4);
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides;
      const variance = this.size * (0.7 + Math.random() * 0.45);
      vertices.push({ x: Math.cos(a) * variance, y: Math.sin(a) * variance });
    }
    return vertices;
  }

  hit(dmg) {
    this.health -= dmg;
    this.flash = 1;
  }

  containsPoint(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= this.size * this.size;
  }

  update(dt) {
    this.flash = Math.max(0, this.flash - dt * 4.2);
  }

  draw(ctx) {
    const hpRatio = Math.max(0, this.health / this.maxHealth);
    const glowBoost = this.flash * 0.6;
    ctx.beginPath();
    this.vertices.forEach((v, idx) => {
      const px = this.x + v.x;
      const py = this.y + v.y;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();

    ctx.fillStyle = this.adjustColor(this.color, 0.25 + glowBoost);
    ctx.strokeStyle = this.adjustColor(this.color, 0.58 + this.flash * 0.55);
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12 + this.flash * 18;
    ctx.shadowColor = this.adjustColor(this.color, 0.7);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.fillStyle = "rgba(235,246,255,0.65)";
    ctx.arc(this.x, this.y, Math.max(1.5, this.size * hpRatio * 0.25), 0, Math.PI * 2);
    ctx.fill();
  }

  adjustColor(hex, alpha) {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  burst(x, y, color, amount = 12, strength = 120) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = strength * (0.35 + Math.random());
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 0.6 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 2.5,
        color,
      });
    }
  }

  update(dt) {
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
      return p.life > 0;
    });
  }

  draw(ctx) {
    this.particles.forEach((p) => {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.fillStyle = p.color.replace(")",
        `, ${Math.min(1, a)})`).replace("rgb", "rgba");
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

class UpgradeSystem {
  constructor() {
    this.config = {
      sparkSpeed: { name: "Spark Speed", base: 50, growth: 1.7, increment: 0.08, value: 1, level: 0 },
      sparkDamage: { name: "Spark Damage", base: 50, growth: 1.85, increment: 0.18, value: 1, level: 0 },
      sparkSpawnRate: { name: "Spawn Rate", base: 50, growth: 1.9, increment: 0.14, value: 1, level: 0 },
      maxSparks: { name: "Max Sparks", base: 65, growth: 1.75, increment: 1, value: 4, level: 0 },
    };
  }

  getCost(key) {
    const up = this.config[key];
    return Math.floor(up.base * up.growth ** up.level);
  }

  buy(key, score) {
    const up = this.config[key];
    const cost = this.getCost(key);
    if (!up || score < cost) return { success: false, score };

    up.level += 1;
    up.value += up.increment;

    return { success: true, score: score - cost, cost };
  }

  toJSON() {
    const out = {};
    Object.entries(this.config).forEach(([key, val]) => {
      out[key] = { value: val.value, level: val.level };
    });
    return out;
  }

  load(data) {
    if (!data) return;
    Object.keys(this.config).forEach((key) => {
      if (data[key]) {
        this.config[key].value = data[key].value;
        this.config[key].level = data[key].level;
      }
    });
  }
}

class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (this.enabled) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.enabled = true;
  }

  tone(freq, dur, type = "sine", vol = 0.06) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  hit() { this.tone(380 + Math.random() * 50, 0.08, "triangle", 0.03); }
  break() { this.tone(160, 0.25, "sawtooth", 0.07); this.tone(240, 0.19, "triangle", 0.05); }
  merge() { this.tone(520, 0.12, "sine", 0.05); this.tone(730, 0.1, "sine", 0.03); }
  upgrade() { this.tone(450, 0.11, "square", 0.05); }
}

class UIManager {
  constructor(game) {
    this.game = game;
    this.scoreEl = document.getElementById("scoreValue");
    this.sparkCountEl = document.getElementById("sparkCountValue");
    this.shardCountEl = document.getElementById("shardCountValue");
    this.upgradeList = document.getElementById("upgradeList");
    this.spawnCostLabel = document.getElementById("spawnCostLabel");
    this.floatLayer = document.getElementById("floatingTextLayer");
    this.buildUpgradeButtons();
  }

  buildUpgradeButtons() {
    Object.entries(this.game.upgrades.config).forEach(([key, item]) => {
      const btn = document.createElement("button");
      btn.className = "upgrade-btn";
      btn.dataset.upgrade = key;
      btn.addEventListener("click", () => this.game.purchaseUpgrade(key));
      this.upgradeList.appendChild(btn);
    });
  }

  floatingText(x, y, text) {
    const node = document.createElement("div");
    node.className = "floating-dmg";
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    this.floatLayer.appendChild(node);
    setTimeout(() => node.remove(), 850);
  }

  update() {
    this.scoreEl.textContent = Math.floor(this.game.score);
    this.sparkCountEl.textContent = `${this.game.sparks.length}/${Math.floor(this.game.upgrades.maxSparks.value)}`;
    this.shardCountEl.textContent = this.game.shards.length;
    this.spawnCostLabel.textContent = Math.floor(this.game.getSparkCost());

    [...this.upgradeList.children].forEach((btn) => {
      const key = btn.dataset.upgrade;
      const up = this.game.upgrades.config[key];
      const cost = this.game.upgrades.getCost(key);
      btn.innerHTML = `${up.name} <em>${cost}</em><small>Lv ${up.level} · x${up.value.toFixed(2)}</small>`;
      btn.disabled = this.game.score < cost;
    });
  }
}

class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.game = game;
    this.shakePower = 0;
  }

  shake(power) {
    this.shakePower = Math.max(this.shakePower, power);
  }

  drawBackground() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.game.height);
    gradient.addColorStop(0, "#0f1938");
    gradient.addColorStop(1, "#060a15");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    for (let i = 0; i < 25; i++) {
      const x = (Math.sin((this.game.time * 0.06 + i) * 2.4) * 0.5 + 0.5) * this.game.width;
      const y = ((i * 89.35 + this.game.time * 1.8) % this.game.height);
      ctx.beginPath();
      ctx.fillStyle = "rgba(155,195,255,0.09)";
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shakePower > 0.1) {
      const sx = (Math.random() - 0.5) * this.shakePower;
      const sy = (Math.random() - 0.5) * this.shakePower;
      ctx.translate(sx, sy);
      this.shakePower *= 0.9;
    }

    this.drawBackground();
    this.game.shards.forEach((s) => s.draw(ctx));
    this.game.sparks.forEach((s) => s.draw(ctx));
    this.game.particles.draw(ctx);
    ctx.restore();
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.score = 0;
    this.totalScore = 0;
    this.sparks = [];
    this.shards = [];
    this.particles = new ParticleSystem();
    this.upgradeSystem = new UpgradeSystem();
    this.upgrades = this.upgradeSystem.config;
    this.audio = new AudioManager();
    this.renderer = new Renderer(this.canvas, this);
    this.ui = new UIManager(this);

    this.time = 0;
    this.lastTimestamp = 0;
    this.spawnTicker = 0;
    this.shardTicker = 0;
    this.hitCooldown = 0;
    this.saveTicker = 0;

    this.palette = ["#7de0ff", "#96e8c8", "#d4beff", "#ffc4dd", "#89b3ff"];

    this.load();
    this.bindEvents();
    this.ensureShards();
    this.ui.update();
  }

  bindEvents() {
    window.addEventListener("resize", () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    });

    document.getElementById("spawnSparkBtn").addEventListener("click", () => this.spawnSparkManual());
    document.getElementById("mergeBtn").addEventListener("click", () => this.mergeSparks());
    document.getElementById("resetBtn").addEventListener("click", () => this.resetProgress());
  }

  getSparkCost() {
    return 10 + this.sparks.length * 4;
  }

  spawnSpark(level = 1) {
    const max = Math.floor(this.upgrades.maxSparks.value);
    if (this.sparks.length >= max) return false;

    const x = this.width * (0.25 + Math.random() * 0.5);
    const y = this.height * (0.25 + Math.random() * 0.5);
    this.sparks.push(new Spark(x, y, level));
    return true;
  }

  spawnSparkManual() {
    const cost = this.getSparkCost();
    if (this.score < cost) return;
    if (this.spawnSpark(1)) {
      this.score -= cost;
      this.audio.merge();
      this.ui.update();
      this.save();
    }
  }

  purchaseUpgrade(key) {
    const result = this.upgradeSystem.buy(key, this.score);
    if (!result.success) return;
    this.score = result.score;
    this.audio.upgrade();
    this.ui.update();
    this.save();
  }

  mergeSparks() {
    const grouped = new Map();
    this.sparks.forEach((s, idx) => {
      if (!grouped.has(s.level)) grouped.set(s.level, []);
      grouped.get(s.level).push(idx);
    });

    let merges = 0;
    const remove = new Set();
    grouped.forEach((indexes, level) => {
      for (let i = 0; i + 1 < indexes.length; i += 2) {
        const a = this.sparks[indexes[i]];
        const b = this.sparks[indexes[i + 1]];
        const nx = (a.x + b.x) * 0.5;
        const ny = (a.y + b.y) * 0.5;
        remove.add(indexes[i]);
        remove.add(indexes[i + 1]);
        this.sparks.push(new Spark(nx, ny, level + 1));
        this.particles.burst(nx, ny, "rgb(184, 226, 255)", 20, 170);
        this.ui.floatingText(nx, ny, `Merge L${level + 1}`);
        merges += 1;
      }
    });

    if (merges > 0) {
      this.sparks = this.sparks.filter((_, idx) => !remove.has(idx));
      this.score += merges * 8;
      this.audio.merge();
      this.save();
    }
    this.ui.update();
  }

  spawnShard() {
    const size = 16 + Math.random() * 32;
    const healthScale = 1 + Math.log10(1 + this.totalScore / 150);
    const health = Math.floor((20 + Math.random() * 28) * healthScale);

    let attempts = 0;
    while (attempts < 20) {
      attempts += 1;
      const x = size + Math.random() * (this.width - size * 2);
      const y = size + Math.random() * (this.height - size * 2);

      const overlaps = this.shards.some((sh) => {
        const dx = sh.x - x;
        const dy = sh.y - y;
        return Math.hypot(dx, dy) < sh.size + size + 16;
      });
      if (!overlaps) {
        const color = this.palette[Math.floor(Math.random() * this.palette.length)];
        this.shards.push(new Shard(x, y, size, health, color));
        return;
      }
    }
  }

  ensureShards() {
    const target = 8 + Math.floor(Math.log2(1 + this.totalScore / 300));
    while (this.shards.length < target) this.spawnShard();
  }

  handleCollisions(dt) {
    const damageBase = this.upgrades.sparkDamage.value;

    this.sparks.forEach((spark) => {
      for (const shard of this.shards) {
        if (!shard.containsPoint(spark.x, spark.y)) continue;

        const damage = spark.getDamage(damageBase) * dt * 60;
        shard.hit(damage);
        if (Math.random() < 0.42) {
          this.particles.burst(spark.x, spark.y, "rgb(198, 230, 255)", 3, 40);
        }
        if (this.hitCooldown <= 0) {
          this.audio.hit();
          this.hitCooldown = 0.04;
        }
        if (Math.random() < 0.11) {
          this.ui.floatingText(shard.x, shard.y, `-${Math.max(1, Math.floor(damage))}`);
        }
        break;
      }
    });

    const destroyed = this.shards.filter((s) => s.health <= 0);
    if (destroyed.length > 0) {
      destroyed.forEach((shard) => {
        this.score += shard.points;
        this.totalScore += shard.points;
        this.particles.burst(shard.x, shard.y, "rgb(220, 244, 255)", 25, 220);
        this.ui.floatingText(shard.x, shard.y, `+${shard.points}`);
      });
      this.audio.break();
      const heavy = destroyed.some((s) => s.maxHealth > 58);
      if (heavy) this.renderer.shake(12);
      this.shards = this.shards.filter((s) => s.health > 0);
      this.ensureShards();
    }
  }

  autoSpawn(dt) {
    this.spawnTicker += dt;
    const cadence = Math.max(1.8, 6 / this.upgrades.sparkSpawnRate.value);
    if (this.spawnTicker >= cadence) {
      this.spawnTicker = 0;
      const ok = this.spawnSpark(1);
      if (ok) this.ui.floatingText(this.width * 0.5, this.height * 0.2, "+Spark");
    }
  }

  update(dt) {
    this.time += dt;
    this.hitCooldown -= dt;
    this.shardTicker += dt;
    this.saveTicker += dt;

    if (this.shardTicker > 5.2) {
      this.shardTicker = 0;
      this.spawnShard();
    }

    this.autoSpawn(dt);
    this.sparks.forEach((s) => s.update(dt, this));
    this.shards.forEach((s) => s.update(dt));
    this.handleCollisions(dt);
    this.particles.update(dt);

    if (this.saveTicker > 4) {
      this.saveTicker = 0;
      this.save();
    }

    this.ui.update();
  }

  loop = (timestamp) => {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.renderer.draw();
    requestAnimationFrame(this.loop);
  };

  save() {
    const payload = {
      score: this.score,
      totalScore: this.totalScore,
      upgradeData: this.upgradeSystem.toJSON(),
      sparks: this.sparks.map((s) => ({ level: s.level })),
    };
    localStorage.setItem("zenSparksSave", JSON.stringify(payload));
  }

  load() {
    const raw = localStorage.getItem("zenSparksSave");
    if (!raw) {
      this.spawnSpark(1);
      this.spawnSpark(1);
      return;
    }
    try {
      const save = JSON.parse(raw);
      this.score = save.score || 0;
      this.totalScore = save.totalScore || save.score || 0;
      this.upgradeSystem.load(save.upgradeData);
      const levels = save.sparks || [];
      levels.forEach((s) => this.spawnSpark(Math.max(1, s.level || 1)));
      if (this.sparks.length === 0) this.spawnSpark(1);
    } catch {
      this.spawnSpark(1);
      this.spawnSpark(1);
    }
  }

  resetProgress() {
    const final = Math.floor(this.totalScore + this.score);
    localStorage.removeItem("zenSparksSave");
    document.getElementById("finalScoreValue").textContent = String(final);
    document.getElementById("resetOverlay").classList.add("active");
  }

  start() {
    requestAnimationFrame(this.loop);
  }
}

class MenuBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.orbs = [];
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w;
    this.canvas.height = this.h;

    for (let i = 0; i < 26; i++) {
      this.orbs.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: 2 + Math.random() * 5,
        vx: -10 + Math.random() * 20,
        vy: -8 + Math.random() * 16,
      });
    }

    window.addEventListener("resize", () => {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.canvas.width = this.w;
      this.canvas.height = this.h;
    });
  }

  loop = () => {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = "rgba(8,12,28,0.35)";
    ctx.fillRect(0, 0, this.w, this.h);

    this.orbs.forEach((o) => {
      o.x += o.vx * 0.016;
      o.y += o.vy * 0.016;
      if (o.x < -20) o.x = this.w + 20;
      if (o.x > this.w + 20) o.x = -20;
      if (o.y < -20) o.y = this.h + 20;
      if (o.y > this.h + 20) o.y = -20;

      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 6);
      g.addColorStop(0, "rgba(166,232,255,0.35)");
      g.addColorStop(1, "rgba(166,232,255,0)");
      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.arc(o.x, o.y, o.r * 6, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(this.loop);
  };
}

(() => {
  const startMenu = document.getElementById("startMenu");
  const gameUI = document.getElementById("gameUI");
  const playBtn = document.getElementById("playBtn");
  const restartBtn = document.getElementById("restartBtn");
  const resetOverlay = document.getElementById("resetOverlay");

  const menuAnim = new MenuBackground(document.getElementById("menuCanvas"));
  menuAnim.loop();

  let game = null;

  const bootGame = () => {
    game = new Game();
    game.audio.init();
    game.start();
  };

  playBtn.addEventListener("click", () => {
    startMenu.classList.remove("active");
    gameUI.classList.remove("hidden");
    if (!game) bootGame();
  });

  restartBtn.addEventListener("click", () => {
    resetOverlay.classList.remove("active");
    window.location.reload();
  });
})();
