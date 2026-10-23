/* Express Bible Presenter - welcome animation (plays after sign-in).
   Self-contained: builds its own full-screen overlay, never touches the dashboards, projector, OBS or remote.
   Always plays the full version, with no skip button. Not shown on OBS / remote pages or with "reduce motion". */
(function () {
  'use strict';
  var q = location.search;
  if (/[?&]mode=(obs|remote)\b/.test(q) || /remote\.html/.test(location.pathname)) return;
  var KEY = 'ebp_welcome_day', played = false;
  var CSS = `
#wibox{position:relative;width:min(100vw,177.78vh);height:min(56.25vw,100vh);container-type:size}
#wibox canvas,#wibox svg,#wibox #wititle,#wibox #wineb{position:absolute;inset:0;width:100%;height:100%}
#wistars{opacity:0;transition:opacity 1.2s}
#wibox svg *{transform-box:view-box}


/* bible */
#wibible{transform:translate(-107px,40px);opacity:0;transition:opacity 1s,transform 1.4s cubic-bezier(.3,.1,.2,1)}
#wibible.in{opacity:1;transform:translate(-107px,0)}
#wibible.open{transform:translate(0,0)}
#wiflip{transform-origin:800px 640px;transition:transform .7s ease-in,opacity .2s .65s}
#wibible.open #wiflip{transform:scaleX(0);opacity:0}
#wilpage{transform-origin:800px 640px;transform:scaleX(0);transition:transform .8s ease-out .6s}
#wibible.open #wilpage{transform:scaleX(1)}
#wilbase{opacity:0;transition:opacity .3s .6s}#wibible.open #wilbase{opacity:1}
#wibglow{opacity:0;transition:opacity 1s}#wibglow.on{opacity:1;animation:wipulse 2s ease-in-out infinite}
@keyframes wipulse{50%{opacity:.55}}
#wiheaven{transform-origin:800px 0;transform:scaleY(0);opacity:0}
#wiheaven.on{animation:wibeam 2.6s ease-out forwards}
@keyframes wibeam{0%{transform:scaleY(0);opacity:0}30%{transform:scaleY(1);opacity:1}75%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);opacity:0}}
#witopglow{opacity:0}#witopglow.on{animation:witg 2.6s ease-out forwards}
@keyframes witg{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
#wiray{stroke-dasharray:900;stroke-dashoffset:900;opacity:0}
#wiray.on{opacity:1;animation:widraw 1.3s ease-in-out forwards}
@keyframes widraw{to{stroke-dashoffset:0}}
.wiorb{offset-path:path('M800 600 C 950 380, 1150 380, 1222 540');offset-distance:0%;opacity:0}
.wiorb.on{animation:wiorb 1.3s ease-in-out forwards}
@keyframes wiorb{0%{offset-distance:0%;opacity:0}15%{opacity:1}85%{opacity:1}100%{offset-distance:100%;opacity:0}}
#wilens{opacity:.15;transition:opacity .5s}#wilens.on{opacity:1;filter:drop-shadow(0 0 14px #bfe3ff)}
#wicone{opacity:0;transition:opacity 1s}#wicone.on{opacity:1}
#wiscreen{opacity:0;transform-origin:580px 280px;transform:scale(.9);transition:opacity .9s,transform .9s}
#wiscreen.on{opacity:1;transform:scale(1)}
#wiworld{transform-origin:580px 280px;transition:transform 1.8s cubic-bezier(.65,0,.25,1),opacity 1.2s}
#wiworld.zoom{transform:scale(3.4)}

#wigal{transform-origin:580px 280px;animation:wispin 60s linear infinite}
@keyframes wispin{to{transform:rotate(360deg)}}
/* title */
#wititle{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none}
#wineb{opacity:0;transition:opacity 2s;pointer-events:none;background:radial-gradient(ellipse at 38% 45%,rgba(255,170,220,.28),transparent 45%),radial-gradient(ellipse at 62% 58%,rgba(90,110,255,.3),transparent 50%),radial-gradient(ellipse at 50% 50%,rgba(255,215,120,.16),transparent 60%)}#wineb.on{opacity:1}
#wit1{font-size:3.2cqw;letter-spacing:.9cqw;color:#cfe6ff;opacity:0;transform:translateY(12px);transition:all 1s;font-weight:600;text-shadow:0 0 12px #6fb4ff}
#wit2{font-size:7.4cqw;font-weight:900;letter-spacing:.3cqw;line-height:1.05;margin-top:1cqw;color:#fff;opacity:0;filter:blur(14px);transform:scale(1.12);transition:all 1.4s cubic-bezier(.2,.7,.2,1);
 background:linear-gradient(100deg,#fff6d0 0%,#ffd66b 30%,#fff 50%,#ffd66b 70%,#fff6d0 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
#wit2.on{opacity:1;filter:blur(0);transform:scale(1);animation:wishine 3.2s linear infinite 1.2s}
#wit1.on{opacity:1;transform:none}
@keyframes wishine{to{background-position:-250% 0}}
#wiglowwrap{position:relative;display:inline-block}
#wiglowwrap::before{content:"";position:absolute;inset:-18% -8%;background:radial-gradient(ellipse,rgba(255,200,90,.42),transparent 65%);opacity:0;transition:opacity 1.5s;filter:blur(18px)}
#wiglowwrap.on::before{opacity:1;animation:wibreathe 2.6s ease-in-out infinite}
#wiglowwrap.on #wit2{filter:drop-shadow(0 0 .9cqw rgba(255,200,80,.85)) drop-shadow(0 0 2.4cqw rgba(255,170,40,.6))}
@keyframes wibreathe{50%{opacity:.55;transform:scale(1.06)}}
.wisp{position:absolute;width:.7cqw;height:.7cqw;background:#fff;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);opacity:0;filter:drop-shadow(0 0 6px #ffd66b)}
.wisp.on{animation:witw 1.8s ease-in-out infinite}
@keyframes witw{0%,100%{opacity:0;transform:scale(.2) rotate(0)}50%{opacity:1;transform:scale(1.4) rotate(90deg)}}
#wibar{position:absolute;left:50%;bottom:6cqh;width:22cqw;height:3px;transform:translateX(-50%);background:#ffffff22;border-radius:3px;opacity:0;transition:opacity .6s}
#wibar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd66b,#fff);border-radius:3px}
#wibar.on{opacity:1}#wibar.on i{animation:wild 2.2s linear forwards}
@keyframes wild{to{width:100%}}
`;
  var SVG = `<svg id="wisvg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
<defs>
<linearGradient id="wigb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset=".6" stop-color="#ffd66b" stop-opacity=".55"/><stop offset="1" stop-color="#ffd66b" stop-opacity="0"/></linearGradient>
<linearGradient id="wigcone" x1="1" x2="0"><stop offset="0" stop-color="#cfe8ff" stop-opacity=".55"/><stop offset="1" stop-color="#cfe8ff" stop-opacity=".12"/></linearGradient>
<radialGradient id="wigg"><stop offset="0" stop-color="#ffe9b0"/><stop offset=".25" stop-color="#ff9ad5" stop-opacity=".7"/><stop offset=".6" stop-color="#5a6cff" stop-opacity=".45"/><stop offset="1" stop-color="#05061a" stop-opacity="0"/></radialGradient>
<radialGradient id="wigbg"><stop offset="0" stop-color="#ffe08a" stop-opacity=".9"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
<linearGradient id="wileather" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a2e18"/><stop offset=".5" stop-color="#3a1b0e"/><stop offset="1" stop-color="#2a1208"/></linearGradient>
<linearGradient id="wipg" x1="0" x2="1"><stop offset="0" stop-color="#d9ccaa"/><stop offset=".12" stop-color="#f6ecd0"/><stop offset="1" stop-color="#fbf3da"/></linearGradient>
<linearGradient id="wipgl" x1="1" x2="0"><stop offset="0" stop-color="#d9ccaa"/><stop offset=".12" stop-color="#f6ecd0"/><stop offset="1" stop-color="#fbf3da"/></linearGradient>
<filter id="wiblur"><feGaussianBlur stdDeviation="8"/></filter><filter id="wiblur2"><feGaussianBlur stdDeviation="3"/></filter>
<clipPath id="wisc"><rect x="148" y="108" width="864" height="344" rx="6"/></clipPath>
</defs>
<g id="wiworld">
 <polygon id="wicone" points="1222,540 1020,100 1020,460" fill="url(#wigcone)"/>
 <g id="wiscreen">
  <rect id="wiframe" x="140" y="100" width="880" height="360" rx="10" fill="#0a0d1f" stroke="#8ea4d8" stroke-width="3" style="transition:opacity 1s"/>
  <g clip-path="url(#wisc)"><rect x="148" y="108" width="864" height="344" fill="#03040f"/>
   <g id="wigal"><circle cx="580" cy="280" r="150" fill="url(#wigg)" opacity=".55"/><g id="wiarms" filter="url(#wiblur2)"></g><circle cx="580" cy="280" r="46" fill="url(#wigbg)"/></g>
   <g id="wisstars"></g>
   <g id="wiverse" style="opacity:0;transition:opacity 1.1s"><rect x="148" y="108" width="864" height="344" fill="#02030f" opacity=".55"/>
   <text x="580" y="262" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="33" fill="#fff7dc" style="filter:drop-shadow(0 0 8px #ffd66b)">“And he said unto them, Go ye into all the world,</text>
   <text x="580" y="308" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="33" fill="#fff7dc" style="filter:drop-shadow(0 0 8px #ffd66b)">and preach the gospel to every creature.”</text>
   <text x="580" y="366" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="24" letter-spacing="4" fill="#ffd66b">MARK 16:15</text></g></g>
 </g>
 <g id="wiproj"><rect x="1222" y="500" width="150" height="80" rx="12" fill="#2b3350" stroke="#7d8cc0" stroke-width="3"/><rect x="1250" y="580" width="12" height="40" fill="#555e86"/><rect x="1330" y="580" width="12" height="40" fill="#555e86"/>
 <circle id="wilens" cx="1222" cy="540" r="24" fill="#e8f5ff" stroke="#9cc4ff" stroke-width="4"/></g>
 <g id="wibible">
  <ellipse id="wibglow" cx="800" cy="640" rx="360" ry="150" fill="url(#wigbg)" filter="url(#wiblur)"/>
  <ellipse cx="800" cy="728" rx="250" ry="14" fill="#000" opacity=".45" filter="url(#wiblur2)"/>
  <!-- right cover + page block -->
  <rect x="800" y="568" width="222" height="148" rx="7" fill="url(#wileather)" stroke="#c9a24a" stroke-width="2.5"/>
  <path d="M800 704 Q910 714 1012 704 L1012 698 Q910 708 800 698Z M800 700 Q910 710 1012 700" fill="#e9dfc0" stroke="#b8a77a" stroke-width="1.5"/>
  <path d="M800 578 Q905 562 1008 578 L1008 696 Q905 683 800 696Z" fill="url(#wipg)" stroke="#b8a77a" stroke-width="1.5"/>
  <path d="M1008 580 v114 M1011 582 v112 M1014 584 v110" stroke="#cdbf96" stroke-width="1.4"/>
  <text x="905" y="596" text-anchor="middle" font-family="Georgia,serif" font-size="9" letter-spacing="2" fill="#6b5a35">GENESIS 1</text>
  <path d="M814 612h86M814 618h86M814 624h86M814 630h86M814 636h82M814 642h86M814 648h86M814 654h86M814 660h86M814 666h82M814 672h86M814 678h86M814 684h86 M912 612h86M912 618h86M912 624h86M912 630h86M912 636h82M912 642h86M912 648h86M912 654h86M912 660h86M912 666h82M912 672h86M912 678h86M912 684h86" stroke="#8a7a52" stroke-width="2" opacity=".75"/>
  <!-- left base -->
  <rect id="wilbase" x="578" y="568" width="222" height="148" rx="7" fill="url(#wileather)" stroke="#c9a24a" stroke-width="2.5"/>
  <g id="wilpage">
   <path d="M800 578 Q695 562 592 578 L592 696 Q695 683 800 696Z" fill="url(#wipgl)" stroke="#b8a77a" stroke-width="1.5"/>
   <path d="M592 580 v114 M589 582 v112 M586 584 v110" stroke="#cdbf96" stroke-width="1.4"/>
   <text x="695" y="596" text-anchor="middle" font-family="Georgia,serif" font-size="9" letter-spacing="2" fill="#6b5a35">THE HOLY BIBLE</text>
   <path d="M606 612h86M606 618h86M606 624h86M606 630h86M606 636h82M606 642h86M606 648h86M606 654h86M606 660h86M606 666h82M606 672h86M606 678h86M606 684h86 M704 612h84M704 618h84M704 624h84M704 630h84M704 636h80M704 642h84M704 648h84M704 654h84M704 660h84M704 666h80M704 672h84M704 678h84M704 684h84" stroke="#8a7a52" stroke-width="2" opacity=".75"/>
  </g>
  <rect x="796" y="574" width="8" height="128" fill="#8a6a2c" opacity=".55"/>
  <path d="M816 696 q-2 30 6 42 l6 -8 l6 8 q4 -22 -2 -42z" fill="#a8171f" stroke="#6b0e14" stroke-width="1"/>
  <g id="wiflip"><rect x="800" y="568" width="222" height="148" rx="7" fill="url(#wileather)" stroke="#e0bf63" stroke-width="3"/>
   <rect x="812" y="580" width="198" height="124" rx="3" fill="none" stroke="#e0bf63" stroke-width="1.6"/>
   <path d="M911 602v38M898 614h26" stroke="#f0cf75" stroke-width="5" stroke-linecap="round"/>
   <text x="911" y="672" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="20" letter-spacing="3" fill="#f0cf75">HOLY BIBLE</text>
   <path d="M800 568v148" stroke="#2a130a" stroke-width="5"/><path d="M826 570v144M834 570v144" stroke="#c9a24a" stroke-width="1.5" opacity=".7"/></g>
 </g>
 <polygon id="wiheaven" points="720,0 880,0 980,640 620,640" fill="url(#wigb)"/>
 <ellipse id="witopglow" cx="800" cy="0" rx="260" ry="90" fill="#fff3b8" filter="url(#wiblur)"/>
 <path id="wiray" d="M800 600 C 950 380, 1150 380, 1222 540" fill="none" stroke="#ffe9a0" stroke-width="5" stroke-linecap="round" filter="url(#wiblur2)"/>
 <g id="wiorbs"></g>
</g>
</svg>`;
  var VERSE_OK = true;

  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  window.ebpPlayWelcome = function () {
    if (played) return; played = true;
    try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    var full = true; /* always the full animation, every time the app opens */

    var root = document.createElement('div');
    root.id = 'wiroot';
    root.style.cssText = 'position:fixed;inset:0;z-index:2000000;background:#02030a;display:flex;align-items:center;justify-content:center;overflow:hidden;opacity:1;transition:opacity .9s';
    root.innerHTML = '<style>' + CSS + '</style><div id="wibox"><canvas id="wistars"></canvas>' + SVG +
      '<div id="wineb"></div><div id="wititle"><div id="wit1">WELCOME TO</div><div id="wiglowwrap"><div id="wit2">EXPRESS BIBLE<br>PRESENTER</div></div></div><div id="wibar"><i></i></div></div>';
    document.body.appendChild(root);
    var $ = function (id) { return root.querySelector('#wi' + id); };

    /* The title block is #wititle / #wit1 / #wit2 in HTML (ids differ from the SVG ids) */
    var cv = $('stars'), cx = cv.getContext('2d'), S = [], raf = 0, timers = [], done = false;
    function fit() {
      cv.width = cv.clientWidth; cv.height = cv.clientHeight;
      S = []; for (var i = 0; i < 240; i++) S.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, r: Math.random() * 1.6 + .2, p: Math.random() * 6, s: Math.random() * .4 + .05 });
    }
    fit(); window.addEventListener('resize', fit);
    function loop(t) {
      cx.clearRect(0, 0, cv.width, cv.height);
      var g = cx.createRadialGradient(cv.width / 2, cv.height / 2, 0, cv.width / 2, cv.height / 2, cv.width * .7);
      g.addColorStop(0, '#0d1233'); g.addColorStop(1, '#02030a'); cx.fillStyle = g; cx.fillRect(0, 0, cv.width, cv.height);
      for (var i = 0; i < S.length; i++) { var s = S[i]; s.y -= s.s * .25; if (s.y < 0) s.y = cv.height; cx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t / 900 + s.p)); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 7); cx.fill(); }
      cx.globalAlpha = 1; raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    var NS = 'http://www.w3.org/2000/svg';
    function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
    var arms = $('arms'), cols = ['#ffb3e6', '#9aa8ff', '#ffe3a0', '#8fe0ff'];
    for (var a = 0; a < 2; a++) for (var i = 0; i < 110; i++) {
      var t = i / 110 * 5.2, r = 18 + t * 34, ang = t + a * Math.PI + (Math.random() - .5) * .35;
      mk('circle', { cx: 580 + Math.cos(ang) * r * 1.5, cy: 280 + Math.sin(ang) * r * .82, r: 2 + Math.random() * 7 * (1 - t / 6), fill: cols[(Math.random() * 4) | 0], opacity: .25 + Math.random() * .45 }, arms);
    }
    var ss = $('sstars');
    for (i = 0; i < 90; i++) mk('circle', { cx: 155 + Math.random() * 850, cy: 115 + Math.random() * 330, r: Math.random() * 1.8 + .3, fill: '#fff', opacity: Math.random() * .8 + .2 }, ss);
    var ob = $('orbs'), orbs = [];
    for (i = 0; i < 5; i++) { var c = mk('circle', { r: 10 - i, fill: '#fff6c8', 'class': 'wiorb' }, ob); c.style.animationDelay = (i * .18) + 's'; c.style.filter = 'drop-shadow(0 0 10px #ffd66b)'; orbs.push(c); }
    var gw = $('glowwrap'), sps = [];
    for (i = 0; i < 22; i++) { var d = document.createElement('div'); d.className = 'wisp'; d.style.left = (Math.random() * 104 - 2) + '%'; d.style.top = (Math.random() * 120 - 10) + '%'; d.style.animationDelay = (Math.random() * 1.8) + 's'; d.style.animationDuration = (1.2 + Math.random() * 1.4) + 's'; gw.appendChild(d); sps.push(d); }

    function at(ms, f) { timers.push(setTimeout(f, ms)); }
    function cls(el, v) { el.setAttribute('class', v); }
    function showTitle() { $('neb').classList.add('on'); $('t1').classList.add('on'); $('t2').classList.add('on'); gw.classList.add('on'); sps.forEach(function (s) { s.classList.add('on'); }); }
    function finish() {
      if (done) return; done = true; timers.forEach(clearTimeout);
      root.style.opacity = 0;
      setTimeout(function () { cancelAnimationFrame(raf); window.removeEventListener('resize', fit); if (root.parentNode) root.remove(); }, 950);
    }

    $('stars').style.opacity = 1;
    if (!full) {                       /* short version, about 3 s */
      $('world').style.display = 'none';
      at(200, function () { $('neb').classList.add('on'); });
      at(400, function () { $('t1').classList.add('on'); });
      at(800, function () { $('t2').classList.add('on'); gw.classList.add('on'); sps.forEach(function (s) { s.classList.add('on'); }); });
      at(3200, finish);
      return;
    }
    /* full version, about 16 s */
    at(700, function () { cls($('bible'), 'in'); });
    at(1700, function () { cls($('bible'), 'in open'); });
    at(3000, function () { cls($('heaven'), 'on'); cls($('topglow'), 'on'); });
    at(3600, function () { cls($('bglow'), 'on'); });
    at(4100, function () { cls($('ray'), 'on'); orbs.forEach(function (o) { o.classList.add('on'); }); });
    at(5300, function () { cls($('lens'), 'on'); cls($('cone'), 'on'); });
    at(5800, function () { cls($('screen'), 'on'); });
    at(6900, function () { $('verse').style.opacity = 1; });
    at(9400, function () { $('verse').style.opacity = 0; });
    at(10000, function () {
      cls($('world'), 'zoom');
      ['proj', 'cone', 'bible', 'ray', 'orbs', 'heaven'].forEach(function (id) { $(id).style.transition = 'opacity .8s'; });
      ['proj', 'cone', 'bible', 'ray', 'orbs'].forEach(function (id) { $(id).style.opacity = 0; });
    });
    at(10600, function () { $('frame').style.opacity = 0; });
    at(11000, function () { $('world').style.opacity = 0; $('neb').classList.add('on'); });
    at(11300, function () { $('t1').classList.add('on'); });
    at(11700, function () { $('t2').classList.add('on'); gw.classList.add('on'); sps.forEach(function (s) { s.classList.add('on'); }); });
    at(13300, function () { $('bar').classList.add('on'); });
    at(15700, finish);
  };
})();
