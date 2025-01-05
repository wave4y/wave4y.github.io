window.Fireworks = (function () {
  let fireworks = [];
  let particles = [];
  let ctx = null;
  let canvas = null;
  const baseColors = ["0", "120", "240", "60", "180", "300", "30", "280"];
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }
  class Firework {
    constructor(sx, sy, tx, ty) {
      this.sx = sx;
      this.sy = sy;
      this.x = sx;
      this.y = sy;
      this.tx = tx;
      this.ty = ty;
      this.distanceToTarget = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2);
      this.distanceTraveled = 0;
      this.coordinates = [];
      this.coordinateCount = 3;
      while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
      }
      this.angle = Math.atan2(ty - sy, tx - sx);
      this.speed = 2;
      this.acceleration = 1.05;
      this.brightness = random(50, 70);
      this.trail = [];
      this.trailLength = 3;
      this.color = null;

      const dx = tx - sx;
      const dy = ty - sy;
      const midX = sx + dx * 0.5;
      const midY = sy + dy * 0.5;

      const offset = random(-30, 30);
      this.controlPoint = {
        x: midX + offset,
        y: midY + Math.abs(offset * 0.5),
      };
      this.progress = 0;
    }

    createExplosion(x, y) {
      let particleCount = 30 + Math.floor(Math.random() * 20);
      for (let i = 0; i < particleCount; i++) {
        const particle = new Particle(x, y);
        if (this.color) {
          particle.color = this.color;
        }
        particles.push(particle);
      }
    }
    update(index) {
      this.progress += 0.03;
      if (this.progress >= 1) {
        this.createExplosion(this.tx, this.ty);
        fireworks.splice(index, 1);
        return;
      }

      const t = this.progress;
      const mt = 1 - t;
      this.x =
        mt * mt * this.sx + 2 * mt * t * this.controlPoint.x + t * t * this.tx;
      this.y =
        mt * mt * this.sy + 2 * mt * t * this.controlPoint.y + t * t * this.ty;

      this.coordinates.pop();
      this.coordinates.unshift([this.x, this.y]);
      this.trail.unshift({ x: this.x, y: this.y });
      if (this.trail.length > this.trailLength) {
        this.trail.pop();
      }
    }
    draw() {
      ctx.beginPath();
      for (let i = 0; i < this.trail.length - 1; i++) {
        const point = this.trail[i];
        const nextPoint = this.trail[i + 1];
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);

        const progress = 1 - (point.y - this.ty) / (this.sy - this.ty);
        const alpha = Math.min(1, progress * 2);
        ctx.strokeStyle = `hsla(${this.color || random(0, 360)}, ${
          this.brightness
        }%, 50%, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.coordinates = [];
      this.coordinateCount = 6;
      while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
      }
      this.angle = random(0, Math.PI * 2);
      this.speed = random(1.5, 12);
      this.friction = 0.95;
      this.gravity = 0.5;
      this.alpha = 1;
      this.decay = random(0.02, 0.03);
      this.color = null;
      this.brightness = random(50, 80);
      this.trail = [];
      this.trailLength = 3;
      this.flickerRate = random(0, 100) > 95 ? 0.5 : 0;
    }
    update(index) {
      this.coordinates.pop();
      this.coordinates.unshift([this.x, this.y]);
      this.trail.unshift({ x: this.x, y: this.y, alpha: this.alpha });
      if (this.trail.length > this.trailLength) {
        this.trail.pop();
      }
      this.speed *= this.friction;
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed + this.gravity;
      this.alpha -= this.decay;
      if (this.flickerRate) {
        this.alpha = Math.max(
          0,
          this.alpha * (1 + Math.sin(Date.now() * this.flickerRate) * 0.2)
        );
      }
      if (this.alpha <= 0.1) {
        particles.splice(index, 1);
      }
    }
    draw() {
      ctx.beginPath();
      for (let i = 0; i < this.trail.length - 1; i++) {
        const point = this.trail[i];
        const nextPoint = this.trail[i + 1];
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.strokeStyle = `hsla(${this.color || random(0, 360)}, ${
          this.brightness
        }%, 50%, ${point.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(
        this.coordinates[this.coordinates.length - 1][0],
        this.coordinates[this.coordinates.length - 1][1]
      );
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = `hsla(${this.color || random(0, 360)}, ${
        this.brightness
      }%, 50%, ${this.alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.color || random(0, 360)}, ${
        this.brightness
      }%, 50%, ${this.alpha * 0.5})`;
      ctx.fill();
    }
  }
  function setupNaturalParticle(p) {
    p.friction = 0.96;
    p.gravity = 0.8;
    p.decay = random(0.012, 0.02);

    p.flickerRate = 0;

    p.brightness = random(50, 70);

    if (this.color) {
      p.color = this.color;
    }
  }
  function setupColorfulParticle(p, options = {}) {
    const hueMin = options.hueMin ?? 0;
    const hueMax = options.hueMax ?? 360;
    p.color = random(hueMin, hueMax);

    const brightnessMin = options.brightnessMin ?? 50;
    const brightnessMax = options.brightnessMax ?? 80;
    p.brightness = random(brightnessMin, brightnessMax);

    const flickerChance = options.flickerChance ?? 0.3;
    if (Math.random() < flickerChance) {
      p.flickerRate = random(0.2, 0.8);
    } else {
      p.flickerRate = 0;
    }

    p.friction = options.friction ?? random(0.92, 0.98);
    p.gravity = options.gravity ?? random(0.2, 0.5);
    p.decay = options.decay ?? random(0.01, 0.02);
  }

  const fireworkTypes = [
    class StandardFirework extends Firework {},
    class SparkleFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);

          particle.speed = random(0.75, 4.5);
          particle.gravity = 0.2;
          particle.friction = 0.99;
          particle.decay = random(0.01, 0.02);

          particle.flickerRate = 0.7;

          particle.color = random(0, 360);
          particle.brightness = random(40, 70);

          setupNaturalParticle(particle);

          particles.push(particle);
        }
      }
    },
    class CascadeFirework extends Firework {
      createExplosion(x, y) {
        const mainParticles = 12;
        const subParticles = 8;

        for (let i = 0; i < mainParticles; i++) {
          const hue = random(0, 360);

          const angle = (i / mainParticles) * Math.PI * 2;
          const speed = random(4.5, 7.5);

          const particle = new Particle(x, y);
          particle.angle = angle;
          particle.speed = speed;

          particle.color = hue;
          particle.brightness = random(50, 70);
          particle.flickerRate = 0;

          particle.gravity = 0.2;
          particle.friction = 0.95;
          particle.decay = 0.01;

          for (let j = 0; j < subParticles; j++) {
            const subParticle = new Particle(x, y);

            subParticle.angle = angle + random(-0.2, 0.2);
            subParticle.speed = speed * random(0.75, 1.2);

            subParticle.color = hue;
            subParticle.brightness = random(40, 70);
            subParticle.flickerRate = 0;

            subParticle.gravity = 0.2;
            subParticle.friction = 0.95;
            subParticle.decay = 0.02;

            particles.push(subParticle);
          }

          particles.push(particle);
        }
      }
    },

    class SoftRingFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);
          const angle = (i / particleCount) * Math.PI * 2;
          particle.angle = angle;
          particle.speed = random(2.25, 5.25);
          setupNaturalParticle.call(this, particle);
          particles.push(particle);
        }
      }
    },

    class SoftScatterFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = 60;
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);
          particle.angle = random(0, Math.PI * 2);
          particle.speed = random(1.5, 6);
          setupNaturalParticle.call(this, particle);
          particles.push(particle);
        }
      }
    },
    class RandomChaosFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = Math.floor(random(40, 80));
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);
          particle.angle = random(0, Math.PI * 2);
          particle.speed = random(2, 10);
          particle.gravity = random(0.2, 0.7);
          particle.friction = random(0.88, 0.98);
          particle.decay = random(0.015, 0.03);
          setupNaturalParticle.call(this, particle);
          particles.push(particle);
        }
      }
    },
    class MistyBloomFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = Math.floor(random(60, 90));
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);
          particle.angle = random(0, Math.PI * 2);
          particle.speed = random(1.5, 4.5);
          particle.gravity = random(0.3, 0.6);
          particle.friction = random(0.9, 0.97);
          particle.decay = random(0.01, 0.02);
          setupNaturalParticle.call(this, particle);
          particles.push(particle);
        }
      }
    },
    class WildSprayFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = Math.floor(random(20, 35));
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);
          particle.angle = random(0, Math.PI * 2);
          particle.speed = random(5, 12);
          particle.gravity = random(0.3, 0.8);
          particle.friction = random(0.88, 0.95);
          particle.decay = random(0.015, 0.03);
          setupNaturalParticle.call(this, particle);
          particles.push(particle);
        }
      }
    },
    class GentleDriftFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = Math.floor(random(50, 70));
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);
          particle.angle = random(0, Math.PI * 2);
          particle.speed = random(2, 6);
          particle.gravity = random(0.1, 0.3);
          particle.friction = random(0.92, 0.99);
          particle.decay = random(0.01, 0.018);
          setupNaturalParticle.call(this, particle);
          particles.push(particle);
        }
      }
    },
    class ChaoticPlumeFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = Math.floor(random(80, 120));
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);
          particle.angle = random(0, Math.PI * 2);
          particle.speed = random(1, 9);
          particle.gravity = random(0.2, 0.8);
          particle.friction = random(0.85, 0.97);
          particle.decay = random(0.015, 0.03);
          setupNaturalParticle.call(this, particle);

          if (Math.random() < 0.3) {
            particle.flickerRate = random(0.3, 0.7);
          }
          particles.push(particle);
        }
      }
    },
    class FloatingDustFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = Math.floor(random(30, 50));
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);
          particle.angle = random(0, Math.PI * 2);
          particle.speed = random(2, 8);
          particle.gravity = random(0.05, 0.2);
          particle.friction = random(0.92, 0.99);
          particle.decay = random(0.005, 0.01);
          setupNaturalParticle.call(this, particle);
          particles.push(particle);
        }
      }
    },
    class FuzzyScatterFirework extends Firework {
      createExplosion(x, y) {
        const particleCount = Math.floor(random(30, 100));
        for (let i = 0; i < particleCount; i++) {
          const particle = new Particle(x, y);
          particle.angle = random(0, Math.PI * 2);
          particle.speed = random(1.5, 7);
          particle.gravity = random(0.2, 0.6);
          particle.friction = random(0.9, 0.99);
          particle.decay = random(0.015, 0.025);
          setupNaturalParticle.call(this, particle);
          particles.push(particle);
        }
      }
    },
  ];
  function loop() {
    requestAnimationFrame(loop);
    if (particles.length > 1000) {
      particles.splice(0, particles.length - 1000);
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "screen";

    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].draw();
      fireworks[i].update(i);
    }

    for (let j = particles.length - 1; j >= 0; j--) {
      particles[j].draw();
      particles[j].update(j);
    }
  }
  let autoTimer = null;
  function startAutoMode() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      const fireworkCount = Math.floor(Math.random() * 5) + 2;

      const groupColors = [];
      for (let i = 0; i < fireworkCount; i++) {
        let color;
        do {
          color = baseColors[Math.floor(Math.random() * baseColors.length)];
        } while (groupColors.includes(color));
        groupColors.push(color);
      }
      const windowRect = windowFrame.getBoundingClientRect();
      const margin = 100;
      const validArea = {
        left: margin,
        right: windowRect.width - margin,
        top: margin,
        bottom: windowRect.height - margin,
      };

      const totalAngleSpread = 60;
      const anglePerFirework = totalAngleSpread / fireworkCount;
      for (let count = 0; count < fireworkCount; count++) {
        setTimeout(() => {
          const litWindows = document.querySelectorAll(
            ".windows rect.light-on"
          );
          const margin = 80;

          const litWindowsArray = [...litWindows];
          const validWindows = litWindowsArray.filter((w) => {
            const wRect = w.getBoundingClientRect();
            const cRect = canvas.getBoundingClientRect();

            const wCenterX = wRect.left - cRect.left + wRect.width / 2;

            if (wCenterX < margin) return false;
            if (wCenterX > canvas.width - margin) return false;
            return true;
          });
          let startX, startY;
          if (validWindows.length > 0) {
            const chosen =
              validWindows[Math.floor(Math.random() * validWindows.length)];
            const chosenRect = chosen.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            startX = chosenRect.left - canvasRect.left + chosenRect.width / 2;
            startY = chosenRect.top - canvasRect.top + chosenRect.height / 2;
          } else if (litWindowsArray.length > 0) {
            const chosen =
              litWindowsArray[
                Math.floor(Math.random() * litWindowsArray.length)
              ];
            const chosenRect = chosen.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            startX = chosenRect.left - canvasRect.left + chosenRect.width / 2;
            startY = chosenRect.top - canvasRect.top + chosenRect.height / 2;
          } else {
            startX = random(validArea.left, validArea.right);
            startY = canvas.height;
          }

          const baseAngle =
            -90 + (-totalAngleSpread / 2 + count * anglePerFirework);
          const randomAngleOffset = random(
            -anglePerFirework / 2,
            anglePerFirework / 2
          );
          const angle = ((baseAngle + randomAngleOffset) * Math.PI) / 180;

          const minDistance = windowRect.height * 0.3;
          const maxDistance = windowRect.height * 0.6;
          const distance = random(minDistance, maxDistance);

          let targetX, targetY;

          targetX = startX + Math.cos(angle) * distance;
          targetY = startY + Math.sin(angle) * distance;

          targetX = Math.max(
            validArea.left,
            Math.min(validArea.right, targetX)
          );
          targetY = Math.max(
            validArea.top,
            Math.min(validArea.bottom, targetY)
          );

          if (
            targetX === validArea.left ||
            targetX === validArea.right ||
            targetY === validArea.top ||
            targetY === validArea.bottom
          ) {
            const dx = targetX - startX;
            const dy = targetY - startY;
            const newDistance = Math.sqrt(dx * dx + dy * dy);
            targetX =
              startX + (dx / newDistance) * Math.min(newDistance, maxDistance);
            targetY =
              startY + (dy / newDistance) * Math.min(newDistance, maxDistance);
          }
          const FireworkType =
            fireworkTypes[Math.floor(Math.random() * fireworkTypes.length)];
          const firework = new FireworkType(startX, startY, targetX, targetY);
          firework.speed = random(8, 12);
          firework.color = groupColors[count];
          fireworks.push(firework);
        }, count * 100);
      }
    }, random(1000, 3000));
  }
  function initFireworks(_canvas, _ctx) {
    canvas = _canvas;
    ctx = _ctx;

    loop();
    startAutoMode();
  }
  function launchFirework(sx, sy, tx, ty) {
    if (!fireworkTypes || !fireworkTypes.length) return;
    const FireworkType = fireworkTypes[0];
    const fw = new FireworkType(sx, sy, tx, ty);
    fw.color = "60";
    fw.speed = random(8, 12);
    fireworks.push(fw);
  }
  return {
    init: initFireworks,
    launch: launchFirework,
    getParticles: () => particles,
    getFireworks: () => fireworks,
  };
})();
