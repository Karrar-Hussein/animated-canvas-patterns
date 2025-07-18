import { Pane } from "tweakpane";
import "./style.css";

let canvas;
let ctx;
let flowField;
let flowFieldAnimation;
let pane;
let tab;
let pauseBtn;

const initPattern = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  flowField = new FlowFieldEffect(ctx, canvas.width, canvas.height);
  flowField.animate(0);

  pane = new Pane();
  tab = pane.addTab({
    pages: [{ title: "Parameters" }, { title: "Colors" }],
  });
  tab.pages[0].addBlade({
    view: "text",
    label: "messege:",
    parse: (v) => String(v),
    value: "set cellSize to 1 :)",
  });

  tab.pages[0].addBinding(flowField, "cellSize", { min: 1, max: 30, steps: 1 });
  tab.pages[0].addBinding(flowField, "lineWidth", {
    min: 0,
    max: 10,
    steps: 1,
  });
  tab.pages[0].addBinding(flowField, "zoom", {
    min: 0.0001,
    max: 0.03,
    steps: 0.001,
  });
  tab.pages[0].addBinding(flowField, "maximumLineLength", {
    min: 0,
    max: 100,
    steps: 1,
  });
  pauseBtn = tab.pages[0].addButton({
    title: "pause/resume",
    label: "animation",
  });
  pauseBtn.on("click", () => {
    flowField.started = !flowField.started;
  });
};

window.addEventListener("load", () => {
  canvas = document.getElementById("canvas1");
  ctx = canvas.getContext("2d");
  initPattern();
});

window.addEventListener("resize", () => {
  cancelAnimationFrame(flowFieldAnimation);

  tab.pages.forEach((element) => {
    tab.removePage(0);
  });
  initPattern();
});

const mouse = {
  x: 0,
  y: 0,
};

// Mouse movement for desktop
window.addEventListener("mousemove", (e) => {
  mouse.x = e.x;
  mouse.y = e.y;
});

// ✅ Added: Touch movement for mobile
window.addEventListener("touchmove", (e) => {
  if (e.touches.length > 0) {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }
});

// ✅ Optional: touchstart (if needed, keeps latest touch position)
window.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }
});

class FlowFieldEffect {
  #ctx;
  #width;
  #height;
  constructor(ctx, width, height) {
    this.#ctx = ctx;
    this.#width = width;
    this.#height = height;
    this.lineWidth = 1;
    this.maximumLineLength = 60;
    this.minimumLineLength = 1 * 10000;
    this.angle = 0;
    this.lastTime = 0;
    this.interval = 1000 / 60;
    this.timer = 0;
    this.cellSize = 15;
    this.gradient;
    this.#createGradient();
    this.#ctx.strokeStyle = this.gradient;
    this.zoom = 0.01;
    this.radius = 0;
    this.vr = 0.03;
    this.started = true;
  }
  #createGradient() {
    this.gradient = this.#ctx.createLinearGradient(
      0,
      0,
      this.#width,
      this.#height
    );
    this.gradient.addColorStop(0.1, "#ff5c33");
    this.gradient.addColorStop(0.2, "#ff66b3");
    this.gradient.addColorStop(0.4, "#ccccff");
    this.gradient.addColorStop(0.6, "#b3ffff");
    this.gradient.addColorStop(0.8, "#80ff80");
    this.gradient.addColorStop(0.9, "#ffff33");
  }
  #drawLine(angle, x, y) {
    let positionX = x;
    let positionY = y;
    let dx = mouse.x - positionX;
    let dy = mouse.y - positionY;
    let distance = dx * dx + dy * dy;
    if (distance > this.maximumLineLength * 10000) {
      distance = this.maximumLineLength * 10000;
    } else if (distance < this.minimumLineLength) {
      distance = this.minimumLineLength;
    }
    const length = distance * 0.0001;
    this.#ctx.beginPath();
    this.#ctx.moveTo(x, y);
    this.#ctx.lineTo(
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    this.#ctx.stroke();
  }
  animate(timeStamp) {
    const deltaTime = timeStamp - this.lastTime;
    this.lastTime = timeStamp;
    if (this.timer > this.interval) {
      this.#ctx.clearRect(0, 0, this.#width, this.#height);
      this.#ctx.lineWidth = this.lineWidth;
      if (this.started) {
        this.radius += this.vr;
        if (this.radius > 5 || this.radius < -5) {
          this.vr *= -1;
        }
      }
      for (let y = 0; y < this.#height; y += this.cellSize) {
        for (let x = 0; x < this.#width; x += this.cellSize) {
          const angle =
            (Math.cos(x * this.zoom) + Math.sin(y * this.zoom)) * this.radius;
          this.#drawLine(angle, x, y);
        }
      }

      this.timer = 0;
    } else {
      this.timer += deltaTime;
    }
    flowFieldAnimation = requestAnimationFrame(this.animate.bind(this));
  }
}
