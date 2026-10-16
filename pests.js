/**
 * PestoGuard Interactive Pest Simulation Engine
 * Simulates Ants (Cheenti), Spiders (Makdi), Termites (Dimak), and Cockroaches
 * Supports interactive pesticide spray, realistic death animations, and panic fleeing
 */

class InsectSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.insects = [];
        this.sprayParticles = [];
        this.splats = [];
        this.floatingTexts = [];
        
        this.isSpraying = false;
        this.sprayX = 0;
        this.sprayY = 0;
        this.sprayRadius = 65;
        this.killCount = 0;
        this.fleeCount = 0;

        this.animFrameId = null;
        this.lastTime = performance.now();
        this.pestModeActive = true;

        this.initCanvasSize();
        this.bindEvents();
        this.seedInitialPests();
        this.animate = this.animate.bind(this);
        this.animFrameId = requestAnimationFrame(this.animate);
    }

    initCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

        // Mouse tracking
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.sprayX = e.clientX - rect.left;
            this.sprayY = e.clientY - rect.top;

            // Update custom spray can cursor position if active
            const customCursor = document.getElementById('spray-can-cursor');
            if (customCursor) {
                customCursor.style.left = `${e.clientX}px`;
                customCursor.style.top = `${e.clientY}px`;
            }
        });

        window.addEventListener('mousedown', (e) => {
            // Don't trigger spray if clicking on interactive form inputs, buttons, or links
            if (e.target.closest('button, input, select, textarea, a, .no-spray')) {
                return;
            }
            this.sprayX = e.clientX;
            this.sprayY = e.clientY;
            this.isSpraying = true;
            if (window.soundEffects) {
                window.soundEffects.startSpray();
            }
        });

        window.addEventListener('mouseup', () => {
            this.isSpraying = false;
            if (window.soundEffects) {
                window.soundEffects.stopSpray();
            }
        });

        // Touch support for mobile devices
        window.addEventListener('touchstart', (e) => {
            if (e.target.closest('button, input, select, textarea, a, .no-spray')) {
                return;
            }
            if (e.touches.length > 0) {
                this.sprayX = e.touches[0].clientX;
                this.sprayY = e.touches[0].clientY;
                this.isSpraying = true;
                if (window.soundEffects) window.soundEffects.startSpray();
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.sprayX = e.touches[0].clientX;
                this.sprayY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.isSpraying = false;
            if (window.soundEffects) window.soundEffects.stopSpray();
        });
    }

    seedInitialPests() {
        const initialCounts = {
            ant: 8,
            termite: 6,
            cockroach: 5,
            spider: 4
        };

        for (const [type, count] of Object.entries(initialCounts)) {
            for (let i = 0; i < count; i++) {
                this.spawnInsect(type);
            }
        }
        this.updateStatsUI();
    }

    spawnInsect(type = null) {
        const types = ['ant', 'termite', 'cockroach', 'spider'];
        const chosenType = type || types[Math.floor(Math.random() * types.length)];
        
        // Spawn from borders or random visible area
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        const w = this.canvas.width;
        const h = this.canvas.height;

        if (edge === 0) { x = Math.random() * w; y = -20; }
        else if (edge === 1) { x = w + 20; y = Math.random() * h; }
        else if (edge === 2) { x = Math.random() * w; y = h + 20; }
        else { x = -20; y = Math.random() * h; }

        this.insects.push(new Insect(x, y, chosenType));
        this.updateStatsUI();
    }

    spawnSwarm(type, count = 5) {
        for (let i = 0; i < count; i++) {
            this.spawnInsect(type);
        }
    }

    createMistParticles(x, y) {
        for (let i = 0; i < 7; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const spreadRadius = Math.random() * this.sprayRadius * 0.8;
            this.sprayParticles.push({
                x: x + Math.cos(angle) * spreadRadius,
                y: y + Math.sin(angle) * spreadRadius,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                size: Math.random() * 8 + 4,
                alpha: 0.7,
                hue: Math.random() > 0.4 ? 145 : 170, // Eco-green to cyan aerosol color
                life: 1.0,
                decay: Math.random() * 0.04 + 0.03
            });
        }
    }

    addSplat(x, y, type) {
        this.splats.push({
            x, y,
            radius: Math.random() * 8 + 10,
            alpha: 0.65,
            color: type === 'termite' ? '#d4af37' : (type === 'cockroach' ? '#5a2d0c' : '#22c55e'),
            drops: Array.from({ length: 5 }, () => ({
                dx: (Math.random() - 0.5) * 24,
                dy: (Math.random() - 0.5) * 24,
                r: Math.random() * 3 + 1.5
            }))
        });
        if (this.splats.length > 30) {
            this.splats.shift();
        }
    }

    addFloatingText(text, x, y, color = '#22c55e') {
        this.floatingTexts.push({
            text,
            x,
            y,
            alpha: 1.0,
            color,
            vy: -1.2
        });
    }

    updateStatsUI() {
        const aliveEl = document.getElementById('stat-pests-alive');
        const killedEl = document.getElementById('stat-pests-killed');
        const barEl = document.getElementById('infestation-bar');
        const alertEl = document.getElementById('infestation-status-badge');

        const aliveCount = this.insects.filter(bug => bug.state !== 'dead').length;
        if (aliveEl) aliveEl.textContent = aliveCount;
        if (killedEl) killedEl.textContent = this.killCount;

        if (barEl) {
            const pct = Math.min(100, Math.round((aliveCount / 25) * 100));
            barEl.style.width = `${pct}%`;
            if (pct > 70) {
                barEl.style.backgroundColor = '#ef4444';
                if (alertEl) alertEl.innerHTML = '⚠️ Severe Infestation!';
            } else if (pct > 30) {
                barEl.style.backgroundColor = '#f59e0b';
                if (alertEl) alertEl.innerHTML = '⚡ Moderate Infestation';
            } else {
                barEl.style.backgroundColor = '#10b981';
                if (alertEl) alertEl.innerHTML = '🛡️ Infestation Under Control';
            }
        }
    }

    triggerBugBomb() {
        // Spray bomb - kills or scatters all current pests!
        if (window.soundEffects) {
            window.soundEffects.startSpray();
            setTimeout(() => window.soundEffects.stopSpray(), 800);
            window.soundEffects.playSuccess();
        }

        // Create massive cloud effect across canvas
        for (let i = 0; i < 80; i++) {
            this.createMistParticles(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height
            );
        }

        this.insects.forEach(bug => {
            if (bug.state !== 'dead') {
                if (Math.random() > 0.3) {
                    bug.kill(this);
                } else {
                    bug.flee(this.canvas.width / 2, this.canvas.height / 2);
                }
            }
        });
        this.addFloatingText('💥 100% PEST BOMB DEPLOYED!', this.canvas.width / 2, 200, '#eab308');
        this.updateStatsUI();
    }

    animate(now) {
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw temporary harmless splats left by eliminated pests
        for (let i = this.splats.length - 1; i >= 0; i--) {
            const s = this.splats[i];
            s.alpha -= 0.001;
            if (s.alpha <= 0) {
                this.splats.splice(i, 1);
                continue;
            }
            this.ctx.save();
            this.ctx.fillStyle = s.color;
            this.ctx.globalAlpha = s.alpha * 0.4;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            this.ctx.fill();
            // Tiny droplets
            s.drops.forEach(d => {
                this.ctx.beginPath();
                this.ctx.arc(s.x + d.dx, s.y + d.dy, d.r, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.restore();
        }

        // 2. Process Spraying interaction
        if (this.isSpraying) {
            this.createMistParticles(this.sprayX, this.sprayY);

            // Draw translucent spray aura circle
            const gradient = this.ctx.createRadialGradient(
                this.sprayX, this.sprayY, 5,
                this.sprayX, this.sprayY, this.sprayRadius
            );
            gradient.addColorStop(0, 'rgba(52, 211, 153, 0.45)');
            gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.25)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

            this.ctx.save();
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.sprayX, this.sprayY, this.sprayRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 3. Update & render spray particles
        for (let i = this.sprayParticles.length - 1; i >= 0; i--) {
            const p = this.sprayParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            p.size += 0.2;

            if (p.alpha <= 0) {
                this.sprayParticles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${p.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 4. Update & render insects
        for (let i = this.insects.length - 1; i >= 0; i--) {
            const bug = this.insects[i];
            bug.update(dt, this);
            bug.draw(this.ctx);

            // Remove if bug fled offscreen or decomposed completely
            if (bug.isRemovable(this.canvas.width, this.canvas.height)) {
                this.insects.splice(i, 1);
                this.updateStatsUI();
            }
        }

        // Auto-replenish if all bugs are killed/fled so the website always has lively interactive action
        if (this.insects.filter(b => b.state !== 'dead').length < 4) {
            this.spawnInsect();
        }

        // 5. Draw floating combo / kill notification texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.alpha -= 0.015;

            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        }

        this.animFrameId = requestAnimationFrame(this.animate);
    }
}

/**
 * Individual Insect Class
 * Realistic crawling gait, turning physics, panic flight, and death twitching
 */
class Insect {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'ant', 'termite', 'cockroach', 'spider'
        this.state = 'crawling'; // 'crawling', 'fleeing', 'dying', 'dead'

        this.initAttributes();
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.turnTimer = 0;
        this.legCycle = 0;
        this.health = 100;
        this.deathTimer = 0;
        this.fleeTimer = 0;
        this.opacity = 1.0;
        this.twitchFactor = 0;
    }

    initAttributes() {
        switch (this.type) {
            case 'ant':
                this.size = 14;
                this.baseSpeed = 65 + Math.random() * 30;
                this.color = '#1f2937';
                this.fleeSpeed = 220;
                this.label = '🐜 Ant (Cheenti)';
                break;
            case 'termite':
                this.size = 16;
                this.baseSpeed = 45 + Math.random() * 25;
                this.color = '#e2b36b'; // Pale wood eating color
                this.fleeSpeed = 180;
                this.label = '🪵 Termite (Dimak)';
                break;
            case 'cockroach':
                this.size = 26;
                this.baseSpeed = 80 + Math.random() * 45;
                this.color = '#54260d'; // Reddish-brown shiny
                this.fleeSpeed = 290;
                this.label = '🪳 Cockroach';
                break;
            case 'spider':
                this.size = 20;
                this.baseSpeed = 50 + Math.random() * 35;
                this.color = '#111827';
                this.fleeSpeed = 210;
                this.label = '🕷️ Spider (Makdi)';
                break;
            default:
                this.size = 16;
                this.baseSpeed = 50;
                this.color = '#374151';
                this.fleeSpeed = 190;
                this.label = '🐛 Pest';
        }
        this.speed = this.baseSpeed;
    }

    update(dt, sim) {
        if (this.state === 'dead') {
            this.deathTimer += dt;
            if (this.deathTimer > 4.0) {
                this.opacity -= dt * 0.5;
            }
            return;
        }

        if (this.state === 'dying') {
            this.deathTimer += dt;
            this.twitchFactor = Math.sin(this.deathTimer * 25) * Math.max(0, 1 - this.deathTimer / 1.5);
            if (this.deathTimer > 1.2) {
                this.state = 'dead';
                sim.updateStatsUI();
            }
            return;
        }

        // Spray interaction check
        if (sim.isSpraying) {
            const dx = this.x - sim.sprayX;
            const dy = this.y - sim.sprayY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < sim.sprayRadius + this.size) {
                // Insect hit by pesticide spray!
                this.health -= 160 * dt; // Rapid toxicity

                // Random decision: Kill or Flee!
                if (this.health <= 0) {
                    this.kill(sim);
                    return;
                } else if (this.state !== 'fleeing') {
                    // With 40% chance pest tries to escape ("bhag jaye")
                    this.flee(sim.sprayX, sim.sprayY);
                    if (window.soundEffects) window.soundEffects.playFlee();
                }
            }
        }

        // State Machine: Crawling or Panic fleeing
        if (this.state === 'fleeing') {
            this.speed = this.fleeSpeed;
            this.legCycle += dt * 35;
            this.fleeTimer -= dt;
            if (this.fleeTimer <= 0) {
                this.state = 'crawling';
                this.speed = this.baseSpeed;
            }
        } else {
            // Normal wandering
            this.speed = this.baseSpeed;
            this.legCycle += dt * 14;
            this.turnTimer -= dt;
            if (this.turnTimer <= 0) {
                this.targetAngle += (Math.random() - 0.5) * 1.8;
                this.turnTimer = Math.random() * 2 + 0.8;
            }
        }

        // Smooth angle rotation
        let angleDiff = this.targetAngle - this.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        this.angle += angleDiff * Math.min(1, dt * 6);

        // Move forward in current direction
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        // Soft screen bounce so bugs crawl across the entire page content
        const padding = 20;
        const w = sim.canvas.width;
        const h = sim.canvas.height;
        if (this.state !== 'fleeing') {
            if (this.x < padding) { this.x = padding; this.targetAngle = 0; }
            if (this.x > w - padding) { this.x = w - padding; this.targetAngle = Math.PI; }
            if (this.y < padding) { this.y = padding; this.targetAngle = Math.PI / 2; }
            if (this.y > h - padding) { this.y = h - padding; this.targetAngle = -Math.PI / 2; }
        }
    }

    flee(fromX, fromY) {
        this.state = 'fleeing';
        this.fleeTimer = 2.5 + Math.random() * 1.5;
        // Run directly opposite of spray source
        const angleAway = Math.atan2(this.y - fromY, this.x - fromX);
        this.targetAngle = angleAway + (Math.random() - 0.5) * 0.4;
        this.angle = this.targetAngle;
    }

    kill(sim) {
        this.state = 'dying';
        this.deathTimer = 0;
        sim.killCount++;
        sim.addSplat(this.x, this.y, this.type);
        sim.addFloatingText(`☠️ ${this.label.split(' ')[1]} Eliminated! +10`, this.x - 25, this.y - 15);
        if (window.soundEffects) {
            window.soundEffects.playKill();
        }
        sim.updateStatsUI();
    }

    isRemovable(canvasW, canvasH) {
        if (this.opacity <= 0) return true;
        // If fled far outside screen
        if (this.state === 'fleeing') {
            return (this.x < -100 || this.x > canvasW + 100 || this.y < -100 || this.y > canvasH + 100);
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + (this.state === 'dead' || this.state === 'dying' ? Math.PI : 0));
        ctx.globalAlpha = this.opacity;

        const isTwitching = this.state === 'dying' || this.state === 'dead';
        const twitchOffset = isTwitching ? this.twitchFactor * 3 : 0;

        switch (this.type) {
            case 'ant':
                this.drawAnt(ctx, twitchOffset);
                break;
            case 'spider':
                this.drawSpider(ctx, twitchOffset);
                break;
            case 'cockroach':
                this.drawCockroach(ctx, twitchOffset);
                break;
            case 'termite':
                this.drawTermite(ctx, twitchOffset);
                break;
            default:
                this.drawAnt(ctx, twitchOffset);
        }

        ctx.restore();
    }

    drawAnt(ctx, twitch) {
        ctx.fillStyle = this.state === 'dead' ? '#4b5563' : '#111827';
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1.2;

        const legWiggle = Math.sin(this.legCycle) * 3 + twitch;

        // 6 Legs
        for (let i = -1; i <= 1; i++) {
            const sideY = i * 3.5;
            // Left leg
            ctx.beginPath();
            ctx.moveTo(0, sideY);
            ctx.lineTo(-7, sideY - 5 + legWiggle * (i % 2 === 0 ? 1 : -1));
            ctx.stroke();

            // Right leg
            ctx.beginPath();
            ctx.moveTo(0, sideY);
            ctx.lineTo(7, sideY - 5 - legWiggle * (i % 2 === 0 ? 1 : -1));
            ctx.stroke();
        }

        // Antennae
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(-4, 12);
        ctx.moveTo(0, 6);
        ctx.lineTo(4, 12);
        ctx.stroke();

        // 3 Body segments: Head, Thorax, Abdomen
        // Abdomen
        ctx.beginPath();
        ctx.ellipse(0, -6, 3.2, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thorax
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.ellipse(0, 5, 2.5, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTermite(ctx, twitch) {
        // Dimak / Termite: pale body with brownish head & mandibles
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.2;
        const legWiggle = Math.sin(this.legCycle) * 2.5 + twitch;

        // Legs
        for (let i = -1; i <= 1; i++) {
            const yOffset = i * 4;
            ctx.beginPath();
            ctx.moveTo(-2, yOffset);
            ctx.lineTo(-8, yOffset - 3 + legWiggle * i);
            ctx.moveTo(2, yOffset);
            ctx.lineTo(8, yOffset - 3 - legWiggle * i);
            ctx.stroke();
        }

        // Soft pale creamy abdomen
        ctx.fillStyle = this.state === 'dead' ? '#9ca3af' : '#fef08a';
        ctx.beginPath();
        ctx.ellipse(0, -6, 4.5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Thorax
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(0, 1, 3.2, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark chewing head
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(0, 6, 3.5, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pincer mandibles
        ctx.strokeStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(-2, 9);
        ctx.lineTo(-1, 12);
        ctx.moveTo(2, 9);
        ctx.lineTo(1, 12);
        ctx.stroke();
    }

    drawCockroach(ctx, twitch) {
        const legWiggle = Math.sin(this.legCycle * 1.5) * 4 + twitch;
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.6;

        // 6 Jointed Spiny Legs
        [-5, 0, 5].forEach((ly, idx) => {
            const phase = idx % 2 === 0 ? 1 : -1;
            // Left leg
            ctx.beginPath();
            ctx.moveTo(-5, ly);
            ctx.lineTo(-12, ly + 2 + legWiggle * phase);
            ctx.lineTo(-17, ly + 9 + legWiggle * phase);
            ctx.stroke();

            // Right leg
            ctx.beginPath();
            ctx.moveTo(5, ly);
            ctx.lineTo(12, ly + 2 - legWiggle * phase);
            ctx.lineTo(17, ly + 9 - legWiggle * phase);
            ctx.stroke();
        });

        // Long twitching antennae
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-2, 11);
        ctx.quadraticCurveTo(-9, 22, -14, 28 + Math.sin(this.legCycle) * 3);
        ctx.moveTo(2, 11);
        ctx.quadraticCurveTo(9, 22, 14, 28 - Math.sin(this.legCycle) * 3);
        ctx.stroke();

        // Oval carapace with shiny gradient
        const grad = ctx.createLinearGradient(-7, 0, 7, 0);
        grad.addColorStop(0, '#3f1a07');
        grad.addColorStop(0.5, '#78350f');
        grad.addColorStop(1, '#3f1a07');
        ctx.fillStyle = this.state === 'dead' ? '#44403c' : grad;

        // Wings/Body
        ctx.beginPath();
        ctx.ellipse(0, -3, 7.5, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thoracic shield (pronotum)
        ctx.fillStyle = '#290e02';
        ctx.beginPath();
        ctx.ellipse(0, 7, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cerci (two tail prongs)
        ctx.beginPath();
        ctx.moveTo(-3, -15);
        ctx.lineTo(-5, -20);
        ctx.moveTo(3, -15);
        ctx.lineTo(5, -20);
        ctx.stroke();
    }

    drawSpider(ctx, twitch) {
        ctx.strokeStyle = this.state === 'dead' ? '#6b7280' : '#18181b';
        ctx.lineWidth = 1.4;
        const legWiggle = Math.sin(this.legCycle) * 3.5 + twitch;

        // 8 Radiating Jointed Legs
        for (let i = 0; i < 4; i++) {
            const angleOffset = (i - 1.5) * 0.35;
            const len = 14 + (i === 1 || i === 2 ? 4 : 0);

            // Left legs
            ctx.beginPath();
            ctx.moveTo(-2, 0);
            const lx1 = -8 - i * 2;
            const ly1 = Math.sin(angleOffset) * len + legWiggle * (i % 2 === 0 ? 1 : -1);
            ctx.lineTo(lx1, ly1);
            ctx.lineTo(lx1 - 7, ly1 + 6);
            ctx.stroke();

            // Right legs
            ctx.beginPath();
            ctx.moveTo(2, 0);
            const rx1 = 8 + i * 2;
            const ry1 = Math.sin(angleOffset) * len - legWiggle * (i % 2 === 0 ? 1 : -1);
            ctx.lineTo(rx1, ry1);
            ctx.lineTo(rx1 + 7, ry1 + 6);
            ctx.stroke();
        }

        // Large rounded bulbous abdomen
        ctx.fillStyle = this.state === 'dead' ? '#374151' : '#09090b';
        ctx.beginPath();
        ctx.ellipse(0, -6, 6, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cephalothorax
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.ellipse(0, 3, 4, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spider eye cluster
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-1.5, 5.5, 0.8, 0, Math.PI * 2);
        ctx.arc(1.5, 5.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Attach to window
window.InsectSimulation = InsectSimulation;
