/* Richting 1, Speelveld. Klassiek script (werkt vanaf file://). Geen bibliotheken. */
(function () {
  var doc = document.documentElement;
  var stil = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Laadteller (Lusion): één keer per sessie, nooit bij reduced motion */
  var loader = document.querySelector('.loader');
  var gezien = false;
  try { gezien = sessionStorage.getItem('zw-geladen') === '1'; } catch (e) {}
  if (loader) {
    if (stil || gezien || document.body.classList.contains('is-sub')) { loader.remove(); }
    else {
      var tel = loader.querySelector('.loader-tel'), t0 = performance.now(), duur = 900;
      (function stap(nu) {
        var p = Math.min(1, (nu - t0) / duur), v = Math.round(100 * (1 - Math.pow(1 - p, 3)));
        tel.textContent = v;
        if (p < 1) requestAnimationFrame(stap);
        else { loader.classList.add('weg'); setTimeout(function () { loader.remove(); }, 750); try { sessionStorage.setItem('zw-geladen', '1'); } catch (e) {} }
      })(t0);
    }
  }

  /* Menu als kaarten (Lusion) */
  var knop = document.querySelector('.menu-knop'), menu = document.getElementById('menu');
  function zetMenu(open) {
    knop.setAttribute('aria-expanded', open ? 'true' : 'false');
    var tx = knop.querySelector('.menu-tekst'); tx.textContent = open ? tx.dataset.dicht : tx.dataset.open;
    menu.hidden = !open;
    document.body.style.overflow = open && innerWidth < 1000 ? 'hidden' : '';
    if (open) { var a = menu.querySelector('a'); if (a) a.focus(); } else knop.focus({ preventScroll: true });
  }
  if (knop && menu) {
    knop.addEventListener('click', function () { zetMenu(knop.getAttribute('aria-expanded') !== 'true'); });
    var zet = zetMenu; menu.addEventListener('click', function(ev){var a=ev.target.closest('a');if(!a)return;var h=a.getAttribute('href');if(h&&h.charAt(0)==='#'){ev.preventDefault();zet(false);var el=document.getElementById(h.slice(1));if(history.pushState)history.pushState(null,'',h);if(el)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}else zet(false);});
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !menu.hidden) zetMenu(false); });
    document.addEventListener('pointerdown', function (ev) { if (!menu.hidden && !menu.contains(ev.target) && !knop.contains(ev.target) && innerWidth >= 1000) zetMenu(false); });
  }

  /* Stappen als tabbladen (Jarvis), met pijltoetsen */
  document.querySelectorAll('.stap-tabs, .check-tabs, .slot-tabs').forEach(function (lijst) {
    var tabs = Array.prototype.slice.call(lijst.querySelectorAll('[role=tab]'));
    function kies(i, focus) {
      tabs.forEach(function (t, j) {
        var aan = i === j; t.setAttribute('aria-selected', aan); t.tabIndex = aan ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !aan;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { kies(i); });
      t.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); kies((i + 1) % tabs.length, true); }
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); kies((i + tabs.length - 1) % tabs.length, true); }
      });
    });
  });

  /* Formulier: controle en melding, er wordt niets verstuurd */
  document.querySelectorAll('.formulier').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var m = f.querySelector('.melding'), goed = true;
      f.querySelectorAll('[required]').forEach(function (el) {
        var ok = el.value.trim() !== '' && (el.type !== 'email' || /.+@.+\..+/.test(el.value));
        el.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok) goed = false;
      });
      m.className = 'melding ' + (goed ? 'ok' : 'fout'); m.textContent = goed ? m.dataset.ok : m.dataset.fout;
      if (!goed) { var eerst = f.querySelector('[aria-invalid=true]'); if (eerst) eerst.focus(); }
    });
  });

  /* Diensten openen als je via een blok of link op #d-... komt */
  function openHash() { var h = location.hash; if (h && h.indexOf('#d-') === 0) { var d = document.querySelector(h); if (d) d.open = true; } }
  addEventListener('hashchange', openHash); openHash();

})();

/* Ronde 3, R1: één eigen object in massa (Lusion). Het merkteken van het bureau (een L van twee afgeronde blokken)
   als glanzend 3D-object, tientallen keren, met eenvoudige fysica: ze duwen elkaar weg, wijken voor muis en vinger,
   en zijn te slepen en aan te tikken (Bruno). WebGL 1 met instancing; geen bibliotheken. */
function start3D(cv) {
  var stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: 'default' });
  var inst = gl && gl.getExtension('ANGLE_instanced_arrays');
  if (!gl || !inst) { cv.closest('.kader').classList.add('geen-3d'); return; }
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
    var r = cv.getBoundingClientRect(); W = r.width; H = r.height; asp = W / H; mob = W < 700;
    var dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); gl.viewport(0, 0, cv.width, cv.height);
  }
  maat(); vulScene();
  addEventListener('resize', function () { var oud = mob; maat(); if (oud !== mob) vulScene(); });

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

  function stap(dt, t) {
    for (var i = 0; i < AANTAL; i++) {
      var p = pos[i], v = vel[i];
      if (i !== grijp) {
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
  }
  var zicht = true, loopt = false, laatst = performance.now(), t0 = laatst;
  function frame(nu) { if (!zicht || document.hidden) { loopt = false; return; } var dt = Math.max(0, Math.min(.04, (nu - laatst) / 1000)); laatst = nu; stap(dt, (nu - t0) / 1000); teken(); requestAnimationFrame(frame); }
  function kick() { if (!loopt && !stil) { loopt = true; laatst = performance.now(); requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { zicht = en[0].isIntersecting; if (zicht) kick(); }).observe(cv);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && zicht) kick(); });
  if (stil) { teken(); cv.addEventListener('pointerup', teken); } else kick();
  window.__zwScene = { pos: pos, naarScherm: naarScherm, aantal: function () { return AANTAL; } };
}
document.querySelectorAll('canvas.scene').forEach(function (cv) { start3D(cv); });
/* binnenkomen: secties, tegels en lijsten ploppen in (ronde 3) */
(function () {
  document.documentElement.classList.add('js');
  var groepen = ['.cijfer-rij li', '.mod', '.kh-tabs > *', '.vg-rij', innerWidth >= 900 ? '.pk-kaart' : '.geen', '.pk-meer li', '.faq details'];
  var soort = { '.mod': 'val', '.cijfer-rij li': 'links', '.vg-rij': 'links', '.faq details': 'op', '.pk-meer li': 'links', '.kh-tabs > *': 'val' };
  groepen.forEach(function (s) { document.querySelectorAll(s).forEach(function (el, i) { el.classList.add('plop'); el.style.setProperty('--i', i % 8); if (soort[s]) el.dataset.plop = soort[s]; }); });
  document.querySelectorAll('.nm-lijst .streep').forEach(function (s, i) { s.parentNode.style.setProperty('--i', i); s.style.transitionDelay = (i * 90) + 'ms'; });
  var doelen = document.querySelectorAll('.plop, .nm-lijst');
  if (!('IntersectionObserver' in window)) { doelen.forEach(function (d) { d.classList.add('zien'); }); return; }
  var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('zien'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
  doelen.forEach(function (d) { io.observe(d); });
})();

/* Ronde 4: matrix-achtergrond, doorlopende lijn, vallende L's, cijfers, eigen winkels, cases-slider, uitklapmenu.
   Klassiek script, geen bibliotheken. Alles respecteert prefers-reduced-motion. */
(function () {
  var stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fijn = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('js');

  /* ---------- 1. Matrix: vallende tekens, met een laptop en telefoon met webshop die uit de tekens oplichten ---------- */
  document.querySelectorAll('canvas.matrix').forEach(function (cv) {
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var TEKENS = '01<>/{}[]=+*#$%&WEBSHOPATELIER€?!:;'.split('');
    var cel, kol, rij, val = [], vorm = null, rand = null, W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), zicht = true, raf = 0, t0 = 0;
    var desk = new Image(), tel = new Image(), geladen = 0;
    desk.src = cv.dataset.desk; tel.src = cv.dataset.tel;
    function klaar() { geladen++; if (geladen === 2) { maakVorm(); teken(true); } }
    desk.onload = klaar; tel.onload = klaar; desk.onerror = klaar; tel.onerror = klaar;
    function maat() {
      var r = cv.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height);
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cel = W < 700 ? 11 : 14; kol = Math.ceil(W / cel); rij = Math.ceil(H / cel);
      val = []; for (var i = 0; i < kol; i++) val.push({ y: Math.random() * rij, v: .25 + Math.random() * .55 });
      if (geladen === 2) maakVorm();
    }
    /* De vorm: een laptop met de winkel en een telefoon ervoor, getekend in een klein raster; per cel een helderheid 0..1 */
    function maakVorm() {
      if (document.documentElement.classList.contains('heeft-toestel3d') || (document.documentElement.classList.contains('geen-webgl') && cv.closest('.hero4'))) { vorm = null; return; }
      /* twee rasters: de inhoud van de schermen (helderheid) en de omtrek van laptop en telefoon (rand) */
      var c = document.createElement('canvas'); c.width = kol; c.height = rij; var g = c.getContext('2d');
      var r2 = document.createElement('canvas'); r2.width = kol; r2.height = rij; var h = r2.getContext('2d');
      var mob = W < 700;
      var lw = kol * (mob ? .7 : .33), lh = lw * .62, lx = mob ? kol * .08 : kol * .52, ly = mob ? rij * .14 : rij * .2;
      lh = Math.min(lh, rij * (mob ? .5 : .5)); lw = lh / .62;
      var tw = lw * .27, th = tw * 2.05, tx = lx + lw * .84, ty = ly + lh - th * .72;
      g.fillStyle = '#000'; g.fillRect(0, 0, kol, rij);
      try { g.drawImage(desk, lx, ly, lw, lh); g.fillStyle = '#000'; g.fillRect(tx - 1, ty - 1, tw + 2, th + 2); g.drawImage(tel, tx, ty, tw, th); } catch (e) {}
      h.fillStyle = '#000'; h.fillRect(0, 0, kol, rij); h.strokeStyle = '#fff'; h.lineWidth = 1;
      h.strokeRect(lx - .5, ly - .5, lw + 1, lh + 1);
      h.fillStyle = '#fff'; h.fillRect(lx - lw * .1, ly + lh + 1, lw * 1.2, 1);
      h.fillStyle = '#000'; h.fillRect(tx - 1.5, ty - 1.5, tw + 3, th + 3); h.strokeRect(tx - .5, ty - .5, tw + 1, th + 1);
      var d, f; try { d = g.getImageData(0, 0, kol, rij).data; f = h.getImageData(0, 0, kol, rij).data; } catch (e) { vorm = null; return; }
      vorm = new Float32Array(kol * rij); rand = new Uint8Array(kol * rij);
      for (var i = 0; i < kol * rij; i++) {
        var l = (d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255;
        var binnen = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) > 6;
        vorm[i] = binnen ? .35 + (1 - l) * .65 : 0;   /* donkere details op het scherm lichten het sterkst op */
        rand[i] = f[i * 4] > 100 ? 1 : 0;
      }
    }
    function teken(statisch) {
      ctx.clearRect(0, 0, W, H); ctx.globalAlpha = document.documentElement.classList.contains('heeft-toestel3d') ? .55 : 1;
      ctx.font = '600 ' + (cel - 2) + 'px Menlo, "SF Mono", monospace'; ctx.textBaseline = 'top';
      for (var x = 0; x < kol; x++) {
        var k = val[x];
        for (var y = 0; y < rij; y++) {
          var afstand = (k.y - y + rij) % rij, spoor = afstand < 14 ? 1 - afstand / 14 : 0;
          var idx = y * kol + x, b = vorm ? vorm[idx] : 0, rd = rand ? rand[idx] : 0;
          var a = rd ? .62 : (b ? .1 + b * .42 + spoor * .12 : .025 + spoor * .1);
          if (statisch) a = rd ? .6 : (b ? .1 + b * .4 : .03);
          if (!b && !rd && a < .04 && Math.random() > .35) continue;
          ctx.fillStyle = rd ? 'rgba(255,110,80,' + a + ')' : (b > .7 ? 'rgba(255,150,120,' + a + ')' : 'rgba(190,160,255,' + a + ')');
          ctx.fillText(TEKENS[(x * 7 + y * 13 + (statisch ? 0 : Math.floor(k.y))) % TEKENS.length], x * cel, y * cel);
        }
      }
    }
    function lus(nu) {
      raf = 0; if (!zicht || document.hidden) return;
      if (nu - t0 > 70) { t0 = nu; val.forEach(function (k) { k.y = (k.y + k.v) % (rij + 14); }); teken(false); }
      raf = requestAnimationFrame(lus);
    }
    function start() { if (!raf && !stil) raf = requestAnimationFrame(lus); }
    maat(); if (stil) teken(true); else start();
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { maat(); teken(stil); }, 150); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { zicht = en[0].isIntersecting; if (zicht) start(); }).observe(cv);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
  });

  /* ---------- 2. Doorlopende lijn rechts: over de hele pagina, tekent mee met het scrollen ---------- */
  (function () {
    var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'), p = document.createElementNS(ns, 'path');
    s.setAttribute('class', 'lijn'); s.setAttribute('aria-hidden', 'true'); s.appendChild(p); document.body.appendChild(s);
    var lengte = 1;
    function bouw() {
      s.style.height = '0px'; s.setAttribute('height', 0);
      var H = document.documentElement.scrollHeight, mob = innerWidth < 900, w = mob ? 12 : 46, mid = w / 2, amp = mob ? 3 : 16, golf = mob ? 520 : 760;
      s.setAttribute('viewBox', '0 0 ' + w + ' ' + H); s.setAttribute('width', w); s.setAttribute('height', H); s.style.height = H + 'px';
      var d = 'M' + mid + ' ' + (mob ? 0 : 40);
      for (var y = (mob ? 0 : 40), i = 0; y < H; y += golf / 2, i++) {
        var ny = Math.min(H, y + golf / 2), cx = mid + (i % 2 ? -amp : amp);
        d += ' Q ' + cx + ' ' + (y + golf / 4) + ' ' + mid + ' ' + ny;
      }
      p.setAttribute('d', d); lengte = p.getTotalLength(); p.style.strokeDasharray = lengte; werk();
    }
    function werk() {
      if (stil) { p.style.strokeDashoffset = 0; return; }
      /* ronde 5: onzichtbaar bij het laden, tekent zich vanaf de eerste scroll */
      var H = document.documentElement.scrollHeight, v = Math.min(1, scrollY / Math.max(1, H - innerHeight));
      s.classList.toggle('lijn-aan', scrollY > 4);
      p.style.strokeDashoffset = lengte * (1 - v);
    }
    var tik = false;
    addEventListener('scroll', function () { if (!tik) { tik = true; requestAnimationFrame(function () { tik = false; werk(); }); } }, { passive: true });
    addEventListener('resize', bouw); addEventListener('load', bouw); bouw();
    if ('ResizeObserver' in window) new ResizeObserver(function () { bouw(); }).observe(document.body);
  })();

  /* ---------- 3. Vallende L's: af en toe één, alleen in de rechtermarge, nooit klikbaar ---------- */
  (function () {
    var veld = document.querySelector('.valveld'); if (!veld || stil) return;
    var laatst = 0, bezig = 0, vorigY = scrollY;
    addEventListener('scroll', function () {
      var nu = performance.now(), dy = Math.abs(scrollY - vorigY); vorigY = scrollY;
      if (dy < 4 || bezig >= 2 || nu - laatst < 3200 || Math.random() > .08 || scrollY < innerHeight * .4) return; /* ronde 5: iets vaker, nog steeds alleen in de marge */
      laatst = nu; bezig++;
      var mob = innerWidth < 900, w = mob ? 12 : 20 + Math.random() * 10;
      var inhoud = Math.min(1240, innerWidth) , marge = (innerWidth - inhoud) / 2;
      var x = mob ? innerWidth - w - 3 : Math.max(innerWidth - marge + 18, innerWidth - 80) + Math.random() * Math.max(0, marge - 60);
      if (!mob && marge < 70) { bezig--; return; }
      var el = document.createElement('div'); el.className = 'val'; el.style.setProperty('--w', w + 'px'); el.style.left = Math.min(x, innerWidth - w - 4) + 'px';
      el.innerHTML = '<i></i><i></i>'; veld.appendChild(el);
      var draai = (Math.random() - .5) * 220, duur = 2600 + Math.random() * 1200;
      var a = el.animate([{ transform: 'translateY(0) rotate(0deg)', opacity: 0 }, { opacity: .9, offset: .1 }, { opacity: .9, offset: .85 }, { transform: 'translateY(' + (innerHeight + 120) + 'px) rotate(' + draai + 'deg)', opacity: 0 }], { duration: duur, easing: 'cubic-bezier(.45,0,.75,1)' });
      a.onfinish = function () { el.remove(); bezig--; };
    }, { passive: true });
  })();

  /* ---------- 4. Binnenkomen (.zien) ---------- */
  var doelen = document.querySelectorAll('.sectie .kk-kop, .pk2, .pk3, .cf, .ck, .krijg2-lijst li, .nm2, .toestellen');
  document.querySelectorAll('.pk3-rij, .cf-raster, .ck-raster, .krijg2-lijst').forEach(function (g) { Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 8)); }); });
  document.querySelectorAll('.nm2 li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  if ('IntersectionObserver' in window && !stil) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('zien'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    doelen.forEach(function (d) { io.observe(d); });
  } else doelen.forEach(function (d) { d.classList.add('zien'); });

  /* ---------- 5. Cijfers: visuals vullen op, de 33 tikt na, agents lichten één voor één op ---------- */
  document.querySelectorAll('.cf').forEach(function (cf) {
    cf.querySelectorAll('.vis i').forEach(function (i, n) { i.style.setProperty('--n', n); });
    var agents = cf.querySelectorAll('.vis-agents i'), pols = cf.querySelectorAll('.vis-pols i');
    function speel() {
      if (agents.length) {
        if (stil) { agents.forEach(function (a) { a.classList.add('aan'); }); return; }
        agents.forEach(function (a, n) { setTimeout(function () { a.classList.add('aan'); }, 300 + n * 70); });
      }
      if (pols.length && !stil) setInterval(function () { if (document.hidden) return; var p = pols[Math.floor(Math.random() * pols.length)]; p.classList.remove('tik'); void p.offsetWidth; p.classList.add('tik'); }, 1400);
    }
    if ('IntersectionObserver' in window) { var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { o.disconnect(); speel(); } }, { threshold: .3 }); o.observe(cf); } else speel();
  });

  /* ---------- 6. Eigen winkels: laptop en telefoon tonen samen dezelfde winkel ---------- */
  document.querySelectorAll('.wie-beeld').forEach(function (w) {
    var t = w.querySelector('[data-toestellen]'), d = t.querySelector('[data-desk]'), m = t.querySelector('[data-tel]'), link = w.querySelector('[data-eigen-link]'), nm = w.querySelector('[data-eigen-naam]');
    w.querySelectorAll('.eigen-knop').forEach(function (b) {
      b.addEventListener('click', function () {
        w.querySelectorAll('.eigen-knop').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        var id = b.dataset.winkel; t.classList.add('wissel');
        setTimeout(function () { d.src = '/assets/' + id + '-desk.webp'; m.src = '/assets/' + id + '-tel.webp'; d.alt = b.dataset.naam + ' op een laptop'; m.alt = b.dataset.naam + ' op een telefoon'; t.classList.remove('wissel'); }, stil ? 0 : 200);
        link.href = 'https://' + b.dataset.url; nm.textContent = b.dataset.naam;
      });
    });
  });

  /* ---------- 7. Cases-slider: pijlen, stippen, pijltoetsen; volgt ook vegen ---------- */
  document.querySelectorAll('[data-slider]').forEach(function (sl) {
    var sec = sl.closest('section'), dias = sl.querySelectorAll('.slide'), stippen = sec.querySelectorAll('[data-naar]'), nu = 0;
    function naar(i) { i = (i + dias.length) % dias.length; sl.scrollTo({ left: dias[i].offsetLeft - sl.offsetLeft, behavior: stil ? 'auto' : 'smooth' }); }
    function markeer() { var i = Math.round(sl.scrollLeft / sl.clientWidth); if (i !== nu) { nu = i; } stippen.forEach(function (s, j) { if (j === nu) s.setAttribute('aria-current', 'true'); else s.removeAttribute('aria-current'); }); }
    sec.querySelectorAll('[data-stap]').forEach(function (b) { b.addEventListener('click', function () { naar(nu + +b.dataset.stap); }); });
    stippen.forEach(function (s) { s.addEventListener('click', function () { naar(+s.dataset.naar); }); });
    sl.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowRight') { ev.preventDefault(); naar(nu + 1); } if (ev.key === 'ArrowLeft') { ev.preventDefault(); naar(nu - 1); } });
    var tk = false; sl.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; markeer(); }); } }, { passive: true });
  });

  /* ---------- 8. Uitklapmenu: muis (met korte vertraging), klik, toetsenbord, Escape ---------- */
  var uits = Array.prototype.slice.call(document.querySelectorAll('[data-uit]'));
  function zet(u, open) {
    var k = u.querySelector('.uit-knop'), p = u.querySelector('.uit-paneel');
    if (open) uits.forEach(function (v) { if (v !== u) zet(v, false); });
    k.setAttribute('aria-expanded', open ? 'true' : 'false'); p.hidden = !open;
  }
  uits.forEach(function (u) {
    var k = u.querySelector('.uit-knop'), p = u.querySelector('.uit-paneel'), timer;
    k.addEventListener('click', function () { zet(u, k.getAttribute('aria-expanded') !== 'true'); });
    if (fijn) {
      u.addEventListener('mouseenter', function () { clearTimeout(timer); timer = setTimeout(function () { zet(u, true); }, 90); });
      u.addEventListener('mouseleave', function () { clearTimeout(timer); timer = setTimeout(function () { zet(u, false); }, 220); });
    }
    u.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { zet(u, false); k.focus(); }
      if (ev.key === 'ArrowDown' && document.activeElement === k) { ev.preventDefault(); zet(u, true); var a = p.querySelector('a'); if (a) a.focus(); }
    });
    u.addEventListener('focusout', function (ev) { if (!u.contains(ev.relatedTarget)) zet(u, false); });
  });
  document.addEventListener('pointerdown', function (ev) { uits.forEach(function (u) { if (!u.contains(ev.target)) zet(u, false); }); });
})();
/* Vangnet voor binnenkomen: als de pagina druk is (3D en matrix op een trage telefoon) kan een IntersectionObserver-melding
   te laat komen. Bij scrollen krijgt alles wat al in of boven beeld staat alsnog .zien, zodat er nooit een leeg vlak blijft. */
(function () {
  var tik = false;
  function vang() {
    tik = false;
    var lijst = document.querySelectorAll('.plop:not(.zien), .sectie .kk-kop:not(.zien), .pk2:not(.zien), .pk3:not(.zien), .cf:not(.zien), .ck:not(.zien), .krijg2-lijst li:not(.zien), .nm2:not(.zien), .toestellen:not(.zien), .nm-lijst:not(.zien)');
    for (var i = 0; i < lijst.length; i++) { var r = lijst[i].getBoundingClientRect(); if (r.top < innerHeight * .95 && r.width > 0) lijst[i].classList.add('zien'); }
  }
  addEventListener('scroll', function () { if (!tik) { tik = true; setTimeout(function () { requestAnimationFrame(vang); }, 120); } }, { passive: true });
  addEventListener('load', vang);
})();
/* Ronde 4b, mobiel korter: wat in de HTML open staat (zodat het zonder JavaScript gewoon stapelt), klapt op de telefoon dicht.
   Op desktop blijft het open en is de kop geen schakelaar. De teller van de samensteller staat ook in de ingeklapte kop. */
(function () {
  var mobiel = matchMedia('(max-width: 699px)');
  function zet() { document.querySelectorAll('[data-mobiel-dicht]').forEach(function (d) { d.open = !mobiel.matches; }); }
  zet(); if (mobiel.addEventListener) mobiel.addEventListener('change', zet);
  document.querySelectorAll('[data-mobiel-dicht] > summary').forEach(function (s) { s.addEventListener('click', function (ev) { if (!mobiel.matches) ev.preventDefault(); }); });
  document.querySelectorAll('[data-samen]').forEach(function (s) {
    var kopie = s.querySelector('[data-samen-kopie]'); if (!kopie) return;
    s.addEventListener('change', function () { kopie.textContent = s.querySelectorAll('input[type=checkbox]:checked').length; s.classList.toggle('gekozen', kopie.textContent !== '0'); });
  });
})();
/* Wat in een uitklapper zit, komt bij openen meteen in beeld (anders wacht het op de volgende scroll). */
document.addEventListener('toggle', function (ev) { var d = ev.target; if (d.open && d.querySelectorAll) d.querySelectorAll('.plop:not(.zien), .nm2:not(.zien)').forEach(function (el) { el.classList.add('zien'); }); }, true);
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
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height; mob = W < 700; dpr = 1; /* achtergrond: zacht, dus 1x pixels is genoeg */
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      deeltjes = []; for (var i = 0; i < (mob ? 150 : 420); i++) deeltjes.push(nieuwDeeltje({}, false));
    }
    function teken(t) {
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
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { maat(); if (stil) teken(2); }, 150); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { zicht = en[0].isIntersecting; if (zicht) start(); }).observe(cv);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    if (kader && !stil) kader.addEventListener('pointermove', function (ev) { var r = kader.getBoundingClientRect(); doel = [(ev.clientX - r.left) / r.width - .5, (ev.clientY - r.top) / r.height - .5]; });
  });
})();

/* ===================== ronde 4c: check, agenda, assistent, mobiele balk, kennisbank ===================== */
(function () {
  var stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  /* Gratis check: voorbeelduitslag, er wordt niets verstuurd */
  document.querySelectorAll('[data-check]').forEach(function (k) {
    var uit = k.querySelector('[data-check-uitslag]');
    function toon(html) { uit.innerHTML = '<p class="cu-label">VOORBEELD, GEEN ECHTE METING</p>' + html; uit.hidden = false; }
    var site = k.querySelector('[data-check-site]');
    site.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var inp = site.querySelector('input'); var v = (inp.value || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!/^[^\s.]+\.[^\s]{2,}$/.test(v)) { inp.setAttribute('aria-invalid', 'true'); inp.focus(); toon('<p>Vul een adres in, bijvoorbeeld <b>jouwwinkel.nl</b>.</p>'); return; }
      inp.removeAttribute('aria-invalid');
      toon('<p><b>' + v.replace(/[<>&"]/g, '') + '</b></p>' +
        '<div class="cu-rij"><span>Gevonden in Google op je eigen naam</span><b class="cu-goed">Ja</b></div>' +
        '<div class="cu-rij"><span>Gevonden op "wat je verkoopt + plaats"</span><b class="cu-matig">Pagina 3</b></div>' +
        '<div class="cu-rij"><span>Genoemd door ChatGPT</span><b class="cu-slecht">Nee</b></div>' +
        '<div class="cu-rij"><span>Laadtijd op de telefoon</span><b class="cu-matig">3,8 s</b></div>' +
        '<div class="cu-rij"><span>llms.txt aanwezig</span><b class="cu-slecht">Nee</b></div>' +
        '<a class="knop knop-cta" href="#contact">Bespreek de uitslag in een call</a>');
    });
    var ai = k.querySelector('[data-check-ai]');
    var TAKEN = { 'Webwinkel': [['Klantmail beantwoorden', '± 6 uur per week'], ['Productteksten schrijven', '± 3 uur per week'], ['Advertentie-ideeën', '± 2 uur per week']],
      'Dienstverlener': [['Offertes opstellen', '± 4 uur per week'], ['Planning en afspraken', '± 3 uur per week'], ['Klantvragen beantwoorden', '± 4 uur per week']],
      'Winkel of horeca': [['Reserveringen en vragen', '± 5 uur per week'], ['Reviews beantwoorden', '± 1 uur per week'], ['Social posts maken', '± 3 uur per week']] };
    ai.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var keuze = (ai.querySelector('input:checked') || {}).value || 'Webwinkel';
      toon('<p><b>' + keuze + '</b>: dit kan AI overnemen</p>' + TAKEN[keuze].map(function (r) { return '<div class="cu-rij"><span>' + r[0] + '</span><b class="cu-goed">' + r[1] + '</b></div>'; }).join('') +
        '<a class="knop knop-cta" href="#contact">Bespreek het in een call</a>');
    });
  });

  /* Agenda: eerst alleen dagen; na een klik twee momenten van 15 minuten; voorbeeldbevestiging */
  document.querySelectorAll('[data-agenda]').forEach(function (a) {
    var boek = a.querySelector('[data-ag-boek]'), melding = a.querySelector('[data-ag-melding]'), vak = a.querySelector('.ag-tijden'), kopTijd = a.querySelector('[data-ag-tijdkop]');
    function stand() {
      var d = a.querySelector('.ag-dag[aria-pressed="true"]'), t = a.querySelector('.ag-tijd[aria-pressed="true"]');
      boek.disabled = !t; boek.textContent = t ? 'Boek ' + d.querySelector('span').textContent + ' ' + d.querySelector('b').textContent + ' ' + d.querySelector('small').textContent + ' om ' + t.textContent : (d ? 'Kies een tijd' : 'Kies eerst een dag');
      melding.textContent = '';
    }
    a.querySelectorAll('.ag-dag').forEach(function (b) { b.addEventListener('click', function () {
      a.querySelectorAll('.ag-dag').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      vak.innerHTML = ''; b.dataset.tijden.split(',').forEach(function (tt) { var k = document.createElement('button'); k.type = 'button'; k.className = 'ag-tijd'; k.setAttribute('aria-pressed', 'false'); k.textContent = tt;
        k.addEventListener('click', function () { vak.querySelectorAll('.ag-tijd').forEach(function (x) { x.setAttribute('aria-pressed', x === k ? 'true' : 'false'); }); stand(); }); vak.appendChild(k); });
      if (kopTijd) kopTijd.hidden = false; stand();
    }); });
    boek.addEventListener('click', function () { melding.textContent = 'Voorbeeld: in de echte site gaat dit via onze agenda en krijg je een bevestiging per mail. In deze mockup wordt niets geboekt.'; });
    stand();
  });

  /* Assistent met het L-gezicht */
  var as = document.querySelector('[data-assistent]');
  if (as) {
    var knop = as.querySelector('.as-knop'), paneel = as.querySelector('.as-paneel'), log = as.querySelector('[data-as-log]'), knoppen = as.querySelector('[data-as-knoppen]');
    var ogen = Array.prototype.slice.call(document.querySelectorAll('.lgezicht .ogen'));
    var figs = Array.prototype.slice.call(document.querySelectorAll('.figuur'));
    if (/[?&]chat=licht/.test(location.search)) document.documentElement.classList.add('chat-licht');
    /* knipperen: onregelmatig, zoals echte ogen; stil bij minder beweging */
    if (!stil) (function knipper() { setTimeout(function () { figs.forEach(function (f) { if (!f.classList.contains('opkijk')) f.classList.add('knipper'); }); setTimeout(function () { figs.forEach(function (f) { f.classList.remove('knipper'); }); if (Math.random() < .25) setTimeout(function () { figs.forEach(function (f) { f.classList.add('knipper'); }); setTimeout(function () { figs.forEach(function (f) { f.classList.remove('knipper'); }); }, 120); }, 180); knipper(); }, 130); }, 2600 + Math.random() * 3800); })();
    /* na een paar seconden kijkt hij even op: er is een bericht (het bolletje met 1) */
    if (!stil) setTimeout(opkijken, 2400);
    var CONTACT = (document.querySelector('.kop-cta') || {}).getAttribute ? document.querySelector('.kop-cta').getAttribute('href') : '/contact';
    var PK = (document.querySelector('.menu-links a[href*="pakketten"]') || {}).getAttribute ? document.querySelector('.menu-links a[href*="pakketten"]').getAttribute('href') : '/pakketten';
    var ANTW = {
      pakket: { t: 'Dat hangt af van waar je staat. Wat past het best?', meer: null, vervolg: [['Ik heb nog geen site', 'geen'], ['Ik heb een webshop', 'shop'], ['Ik wil meer klanten', 'klanten']] },
      geen: { t: 'Dan begin je met een website: vanaf € 999 eenmalig. Wil je meteen verkopen, dan een webshop: vanaf € 2.900 eenmalig. Op beide geldt no cure, no pay: je ziet eerst het ontwerp.', link: ['Bekijk website maken', '/website-laten-maken'], vervolg: [['Boek een call', 'call']] },
      shop: { t: 'Dan kijken we eerst wat je winkel tegenhoudt: een audit vanaf € 495 eenmalig, of doorlopend optimaliseren vanaf € 695 per maand.', link: ['Bekijk webshop optimaliseren', '/conversie-optimalisatie'], vervolg: [['Boek een call', 'call']] },
      klanten: { t: 'Dan zijn gevonden worden en adverteren de snelste route. Vindbaar worden in Google en ChatGPT kost vanaf € 349 per maand, adverteren op Meta ook vanaf € 349 per maand, advertentiebudget apart.', link: ['Doe eerst de gratis check', '/gratis-seo-check'], vervolg: [['Boek een call', 'call']] },
      prijs: { t: 'Een website kost bij ons vanaf € 999 eenmalig. Je ziet eerst het ontwerp; niet tevreden, dan betaal je niets.', meer: 'Andere pakketten: webshop vanaf € 2.900 eenmalig, vindbaar worden vanaf € 349 per maand, adverteren op Meta vanaf € 349 per maand, social media vanaf € 199 per maand, onderhoud vanaf € 25 per maand. Alle prijzen zijn excl. btw [[te bevestigen]].', link: ['Alle pakketten en prijzen', PK], vervolg: [['Welk pakket past bij mij?', 'pakket'], ['Boek een call', 'call']] },
      call: { t: 'Top. Kies een dag en tijd in onze agenda; een kwartier, vrijblijvend.', link: ['Naar de agenda', CONTACT], vervolg: [] },
      anders: { t: 'Goede vraag. Daar geeft een collega je liefst zelf antwoord op. Plan een call of stuur een bericht, dan hoor je het vandaag nog [[reactietijd te bevestigen]].', link: ['Naar de agenda', CONTACT], vervolg: [['Wat kost een website?', 'prijs']] }
    };
    function opkijken() { figs.forEach(function (f) { f.classList.remove('knipper'); f.classList.add('opkijk'); }); setTimeout(function () { figs.forEach(function (f) { f.classList.remove('opkijk'); }); }, 1100); }
    function bericht(wie, html) { if (wie === 'bot') opkijken(); var m = el('div', 'as-msg as-' + wie); m.appendChild(el('p', '', html)); log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }
    function antwoord(sleutel) {
      var a = ANTW[sleutel] || ANTW.anders; knoppen.innerHTML = '';
      var typ = el('div', 'as-msg as-bot as-typen', '<p><i></i><i></i><i></i></p>'); log.appendChild(typ); log.scrollTop = log.scrollHeight;
      setTimeout(function () {
        typ.remove();
        var m = bericht('bot', a.t.replace(/\[\[(.+?)\]\]/g, '<span class="invul">$1</span>'));
        if (a.meer) { var mk = el('button', 'as-meer', 'Meer weergeven'); mk.type = 'button'; mk.addEventListener('click', function () { m.querySelector('p').insertAdjacentHTML('beforeend', '<br><br>' + a.meer.replace(/\[\[(.+?)\]\]/g, '<span class="invul">$1</span>')); mk.remove(); }); m.appendChild(mk); }
        if (a.link) { var l = el('a', 'knop knop-licht as-link', a.link[0]); l.href = a.link[1]; m.appendChild(l); }
        (a.vervolg || []).forEach(function (v) { var b = el('button', '', v[0]); b.type = 'button'; b.dataset.vraag = v[1]; knoppen.appendChild(b); });
        log.scrollTop = log.scrollHeight;
      }, stil ? 0 : 650);
    }
    function open(aan) {
      paneel.hidden = !aan; knop.setAttribute('aria-expanded', aan); document.body.classList.toggle('chat-open', aan);
      if (aan) { var eerste = knoppen.querySelector('button'); (eerste || as.querySelector('input')).focus(); } else knop.focus();
    }
    knop.addEventListener('click', function () { open(paneel.hidden); });
    as.querySelector('.as-dicht').addEventListener('click', function () { open(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !paneel.hidden) open(false); });
    knoppen.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; bericht('jij', b.textContent); antwoord(b.dataset.vraag); });
    as.querySelector('[data-as-invoer]').addEventListener('submit', function (ev) {
      ev.preventDefault(); var i = this.querySelector('input'), v = i.value.trim(); if (!v) return; i.value = '';
      bericht('jij', v.replace(/[<>&]/g, ''));
      var s = /prijs|kost|euro|€|duur/i.test(v) ? 'prijs' : /pakket|welk|past/i.test(v) ? 'pakket' : /bel|call|afspraak|gesprek|agenda/i.test(v) ? 'call' : 'anders';
      antwoord(s);
    });
    /* ogen volgen de muis */
    if (!stil && matchMedia('(pointer: fine)').matches) {
      document.addEventListener('pointermove', function (ev) {
        ogen.forEach(function (g) {
          var r = g.ownerSVGElement.getBoundingClientRect(); var dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 3);
          var d = Math.max(1, Math.hypot(dx, dy)); g.setAttribute('transform', 'translate(' + (dx / d * 1.6).toFixed(2) + ' ' + (dy / d * 1.6).toFixed(2) + ')');
        });
      }, { passive: true });
    }
  }

  /* Vaste balk op de telefoon: weg bij het slot, de footer, een formulier met focus of een open chat */
  var balk = document.querySelector('.mobiele-balk');
  if (balk) {
    var inBeeld = new Set();
    function werk() { balk.classList.toggle('weg', inBeeld.size > 0 || document.body.classList.contains('chat-open') || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (x) { x.isIntersecting ? inBeeld.add(x.target) : inBeeld.delete(x.target); }); werk(); }, { rootMargin: '0px 0px -10% 0px' });
      document.querySelectorAll('.slot2, .voet, .hero, .check-kaart').forEach(function (n) { io.observe(n); });
      var io2 = new IntersectionObserver(function (en) { en.forEach(function (x) { document.body.classList.toggle('slot-zicht', x.isIntersecting); }); }, { rootMargin: '-20% 0px -20% 0px' });
      document.querySelectorAll('.slot2-rechts, .check-kaart').forEach(function (n) { io2.observe(n); });
      var hero = document.querySelector('.hero'); if (hero) new IntersectionObserver(function (en) { document.body.classList.toggle('hero-zicht', en[0].isIntersecting); }, { rootMargin: '0px 0px -35% 0px' }).observe(hero);
    }
    document.addEventListener('focusin', werk); document.addEventListener('focusout', function () { setTimeout(werk, 50); });
    new MutationObserver(werk).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /* Kennisbank: filter op onderwerp */
  document.querySelectorAll('.kb-filter').forEach(function (f) {
    var kaarten = document.querySelectorAll('.kb');
    f.addEventListener('click', function (ev) {
      var b = ev.target.closest('.chip'); if (!b) return;
      f.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      var o = b.textContent.trim();
      kaarten.forEach(function (k) { k.hidden = o !== 'Alles' && k.querySelector('.kb-onderwerp').firstChild.textContent.trim() !== o; });
    });
  });
})();

/* ===================== Lusion-principes: vastgepinde cases, omdraaiende pakketkaarten ===================== */
(function () {
  var stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* pakketkaarten draaien om zodra de rij in beeld komt */
  document.querySelectorAll('.pk2-rij').forEach(function (r) {
    if (stil || !('IntersectionObserver' in window)) { r.classList.add('omgedraaid'); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { r.classList.add('omgedraaid'); io.disconnect(); } }, { threshold: .25 });
    io.observe(r); setTimeout(function () { var b = r.getBoundingClientRect(); if (b.top < innerHeight && b.bottom > 0) r.classList.add('omgedraaid'); }, 1200);
  });
  /* cases: vastpinnen op brede schermen als de inhoud in een scherm past */
  var sec = document.querySelector('[data-pin]'); if (!sec || stil) return;
  var pin = sec.querySelector('.cases2-pin'), sl = sec.querySelector('[data-slider]'), n = sl.querySelectorAll('.slide').length;
  var balk = document.createElement('div'); balk.className = 'pin-voortgang'; balk.innerHTML = '<i></i>'; balk.setAttribute('aria-hidden', 'true'); pin.appendChild(balk);
  var aan = false, VASTZETTEN = false; /* ronde 5b: niet meer vastzetten; het leverde een lang bijna leeg vlak op. true zet het terug */
  function meet() {
    sec.classList.remove('pinnen'); aan = false;
    if (VASTZETTEN && innerWidth >= 1000) { sec.style.setProperty('--pin-n', n - 1); sec.classList.add('pinnen'); var z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1; var inhoud = Array.prototype.reduce.call(pin.children, function (s, c) { return s + c.offsetHeight; }, 0) + 140; if (inhoud * z <= innerHeight) aan = true; else sec.classList.remove('pinnen'); }
    werk();
  }
  function voortgang() { var r = sec.getBoundingClientRect(); var lengte = sec.offsetHeight - innerHeight; return Math.min(1, Math.max(0, -r.top / Math.max(1, lengte))); }
  function werk() {
    var p = aan ? voortgang() : 0; balk.style.setProperty('--p', aan ? p : 0); balk.hidden = !aan;
    if (aan) sl.scrollLeft = p * (sl.scrollWidth - sl.clientWidth);
  }
  /* pijlen en stippen scrollen de pagina als hij vastgepind staat */
  sec.addEventListener('click', function (ev) {
    if (!aan) return; var b = ev.target.closest('[data-stap],[data-naar]'); if (!b) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    var nu = Math.round(voortgang() * (n - 1)), doel = b.dataset.naar != null ? +b.dataset.naar : Math.min(n - 1, Math.max(0, nu + +b.dataset.stap));
    var top = sec.getBoundingClientRect().top + scrollY + (doel / (n - 1)) * (sec.offsetHeight - innerHeight) + 1;
    scrollTo({ top: top, behavior: 'smooth' });
  }, true);
  var tk = false; addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; werk(); }); } }, { passive: true });
  addEventListener('resize', meet); addEventListener('load', meet); meet();
})();

/* 4d: de visiezin licht woord voor woord op terwijl je scrolt; zonder JS of met minder beweging staat hij meteen vol */
(function () {
  var zinnen = document.querySelectorAll('.visiezin[data-oplichten]'); if (!zinnen.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { zinnen.forEach(function (z) { z.querySelectorAll('.vz-w').forEach(function (w) { w.classList.add('aan'); }); }); return; }
  function werk() {
    zinnen.forEach(function (z) {
      var r = z.getBoundingClientRect(), w = z.querySelectorAll('.vz-w');
      var p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (innerHeight * .45)));
      var n = Math.round(p * w.length); w.forEach(function (x, i) { x.classList.toggle('aan', i < n); });
    });
  }
  var tk = false; addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; werk(); }); } }, { passive: true }); werk();
})();

/* 4e: reviewband pauzeert bij aanraken (telefoon) */
document.querySelectorAll('[data-rv]').forEach(function (b) {
  b.addEventListener('touchstart', function () { b.classList.add('pauze'); }, { passive: true });
  b.addEventListener('touchend', function () { setTimeout(function () { b.classList.remove('pauze'); }, 1200); }, { passive: true });
});

/* het grote woordmerk in de footer vult de breedte en loopt nooit over, ook bij een langere naam */
(function () {
  var wm = document.querySelector('.woordmerk'); if (!wm) return;
  function pas() { wm.style.fontSize = ''; var vs = parseFloat(getComputedStyle(wm).fontSize); if (wm.scrollWidth > wm.clientWidth) wm.style.fontSize = (vs * wm.clientWidth / wm.scrollWidth * .98) + 'px'; }
  pas(); addEventListener('resize', pas); if (document.fonts) document.fonts.ready.then(pas);
})();

/* ronde 5: bewegende schermen in de cases: pas laden en afspelen als ze in beeld zijn; bij minder beweging alleen het stilstaande beeld */
(function () {
  var vids = document.querySelectorAll('video[data-lazy-video]'); if (!vids.length) return;
  /* het stilstaande beeld pas zetten als de video bijna in beeld komt, zodat het de eerste weergave niet vertraagt */
  var pio = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting && x.target.dataset.poster) { x.target.poster = x.target.dataset.poster; pio.unobserve(x.target); } }); }, { rootMargin: '600px 0px' }) : null;
  vids.forEach(function (v) { if (pio) pio.observe(v); else v.poster = v.dataset.poster; });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (x) { var v = x.target;
      if (x.isIntersecting) { if (!v.dataset.geladen) { v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.dataset.src; }); v.load(); v.dataset.geladen = '1'; } var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else if (!v.paused) v.pause();
    });
  }, { rootMargin: '200px 0px', threshold: .01 });
  vids.forEach(function (v) { io.observe(v); });
})();

/* Gedeeld (ronde 3): korte loops laden pas als ze in beeld komen, pauzeren buiten beeld; bij reduced motion blijft het posterbeeld staan.
   Getallen tellen op als ze in beeld komen (number ticker). */
(function () {
  var stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vids = document.querySelectorAll('video.lus[data-src]');
  if (!stil && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        var v = x.target;
        if (x.isIntersecting) { if (!v.src) { v.src = v.dataset.src; } var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (v.src) v.pause();
      });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { io.observe(v); });
  }
  var getallen = document.querySelectorAll('[data-tel]');
  if (!stil && 'IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return; io2.unobserve(x.target);
        var el = x.target, doel = +el.dataset.tel, t0 = performance.now(), duur = 900;
        if (!/^\d+$/.test(el.dataset.tel)) return; /* ronde 5: alleen zuivere getallen tellen op; '€ 50k+' en '24/7' blijven zoals ze zijn */
        (function stap(nu) { var p = Math.min(1, (nu - t0) / duur); el.textContent = Math.round(doel * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(stap); })(t0);
      });
    }, { threshold: .6 });
    getallen.forEach(function (g) { if (!/^\d+$/.test(g.dataset.tel || '')) return; g.textContent = '0'; io2.observe(g); });
  }
})();
/* Samensteller: modules combineren; de keuze gaat mee naar het formulier. */
(function () {
  document.querySelectorAll('[data-samen]').forEach(function (s) {
    var boxen = s.querySelectorAll('input[type=checkbox]'), lijst = s.querySelector('[data-samen-lijst]'), leeg = s.querySelector('[data-samen-leeg]'), tel = s.querySelector('[data-samen-tel]'), knop = s.querySelector('[data-samen-knop]');
    function werk() {
      var gekozen = Array.prototype.filter.call(boxen, function (b) { return b.checked; }).map(function (b) { return b.value; });
      lijst.innerHTML = ''; gekozen.forEach(function (n) { var li = document.createElement('li'); li.textContent = n; lijst.appendChild(li); });
      tel.textContent = gekozen.length; leeg.hidden = gekozen.length > 0; knop.setAttribute('aria-disabled', gekozen.length ? 'false' : 'true');
      s.classList.toggle('heeft-keuze', gekozen.length > 0);
      return gekozen;
    }
    boxen.forEach(function (b) { b.addEventListener('change', werk); });
    knop.addEventListener('click', function (ev) {
      var g = werk(); if (!g.length) { ev.preventDefault(); return; }
      var veld = document.querySelector('.formulier input[name=modules]');
      if (veld) { veld.value = g.join(', '); veld.closest('label').hidden = false;
        var paneel = veld.closest('[role=tabpanel]'); if (paneel && paneel.hidden) { var tab = document.getElementById(paneel.getAttribute('aria-labelledby')); if (tab) tab.click(); } }
    });
    werk();
  });
})();
