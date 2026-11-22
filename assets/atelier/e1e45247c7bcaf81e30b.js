(function(){
  const laag = document.querySelector('.val-laag');
  const blok = document.querySelector('.val-blok');
  const scene = document.querySelector('.hero-visual');
  const rustig = matchMedia('(prefers-reduced-motion: reduce)');
  const hoogteBlok = 66;
  const snelheid = 130;
  let actief = false;
  let frame = 0;
  let vorige;
  let afgelegd;
  let startLinks;
  let startBoven;
  let beginSchaal;

  function opruimen() {
    cancelAnimationFrame(frame);
    frame = 0;
    actief = false;
    blok.hidden = true;
  }
  function teken(tijd) {
    frame = 0;
    if (!actief) return;
    if (document.hidden) { vorige = undefined; return; }
    if (vorige !== undefined) afgelegd += Math.min(tijd - vorige, 50) * snelheid / 1000;
    vorige = tijd;
    const diepte = Math.max(1, laag.clientHeight + hoogteBlok - startBoven);
    if (afgelegd >= diepte) { opruimen(); return; }
    const breedte = laag.clientWidth;
    const fractie = afgelegd / diepte;
    const rand = breedte - (breedte < 620 ? 45 : 67);
    const midden = startLinks + (rand - startLinks) * Math.min(1, fractie * 4);
    const links = Math.max(5, Math.min(breedte - 46, midden + Math.sin(afgelegd / 180) * 11));
    const schaal = beginSchaal + (.83 - beginSchaal) * Math.min(1, fractie * 4);
    blok.style.transform = 'translate3d(' + links + 'px,' + (startBoven + afgelegd) + 'px,0) scale(' + schaal + ')';
    frame = requestAnimationFrame(teken);
  }
  document.addEventListener('atelier-blok-valt', function (e) {
    if (actief || rustig.matches || document.hidden) return;
    const r = laag.getBoundingClientRect();
    startLinks = e.detail.x - r.left - 22;
    startBoven = Math.max(0, e.detail.y - r.top - hoogteBlok / 2);
    beginSchaal = Math.max(.68, Math.min(1.35, e.detail.schaal));
    blok.dataset.materiaal = String(Math.min(2, e.detail.materiaal || 0));
    actief = true;
    vorige = undefined;
    afgelegd = 0;
    blok.hidden = false;
    teken(performance.now());
  });
  rustig.addEventListener('change', function () { if (rustig.matches) opruimen(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      vorige = undefined;
    } else if (actief && !frame) {
      frame = requestAnimationFrame(teken);
    }
  });

  function posterVal() {
    if (!scene.classList.contains('geen-3d') || rustig.matches) return;
    const r = scene.getBoundingClientRect();
    if (!actief && r.bottom > 0 && r.top < innerHeight) {
      document.dispatchEvent(new CustomEvent('atelier-blok-valt', {
        detail: { x: r.left + .72 * r.width, y: r.top + .52 * r.height, materiaal: 0, schaal: 1 }
      }));
    }
    setTimeout(posterVal, 9500);
  }
  setTimeout(posterVal, 5800);
})();

function start3D(cv) {
  var kader = cv.closest('.kader');
  var stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: 'default' });
  var inst = gl && gl.getExtension('ANGLE_instanced_arrays');
  if (!gl || !inst) { kader.classList.add('geen-3d'); return; }
  cv.addEventListener('webglcontextlost', function () { kader.classList.remove('scene-klaar'); });
  var namen = JSON.parse(cv.dataset.namen || '[]'), links = JSON.parse(cv.dataset.links || '[]');
  var label = cv.parentNode.querySelector('.blok-label');
  var dichtheid = +(cv.dataset.aantal || 0);

  /* geometrie: afgeronde doos, samengevoegd tot een L */
  function rondeDoos(cx, cy, cz, hx, hy, hz, r, n, P, N) {
    var assen = [[0, 1, 2, 1], [0, 1, 2, -1], [1, 2, 0, 1], [1, 2, 0, -1], [2, 0, 1, 1], [2, 0, 1, -1]];
    var h = [hx, hy, hz], c = [cx, cy, cz];
    assen.forEach(function (a) {
      var u = a[0], v = a[1], w = a[2], s = a[3];
      function punt(i, j) {
        var p = [0, 0, 0]; p[u] = (i / n * 2 - 1) * h[u]; p[v] = (j / n * 2 - 1) * h[v]; p[w] = s * h[w];
        var q = [0, 0, 0], d = [0, 0, 0];
        for (var k = 0; k < 3; k++) { q[k] = Math.max(-h[k] + r, Math.min(h[k] - r, p[k])); d[k] = p[k] - q[k]; }
        var l = Math.hypot(d[0], d[1], d[2]) || 1;
        return [[q[0] + d[0] / l * r + c[0], q[1] + d[1] / l * r + c[1], q[2] + d[2] / l * r + c[2]], [d[0] / l, d[1] / l, d[2] / l]];
      }
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var a1 = punt(i, j), b1 = punt(i + 1, j), c1 = punt(i + 1, j + 1), d1 = punt(i, j + 1);
        var tri = s > 0 ? [a1, b1, c1, a1, c1, d1] : [a1, c1, b1, a1, d1, c1];
        if (u === 1) tri = s > 0 ? [a1, c1, b1, a1, d1, c1] : [a1, b1, c1, a1, c1, d1];
        tri.forEach(function (t) { P.push(t[0][0], t[0][1], t[0][2]); N.push(t[1][0], t[1][1], t[1][2]); });
      }
    });
  }
  var P = [], N = [];
  rondeDoos(-0.17, 0.25, 0, 0.17, 0.75, 0.17, 0.08, 6, P, N);   // slanke kolom, zoals het beeldmerk (1:3)
  var nKolom = P.length / 3;
  rondeDoos(0.19, -0.33, 0, 0.19, 0.17, 0.17, 0.08, 6, P, N);   // voet rechtsonder, even breed
  var nVert = P.length / 3;
  var D = []; for (var di = 0; di < nVert; di++) D.push(di < nKolom ? 0 : 1);   // 0 = kolom, 1 = voet (tweede kleur)

  var vs = [
    'attribute vec3 p; attribute vec3 n; attribute vec3 o; attribute vec4 q; attribute float k; attribute float s; attribute float d;',
    'uniform mat4 M; varying vec3 vn; varying vec3 vp; varying float vk;',
    'vec3 rot(vec4 q, vec3 v){ return v + 2.0*cross(q.xyz, cross(q.xyz, v) + q.w*v); }',
    'void main(){ vec3 w = rot(q, p*s) + o; vn = rot(q, n); vp = w; vk = (d > .5) ? (k < .5 ? 1.0 : 0.0) : k; gl_Position = M * vec4(w,1.0); }'].join('\n');
  var fs = [
    'precision mediump float; varying vec3 vn; varying vec3 vp; varying float vk; uniform vec3 C;',
    'void main(){ vec3 n = normalize(vn); vec3 v = normalize(C - vp); vec3 l = normalize(vec3(-.45,.8,.55));',
    ' vec3 kl = vk < .5 ? vec3(1.,.357,.227) : (vk < 1.5 ? vec3(.937,.902,.855) : (vk < 2.5 ? vec3(.07,.06,.09) : vec3(.36,.24,.5)));',
    ' kl = pow(kl, vec3(2.2)); float g = (vk > 1.5 && vk < 2.5) ? 90. : 48.;',
    ' float d = max(dot(n,l),0.), sp = pow(max(dot(n, normalize(l+v)),0.), g), fr = pow(1.-max(dot(n,v),0.), 3.);',
    ' vec3 c = kl*(.14 + .86*d) + vec3(1.)*sp*(vk>1.5?.9:.5) + vec3(.45,.4,.55)*fr*.35 + kl*.28*max(dot(n,normalize(vec3(.7,-.3,.4))),0.);',
    ' gl_FragColor = vec4(pow(c, vec3(.4545)), 1.); }'].join('\n');
  function sh(t, src) { var x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(x)); return x; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
  function buf(data, naam, maat, perInstance) {
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, perInstance ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, naam); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, maat, gl.FLOAT, false, 0, 0);
    if (perInstance) inst.vertexAttribDivisorANGLE(loc, 1); return b;
  }
  buf(new Float32Array(P), 'p', 3); buf(new Float32Array(N), 'n', 3); buf(new Float32Array(D), 'd', 1);

  var W = 1, H = 1, asp = 1, mob = false, AANTAL = 0;
  /* ronde 4b: de blokken eromheen en erboven, niet over het toestel en niet over de kop (vakken in fracties van het kader) */
  var heeftToestel = !!(cv.parentNode && cv.parentNode.querySelector('canvas.toestel3d'));
  var qh = /[?&]h=([BK])/.exec(location.search), COMP = qh ? qh[1] : ((cv.parentNode.querySelector('canvas.toestel3d') || {}).dataset || {}).compositie || 'B';
  var ZONES = !heeftToestel ? {} : { B: [[0, 0, .5, 1]], K: [[0, 0, .45, 1], [0, .4, .64, 1]], mob: [[0, .84, 1, 1]] };
  var pos = [], vel = [], rotq = [], angv = [], thuis = [], kleur = [], schaal = [];
  var bO, bQ, bK, bS, uM = gl.getUniformLocation(pr, 'M'), uC = gl.getUniformLocation(pr, 'C');
  var cam = [0, 0, 9], fov = 0.9;
  function vulScene() {
    AANTAL = dichtheid || (mob ? 10 : 14); cam[2] = mob ? 6.2 : 9;
    pos = []; vel = []; rotq = []; angv = []; thuis = []; kleur = []; schaal = [];
    var hh = Math.tan(fov / 2) * cam[2], hw = hh * asp;
    for (var i = 0; i < AANTAL; i++) {
      var x, y;
      var weg = ZONES[mob ? 'mob' : COMP] || [], poging = 0;
      do {
        if (mob) { x = (Math.random() * 2 - 1) * hw * .85; y = (Math.random() * 2 - 1) * hh * .8; }
        else if (weg.length) { x = hw * (0.05 + Math.random() * .92); y = (Math.random() * 2 - 1) * hh * .85; }
        else { x = hw * (0.12 + Math.random() * .66); y = hh * (.7 - Math.random() * 1.2); } /* eindtoets: 55-90% breed, 15-75% hoog, rechtsonder leeg */ /* 4c: rechts met lucht, kop links vrij */
        var fx = x / hw * .5 + .5, fy = .5 - y / hh * .5, raakt = false;
        for (var zi = 0; zi < weg.length; zi++) { var zn = weg[zi]; if (fx > zn[0] && fx < zn[2] && fy > zn[1] && fy < zn[3]) raakt = true; }
        poging++;
      } while (raakt && poging < 60);
      var z = (Math.random() * 2 - 1) * 1.6;
      thuis.push([x, y, z]); pos.push([x + (Math.random() - .5) * 4, y + 6 + Math.random() * 4, z]); vel.push([0, 0, 0]);
      var a = Math.random() * 6.28, ax = [Math.random() - .5, Math.random() - .5, Math.random() - .5], al = Math.hypot(ax[0], ax[1], ax[2]);
      rotq.push([ax[0] / al * Math.sin(a / 2), ax[1] / al * Math.sin(a / 2), ax[2] / al * Math.sin(a / 2), Math.cos(a / 2)]);
      angv.push([(Math.random() - .5) * .6, (Math.random() - .5) * .6, (Math.random() - .5) * .6]);
      var licht = /[?&]v=licht/.test(location.search) || document.documentElement.classList.contains('licht'); kleur.push(i % 3 === 0 ? 0 : (i % 3 === 1 ? (licht ? 3 : 1) : 2)); schaal.push(mob ? .95 : 1.0);
    }
    if (stil) for (i = 0; i < AANTAL; i++) pos[i] = thuis[i].slice();
    bO = buf(new Float32Array(AANTAL * 3), 'o', 3, true); bQ = buf(new Float32Array(AANTAL * 4), 'q', 4, true);
    bK = buf(new Float32Array(kleur), 'k', 1, true); bS = buf(new Float32Array(schaal), 's', 1, true);
  }
  function maat() {
    var r = cv.getBoundingClientRect(); if (!r.width || !r.height) return; W = r.width; H = r.height; asp = W / H; mob = W < 700;
    var dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); gl.viewport(0, 0, cv.width, cv.height);
  }
  maat(); vulScene();
  new ResizeObserver(function () {
    var oud = mob;
    var breedte = W;
    maat();
    if (oud !== mob || breedte <= 1) vulScene();
    if (stil) teken();
  }).observe(kader);

  function matrix() {
    var f = 1 / Math.tan(fov / 2), nr = .1, fr = 40;
    var pm = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (fr + nr) / (nr - fr), -1, 0, 0, 2 * fr * nr / (nr - fr), 0];
    pm[12] = 0; pm[13] = 0; pm[14] = pm[14] + pm[10] * -cam[2]; pm[15] = cam[2];
    return new Float32Array(pm);
  }
  function naarScherm(p) { var d = cam[2] - p[2], hh = Math.tan(fov / 2) * d; var r = cv.getBoundingClientRect(); return [r.left + (p[0] / (hh * asp) * .5 + .5) * r.width, r.top + (.5 - p[1] / hh * .5) * r.height]; }
  function naarWereld(cx, cy) { var r = cv.getBoundingClientRect(), hh = Math.tan(fov / 2) * cam[2]; return [((cx - r.left) / r.width - .5) * 2 * hh * asp, (.5 - (cy - r.top) / r.height) * 2 * hh]; }
  function raak(cx, cy) { var b = -1, bd = 1e9; for (var i = 0; i < AANTAL; i++) { var s = naarScherm(pos[i]); var d = Math.hypot(s[0] - cx, s[1] - cy); if (d < (mob ? 40 : 52) && d < bd) { bd = d; b = i; } } return b; }

  var muis = null, grijp = -1, start = null, schoof = false, licht = -1;
  cv.addEventListener('pointermove', function (ev) {
    muis = naarWereld(ev.clientX, ev.clientY);
    if (grijp >= 0) { schoof = schoof || Math.hypot(ev.clientX - start[0], ev.clientY - start[1]) > 6; pos[grijp][0] = muis[0]; pos[grijp][1] = muis[1]; vel[grijp] = [0, 0, 0]; }
  });
  cv.addEventListener('pointerleave', function () { muis = null; });
  cv.addEventListener('pointercancel', function () { grijp = -1; cv.classList.remove('pak'); });
  cv.addEventListener('pointerdown', function (ev) { var i = raak(ev.clientX, ev.clientY); start = [ev.clientX, ev.clientY]; schoof = false; if (i >= 0) { grijp = i; cv.setPointerCapture(ev.pointerId); cv.classList.add('pak'); } });
  cv.addEventListener('pointerup', function () { if (grijp >= 0 && !schoof && namen.length) toon(grijp); else if (grijp >= 0) { var g = grijp; vel[g] = [(Math.random() - .5) * 6, 4, 0]; } grijp = -1; cv.classList.remove('pak'); });
  function toon(i) {
    if (!label) return; var k = i % namen.length; licht = i;
    label.querySelector('b').textContent = namen[k]; label.querySelector('a').href = links[k];
    var s = naarScherm(pos[i]), r = cv.getBoundingClientRect();
    label.style.left = Math.max(120, Math.min(r.width - 120, s[0] - r.left)) + 'px'; label.style.top = Math.max(80, s[1] - r.top - 34) + 'px';
    label.hidden = false; clearTimeout(label._t); label._t = setTimeout(function () { label.hidden = true; licht = -1; }, 3600);
    angv[i] = [3, 4, 2];
  }

  var volgendeVal = 5.5, valIndex = -1, valSinds = 0;
  function stap(dt, t) {
    if (kader.classList.contains('hero-visual') && valIndex < 0 && t >= volgendeVal && AANTAL > 1 && document.querySelector('.val-blok').hidden) {
      valIndex = 1 + Math.floor(Math.random() * (AANTAL - 1));
      if (valIndex === grijp) valIndex = (valIndex + 1) % AANTAL;
      valSinds = t;
      var vertrek = naarScherm(pos[valIndex]);
      document.dispatchEvent(new CustomEvent('atelier-blok-valt', {
        detail: { x: vertrek[0], y: vertrek[1], materiaal: kleur[valIndex], schaal: schaal[valIndex] }
      }));
      pos[valIndex][1] = thuis[valIndex][1] + 30;
    }
    for (var i = 0; i < AANTAL; i++) {
      var p = pos[i], v = vel[i];
      if (i === valIndex && i !== grijp) {
        var verlopen = t - valSinds, doel = thuis[i];
        if (verlopen < 1.8) {
          p[1] = doel[1] + 30;
        } else if (p[1] > doel[1] + 15) {
          p[0] = doel[0]; p[1] = doel[1] + 8.8; p[2] = doel[2]; v[1] = -3.2;
        } else if (verlopen < 4.6) {
          v[1] += (doel[1] - p[1]) * 3.6 * dt;
          v[1] *= Math.pow(.05, dt);
          p[1] += v[1] * dt;
        } else { valIndex = -1; volgendeVal = t + 8; }
      } else if (i !== grijp) {
        var h = thuis[i], dx = h[0] + Math.sin(t * .4 + i) * .15 - p[0], dy = h[1] + Math.cos(t * .35 + i * 1.7) * .18 - p[1], dz = h[2] - p[2];
        v[0] += dx * 2.4 * dt; v[1] += dy * 2.4 * dt; v[2] += dz * 2.4 * dt;
        if (muis && grijp < 0) { var mx = p[0] - muis[0], my = p[1] - muis[1], md = Math.hypot(mx, my); if (md < 1.6 && md > .001) { var f = (1.6 - md) * 18 * dt; v[0] += mx / md * f; v[1] += my / md * f; v[2] += f * .3; } }
        for (var j = i + 1; j < AANTAL; j++) {
          var q = pos[j], ex = p[0] - q[0], ey = p[1] - q[1], ez = p[2] - q[2], ed = Math.hypot(ex, ey, ez), min = .95;
          if (ed < min && ed > .0001) { var g = (min - ed) * 14 * dt; ex /= ed; ey /= ed; ez /= ed; v[0] += ex * g; v[1] += ey * g; v[2] += ez * g; if (j !== grijp) { vel[j][0] -= ex * g; vel[j][1] -= ey * g; vel[j][2] -= ez * g; } }
        }
        var damp = Math.pow(.06, dt); for (var k = 0; k < 3; k++) { v[k] *= damp; p[k] += v[k] * dt; }
      }
      var w = angv[i], sn = 1 + Math.min(4, Math.hypot(v[0], v[1]) * .6);
      var hq = [w[0] * dt * .5 * sn, w[1] * dt * .5 * sn, w[2] * dt * .5 * sn], r = rotq[i];
      var nq = [r[3] * hq[0] + r[0] + hq[1] * r[2] - hq[2] * r[1], r[3] * hq[1] + r[1] + hq[2] * r[0] - hq[0] * r[2], r[3] * hq[2] + r[2] + hq[0] * r[1] - hq[1] * r[0], r[3] - hq[0] * r[0] - hq[1] * r[1] - hq[2] * r[2]];
      var ql = Math.hypot(nq[0], nq[1], nq[2], nq[3]); rotq[i] = [nq[0] / ql, nq[1] / ql, nq[2] / ql, nq[3] / ql];
      for (k = 0; k < 3; k++) w[k] += ((k === 1 ? .25 : .12) * (i % 2 ? 1 : -1) - w[k]) * .4 * dt;
    }
  }
  var Of = new Float32Array(0), Qf = new Float32Array(0);
  function teken() {
    if (Of.length !== AANTAL * 3) { Of = new Float32Array(AANTAL * 3); Qf = new Float32Array(AANTAL * 4); }
    for (var i = 0; i < AANTAL; i++) { Of[i * 3] = pos[i][0]; Of[i * 3 + 1] = pos[i][1]; Of[i * 3 + 2] = pos[i][2]; Qf.set(rotq[i], i * 4); }
    gl.bindBuffer(gl.ARRAY_BUFFER, bO); gl.bufferData(gl.ARRAY_BUFFER, Of, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bQ); gl.bufferData(gl.ARRAY_BUFFER, Qf, gl.DYNAMIC_DRAW);
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uM, false, matrix()); gl.uniform3fv(uC, cam);
    inst.drawArraysInstancedANGLE(gl.TRIANGLES, 0, nVert, AANTAL);
    if (!gl.isContextLost() && W > 1 && H > 1) kader.classList.add('scene-klaar');
  }
  var zicht = true, loopt = false, laatst = performance.now(), t0 = laatst;
  function frame(nu) { if (!zicht || document.hidden) { loopt = false; return; } var dt = Math.max(0, Math.min(.04, (nu - laatst) / 1000)); laatst = nu; stap(dt, (nu - t0) / 1000); teken(); requestAnimationFrame(frame); }
  function kick() { if (!loopt && !stil) { loopt = true; laatst = performance.now(); requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { zicht = en[0].isIntersecting; if (zicht) { maat(); kick(); } }).observe(kader);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && zicht) kick(); });
  if (stil) { teken(); cv.addEventListener('pointerup', teken); } else kick();
  window.__zwScene = { pos: pos, naarScherm: naarScherm, aantal: function () { return AANTAL; } };
}
document.querySelectorAll('canvas.scene').forEach(function (cv) { start3D(cv); });
/* Ronde 4c: rustige "future server data world" achter de L-blokken.
   Rijen serverkasten in perspectief naar een verdwijnpunt rechts, kleine lichtjes (lila, soms koraal) die traag knipperen,
   datastromen langs de vloerlijnen, heel ver weg een vage regen van tekens. Achter de kop vrijwel leeg; donkerder naar de randen.
   Beweegt traag mee met muis en scroll. Stil beeld bij reduced motion. */
(function () {
  document.querySelectorAll('canvas.datawereld').forEach(function (cv) {
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var stil = matchMedia('(prefers-reduced-motion: reduce)').matches, kader = cv.closest('.kader');
    var W = 0, H = 0, dpr = 1, mob = false, rekken = [], stromen = [], tekens = [], raf = 0, zicht = true, vorige = 0, muis = [0, 0], doel = [0, 0];
    function rnd(a, b) { return a + Math.random() * (b - a); }
    /* 4d (Volkert, bij een voorbeeldbeeld): een tunnel van data. Deeltjes en korte lichtstrepen komen traag uit een
       verdwijnpunt rechts (achter de L-blokken) naar je toe; ver weg klein en scherp, dichtbij groot en onscherp (bokeh).
       Lila en paars, af en toe koraal. Naar links dooft het uit, zodat de kop vrij blijft. */
    var deeltjes = [], sprites = {};
    function sprite(kleur) {
      if (sprites[kleur]) return sprites[kleur];
      var s = document.createElement('canvas'); s.width = s.height = 64; var c = s.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(' + kleur + ',1)'); g.addColorStop(.35, 'rgba(' + kleur + ',.55)'); g.addColorStop(1, 'rgba(' + kleur + ',0)');
      c.fillStyle = g; c.fillRect(0, 0, 64, 64); return (sprites[kleur] = s);
    }
    function nieuwDeeltje(d, vers) {
      var hoek = Math.random() * 6.283, straal = Math.pow(Math.random(), 1.4) * 1.3 + .12;
      d.x = Math.cos(hoek) * straal * 1.25; d.y = Math.sin(hoek) * straal * .8;
      d.z = vers ? rnd(.85, 1.25) : rnd(.08, 1.25); d.v = rnd(.035, .09);
      var k = Math.random(); d.kl = k < .07 ? '255,110,80' : (k < .55 ? '206,186,255' : '150,112,240');
      d.streep = Math.random() < .38; d.h = rnd(.6, 1); return d;
    }
    function maat() {
      var r = cv.getBoundingClientRect(); if (!r.width || !r.height) return; W = r.width; H = r.height; mob = W < 700; dpr = 1; /* achtergrond: zacht, dus 1x pixels is genoeg */
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      deeltjes = []; for (var i = 0; i < (mob ? 150 : 420); i++) deeltjes.push(nieuwDeeltje({}, false));
    }
    function teken(t) {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      var vx = W * (mob ? .62 : .73) + muis[0] * 22, vy = H * (mob ? .3 : .44) + muis[1] * 12 - Math.min(40, scrollY * .06);
      var schaal = mob ? W * .34 : W * .3;
      /* gloed in het verdwijnpunt */
      var gl = ctx.createRadialGradient(vx, vy, 0, vx, vy, schaal * 1.4); gl.addColorStop(0, 'rgba(150,110,240,.22)'); gl.addColorStop(.4, 'rgba(90,60,160,.08)'); gl.addColorStop(1, 'rgba(90,60,160,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      ctx.lineCap = 'round';
      deeltjes.slice().sort(function (a, b) { return b.z - a.z; }).forEach(function (d) {
        var px = vx + d.x / d.z * schaal, py = vy + d.y / d.z * schaal;
        if (px < -80 || px > W + 80 || py < -80 || py > H + 80) return;
        var dichtbij = Math.max(0, Math.min(1, (1.25 - d.z) / 1.15)), alfa = Math.min(1, .25 + dichtbij * 1.3) * d.h * (mob ? .7 : .95);
        if (d.streep && d.z > .22) {
          var z2 = d.z + .16, qx = vx + d.x / z2 * schaal, qy = vy + d.y / z2 * schaal;
          var g = ctx.createLinearGradient(qx, qy, px, py); g.addColorStop(0, 'rgba(' + d.kl + ',0)'); g.addColorStop(1, 'rgba(' + d.kl + ',' + (alfa * .8) + ')');
          ctx.strokeStyle = g; ctx.lineWidth = Math.max(1, .7 / d.z); ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
        } else {
          var r = d.z < .3 ? (0.3 - d.z) * 110 + 8 : Math.max(1.6, 3.2 / d.z); /* dichtbij: groot en onscherp */
          var a2 = d.z < .3 ? alfa * .3 : alfa;
          ctx.globalAlpha = a2; ctx.drawImage(sprite(d.kl), px - r, py - r, r * 2, r * 2); ctx.globalAlpha = 1;
        }
      });
      /* achter de kop leeg: naar links uitdoven; op de telefoon naar onder */
      ctx.globalCompositeOperation = 'destination-in';
      var m = mob ? ctx.createLinearGradient(0, H, 0, 0) : ctx.createLinearGradient(0, 0, W, 0);
      if (mob) { m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(.45, 'rgba(0,0,0,.25)'); m.addColorStop(.8, 'rgba(0,0,0,1)'); }
      else { m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(.36, 'rgba(0,0,0,.04)'); m.addColorStop(.58, 'rgba(0,0,0,.85)'); m.addColorStop(1, 'rgba(0,0,0,1)'); }
      ctx.fillStyle = m; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    }
    function lus(nu) {
      raf = 0; if (!zicht || document.hidden) return;
      if (vorige && nu - vorige < 30) { raf = requestAnimationFrame(lus); return; } /* hooguit ±30 beelden per seconde: het is een trage achtergrond */
      var dt = Math.min(.1, (nu - vorige) / 1000 || 0); vorige = nu;
      if (dt) deeltjes.forEach(function (d) { d.z -= d.v * dt; if (d.z < .05) nieuwDeeltje(d, true); });
      muis[0] += (doel[0] - muis[0]) * .03; muis[1] += (doel[1] - muis[1]) * .03;
      teken(nu / 1000); raf = requestAnimationFrame(lus);
    }
    function start() { if (stil) { teken(2); return; } if (!raf) raf = requestAnimationFrame(lus); }
    maat(); start();
    new ResizeObserver(function () { maat(); if (stil) teken(2); }).observe(kader);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { zicht = en[0].isIntersecting; if (zicht) { maat(); start(); } }).observe(kader);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    if (kader && !stil) kader.addEventListener('pointermove', function (ev) { var r = kader.getBoundingClientRect(); doel = [(ev.clientX - r.left) / r.width - .5, (ev.clientY - r.top) / r.height - .5]; });
  });
})();
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const local = (nl, en) => document.documentElement.lang === 'en' ? en : nl;
const i18n = $$('[data-en]').map(node => [node, node.textContent, node.dataset.en]);

const services = {
  ...{
  "artikel-seo-geo": [
    "SEO en GEO: wat is het verschil?",
    "SEO and GEO: what is the difference?",
    "SEO helpt mensen je pagina te vinden via een zoekmachine. GEO richt zich op vindbaarheid in antwoorden van generatieve AI. In beide gevallen hebben duidelijke pagina’s, concrete antwoorden en controleerbare informatie meer waarde dan het herhalen van zoekwoorden.\n\nBegin met één klantvraag, zoals wat een webshop voor een merk met twintig producten nodig heeft. Geef het antwoord bovenaan, laat zien waar je advies op gebaseerd is en link naar relevante voorbeelden. Meet zoekverkeer en aanvragen apart van incidentele vermeldingen in AI-antwoorden.",
    "SEO helps people find your pages through search engines. GEO focuses on visibility in generative AI answers. In both cases, clear pages, specific answers and verifiable information are more valuable than repeated keywords.\n\nStart with one customer question, such as what an online store with twenty products needs. Answer it upfront, explain the basis for your advice and link to examples. Track search traffic and enquiries separately from occasional mentions in AI answers."
  ],
  "artikel-social-kosten": [
    "Wat kost socialmedia uitbesteden?",
    "What does social media management cost?",
    "Een contentkalender en een compleet productieproces zijn verschillende opdrachten. Vraag per offerte hoeveel formats en posts inbegrepen zijn, wie beeld maakt, welke kanalen meedoen en wie reacties afhandelt. Dat maakt maandprijzen vergelijkbaar.\n\nStart met één kanaal en twee formats die je kunt volhouden. Spreek een vast moment af voor goedkeuring en vergelijk na de eerste maand hoeveel tijd je bespaart en welke content gesprekken of bezoeken oplevert.",
    "A content calendar and a full production workflow represent different scopes. Ask how many posts and formats are included, who produces assets, which channels are covered and who handles replies. That makes monthly quotes comparable.\n\nStart with one channel and two formats you can sustain. Agree on a regular approval time. After the first month, compare time saved and which posts generated conversations or visits."
  ],
  "artikel-meta-budget": [
    "Hoe bepaal je je Meta-budget?",
    "How do you set a Meta ads budget?",
    "Werk terug vanuit wat een verkoop mag kosten. Trek productkosten, levering en verwachte retourkosten af van je opbrengst en reserveer de marge die je wilt overhouden. Het bedrag dat resteert geeft richting aan je maximale acquisitiekosten.\n\nScheid mediabudget van productie- en beheerkosten. Begin met een afgebakende test met een duidelijke doelgroep en enkele creatieve invalshoeken. Kijk naar marge en verkoopvolume naast klikprijs en omzet.",
    "Work backwards from what you can afford per sale. Subtract product, delivery and expected return costs from revenue and reserve the margin you want to keep. The remaining amount helps guide your acquisition cost ceiling.\n\nSeparate media spend from production and management fees. Start with a defined test, a clear audience and a handful of creative angles. Look at margin and sales volume alongside cost per click and revenue."
  ],
  "artikel-ai-agent": [
    "Welke taak geef je je eerste AI-agent?",
    "What task should your first AI agent handle?",
    "Kies een taak die vaak terugkomt, een vaste invoer heeft en makkelijk te controleren is. Denk aan het samenvatten van klantvragen of het voorbereiden van een weekrapport. Geef de agent alleen toegang tot de bronnen die daarvoor nodig zijn.\n\nLaat de agent eerst concepten maken. Spreek af welke uitzonderingen altijd teruggaan naar een medewerker. Vergelijk na een proefperiode voorbereidingstijd, correcties en hoeveel gevallen iemand alsnog zelf moest afhandelen.",
    "Choose a task that recurs, has predictable input and is easy to review. Examples include summarising support enquiries or drafting a weekly report. Give the agent access only to the sources it needs.\n\nStart with drafts. Define the exceptions that always go back to a person. After a trial, compare preparation time, corrections and the number of cases someone still had to handle manually."
  ],
  "artikel-chatbot-kosten": [
    "Wat kost een AI-chatbot voor je site?",
    "What does an AI chatbot cost?",
    "De prijs hangt af van wat de chatbot moet kunnen. Antwoorden geven op vaste vragen vraagt andere inrichting dan orderstatus ophalen, meerdere talen ondersteunen of doorverbinden naar een helpdesk. Kijk daarom naar inrichting, gebruik en onderhoud.\n\nBegin met de tien vragen waarvoor klanten het vaakst contact zoeken. Meet hoeveel gesprekken de chatbot afhandelt, hoe vaak hij doorverwijst en of zijn antwoorden kloppen. Breid pas uit als je die antwoorden kunt onderhouden.",
    "Cost depends on what the chatbot needs to do. Answering fixed questions involves different setup from retrieving orders, supporting multiple languages or handing off to a helpdesk. Compare setup, usage and maintenance.\n\nBegin with the ten questions that bring customers to support most often. Measure resolutions, handoffs and answer accuracy. Expand when you can keep the underlying answers current."
  ],
  "artikel-website-onderhoud": [
    "Wat zit er in websiteonderhoud?",
    "What does website maintenance include?",
    "Vraag welke onderdelen de onderhoudsafspraak dekt. Denk aan beveiligingsupdates, back-ups, beschikbaarheid en het oplossen van storingen. Kleine inhoudswijzigingen, nieuwe functies en licenties kunnen apart zijn geprijsd.\n\nLeg vast wie een storing meldt, wat de reactietijden zijn en hoe je een back-up kunt herstellen. Een onderhoudsoverzicht helpt je zien wat is gedaan en wat nog op de planning staat.",
    "Ask what the maintenance agreement covers. Consider security updates, backups, uptime and incident response. Small content changes, new features and licences may be priced separately.\n\nAgree who reports an incident, what response times apply and how a backup can be restored. A maintenance log helps you see what has been done and what is scheduled."
  ],
  "artikel-webshop-conversie": [
    "Wat is een goede webshopconversie?",
    "What is a good conversion rate?",
    "Een gemiddelde uit de markt vertelt weinig zonder context. Verkeer uit een merkzoekopdracht koopt vaak anders dan bezoekers uit een eerste advertentie. Vergelijk daarom op kanaal, apparaat en nieuwe versus terugkerende klanten.\n\nKijk waar het verschil ontstaat. Wordt een product weinig aan de winkelwagen toegevoegd, controleer dan de productpagina. Haken bezoekers vooral af bij afrekenen, onderzoek dan verzendkosten, betaalopties en foutmeldingen.",
    "A market average tells you little without context. People who search for your brand may buy differently from visitors seeing your first ad. Compare by channel, device and new versus returning customers.\n\nFind where the difference begins. If few people add a product to their cart, review the product page. If people mainly drop out at checkout, inspect shipping charges, payment options and errors."
  ],
  "artikel-checkout": [
    "Waar haken klanten af bij het afrekenen?",
    "Where do shoppers abandon checkout?",
    "Doorloop je eigen checkout op een telefoon. Controleer wanneer bezorgkosten zichtbaar worden, of je als gast kunt afrekenen en of betaalopties duidelijk zijn. Test ook wat iemand ziet na een mislukte betaling.\n\nBreng vervolgens de stappen van winkelwagen tot betaling in kaart. Kies één zichtbaar knelpunt en meet wat er verandert na de aanpassing. Neem omzet per bezoek en het aantal mislukte betalingen mee.",
    "Go through your own checkout on a phone. Check when shipping fees appear, whether guest checkout is possible and whether payment options are clear. Test what shoppers see after a failed payment.\n\nThen map the steps from cart to payment. Pick one visible problem and measure what changes after the fix. Include revenue per visit and the number of failed payments."
  ],
  "artikel-nieuwe-markt": [
    "Wanneer ben je klaar voor een nieuw land?",
    "When are you ready to enter a new market?",
    "Begin met een klein assortiment en maak een berekening per land. Neem vertaling, verzending, retouren en klantenservice mee. Test of lokale klanten de betaalmethoden herkennen en of je productpagina antwoord geeft op hun belangrijkste vragen.\n\nMaak vooraf duidelijk wanneer de test geslaagd is. Gebruik bijvoorbeeld marge per bestelling, levertijd, retouren en terugkerende klantvragen. Die informatie helpt beslissen welke producten je als volgende toevoegt.",
    "Start with a small range and model costs by market. Include localisation, shipping, returns and support. Check that local customers recognise the payment options and that product pages answer their main questions.\n\nDefine success before testing. Useful measures include margin per order, delivery time, returns and recurring support questions. This helps you decide which products to add next."
  ]
},
  agent: ["AI-agents", "AI agents", "Kies één bestaande agent vanaf € 250 of het Commerce 360-team van 14 agents vanaf € 1.499. Maatwerk, implementatie en training begroten we apart. Bedragen zijn exclusief btw.", "Choose one existing agent from €250 or the 14-agent Commerce 360 team from €1,499. Custom work, implementation and training are quoted separately. Prices exclude VAT."],
  social: ["Socialmedia", "Social media", "We brengen contentplanning, beeld, goedkeuring en publicatie samen. Zo kun je consistent posten en kwaliteit blijven bewaken.", "We bring planning, creative, approvals and publishing together so you can post consistently and oversee quality."],
  ads: ["Social advertising", "Social advertising", "Vanaf € 399 exclusief btw richten we Meta óf TikTok in, koppelen en testen we de pixel, leggen we de strategie uit en starten we één campagne. Advertentiebudget en extra creatives komen daar apart bij.", "From €399 excluding VAT, we set up Meta or TikTok, connect and test the pixel, explain the strategy and launch one campaign. Ad spend and additional creative cost extra."],

  website: ['Website','Website','Een website begint bij de klantvraag. We maken eerst een ontwerp met een duidelijke route naar contact of een aanvraag. Daarna bouwen en testen we de site op mobiel en desktop.','A website starts with the customer’s question. We design a clear path to an enquiry, then build and test it on mobile and desktop.'],
  webshop: ['Webshop','Online store','Van navigatie en productpagina’s tot betalen en bevestigen. De eerste versie richt zich op wat klanten nodig hebben om met vertrouwen te bestellen.','From navigation and product pages to payment and confirmation. The first version focuses on what customers need to order with confidence.'],
  vindbaar: ['Vindbaarheid','Visibility', "Vanaf € 1.250 exclusief btw verzorgen we een nulmeting, Search Console, een indexerings- en sitemapcheck en verbeteringen aan vijf pagina’s. Na 30 dagen bespreken we de cijfers.", "From €1,250 excluding VAT, we cover a baseline, Search Console, indexing and sitemap checks and improvements to five pages. We review the figures after 30 days."],
  'artikel-website': ['Wat kost een website?','What does a website cost?','Vergelijk offertes op ontwerp, bouw, content en onderhoud. Een compacte dienstensite met één taal vraagt minder werk dan een site met twee talen, eigen fotografie en een boekingskoppeling. Vraag wat je zelf moet aanleveren, wie na oplevering wijzigingen doet en welke kosten terugkomen.','Compare quotes across design, build, content and maintenance. A single-language service site takes less work than a bilingual site with original photography and a booking integration. Ask what you must supply, who handles changes and which costs recur.'],
  'artikel-webshop': ['Wat kost een webshop per maand?','How much does an online store cost per month?','Zet de vaste kosten van platform, domein, apps en onderhoud naast de variabele kosten per bestelling. Denk aan betaalfees, fulfilment, retouren en advertenties. Reken beide door bij een rustige en een drukke maand. Zo zie je wat een extra bestelling bijdraagt, ook als je omzet groeit.','List fixed platform, domain, app and maintenance costs alongside payment, fulfilment, returns and advertising costs per order. Model a slow month and a busy one to see what each extra order contributes as sales grow.'],
  'artikel-ai': ['Hoe word je vindbaar in AI-antwoorden?','How can your business show up in AI answers?','Begin met toegankelijke pagina’s over je diensten en de vragen van klanten. Geef concrete antwoorden, laat zien wie erachter zit en verwijs naar voorbeelden die een lezer kan controleren. Houd de inhoud actueel en meet welke landingspagina’s bezoeken, aanvragen of verwijzingen opleveren.','Begin with accessible service pages and useful answers to customer questions. Show who is behind the content and link to examples readers can verify. Keep it current and track which landing pages generate visits, enquiries or referrals.']
};

const portfolioAlt = {"ElleCera": [["De Black Friday-pagina van ElleCera met verzorgingsproducten en actieprijzen.", "ElleCera’s Black Friday page with skincare products and sale prices."], ["De actiepagina van ElleCera met uitgelichte huidverzorging.", "ElleCera’s offers page featuring skincare products."], ["De mobiele ElleCera-winkel met Black Friday-aanbiedingen en productkaarten.", "The mobile ElleCera store with Black Friday offers and product cards."]], "Scillasdotter": [["De homepage van Scillasdotter met een zwart-witportret en de naam Alexandra Scillasdotter.", "The Scillasdotter homepage with a black-and-white portrait and the name Alexandra Scillasdotter."], ["Een zwart-witportret vult de openingspagina van Scillasdotter.", "A black-and-white portrait fills the Scillasdotter landing page."], ["De mobiele Scillasdotter-site met een rood campagnebeeld boven zwart-witfotografie.", "The mobile Scillasdotter site with a red campaign image above black-and-white photography."]], "Doggy & Cats": [["De Doggy & Cats-homepage met een hond in een mand naast de collectielink.", "The Doggy & Cats homepage features a dog in a bed beside the collection link."], ["De collectiepagina ‘Alle producten’ van Doggy & Cats.", "The Doggy & Cats collection page showing all products."], ["De Duitse Doggy & Cats-winkel met een collectieknop onder de openingsfoto.", "The German Doggy & Cats mobile store with a collection button beneath the cover image."]], "The Focus Club": [["De homepage van The Focus Club met een foto van een gezin en een knop naar het assortiment.", "The Focus Club homepage with a family photo and a link to the range."], ["De productcollectie van The Focus Club met drie productkaarten naast elkaar.", "The Focus Club collection shows three product cards side by side."], ["De mobiele homepage van The Focus Club met een familiefoto boven de introductie.", "The Focus Club mobile homepage with a family photo above the introduction."]]};
const cases = [
  {name:'ElleCera', domain:'ellecera.nl', tag:'Skincare · Shopify', home:'/assets/atelier/697d26062cc8e4658991.webp', video:'/assets/atelier/09059a00375ba0a49ab6.mp4', detail:'/assets/atelier/e08b4f644018ce2c711c.webp', phone:'/assets/atelier/202e97017bfac0073f23.webp'},
  {name:'Scillasdotter', domain:'scillasdotter.com', tag:'Fashion · Design', home:'/assets/atelier/ea25aaee020550f35833.webp', video:'/assets/atelier/a28bdecf6bc8609d4f90.mp4', detail:'/assets/atelier/d099480a1bc6ed575cbc.webp', phone:'/assets/atelier/a44ce816647b89fbd2e4.webp'},
  {name:'Doggy & Cats', domain:'doggyandcats.nl', tag:'Pets · E-commerce', home:'/assets/atelier/ec106d97792c630c1df0.webp', detail:'/assets/atelier/accc958ff72667ea90e4.jpg', phone:'/assets/atelier/56f632678d4fd23bc377.webp'},
  {name:'The Focus Club', domain:'thefocusclub.shop', tag:'Wellness · E-commerce', home:'/assets/atelier/387ece24f3ca01093bd1.webp', detail:'/assets/atelier/80a50313c0b8dee9d2bf.webp', phone:'/assets/atelier/e5718399493232553515.webp'}
];

const elleceraSitekop = '/assets/atelier/18736a09c09101596e06.jpg';
const elleceraPoster = '/assets/atelier/2003da648b5414f4a4a2.jpg';
const elleceraActie = '/assets/atelier/dad667f75b3e4a0f8454.jpg';
let elleceraDia = 'video';

function elleceraHomepage(item) {
  const kader = document.createElement('div');
  kader.className = 'ellecera-preview';
  const bewegend = elleceraDia === 'video';
  if (bewegend) {
    const sitekop = document.createElement('img');
    sitekop.className = 'ellecera-preview-kop';
    sitekop.src = elleceraSitekop;
    sitekop.alt = '';

    const beeld = document.createElement('div');
    beeld.className = 'ellecera-preview-hero';
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = elleceraPoster;
    video.dataset.source = item.video;
    video.setAttribute('aria-label', local('Originele ElleCera-video', 'Original ElleCera video'));
    beeld.append(video);

    const tekst = document.createElement('div');
    tekst.className = 'ellecera-preview-copy';
    tekst.innerHTML = '<p class="ellecera-preview-titel">Restore your skin’s <em>rhythm.</em></p><p class="ellecera-preview-ondertitel">Verzorging die je huid ondersteunt in plaats van corrigeert.</p><span class="ellecera-preview-label">Ontdek onze Black Friday deals</span>';
    beeld.append(tekst);
    video.addEventListener('playing', () => beeld.classList.add('speelt'));
    tekst.innerHTML += '<p class="ellecera-vertrouwen">Excellent 4.8 | 30,000+ Customers <span>★★★★★</span></p>';
    voegVideoknopToe(beeld, video);
    video.addEventListener('error', () => {
      const foto = document.createElement('img');
      foto.alt = '';
      foto.src = elleceraPoster;
      beeld.classList.remove('speelt');
      video.replaceWith(foto);
    }, {once:true});
    kader.append(sitekop, beeld);
  } else {
    kader.classList.add('ellecera-preview-actie');
    const foto = document.createElement('img');
    foto.className = 'ellecera-preview-stil';
    foto.src = elleceraActie;
    foto.alt = 'ElleCera – Black Friday Sale';
    kader.append(foto);
  }

  const kies = document.createElement('div');
  kies.className = 'ellecera-dia-keuze';
  kies.setAttribute('role', 'group');
  kies.setAttribute('aria-label', local('ElleCera homepage slides', 'ElleCera home page slides'));
  [['actie', 'Black Friday'], ['video', local('Video', 'Video')]].forEach(([dia, naam]) => {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.setAttribute('aria-label', naam);
    knop.setAttribute('aria-pressed', String(elleceraDia === dia));
    knop.dataset.elleceraDia = dia;
    knop.addEventListener('click', () => {
      if (elleceraDia === dia) return;
      elleceraDia = dia;
      toonCase();
      const scherm = $('#case-screen');
      scherm.querySelector(`[data-ellecera-dia="${dia}"]`)?.focus({preventScroll:true});
      const video = scherm.querySelector('video');
      if (dia === 'video' && video) {
        if (!video.getAttribute('src')) video.src = video.dataset.source;
        video.play().catch(() => {});
      }
    });
    const streep = document.createElement('span');
    streep.setAttribute('aria-hidden', 'true');
    knop.append(streep);
    kies.append(knop);
  });
  kader.append(kies);
  return kader;
}

let activeCase = 0;
let caseView = 'home';
let caseVisible = false;
function videostand() {
  const video = $('#case-screen video');
  if (!video) return;
  if (caseVisible && !document.hidden && !motion.matches && !navigator.connection?.saveData && (innerWidth > 700 || video.dataset.handmatig === 'speel')) {
    if (!video.getAttribute('src') && video.dataset.source) video.src = video.dataset.source;
    if (video.dataset.handmatig !== 'pauze') video.play().catch(() => {});
  }
  else video.pause();
}
let caseBenaderd = false;
function toonCase() {
  if (!caseBenaderd) return;
  const item = cases[activeCase];
  const screen = $('#case-screen');
  const lamp = $('#case-link');
  const home = caseView === 'home';
  $('#case-name').textContent = local(...[['Skincaremerk','Skincare brand'],['Coutureatelier','Couture atelier'],['Dierenwebshop','Pet store'],['Focus & welzijn','Focus & wellness']][activeCase]);
  $('#case-tag').textContent = item.name + ' · ' + item.domain;
  $('#case-bijdrage').replaceChildren(...caseInhoud[activeCase].gedaan.map(taak => {
    const li = document.createElement('li');
    const kop = document.createElement('strong');
    kop.textContent = local(...taak.slice(0,2));
    const tekst = document.createElement('span');
    tekst.textContent = local(...taak.slice(2));
    li.append(kop, tekst);
    return li;
  }));
  lamp.href = 'https://' + item.domain + '/';
  $('#case-phone').src = item.phone;
  const phone = $('#case-phone');
  [phone.dataset.altNl, phone.dataset.altEn] = portfolioAlt[item.name][2];
  phone.alt = local(phone.dataset.altNl, phone.dataset.altEn);
  const video = activeCase !== 0 && home && item.video && !motion.matches;
  const media = document.createElement(video ? 'video' : 'img');
  media.className = 'case-layer';
  if (video) {
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    media.preload = 'none';
    media.poster = item.home;
    media.dataset.source = item.video;
    media.setAttribute('aria-label', item.name + local(' homepage in beweging', ' animated homepage'));
  } else {
    media.src = home ? item.home : item.detail;
    media.alt = local(...portfolioAlt[item.name][home ? 0 : 1]);
  }
  screen.querySelector('video')?.pause();
  const ellecera = activeCase === 0 && home;
  screen.replaceChildren(ellecera ? elleceraHomepage(item) : media);
  if (!ellecera && video) voegVideoknopToe(screen, media);
  screen.classList.toggle('pan', home && !item.video && caseVisible);
  $$('[data-case]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.case) === activeCase));
  videostand();
}
new IntersectionObserver(([entry], observer) => {
  if (!entry.isIntersecting) return;
  caseBenaderd = true;
  toonCase();
  observer.disconnect();
}, {rootMargin:'180px 0px'}).observe($('.case-card'));
$$('[data-case]').forEach(b => b.addEventListener('click', () => { activeCase = Number(b.dataset.case); caseView = 'home'; toonCase(); }));
new IntersectionObserver(([entry]) => {
  caseVisible = entry.isIntersecting;
  $('#case-screen').classList.toggle('pan', caseVisible && caseView === 'home' && !cases[activeCase].video);
  videostand();
}, {threshold:.2}).observe($('.case-card'));

function menu(open) {
  $('#menu').setAttribute('aria-expanded', open);
  $('#mega').hidden = !open;
  $('#mega-trigger').setAttribute('aria-expanded',open);
  $('#menu-scrim').hidden = !open;
}
$('#menu').addEventListener('click', () => menu($('#mega').hidden));
$('#mega').addEventListener('click', event => { if (event.target.closest('a')) menu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#mega').hidden) { menu(false); $('#menu').focus(); }
});
document.addEventListener('pointerdown', event => { if (!event.target.closest('header')) menu(false); });

$('#stopband').addEventListener('click', event => {
  const paused = $('.reel').classList.toggle('is-paused');
  event.currentTarget.setAttribute('aria-pressed', paused);
  bandLabel();
});
function bandLabel() {
  const paused = $('.reel').classList.contains('is-paused');
  $('#stopband').textContent = paused ? '▶' : 'Ⅱ';
  $('#stopband').setAttribute('aria-label', paused ? local('Logobalk afspelen','Play logo reel') : local('Logobalk pauzeren','Pause logo reel'));
}


document.addEventListener('visibilitychange', videostand);
motion.addEventListener('change', () => { toonCase(); tekenTitels(); heroKop(false); });

const koppen = $$('[data-reveal]');
function woorden() {
  koppen.forEach(kop => {
    const regels = local(kop.dataset.nl, kop.dataset.enTitle).split('|');
    kop.replaceChildren();
    regels.forEach((regel,index) => {
      if (index) kop.append(' ');
      const groep = document.createElement(index ? 'em' : 'span');
      regel.split(' ').forEach((woord,i) => {
        if (i) groep.append(' ');
        const vak = document.createElement('span');
        vak.dataset.word = '';
        vak.textContent = woord;
        groep.append(vak);
      });
      kop.append(groep);
    });
    kop.classList.add('reveal');
  });
  tekenTitels();
}


const stock = new IntersectionObserver((entries, observer) => {
  entries.filter(e => e.isIntersecting).forEach(({target}) => {
    observer.unobserve(target);
    const foto = new Image();
    const id = target.dataset.stock;
    foto.onload = () => { target.src = foto.src; };
    foto.src = 'https://images.pexels.com/photos/' + id + '/pexels-photo-' + id + '.jpeg?auto=compress&cs=tinysrgb&w=800';
  });
}, {rootMargin:'180px'});
$$('[data-stock]').forEach(beeld => stock.observe(beeld));

const dialog = $('#dialog');
document.addEventListener('click', event => {
  const button = event.target.closest('[data-open]');
  if (!button) return;
  const key = button.dataset.open;
  const item = services[key];
  $('#dialog-title').textContent = local(item[0], item[1]);
  const alineas = local(item[2], item[3]).split('\n\n').map(tekst => {
    const alinea = document.createElement('p');
    alinea.textContent = tekst;
    return alinea;
  });
  $('#dialog-copy').replaceChildren(...alineas);
  $('#dialog-contact').hidden = key.startsWith('artikel');
  dialog.showModal();
});
$('#dialog-contact').addEventListener('click', () => dialog.close());
function adviseer() {
  const key = $('#advies').value;
  const item = services[key];
  $('#advies-title').textContent = local(item[0], item[1]);
  $('#advies-text').textContent = local(item[2], item[3]);
  $('#advies-link').href = {"website": "/pakketten/website/", "webshop": "/pakketten/webshop/", "agent": "/pakketten/ai-agents/", "social": "/pakketten/socialmedia/", "ads": "/pakketten/social-advertising/", "vindbaar": "/pakketten/vindbaarheid/", "conversie": "/pakketten/conversie-optimalisatie/", "onderhoud": "/pakketten/onderhoud-uitbreiding/"}[key] || '/pakketten/';
}
$('#advies').addEventListener('change', adviseer);

function vertaal() {
  document.documentElement.lang = $('#taal').value;
  i18n.forEach(([node,nl,en]) => node.textContent = local(nl,en));
  woorden();
  if (huidigePagina) document.title = local(...routes[huidigePagina].slice(0,2)) + ' | WebshopAtelier';
  vertaalPijlen();
  bandLabel();
  vertaalChat();
  tekenPakketkeuze();
  heroKop(true);
  toonCase();
  adviseer();
}
$('#taal').addEventListener('change', vertaal);
const hoofdtitel = $('#hoofdkop');
let titelStart = 0;
let titelVersie = 0;
let heroVerlaten = false;

function heroKop(animate) {
  if (!hoofdtitel) return;
  const begin = local(['Ik bouw','de toekomst.'], ['I build','the future.']);
  const regels = local(['Samen','bouwen','wij de','toekomst.'], ['Together,','we build','the','future.']);
  hoofdtitel.setAttribute('aria-label', regels.join(' '));
  hoofdtitel.querySelectorAll('.title-before span').forEach((el,i) => el.textContent = begin[i]);
  hoofdtitel.querySelectorAll('.title-after .write span, .title-after em span').forEach((el,i) => el.textContent = regels[i]);
  hoofdtitel.classList.remove('is-live','titel-snel');
  const versie = ++titelVersie;
  titelStart = 0;
  if (animate && !motion.matches && hoofdtitel.getClientRects().length) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (versie !== titelVersie) return;
      hoofdtitel.classList.add('is-live');
      titelStart = performance.now();
      if (scrollY > 12 && window.scrollY < hoofdtitel.offsetHeight) hoofdtitel.classList.add('titel-snel');
    }));
  }
}


let vorigeScroll = window.scrollY;
addEventListener('scroll', () => {
  const positie = window.scrollY;
  if (positie > vorigeScroll && positie > 12 && titelStart && performance.now() - titelStart < 1100) {
    hoofdtitel.classList.add('titel-snel');
  }
  vorigeScroll = positie;
}, {passive:true});

if (hoofdtitel) new IntersectionObserver(([item]) => {
  if (!item.isIntersecting) {
    heroVerlaten = true;
  } else if (heroVerlaten) {
    heroVerlaten = false;
    heroKop(true);
  }
}, {threshold:.22}).observe(hoofdtitel);


const chatVraag = $('#chat-vraag');
const chatSturen = $('#chat-sturen');
function chatReply(key) {
  const item = services[key];
  return key === 'website' ? local('Een website bij WebshopAtelier begint bij € 999 eenmalig. Het aantal pagina’s en de gewenste functies bepalen je offerte.', 'A website from WebshopAtelier starts at a one-off €999. Your quote depends on the pages and features you need.') : item ? local(item[2],item[3]) : local('Stel je vraag in een korte call. Dan denken we gericht mee.', 'Bring your question to a short call and we’ll think it through together.');
}
function vertaalChat() {
  for (const answer of $('#chat-copy').querySelectorAll('[data-reply]')) {
    answer.textContent = chatReply(answer.dataset.reply);
  }
  for (const question of $('#chat-copy').querySelectorAll('[data-preset]')) {
    question.textContent = document.querySelector('[data-question="' + question.dataset.preset + '"]').textContent;
  }
  chatVraag.placeholder = local('Stel je vraag…', 'Type your question…');
  $('#chat-launch').setAttribute('aria-label', local('Open Atelier-assistent', 'Open Atelier assistant'));
  $('#chat-close').setAttribute('aria-label', local('Chat sluiten', 'Close chat'));
  $('#chat-sturen').setAttribute('aria-label', local('Vraag versturen', 'Send question'));
  chatVraag.setAttribute('aria-label', local('Je vraag', 'Your question'));
  $('#chat-panel').closest('aside').setAttribute('aria-label', local('Atelier-assistent', 'Atelier assistant'));
}
const chatTopicsToggle = $('#chat-topics-toggle');
chatTopicsToggle?.addEventListener('click', () => {
  const open = $('#chat-panel').classList.toggle('show-chat-topics');
  chatTopicsToggle.setAttribute('aria-expanded', String(open));
  if (open) $('#chat-panel [data-question]').focus({preventScroll:true});
  const scroll = $('#chat-scroll');
  scroll.scrollTop = scroll.scrollHeight;
});
function chatAnswer(key, vraag, preset = false) {
  $('#chat-panel').classList.remove('show-chat-topics');
  chatTopicsToggle?.setAttribute('aria-expanded', 'false');
  const item = services[key];
  const gesteld = document.createElement('p');
  gesteld.className = 'chat-bericht-vraag';
  gesteld.textContent = vraag;
  if (preset) gesteld.dataset.preset = key;
  const antwoord = document.createElement('p');
  antwoord.className = 'chat-bericht-antwoord';
  antwoord.dataset.reply = key || '';
  antwoord.textContent = chatReply(key);
  $('#chat-copy').append(gesteld, antwoord);
  const gesprekken = $('#chat-scroll');
  gesprekken.scrollTop = gesprekken.scrollHeight;
}
$$('[data-question]').forEach(knop => knop.addEventListener('click', () => chatAnswer(knop.dataset.question, knop.textContent, true)));
chatVraag.addEventListener('input', () => { chatSturen.disabled = !chatVraag.value.trim(); });
$('#chat-form').addEventListener('submit', gebeurtenis => {
  gebeurtenis.preventDefault();
  const vraag = chatVraag.value.trim();
  if (!vraag) return;
  const woorden = vraag.toLowerCase();
  const onderwerpen = [[/seo|geo|google|vindbaar|search/,'vindbaar'],[/agent|automati|chatbot/,'agent'],[/adverten|ads|campagn|campaign|pixel/,'ads'],[/social|instagram|tiktok/,'social'],[/webshop|store|shopify/,'webshop'],[/site|website/,'website']];
  chatAnswer(onderwerpen.find(([patroon]) => patroon.test(woorden))?.[1], vraag);
  chatVraag.value = '';
  chatSturen.disabled = true;
  chatVraag.focus();
});
function setChat(open) {
  $('#chat-launch').setAttribute('aria-expanded',open);
  $('#chat-panel').hidden = !open;
  if (open) {
    $('#chat-launch i').hidden = true;
    $('#chat-close').focus({preventScroll:true});
  }
}
$('#chat-launch').addEventListener('click', () => setChat($('#chat-panel').hidden));
$('#chat-close').addEventListener('click', () => { setChat(false); $('#chat-launch').focus(); });
$('#chat-book').addEventListener('click', () => setChat(false));
$('.chat-pakket-link').addEventListener('click', () => setChat(false));
$('#chat-panel').addEventListener('keydown', e => {
  if (e.key === 'Escape') { setChat(false); $('#chat-launch').focus(); }
});
const proces = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  });
}, {threshold:.3});
$$('.process-card').forEach(card => proces.observe(card));

const trigger = $('#mega-trigger');
const paneel = $('#mega');
const scrim = $('#menu-scrim');
let menuTimer;
let menuViaAanwijzer = false;
trigger.addEventListener('click', () => {
  clearTimeout(menuTimer);
  if (menuViaAanwijzer && !paneel.hidden) {
    menuViaAanwijzer = false;
    return;
  }
  menuViaAanwijzer = false;
  menu(paneel.hidden);
});
scrim.addEventListener('click', () => menu(false));
const aanwijzer = matchMedia('(any-hover: hover) and (min-width: 850px)');
trigger.addEventListener('pointerenter', () => {
  if (!aanwijzer.matches) return;
  clearTimeout(menuTimer);
  menuTimer = setTimeout(() => {
    if (paneel.hidden) { menuViaAanwijzer = true; menu(true); }
  }, 160);
});
trigger.addEventListener('pointerleave', () => {
  clearTimeout(menuTimer);
  if (menuViaAanwijzer) menuTimer = setTimeout(() => { menuViaAanwijzer = false; menu(false); }, 300);
});
paneel.addEventListener('pointerenter', () => clearTimeout(menuTimer));
paneel.addEventListener('pointerleave', () => {
  if (menuViaAanwijzer) menuTimer = setTimeout(() => { menuViaAanwijzer = false; menu(false); }, 300);
});
paneel.addEventListener('focusin', () => { clearTimeout(menuTimer); menuViaAanwijzer = false; });
trigger.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    menu(true);
    paneel.querySelector('a').focus();
  }
});
$('#newsletter').addEventListener('submit', event => {
  event.preventDefault();
  const mail = new FormData(event.currentTarget).get('email');
  location.href = 'mailto:hello@webshopatelier.nl?subject=' + encodeURIComponent(local('Atelier-updates','Studio updates')) + '&body=' + encodeURIComponent(local('Ik ontvang graag updates op ', 'Please send updates to ') + mail);
  $('#news-status').textContent = local('Verstuur het bericht vanuit je mailprogramma om je aan te melden.', 'Send the message from your mail app to sign up.');
});

function voegVideoknopToe(kader, video) {
  const knop = document.createElement('button');
  knop.className = 'case-video-toggle';
  knop.type = 'button';
  const label = () => knop.textContent = video.paused ? local('Speel video','Play video') : local('Pauzeer video','Pause video');
  video.addEventListener('play',label);
  video.addEventListener('pause',label);
  video.addEventListener('error',() => knop.remove(),{once:true});
  knop.addEventListener('click',() => {
    if (video.paused) {
      video.dataset.handmatig = 'speel';
      if (!video.getAttribute('src') && video.dataset.source) video.src = video.dataset.source;
      video.play().catch(label);
    } else {
      video.dataset.handmatig = 'pauze';
      video.pause();
    }
  });
  label();
  kader.append(knop);
}

const caseInhoud = [
  {
    "gedaan": [
      [
        "Shopify & thema",
        "Shopify & theme",
        "Eigen thema-onderdelen voor de homepage en productpagina’s, waaronder de videobanner.",
        "Custom theme components for the homepage and product pages, including the video hero."
      ],
      [
        "Meertalige webshops",
        "Multilingual stores",
        "Winkels en productpagina’s per taal, met een herkenbare ElleCera-uitstraling.",
        "Storefronts and product pages by language, with consistent ElleCera branding."
      ],
      [
        "Productpresentatie",
        "Product presentation",
        "Productfotografie en video gecombineerd met bundels en actiepagina’s.",
        "Product photography and video combined with bundles and campaign pages."
      ],
      [
        "Campagnes & e-mail",
        "Campaigns & email",
        "Campagnes voor Meta en TikTok en automatische e-mails ingericht.",
        "Set up campaigns for Meta and TikTok and automated email flows."
      ]
    ]
  },
  {
    "gedaan": [
      [
        "Digitale portfolio",
        "Online portfolio",
        "Een website waarin de ontwerpen en het beeld van het atelier de hoofdrol spelen.",
        "A site centred on the atelier’s designs and photography."
      ],
      [
        "Meertalige site",
        "Multilingual site",
        "De portfolio en aanvraagroute beschikbaar gemaakt in meerdere talen.",
        "Made the portfolio and enquiry journey available in multiple languages."
      ],
      [
        "Afspraak aanvragen",
        "Appointment enquiries",
        "Een eigen aanvraagpagina en een persoonlijk e-mailadres voor direct contact.",
        "A dedicated enquiry page and a business email address for direct contact."
      ],
      [
        "Technische vindbaarheid",
        "Technical search visibility",
        "SEO en gestructureerde gegevens toegevoegd aan de site.",
        "Added SEO and structured data to the site."
      ]
    ]
  },
  {
    "gedaan": [
      [
        "Training & goedkeuring",
        "Training & approval",
        "AI-training en afspraken gemaakt over welke taken het team eerst controleert.",
        "AI training and approval rules for tasks the team checks before they go live."
      ],
      [
        "Klantenservice",
        "Customer support",
        "Een agent die antwoorden op klantvragen voorbereidt voor het team.",
        "An agent that prepares answers to customer enquiries for the team."
      ],
      [
        "Productcontent & advertenties",
        "Product content & ads",
        "Agents die productpagina’s en advertentie-ideeën helpen voorbereiden.",
        "Agents that help prepare product pages and advertising concepts."
      ],
      [
        "Dagelijkse cijfers",
        "Daily reporting",
        "Een dagelijks overzicht ingericht om de cijfers op één plek te bekijken.",
        "Set up a daily overview so the team can review the numbers in one place."
      ]
    ]
  },
  {
    "gedaan": [
      [
        "Concurrentieonderzoek",
        "Competitor research",
        "Bekeken hoe andere merken producten voor focus en rust onder de aandacht brengen.",
        "Reviewed how other brands promote products for focus and calm."
      ],
      [
        "Invalshoeken",
        "Creative concepts",
        "De onderzoeksresultaten vertaald naar verschillende advertentie-ideeën.",
        "Turned the research into distinct advertising concepts."
      ],
      [
        "Beeld & video",
        "Images & video",
        "Statische advertenties en video’s gemaakt om verschillende formats te testen.",
        "Created static ads and videos for testing different formats."
      ],
      [
        "Testen & opschalen",
        "Testing & scaling",
        "Campagnes ingericht, varianten getest en de best presterende advertenties opgeschaald.",
        "Set up campaigns, tested variants and scaled the best-performing ads."
      ]
    ]
  }
];

const blogKaarten = $$('[data-blogkaart]');
const blogMeer = $('#blogs-meer');
function stelBlogsIn() {
  const archief = huidigePagina === 'inzichten';
  $('#veldgids').classList.toggle('blogarchief', archief);
  blogKaarten.forEach((kaart,index) => kaart.hidden = index >= (archief ? 9 : 4));
  blogMeer.hidden = false;
  $('#blogs-status').textContent = '';
}
blogMeer.addEventListener('click', () => {
  const volgend = blogKaarten.filter(kaart => kaart.hidden).slice(0,huidigePagina === 'inzichten' ? 9 : 4);
  volgend.forEach(kaart => { kaart.hidden = false; });
  const zichtbaar = blogKaarten.filter(kaart => !kaart.hidden).length;
  $('#blogs-status').textContent = local(zichtbaar + ' van ' + blogKaarten.length + ' artikelen', zichtbaar + ' of ' + blogKaarten.length + ' articles');
  volgend[0]?.querySelector('button')?.focus({preventScroll:true});
  volgend[0]?.scrollIntoView({block:'nearest',behavior:motion.matches?'instant':'smooth'});
  blogMeer.hidden = zichtbaar === blogKaarten.length;
});

const routes = {
  werk:['Ons werk','work','werk','keuze','ontzorg','pakket-suggesties','boeken'],
  pakketten:['Onze pakketten','services','pakketten','keuze','ontzorg','boeken'],
  'over-ons':['Over ons','About us','atelier','tools','ontzorg','pakket-suggesties','boeken'],
  inzichten:['Tips en inzichten','Tips and insights','veldgids','pakket-suggesties'],
  contact:['Contact','Contact','contact','ontzorg','pakket-suggesties','boeken'],
  privacy:['Privacyverklaring','Privacy notice','privacy','boeken'],
  cookies:['Cookiebeleid','Cookie policy','cookies','boeken'],
  voorwaarden:['Algemene voorwaarden','Terms and conditions','voorwaarden','boeken'],
  klachten:['Klachtenregeling','Complaints','klachten','boeken'],
  bedrijfsgegevens:['Bedrijfsgegevens','Company details','bedrijfsgegevens','boeken']
};
let huidigePagina;
function toonPagina(gevraagdeHash) {
  const hash = typeof gevraagdeHash === 'string' ? gevraagdeHash : location.hash || '';
  const basispad = location.pathname.replace(/^\/|\/$/g, '');
  const [pad = '', onderdeel = ''] = hash.startsWith('#/') ? hash.slice(2).split('/') : [basispad, hash.slice(1)];
  const pakket = pad === 'pakketten' && onderdeel.startsWith('pakket-') ? document.getElementById(onderdeel) : null;
  const pagina = routes[pad];
  const anchor = hash.slice(1);
  const juridischAnker = !pad && /^([a-z]+)-onderdeel-\d+$/.exec(anchor);
  if (juridischAnker && (juridischAnker[1] === 'privacy' || juridischAnker[1] === 'voorwaarden')) {
    if (huidigePagina !== juridischAnker[1]) {
      toonPagina('#/' + juridischAnker[1]);
    }
    requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
    return;
  }
  if (!pad && anchor && !['top','werk','pakketten','keuze','atelier','tools','veldgids','boeken','contact'].includes(anchor) && !anchor.startsWith('pakket-')) return;
  if (!pad && huidigePagina && (routes[huidigePagina].slice(2).includes(anchor) || (huidigePagina === 'pakketten' && anchor.startsWith('pakket-')))) {
    requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
    return;
  }
  const wasArchief = huidigePagina === 'inzichten';
  huidigePagina = pagina ? pad : '';
  if (wasArchief !== (huidigePagina === 'inzichten')) stelBlogsIn();
  document.querySelectorAll('main > section').forEach(sectie => {
    sectie.hidden = pagina ? !pagina.slice(2).includes(sectie.id) : sectie.matches('.contact-pagina,.juridisch,.pakket-suggesties');
  });
  document.querySelectorAll('.header-links a').forEach(link => {
    if (pagina && link.getAttribute('href') === '/' + pad + '/') link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  if (hash.startsWith('#/')) document.title = pagina ? local(pagina[0],pagina[1]) + ' | WebshopAtelier' : 'WebshopAtelier';
  tekenTitels();
  tekenStrepen();
  vulLogobalk();
  if (pakket) {
    if (pakket.tagName === 'DETAILS') pakket.open = true;
    requestAnimationFrame(() => pakket.scrollIntoView({block:'start'}));
  } else if (pagina && onderdeel === 'boeken') {
    requestAnimationFrame(() => document.getElementById('boeken')?.scrollIntoView());
  } else if (pagina && !hash) requestAnimationFrame(() => window.scrollTo({top:0,behavior:'instant'}));
  else if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
}
addEventListener('hashchange',toonPagina);
let gepland = false;
const begrens = waarde => Math.min(1, Math.max(0, waarde));
function meng(van, naar, deel) {
  return van.map((waarde, index) => Math.round(waarde + (naar[index] - waarde) * deel));
}
function tekenTitels() {
  const grijs = [154, 143, 165];
  const wit = [249, 244, 239];
  const oranje = [255, 112, 78];
  koppen.forEach(kop => {
    const deel = begrens((innerHeight * .94 - kop.getBoundingClientRect().top) / (innerHeight * .63));
    const delen = Array.from(kop.querySelectorAll('[data-word]'));
    delen.forEach((woord, index) => {
      const laatste = index === delen.length - 1;
      const vertraging = index / Math.max(delen.length - 1, 1) * .14;
      const helderheid = begrens((deel - vertraging) / .56);
      const basiskleur = meng(grijs, wit, helderheid);
      const kleur = laatste ? meng(basiskleur, oranje, begrens((deel - .72) / .28)) : basiskleur;
      woord.style.setProperty('--word', 'rgb(' + (motion.matches ? (laatste ? oranje : wit) : kleur).join(',') + ')');
    });
  });
}

const streeplijst = document.querySelector('.ontzorg .checklist');
function tekenStrepen() {
  if (!streeplijst) return;
  const rect = streeplijst.getBoundingClientRect();
  const mobiel = streeplijst.clientWidth < 570;
  const deel = begrens((innerHeight * .9 - rect.top) / (rect.height + innerHeight * (mobiel ? .20 : .32)));
  const regels = Array.from(streeplijst.querySelectorAll('.strike'));
  regels.forEach((regel, index) => {
    const start = index / regels.length * .86;
    regel.style.setProperty('--doorhalen', motion.matches ? 1 : begrens((deel - start) / .14));
  });
}

function planTitels() {
  if (gepland) return;
  gepland = true;
  requestAnimationFrame(() => {
    gepland = false;
    tekenTitels();
    tekenStrepen();
    tekenAanpak();
  });
}
addEventListener('scroll', planTitels, {passive:true});
motion.addEventListener('change', planTitels);

const logobalk = $('.r-track');
const logostrook = $('.r-strip');
function vulLogobalk() {
  const eersteRij = logobalk?.firstElementChild;
  const rijbreedte = eersteRij?.getBoundingClientRect().width;
  if (!rijbreedte || !logostrook.clientWidth) return;
  const aantal = Math.ceil(logostrook.clientWidth / rijbreedte) + 1;
  logobalk.style.setProperty('--lusafstand', -rijbreedte + 'px');
  logobalk.style.setProperty('--lusduur', rijbreedte / 29 + 's');
  while (logobalk.children.length < aantal) {
    const rij = eersteRij.cloneNode(true);
    rij.setAttribute('aria-hidden', 'true');
    logobalk.append(rij);
  }
  while (logobalk.children.length > aantal) logobalk.lastElementChild.remove();
  logobalk.classList.add('lus-klaar');
}
if (typeof ResizeObserver !== 'undefined' && logobalk?.firstElementChild) {
  const meetLogos = new ResizeObserver(vulLogobalk);
  meetLogos.observe(logostrook);
  meetLogos.observe(logobalk.firstElementChild);
}

const suggesties = $('#suggestie-rij');
if (suggesties) {
  const knoppen = $$('[data-suggestie-stap]');
  function werkSuggestiepijlenBij() {
    const einde = suggesties.scrollWidth - suggesties.clientWidth;
    knoppen.forEach(knop => {
      knop.disabled = Number(knop.dataset.suggestieStap) < 0
        ? suggesties.scrollLeft <= 1
        : suggesties.scrollLeft >= einde - 1;
    });
  }
  knoppen.forEach(knop => knop.addEventListener('click', () => {
    const [eerste, tweede] = suggesties.children;
    const stap = tweede.offsetLeft - eerste.offsetLeft;
    suggesties.scrollBy({left: stap * Number(knop.dataset.suggestieStap), behavior: motion.matches ? 'instant' : 'smooth'});
  }));
  suggesties.addEventListener('scroll', werkSuggestiepijlenBij, {passive:true});
  new ResizeObserver(werkSuggestiepijlenBij).observe(suggesties);
  suggesties.addEventListener('keydown', event => {
    const links = Array.from(suggesties.querySelectorAll('a'));
    const index = links.indexOf(event.target);
    if (index < 0) return;
    const doelen = {ArrowLeft:index - 1, ArrowRight:index + 1, Home:0, End:links.length - 1};
    if (!Object.hasOwn(doelen, event.key)) return;
    event.preventDefault();
    links[Math.max(0, Math.min(links.length - 1, doelen[event.key]))].focus();
  });
  werkSuggestiepijlenBij();
}
const casepijlen = $$('[data-case-stap]');
function vertaalPijlen() {
  $$('[data-suggestie-stap]').forEach(knop => knop.setAttribute('aria-label', Number(knop.dataset.suggestieStap) < 0 ? local('Vorige pakketten','Previous packages') : local('Volgende pakketten','Next packages')));
  casepijlen.forEach(knop => knop.setAttribute('aria-label', Number(knop.dataset.caseStap) < 0 ? local('Vorige klantcase', 'Previous case') : local('Volgende klantcase', 'Next case')));
}
casepijlen.forEach(knop => knop.addEventListener('click', () => {
  activeCase = (activeCase + Number(knop.dataset.caseStap) + cases.length) % cases.length;
  caseView = 'home';
  toonCase();
}));

addEventListener('resize', () => {
  planTitels();
  vulLogobalk();
});

toonPagina();
const kopTalen = $('#kop-talen');
const taalIndicator = $('#taal-indicator');
const taalKnoppen = $$('[data-menu-taal]');

function kiesTaal(land) {
  const knop = taalKnoppen.find(item => item.dataset.land === land);
  if (!knop) return false;
  taalKnoppen.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.land === land)));
  $('#taal').value = knop.dataset.menuTaal;
  taalIndicator.textContent = knop.querySelector('span').textContent;
  kopTalen.querySelector('summary').setAttribute('aria-label', local('Taal kiezen', 'Choose language') + ' · ' + knop.textContent.trim());
  $('#taal').dispatchEvent(new Event('change'));
  document.documentElement.lang = knop.lang;
  return true;
}
function startTaal() {
  let land;
  try { land = localStorage.getItem('atelier-taal'); if (land === 'BE') { land = 'NL'; localStorage.setItem('atelier-taal', land); } } catch {}
  return land ? kiesTaal(land) : false;
}
taalKnoppen.forEach(knop => knop.addEventListener('click', () => {
  kiesTaal(knop.dataset.land);
  try { localStorage.setItem('atelier-taal', knop.dataset.land); } catch {}
  if (kopTalen.open) {
    kopTalen.open = false;
    kopTalen.querySelector('summary').focus();
  }
}));

const pakketDropdown = $('#pakket-dropdown');
const pakketKnoppen = $$('[data-pakket-keuze]');
function tekenPakketkeuze() {
  const waarde = $('#advies').value;
  const actief = pakketKnoppen.find(knop => knop.dataset.pakketKeuze === waarde);
  if (!actief) return;
  $('#pakket-huidig').textContent = actief.querySelector('span').textContent;
  pakketKnoppen.forEach(knop => knop.setAttribute('aria-pressed', String(knop === actief)));
}
pakketKnoppen.forEach(knop => knop.addEventListener('click', () => {
  $('#advies').value = knop.dataset.pakketKeuze;
  adviseer();
  tekenPakketkeuze();
  pakketDropdown.open = false;
  pakketDropdown.querySelector('summary').focus();
}));
[kopTalen,pakketDropdown].forEach(lijst => {
  lijst.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !lijst.open) return;
    event.preventDefault();
    event.stopPropagation();
    lijst.open = false;
    lijst.querySelector('summary').focus();
  });
  document.addEventListener('pointerdown', event => {
    if (lijst.open && !lijst.contains(event.target)) lijst.open = false;
  });
});

const aanpakBaan = $('.aanpak-stappen');
const aanpakStappen = $$('.aanpak-stappen > li');
function tekenAanpak() {
  if (aanpakStappen.length < 2 || !aanpakBaan.getClientRects().length) return;
  const begin = aanpakStappen[0].getBoundingClientRect().top + 18;
  const eind = aanpakStappen.at(-1).getBoundingClientRect().top + 18;
  const drempel = innerHeight * .58;
  const afstand = Math.max(0, eind - begin);
  const voortgang = motion.matches ? afstand : Math.min(afstand, Math.max(0,drempel-begin));
  aanpakBaan.style.setProperty('--baan-lengte', afstand + 'px');
  aanpakBaan.style.setProperty('--baan-voortgang', voortgang + 'px');
  aanpakStappen.forEach(stap => stap.classList.toggle('stap-actief', motion.matches || stap.getBoundingClientRect().top + 18 <= drempel));
}
document.querySelectorAll('[data-platform-logo]').forEach(icoon => {
  function terugval() {
    icoon.hidden=true;
    icoon.nextElementSibling.hidden=false;
  }
  icoon.addEventListener('error',terugval,{once:true});
  if (icoon.complete && !icoon.naturalWidth) terugval();
});

if (!startTaal()) vertaal();
planTitels();
