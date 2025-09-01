/* =========================================================
   Sweet Sixteen — cykal qivi ichiya putri
   Pure JS (no libraries). Animations via rAF + CSS.
   Effects:
   - Parallax layers (scroll/tilt)
   - Background bokeh + floating hearts (canvas)
   - Click confetti hearts
   - Typewriter text
   - SVG cake candle flame -> blow out + smoke
   - Music with WebAudio (no external file) + localStorage
   - Fireworks + confetti on Make a Wish
   - Modal with rain hearts
   - Keyboard accessible controls
   ========================================================= */

(() => {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Parallax subtle ---------- */
  const layers = $$(".parallax .layer");
  const onScrollParallax = () => {
    const y = window.scrollY || 0;
    // gentle translate for depth
    layers[0].style.transform = `translateY(${y * 0.06}px)`;
    layers[1].style.transform = `translateY(${y * 0.03}px)`;
    layers[2].style.transform = `translateY(${y * 0.015}px)`;
  };
  window.addEventListener("scroll", onScrollParallax, {passive:true});

  /* ---------- Typewriter ---------- */
  const typeEl = $("#typewriter");
  const message = [
    "Untukmu, manis yang berusia enam belas tahun sekarang",
    "semoga setiap langkahmu dipeluk cahaya.",
    "Terima kasih telah memilihku menjadi teman tumbuh,",
    "hari ini, esok, dan seterusnya. 💖"
  ].join(" ");
  function typeWriter(el, text, speed = 26){
    let i = 0;
    const tick = () => {
      el.textContent = text.slice(0, i++);
      if(i <= text.length) req = requestAnimationFrame(tick);
    };
    let req = requestAnimationFrame(tick);
  }
  // Defer until user interacts (for better first paint)
  window.addEventListener("DOMContentLoaded", () => typeWriter(typeEl, message));

  /* ---------- Canvas: background hearts + bokeh ---------- */
  const bgCanvas = $("#bgCanvas");
  const fxCanvas = $("#fxCanvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resizeCanvas(c){
    c.width = Math.floor(innerWidth * dpr);
    c.height = Math.floor(innerHeight * dpr);
    c.style.width = innerWidth + "px";
    c.style.height = innerHeight + "px";
  }
  resizeCanvas(bgCanvas); resizeCanvas(fxCanvas);
  window.addEventListener("resize", () => { resizeCanvas(bgCanvas); resizeCanvas(fxCanvas); }, {passive:true});

  // Background particles
  const bgCtx = bgCanvas.getContext("2d");
  const fxCtx = fxCanvas.getContext("2d");

  const HEARTS = [];
  const BOKEH = [];
  const maxHearts = prefersReduced() ? 20 : 42;
  const maxBokeh = prefersReduced() ? 12 : 22;

  function spawnHeart(){
    return {
      x: Math.random()*bgCanvas.width,
      y: bgCanvas.height + Math.random()*bgCanvas.height*0.3,
      r: (8 + Math.random()*18) * dpr,
      vy: -(0.2 + Math.random()*0.7) * dpr,
      vx: (Math.random() - .5) * 0.15 * dpr,
      alpha: .15 + Math.random()*.35
    };
  }
  function spawnBokeh(){
    return {
      x: Math.random()*bgCanvas.width,
      y: Math.random()*bgCanvas.height,
      r: (20 + Math.random()*70) * dpr,
      alpha: .05 + Math.random()*.12,
      pulse: Math.random()*Math.PI*2
    };
  }
  for(let i=0;i<maxHearts;i++) HEARTS.push(spawnHeart());
  for(let i=0;i<maxBokeh;i++) BOKEH.push(spawnBokeh());

  function drawHeart(ctx, x, y, size, alpha){
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size/24, size/24);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(12, 21);
    ctx.bezierCurveTo(12, 21, 0, 13, 0, 6);
    ctx.bezierCurveTo(0, 2.5, 2.5, 0, 6, 0);
    ctx.bezierCurveTo(8.5, 0, 10.5, 1.5, 12, 3.5);
    ctx.bezierCurveTo(13.5, 1.5, 15.5, 0, 18, 0);
    ctx.bezierCurveTo(21.5, 0, 24, 2.5, 24, 6);
    ctx.bezierCurveTo(24, 13, 12, 21, 12, 21);
    ctx.closePath();
    ctx.fillStyle = "#e2559b";
    ctx.fill();
    ctx.restore();
  }

  function drawBokeh(ctx, b){
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${b.alpha})`;
    ctx.fill();
  }

  function animateBG(){
    bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);

    // Bokeh
    for(const b of BOKEH){
      b.pulse += 0.01;
      const base = b.alpha;
      b.alpha = base + Math.sin(b.pulse)*0.02;
      drawBokeh(bgCtx, b);
    }

    // Hearts floating
    for(const h of HEARTS){
      drawHeart(bgCtx, h.x, h.y, h.r, h.alpha);
      h.x += h.vx; h.y += h.vy;
      if(h.y < -40*dpr || h.x < -40*dpr || h.x > bgCanvas.width + 40*dpr){
        const idx = HEARTS.indexOf(h);
        HEARTS[idx] = spawnHeart();
        HEARTS[idx].y = bgCanvas.height + 10*dpr;
      }
    }
    requestAnimationFrame(animateBG);
  }
  if(!prefersReduced()) requestAnimationFrame(animateBG);

  /* ---------- Click hearts confetti ---------- */
  const bursts = [];
  function spawnBurst(x, y){
    const count = 18;
    for(let i=0;i<count;i++){
      bursts.push({
        x: x*dpr, y: y*dpr,
        vx: (Math.random()*2-1) * 2.2 * dpr,
        vy: (Math.random()*2-1) * 2.2 * dpr,
        life: 1, size: (6+Math.random()*10)*dpr
      });
    }
  }
  function animateFX(){
    fxCtx.clearRect(0,0,fxCanvas.width,fxCanvas.height);
    // bursts
    for(let i=bursts.length-1; i>=0; i--){
      const p = bursts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.03*dpr; p.life -= 0.015;
      drawHeart(fxCtx, p.x, p.y, p.size, Math.max(p.life,0));
      if(p.life<=0) bursts.splice(i,1);
    }
    // fireworks (handled separately but share same canvas)
    renderFireworks();
    requestAnimationFrame(animateFX);
  }
  requestAnimationFrame(animateFX);

  document.addEventListener("pointerdown", (e) => {
    spawnBurst(e.clientX, e.clientY);
  });

  /* ---------- Cake: blow candle ---------- */
  const blowBtn = $("#blowBtn");
  const flame = $("#cake .flame");
  const smoke = $("#cake .smoke");
  let candleOut = false;

  function blowCandle(){
    if(candleOut) return;
    candleOut = true;
    // fade flame out
    flame.style.transition = "opacity .8s var(--ease)";
    flame.style.opacity = "0";
    // show smoke
    smoke.style.transition = "opacity .8s var(--ease)";
    smoke.style.opacity = "1";
    // little puff burst
    const rect = $("#cake").getBoundingClientRect();
    spawnBurst(rect.left + rect.width/2, rect.top + rect.height*0.28);
    // gentle whoosh with audio
    whoosh();
  }
  blowBtn.addEventListener("click", blowCandle);
  blowBtn.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); blowCandle(); }});
  $("#scrollWords").addEventListener("click", ()=> $("#kata").scrollIntoView({behavior:"smooth"}));
/* ---------- Musik pakai <audio> file ---------- */
const musicBtn = document.getElementById("musicBtn");
const audioEl  = document.getElementById("bgMusic");
let musicOn = false;

function toggleMusic(){
  if (audioEl.paused){
    audioEl.play().catch(()=>{});   // butuh gesture user di browser modern
    musicOn = true;
    localStorage.setItem("musicOn","1");
    musicBtn.classList.add("on");
    musicBtn.title = "Jeda musik";
    musicBtn.setAttribute("aria-label","Jeda musik romantis");
  } else {
    audioEl.pause();
    musicOn = false;
    localStorage.setItem("musicOn","0");
    musicBtn.classList.remove("on");
    musicBtn.title = "Putar musik";
    musicBtn.setAttribute("aria-label","Putar musik romantis");
  }
}

musicBtn.addEventListener("click", toggleMusic);
musicBtn.addEventListener("keydown", e=>{
  if(e.key==="Enter"||e.key===" "){
    e.preventDefault();
    toggleMusic();
  }
});

// restore preferensi setelah interaksi pertama
document.addEventListener("pointerdown", function once(){
  const pref = localStorage.getItem("musicOn");
  if (pref === "1") audioEl.play().catch(()=>{});
  document.removeEventListener("pointerdown", once);
}, {once:true});


  // small whoosh when blowing candle
  function whoosh(){
    if(!audioCtx) initAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.value = 600;
    g.gain.value = 0.15;
    const lp = audioCtx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 800;
    o.connect(lp).connect(g).connect(audioCtx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.55);
    o.stop(audioCtx.currentTime + 0.6);
  }

  /* ---------- Fireworks + Confetti ---------- */
  const rockets = [];
  const sparks = [];
  let fireworksOn = false;

  function launchFirework(){
    const x = (innerWidth*0.2 + Math.random()*innerWidth*0.6) * dpr;
    const y = fxCanvas.height;
    rockets.push({x, y, vy: -(3.5 + Math.random()*1.8)*dpr, vx: (Math.random()-.5)*0.6*dpr, exploded:false, color: randomColor()});
  }
  function explode(x,y,color){
    const N = 80;
    for(let i=0;i<N;i++){
      const angle = (i/N)*Math.PI*2;
      const speed = (1.2 + Math.random()*1.8)*dpr;
      sparks.push({
        x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
        life: 1.2 + Math.random()*0.6, color
      });
    }
    // add confetti rain
    for(let i=0;i<40;i++){
      bursts.push({
        x: x, y: y, vx: (Math.random()-.5)*1.2*dpr, vy: (Math.random()-.2)*1.1*dpr,
        life: 1, size:(5+Math.random()*8)*dpr
      });
    }
  }
  function randomColor(){
    const pastel = ["#ffc6e0","#e6d1ff","#ffdba9","#c6f1ff","#ffe6f2"];
    return pastel[Math.floor(Math.random()*pastel.length)];
  }

  function renderFireworks(){
    // rockets
    for(let i=rockets.length-1; i>=0; i--){
      const r = rockets[i];
      r.x += r.vx; r.y += r.vy; r.vy += 0.03*dpr;
      fxCtx.fillStyle = r.color;
      fxCtx.fillRect(r.x, r.y, 2*dpr, 6*dpr);
      if(r.vy >= -0.2*dpr && !r.exploded){
        r.exploded = true; explode(r.x, r.y, r.color); rockets.splice(i,1);
      }
    }
    // sparks
    for(let i=sparks.length-1; i>=0; i--){
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vy += 0.018*dpr; s.life -= 0.012;
      fxCtx.globalAlpha = Math.max(s.life,0);
      fxCtx.beginPath(); fxCtx.arc(s.x, s.y, 2.2*dpr, 0, Math.PI*2); fxCtx.fillStyle = s.color; fxCtx.fill();
      fxCtx.globalAlpha = 1;
      if(s.life <= 0) sparks.splice(i,1);
    }
  }

  const wishBtn = $("#wishBtn");
  function makeWish(){
    if(prefersReduced()) return;
    fireworksOn = true;
    // volley of fireworks
    for(let i=0;i<6;i++) setTimeout(launchFirework, i*260);
    // celebratory text burst near button
    const rect = wishBtn.getBoundingClientRect();
    spawnBurst(rect.left + rect.width/2, rect.top + rect.height/2);
    thump();
  }
  wishBtn.addEventListener("click", makeWish);
  wishBtn.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); makeWish(); }});
  function thump(){ // tiny kick
    if(!audioCtx) initAudio();
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = "sine"; o.frequency.value = 140; g.gain.value = 0.2;
    o.connect(g).connect(audioCtx.destination); o.start();
    o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
    o.stop(audioCtx.currentTime + 0.22);
  }

  /* ---------- Modal + Rain Hearts ---------- */
  const modal = $("#modalSurprise");
  const openModalBtn = $("#surpriseBtn");
  const closeModalBtn = $("#closeModal");
  const rainHeartsBtn = $("#rainHeartsBtn");

  function openModal(){
    modal.hidden = false;
    modal.focus();
    // small burst
    const r = openModalBtn.getBoundingClientRect();
    spawnBurst(r.left + r.width/2, r.top);
    // trap focus rudimentary
    document.addEventListener("keydown", escClose);
  }
  function closeModal(){
    modal.hidden = true;
    document.removeEventListener("keydown", escClose);
  }
  function escClose(e){ if(e.key==="Escape") closeModal(); }

  openModalBtn.addEventListener("click", openModal);
  openModalBtn.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openModal(); }});
  closeModalBtn.addEventListener("click", closeModal);

  function rainHearts(){
    const count = prefersReduced() ? 50 : 140;
    for(let i=0;i<count;i++){
      bursts.push({
        x: Math.random()*fxCanvas.width,
        y: -10*dpr,
        vx: (Math.random()-.5)*0.6*dpr,
        vy: (0.8+Math.random()*0.4)*dpr,
        life: 1.2+Math.random()*0.6,
        size: (6+Math.random()*10)*dpr
      });
    }
  }
  rainHeartsBtn.addEventListener("click", rainHearts);

  /* ---------- Peluk Virtual ---------- */
  const hugBtn = $("#hugBtn");
  hugBtn.addEventListener("click", ()=>{
    hugBtn.classList.add("hugged");
    hugBtn.textContent = "🤗 !";
    setTimeout(()=>{ hugBtn.classList.remove("hugged"); hugBtn.textContent = "🤗 Peluk Virtual"; }, 2200);
    // big heart burst
    const r = hugBtn.getBoundingClientRect();
    spawnBurst(r.left + r.width/2, r.top + r.height/2);
  });

  /* ---------- Optional: Hover tilt demo (if you add an image) ---------- */
  // Example usage: add HTML block with class "tilt-card"
  $$(".tilt-card .card").forEach(card=>{
    const onMove = (e)=>{
      const rect = card.getBoundingClientRect();
      const mx = (e.clientX - rect.left)/rect.width;
      const my = (e.clientY - rect.top)/rect.height;
      const rx = (my - 0.5)*10;
      const ry = (mx - 0.5)*-14;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const reset = ()=> card.style.transform = "rotateX(0) rotateY(0)";
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", reset);
  });

  /* ---------- Keyboard nav for anchors ---------- */
  $$("a[href^='#']").forEach(a=>{
    a.addEventListener("click", (e)=>{
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:"smooth", block:"start"});
      }
    });
  });

})();


