const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const exploreLink = document.querySelector(".explore-link");

if (exploreLink) {
  exploreLink.addEventListener("click", () => {
    exploreLink.classList.add("is-active");
    window.setTimeout(() => exploreLink.classList.remove("is-active"), 220);
  });
}

const receiptIntro = document.querySelector(".receipt-intro");
const receiptFrame = document.querySelector(".receipt-intro__frame");

if (receiptIntro && receiptFrame) {
  const syncReceiptScroll = () => {
    const rect = receiptIntro.getBoundingClientRect();
    const travel = Math.max(1, receiptIntro.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / travel));

    receiptFrame.contentWindow?.postMessage(
      {
        type: "receipt-scroll-progress",
        progress,
      },
      "*"
    );
  };

  const syncReceiptPointer = (event) => {
    const rect = receiptFrame.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const active = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

    receiptFrame.contentWindow?.postMessage(
      {
        type: "receipt-pointer",
        active,
        x,
        y,
      },
      "*"
    );
  };

  const resetReceiptPointer = () => {
    receiptFrame.contentWindow?.postMessage(
      {
        type: "receipt-pointer",
        active: false,
      },
      "*"
    );
  };

  receiptFrame.addEventListener("load", syncReceiptScroll);
  window.addEventListener("scroll", syncReceiptScroll, { passive: true });
  window.addEventListener("pointermove", syncReceiptPointer, { passive: true });
  window.addEventListener("pointerleave", resetReceiptPointer);
  window.addEventListener("resize", syncReceiptScroll);
  syncReceiptScroll();
}

const particleCanvas = document.getElementById("particleCanvas");

if (particleCanvas) {
  const ctx = particleCanvas.getContext("2d");
  const field = particleCanvas.closest(".blue-field");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrameId = null;

  const mouse = {
    x: -9999,
    y: -9999,
    px: -9999,
    py: -9999,
    speed: 0,
    active: false,
  };

  const particleSettings = {
    background: "#436fdb",
    bottomStartRatio: 0.66,
    particleSpacing: 24,
    randomJitter: 0.08,
    minSize: 4.5,
    maxSize: 9,
    minGap: 2.5,
    interactionRadius: 200,
    horizontalForce: 18,
    liftForce: 28,
    returnForce: 0.0065,
    friction: 0.975,
    gravity: 0.001,
    maxLift: 360,
    ambientWaveY: 2.4,
    ambientWaveX: 2.8,
  };

  const particleShapes = ["circle", "triangle", "cross"];

  class Particle {
    constructor(x, y, size, alpha, shape, rotation) {
      this.homeX = x;
      this.homeY = y;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.size = size;
      this.alpha = alpha;
      this.shape = shape;
      this.rotation = rotation;
      this.phase = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.01;
    }

    disturb(time) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > particleSettings.interactionRadius) return;

      const power = Math.pow(1 - distance / particleSettings.interactionRadius, 1.7);
      const moveX = mouse.x - mouse.px;
      const moveY = mouse.y - mouse.py;
      const dragX = Math.max(-36, Math.min(36, moveX));
      const dragY = Math.max(-24, Math.min(24, moveY));
      const speedBoost = Math.min(mouse.speed / 18, 3.5);

      this.vx += dragX * 1.2 * power;
      this.vx += Math.sin(this.phase + time * 4) * particleSettings.horizontalForce * 0.16 * power;

      const softLift = particleSettings.liftForce * power * (0.06 + speedBoost * 0.28);
      this.vy -= softLift;
      this.vy += dragY * 0.12 * power;

      this.vx += Math.sin(time * 4 + this.phase) * 2.5 * power;
      this.vy += Math.cos(time * 3 + this.phase) * 0.6 * power;
      this.rotation += Math.sin(this.phase + time * 3) * 0.012 * power;
    }

    update() {
      const time = performance.now() * 0.001;
      const waveX =
        Math.sin(this.homeY * 0.026 + time * 1.55 + this.phase) * particleSettings.ambientWaveX +
        Math.sin((this.homeX + this.homeY) * 0.012 + time * 1.1) * particleSettings.ambientWaveX * 0.35;
      const waveY =
        Math.sin(this.homeX * 0.032 + time * 1.8 + this.phase) * particleSettings.ambientWaveY +
        Math.sin((this.homeX - this.homeY) * 0.014 + time * 1.2) * particleSettings.ambientWaveY * 0.25;

      if (mouse.active) {
        this.disturb(time);
      }

      const targetX = this.homeX + waveX;
      const targetY = this.homeY + waveY;
      const mouseDx = this.x - mouse.x;
      const mouseDy = this.y - mouse.y;
      const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
      const nearMouse = mouse.active && mouseDistance < particleSettings.interactionRadius * 1.25;
      const returnScale = nearMouse ? 0.25 : 0.85;

      this.vx += (targetX - this.x) * particleSettings.returnForce * returnScale;
      this.vy += (targetY - this.y) * particleSettings.returnForce * returnScale;
      this.vy += nearMouse ? particleSettings.gravity * 0.02 : particleSettings.gravity;

      if (this.y < this.homeY - particleSettings.maxLift) {
        this.vy += 0.4;
      }

      this.vx *= particleSettings.friction;
      this.vy *= particleSettings.friction;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.spin + this.vx * 0.0008;
    }

    drawCircle() {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    drawTriangle() {
      const size = this.size * 1.45;

      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.9, size * 0.7);
      ctx.lineTo(-size * 0.9, size * 0.7);
      ctx.closePath();
      ctx.fill();
    }

    drawCross() {
      const size = this.size * 1.25;

      ctx.lineWidth = Math.max(2, this.size * 0.46);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.stroke();
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;

      if (this.shape === "circle") {
        this.drawCircle();
      } else if (this.shape === "triangle") {
        this.drawTriangle();
      } else {
        this.drawCross();
      }

      ctx.restore();
    }
  }

  function getShapeRadius(size, shape) {
    if (shape === "triangle") return size * 1.55;
    if (shape === "cross") return size * 1.45;
    return size;
  }

  function isOverlapping(x, y, size, shape, placed) {
    const radius = getShapeRadius(size, shape) + particleSettings.minGap;

    return placed.some((item) => {
      const dx = x - item.x;
      const dy = y - item.y;
      const minDistance = radius + item.radius;

      return dx * dx + dy * dy < minDistance * minDistance;
    });
  }

  function createParticles() {
    particles = [];

    const startY = height * particleSettings.bottomStartRatio;
    const spacing = particleSettings.particleSpacing;
    const placed = [];

    for (let y = startY; y < height + 30; y += spacing) {
      const depth = (y - startY) / Math.max(1, height - startY);

      for (let x = -30; x < width + 30; x += spacing) {
        let size = particleSettings.minSize + Math.random() * (particleSettings.maxSize - particleSettings.minSize);
        let shape = particleShapes[Math.floor(Math.random() * particleShapes.length)];
        let px = x + spacing * 0.5 + (Math.random() - 0.5) * spacing * particleSettings.randomJitter;
        let py = y + spacing * 0.5 + (Math.random() - 0.5) * spacing * particleSettings.randomJitter;
        let tries = 0;

        while (tries < 8 && isOverlapping(px, py, size, shape, placed)) {
          size = particleSettings.minSize + Math.random() * (particleSettings.maxSize - particleSettings.minSize);
          shape = particleShapes[Math.floor(Math.random() * particleShapes.length)];
          px = x + spacing * 0.5 + (Math.random() - 0.5) * spacing * particleSettings.randomJitter;
          py = y + spacing * 0.5 + (Math.random() - 0.5) * spacing * particleSettings.randomJitter;
          tries += 1;
        }

        if (!isOverlapping(px, py, size, shape, placed)) {
          const alpha = Math.min(0.96, 0.72 + Math.random() * 0.2 + depth * 0.04);
          const rotation = Math.random() * Math.PI * 2;

          particles.push(new Particle(px, py, size, alpha, shape, rotation));
          placed.push({ x: px, y: py, radius: getShapeRadius(size, shape) });
        }
      }
    }
  }

  function drawParticles() {
    ctx.fillStyle = particleSettings.background;
    ctx.fillRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.update();
      particle.draw();
    });
  }

  function animateParticles() {
    drawParticles();

    if (!reduceMotion.matches) {
      animationFrameId = requestAnimationFrame(animateParticles);
    }
  }

  function resizeParticles() {
    const rect = field.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    particleCanvas.width = Math.floor(width * dpr);
    particleCanvas.height = Math.floor(height * dpr);
    particleCanvas.style.width = `${width}px`;
    particleCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createParticles();
    drawParticles();
  }

  function updateMouse(clientX, clientY) {
    const rect = field.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (mouse.x < -1000 || mouse.y < -1000) {
      mouse.px = x;
      mouse.py = y;
    } else {
      mouse.px = mouse.x;
      mouse.py = mouse.y;
    }

    mouse.x = x;
    mouse.y = y;

    const dx = mouse.x - mouse.px;
    const dy = mouse.y - mouse.py;

    mouse.speed = Math.sqrt(dx * dx + dy * dy);
    mouse.active = y > height * 0.55 && x >= 0 && x <= width && y >= 0 && y <= height;
  }

  function resetMouse() {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
    mouse.px = -9999;
    mouse.py = -9999;
  }

  field.addEventListener("mousemove", (event) => {
    updateMouse(event.clientX, event.clientY);
  });

  field.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];

      if (touch) {
        updateMouse(touch.clientX, touch.clientY);
      }
    },
    { passive: true }
  );

  field.addEventListener("mouseleave", resetMouse);
  field.addEventListener("touchend", resetMouse);
  field.addEventListener("touchcancel", resetMouse);

  window.addEventListener("resize", () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    resizeParticles();
    animateParticles();
  });

  if ("ResizeObserver" in window) {
    const particleResizeObserver = new ResizeObserver(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      resizeParticles();
      animateParticles();
    });

    particleResizeObserver.observe(field);
  }

  function handleMotionPreferenceChange() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    animateParticles();
  }

  if ("addEventListener" in reduceMotion) {
    reduceMotion.addEventListener("change", handleMotionPreferenceChange);
  } else {
    reduceMotion.addListener(handleMotionPreferenceChange);
  }

  resizeParticles();
  animateParticles();
}
