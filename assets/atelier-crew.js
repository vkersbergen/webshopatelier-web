(() => {
  const host = document.querySelector(".hero-visual");
  if (!host) return;
  const field = document.createElement("div");
  field.className = "playfield";
  field.setAttribute("aria-hidden", "true");
  field.innerHTML = '<i class="wa-orbit outer"></i><i class="wa-orbit"></i>';
  host.append(field);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const definitions = [
    ["social", 0.1, 0.26, 35, 39, 7],
    ["ai", 0.24, 0.59, 48, 63, -8],
    ["website", 0.62, 0.57, 68, -64, 2],
    ["onderhoud", 0.85, 0.31, 40, -36, 7],
    ["advertenties", 0.31, 0.18, 37, 30, -6],
    ["conversie", 0.59, 0.24, 32, -33, 9],
    ["zoeken", 0.82, 0.75, 45, -40, -9],
  ];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  let paused = false;
  let width = 0,
    height = 0,
    visible = false,
    animation = 0,
    last = 0;
  let elapsed = 0,
    nextDrop = 9.2,
    drops = 0,
    collisions = 0;
  let act = null,
    nextAct = 3.9,
    actCount = 0;
  const entranceOrder = [2, 0, 4, 3, 1, 6, 5];
  const pivots = {
    website: "54% 62%",
    onderhoud: "36% 57%",
    social: "49% 57%",
    ai: "51% 51%",
    advertenties: "55% 39%",
    conversie: "55% 68%",
    zoeken: "39% 77%",
  };
  const timings = {
    website: [3.5, 9],
    onderhoud: [8, 8],
    social: [2.8, 10],
    ai: [2, 6],
    advertenties: [2.3, 8],
    conversie: [2.7, 5],
    zoeken: [1.8, 9],
  };
  const smooth = (t) => {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;
  const figures = definitions.map(([name, fx, fy, size, vx, vy], index) => {
    const img = document.createElement("div");
    img.className = "wa-mini-agent";
    img.dataset.role = name;
    const puppet = document.createElement("span");
    puppet.className = "agent-puppet";
    for (const kind of ["body", "prop"]) {
      const part = new Image();
      part.src = "/assets/atelier-crew/" + name + "-" + kind + ".webp";
      part.alt = "";
      part.className = "agent-" + kind;
      part.draggable = false;
      if (kind === "prop") part.style.transformOrigin = pivots[name];
      puppet.append(part);
    }
    const work = document.createElement("i");
    work.className = "agent-work";
    puppet.append(work);
    img.append(puppet);
    const shadow = document.createElement("i");
    shadow.className = "wa-groundshade";
    field.append(shadow, img);
    return {
      img,
      puppet,
      prop: puppet.querySelector(".agent-prop"),
      work,
      name,
      shadow,
      fx,
      fy,
      size,
      vx,
      vy,
      spin: 0,
      angle: 0,
      impact: 0,
      index,
      falling: false,
      arrival: entranceOrder.indexOf(index) * 0.2,
      face: 1,
      turn: 1,
    };
  });
  const floorAt = (a) => height * 0.89;
  function resize() {
    const previous = width;
    const oldHeight = height;
    width = field.clientWidth;
    height = field.clientHeight;
    if (!width || !height) return;
    for (const a of figures) {
      a.w = a.size * clamp(width / 375, 0.81, 1.85);
      a.h = a.w * 1.2;
      a.radius = a.w * 0.455;
      a.invMass = 1 / (a.radius * a.radius);
      a.x = previous ? (a.x * width) / previous : a.fx * width;
      a.y = oldHeight ? (a.y * height) / oldHeight : a.fy * height;
      if (!previous && !reduce.matches) {
        a.y = -a.h * 0.62;
        a.entering = true;
      }
      a.img.style.width = a.w + "px";
      a.img.style.height = a.h + "px";
    }
    draw();
  }
  function kick(a, speed) {
    a.vy = -speed;
    a.falling = true;
    a.spin += (a.vx < 0 ? -1 : 1) * 52;
  }
  function walls(a) {
    const xMin = a.radius + 2,
      xMax = width - xMin,
      yMin = a.h * 0.5 + 2;
    const yMax = floorAt(a) - a.h * 0.46;
    if (a.x < xMin || a.x > xMax) {
      a.vx = (a.x < xMin ? 1 : -1) * Math.max(25, Math.abs(a.vx) * 0.91);
      a.x = clamp(a.x, xMin, xMax);
      a.spin += a.vx * 0.22;
    }
    if (a.y < yMin) {
      a.y = yMin;
      a.vy = Math.abs(a.vy) * 0.84;
    }
    if (a.y >= yMax) {
      const landingSpeed = a.vy;
      a.y = yMax;
      if (landingSpeed > 22) {
        a.vy = -landingSpeed * 0.67;
        a.impact = Math.max(a.impact, clamp(landingSpeed / 500, 0, 0.26));
      } else if (landingSpeed > 0) a.vy = 0;
      a.falling = false;
    }
  }
  function bounce(a, b) {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const overlap = a.radius + b.radius - distance;
    if (overlap <= 0) return;
    const nx = dx / distance,
      ny = dy / distance,
      mass = a.invMass + b.invMass;
    const separation = (overlap + 0.12) / mass;
    a.x -= nx * separation * a.invMass;
    a.y -= ny * separation * a.invMass;
    b.x += nx * separation * b.invMass;
    b.y += ny * separation * b.invMass;
    const approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if (approach <= 1) return;
    const impulse = ((1 + 0.92) * approach) / mass;
    a.vx -= nx * impulse * a.invMass;
    a.vy -= ny * impulse * a.invMass;
    b.vx += nx * impulse * b.invMass;
    b.vy += ny * impulse * b.invMass;
    if (approach > 16) {
      const turn = clamp(approach * 0.65, 15, 100) * (nx >= 0 ? 1 : -1);
      a.spin -= turn;
      b.spin += turn;
      a.impact = b.impact = clamp(approach / 320, 0.08, 0.26);
      collisions++;
      field.dispatchEvent(
        new CustomEvent("atelier-impact", {
          detail: {
            a: a.index,
            b: b.index,
            incoming: approach,
            outgoing: (b.vx - a.vx) * nx + (b.vy - a.vy) * ny,
          },
        }),
      );
    }
  }
  function entrance(a, dt) {
    if (elapsed < a.arrival) {
      a.y = -a.h * 0.7;
      return;
    }
    const firstFloor = height * a.fy;
    a.vy += 480 * dt;
    a.y += a.vy * dt;
    if (a.y >= firstFloor) {
      a.y = firstFloor;
      a.vy = -clamp(a.vy * 0.32, 42, 82);
      a.entering = false;
      a.impact = 0.29;
      a.spin = (a.index % 2 ? 1 : -1) * 70;
    }
  }
  function startAct() {
    const roles = [
      ["website", "ai"],
      ["advertenties", "onderhoud"],
      ["social", "zoeken"],
      ["onderhoud", "conversie"],
    ];
    const [lead, other] = roles[actCount++ % roles.length].map((name) =>
      figures.find((f) => f.name === name),
    );
    const sign = lead.x < other.x ? 1 : -1,
      middle = clamp((lead.x + other.x) * 0.5, width * 0.3, width * 0.7);
    const y = height * 0.46;
    act = {
      lead,
      other,
      sign,
      middle,
      y,
      start: elapsed,
      ax: lead.x,
      ay: lead.y,
      bx: other.x,
      by: other.y,
      hit: false,
    };
    field.dataset.scene = lead.name + "-" + other.name;
  }
  function actStep(dt) {
    if (!act) {
      if (elapsed >= nextAct) startAct();
      else return;
    }
    const { lead: a, other: b, sign: d, middle: x, y } = act;
    const age = elapsed - act.start;
    const gap = a.radius + b.radius;
    const partner = x + d * gap * 0.52;
    const stop = partner - d * (gap + 15);
    const beat = (phase) => (field.dataset.beat = phase);
    if (age < 1.05) {
      beat("aanloop");
      const k = smooth(age / 1.05);
      a.x = mix(act.ax, stop, k);
      a.y = mix(act.ay, y, k) - Math.sin(k * Math.PI * 4) * 3;
      b.x = mix(act.bx, partner, k);
      b.y = mix(act.by, y, k);
      a.face = d;
      b.face = d;
    } else if (age < 1.52) {
      beat("uithalen");
      const k = smooth((age - 1.05) / 0.47);
      a.x = stop - d * 7 * k;
      a.y = y + 2 * k;
      a.angle = -d * 11 * k;
    } else if (age < 1.74) {
      beat("por");
      const k = smooth((age - 1.52) / 0.22);
      a.x = mix(stop - d * 7, partner - d * gap * 0.94, k);
      a.y = y;
      a.angle = d * 14 * k;
      a.gesture = 18 * k;
    } else if (age < 2.3) {
      beat("terugstuiten");
      if (!act.hit) {
        act.hit = true;
        a.impact = 0.24;
        b.impact = 0.36;
        a.gesture = 24;
        b.spin = d * 110;
        field.dataset.pokes = String(Number(field.dataset.pokes || 0) + 1);
        const burst = document.createElement("i");
        burst.className = "agent-contact";
        burst.style.left = partner - d * b.radius + "px";
        burst.style.top = y - 3 + "px";
        field.append(burst);
        burst.addEventListener("animationend", () => burst.remove(), {
          once: true,
        });
      }
      const t = (age - 1.74) / 0.56,
        k = 1 - (1 - t) ** 2;
      a.x = partner - d * gap * 0.94 - d * 17 * k;
      b.x = partner + d * 30 * k;
      a.y = y - Math.sin(t * Math.PI) * 7;
      b.y = y - Math.sin(t * Math.PI) * 22;
      b.angle = d * 20 * Math.sin(t * Math.PI);
      a.angle = -d * 9 * Math.sin(t * Math.PI);
      a.impact *= Math.exp(-dt * 8);
      b.impact *= Math.exp(-dt * 8);
    } else if (age < 3.35) {
      beat("terugkijken");
      b.face = -d;
      b.angle =
        -d * 8 * Math.sin(Math.min(1, (age - 2.3) / 0.38) * Math.PI * 0.5);
      a.face = age < 2.8 ? d : -d;
      a.gesture = 6 * Math.sin(age * 13);
    } else {
      a.vx = -d * 58;
      b.vx = d * 39;
      a.vy = -15;
      b.vy = -10;
      a.gesture = 0;
      b.angle = 0;
      nextAct = elapsed + 1.7;
      act = null;
      beat("aan het werk");
    }
  }
  function step(dt) {
    elapsed += dt;
    actStep(dt);
    if (elapsed > nextDrop) {
      const a = figures[[2, 6, 1, 3, 4, 0, 5][drops % 7]];
      a.falling = true;
      a.vy = 70;
      a.spin = 65;
      drops++;
      nextDrop = elapsed + 4.7;
    }
    for (const a of figures) {
      if (a.entering) {
        entrance(a, dt);
        continue;
      }
      if (act && (a === act.lead || a === act.other)) continue;
      if (a.falling) a.vy += 285 * dt;
      else {
        const target =
          height * (a.fy + 0.055 * Math.sin(elapsed * 1.13 + a.index));
        a.vy += ((target - a.y) * 1.15 - a.vy * 0.5) * dt;
      }
      const cruise = 40 + a.index * 2.7;
      a.vx += (Math.sign(a.vx || 1) * cruise - a.vx) * dt * 0.2;
      a.vx = clamp(a.vx, -160, 160);
      a.vy = clamp(a.vy, -200, 230);
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.angle = (a.angle + a.spin * dt) * Math.exp(-dt * 2.2);
      a.spin *= Math.exp(-dt * 3.8);
      a.impact *= Math.exp(-dt * 8);
      walls(a);
    }
    const free = figures.filter(
      (a) => !a.entering && (!act || (a !== act.lead && a !== act.other)),
    );
    for (let i = 0; i < free.length; i++)
      for (let j = i + 1; j < free.length; j++) bounce(free[i], free[j]);
    free.forEach(walls);
  }
  function draw() {
    if (!width) return;
    for (const a of figures) {
      const active = !reduce.matches;
      const [pace, range] = timings[a.name];
      const cycle = elapsed * pace + a.index;
      const rest = act && (a === act.other || a === act.lead);
      const work = active && !a.entering && !rest;
      a.turn = mix(a.turn, active ? a.face : 1, 0.19);
      a.puppet.style.transform =
        "perspective(150px) rotateY(" + ((1 - a.turn) * 86).toFixed(1) + "deg)";
      const swing = work ? Math.sin(cycle) * range : a.gesture || 0;
      a.prop.style.transform = "rotate(" + swing.toFixed(1) + "deg)";
      a.work.style.opacity = work
        ? Math.pow(Math.max(0, Math.sin(cycle)), 3) * 0.75
        : 0;
      const ground = floorAt(a),
        lift = Math.max(0, ground - a.y - a.h * 0.46);
      const angle = clamp(
        a.angle + Math.sin(elapsed * 1.2 + a.index) * 4,
        -27,
        27,
      );
      a.img.style.transform =
        "translate3d(" +
        (a.x - a.w / 2).toFixed(1) +
        "px," +
        (a.y - a.h / 2).toFixed(1) +
        "px,0) rotate(" +
        angle.toFixed(1) +
        "deg) scale(" +
        (1 + a.impact * 0.65).toFixed(3) +
        "," +
        (1 - a.impact * 0.48).toFixed(3) +
        ")";
      a.img.style.zIndex = String(3 + Math.round(a.y / 12));
      a.shadow.style.transform =
        "translate(" +
        (a.x - 21).toFixed(1) +
        "px," +
        (ground - 3).toFixed(1) +
        "px) scaleX(" +
        Math.max(0.4, 1 - lift / 200) +
        ")";
      a.shadow.style.opacity =
        a.entering && elapsed < a.arrival
          ? 0
          : Math.max(0.07, 0.58 - lift / 180);
    }
    field.dataset.drops = drops;
    field.dataset.collisions = collisions;
  }
  function frame(now) {
    if (paused || !visible || document.hidden || reduce.matches) {
      animation = 0;
      return;
    }
    if (last && now - last < 32) {
      animation = requestAnimationFrame(frame);
      return;
    }
    let dt = last ? Math.min(0.045, (now - last) / 1000) : 0;
    last = now;
    while (dt > 0) {
      const slice = Math.min(dt, 1 / 120);
      step(slice);
      dt -= slice;
    }
    draw();
    animation = requestAnimationFrame(frame);
  }
  function run() {
    if (paused || !visible || document.hidden || reduce.matches) {
      cancelAnimationFrame(animation);
      animation = 0;
      last = 0;
      draw();
      return;
    }
    if (!animation) animation = requestAnimationFrame(frame);
  }
  field.addEventListener("pointerdown", (e) => {
    if (paused || reduce.matches) return;
    const rect = field.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    const a = figures.reduce((a, b) =>
      Math.hypot(a.x - x, a.y - y) < Math.hypot(b.x - x, b.y - y) ? a : b,
    );
    if (Math.hypot(a.x - x, a.y - y) > a.radius * 2) return;
    kick(a, 155);
    a.vx += a.x < x ? -33 : 33;
  });
  const control = host.querySelector(".crew-motion");
  function label() {
    const en = document.documentElement.lang.startsWith("en");
    const title = paused
      ? en
        ? "Resume animation"
        : "Animatie hervatten"
      : en
        ? "Pause animation"
        : "Animatie pauzeren";
    control.setAttribute("aria-label", title);
    control.title = title;
  }
  control.addEventListener("click", () => {
    paused = !paused;
    control.setAttribute("aria-pressed", String(paused));
    label();
    run();
  });
  new MutationObserver(label).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  label();
  new ResizeObserver(resize).observe(field);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    run();
  }).observe(host);
  document.addEventListener("visibilitychange", run);
  reduce.addEventListener("change", () => {
    if (reduce.matches) {
      act = null;
      for (const a of figures) {
        a.entering = false;
        a.x = a.fx * width;
        a.y = a.fy * height;
        a.angle = 0;
        a.gesture = 0;
        a.turn = 1;
        a.impact = 0;
      }
    }
    run();
  });
  resize();
  run();
})();
