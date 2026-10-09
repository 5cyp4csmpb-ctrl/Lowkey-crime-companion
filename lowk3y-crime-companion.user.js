// ==UserScript==
// @name         LowK3y Crime Companion
// @namespace    https://github.com/5cyp4csmpb-ctrl/Lowkey-crime-companion
// @version      0.1.2
// @description  Subtle read-only contextual help for Torn Crimes 2.0, including Torn PDA.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowkey-crime-companion/main/lowk3y-crime-companion.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowkey-crime-companion/main/lowk3y-crime-companion.user.js
// ==/UserScript==
(() => {
  'use strict';
  const ID = 'lowk3y-crime-companion-v1';
  const KEY = 'lowk3y-crime-companion-collapsed';
  const crimes = ['Search for Cash','Bootlegging','Graffiti','Shoplifting','Pickpocketing','Card Skimming','Burglary','Hustling','Disposal','Cracking','Forgery','Scamming','Arson','Bounty Hunting'];
  let timer;
  function onCrimesPage() {
    const url = (location.pathname + location.search + location.hash).toLowerCase();
    return url.includes('crimes') || url.includes('sid=crimes') || url.includes('sid=crime');
  }
  function findCrime() {
    const headings = [...document.querySelectorAll('h1,h2,h3,[class*="title"],[class*="heading"]')]
      .filter(el => !el.closest('#' + ID))
      .map(el => (el.textContent || '').trim());
    return crimes.find(c => headings.some(h => h.toLowerCase() === c.toLowerCase())) || null;
  }
  function mount() {
    const existing = document.getElementById(ID);
    if (!onCrimesPage()) { existing?.remove(); return; }
    const anchor = document.querySelector('[class*="crimeList"], [class*="crimesList"], [class*="crime-list"], [class*="crimes-list"], #mainContainer, #main-container, main, .content-wrapper, #content-wrapper, #content');
    if (!anchor) return;
    // Keep the companion within Torn's crime content, not the PDA navigation.
    const crime = findCrime();
    if (existing) {
      const label = existing.shadowRoot?.querySelector('[data-crime]');
      if (label && label.textContent !== (crime || 'Crimes 2.0')) label.textContent = crime || 'Crimes 2.0';
      return;
    }
    const host = document.createElement('section');
    host.id = ID;
    host.style.cssText = 'box-sizing:border-box;max-width:100%;margin:10px 0;padding:0;border:1px solid #494949;border-radius:5px;background:#242424;color:#ddd;font:12px/1.5 Arial,sans-serif;clear:both';
    const shadow = host.attachShadow({mode:'open'});
    shadow.innerHTML = `<style>
      *{box-sizing:border-box}button{cursor:pointer;color:inherit;font:inherit}button:focus-visible{outline:2px solid #9ab6a0;outline-offset:2px}
      .head{width:100%;display:flex;justify-content:space-between;align-items:center;border:0;background:#303030;padding:9px 11px;text-align:left;font-weight:bold}
      .head span:last-child{color:#aaa}.body{padding:10px 11px}.muted{color:#aaa}.hint{border-left:2px solid #6e9576;padding-left:9px;margin:8px 0}
      .foot{font-size:10px;color:#999;margin-top:9px}.hide{display:none}
    </style><button type="button" class="head" aria-expanded="true"><span>Crime Companion <span class="muted">· <span data-crime>Crimes 2.0</span></span></span><span class="arrow">▾</span></button>
    <div class="body"><div class="hint">Check your current crime skill and nerve before choosing your next action. Prioritise progress towards your own goals.</div>
    <div class="muted">Contextual recommendations and verified calculators will be added in later builds. This version does not read or estimate your skill values.</div>
    <div class="foot">LowK3y Industries · v0.1.2 · advisory only</div></div>`;
    const button = shadow.querySelector('button');
    const body = shadow.querySelector('.body');
    const arrow = shadow.querySelector('.arrow');
    let collapsed = false;
    try { collapsed = localStorage.getItem(KEY) === '1'; } catch {}
    function apply() { body.classList.toggle('hide', collapsed); button.setAttribute('aria-expanded', String(!collapsed)); arrow.textContent = collapsed ? '▸' : '▾'; }
    button.addEventListener('click', () => { collapsed = !collapsed; try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch {} apply(); });
    apply();
    shadow.querySelector('[data-crime]').textContent = crime || 'Crimes 2.0';
    anchor.prepend(host);
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(mount, 250); }
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {childList:true, subtree:true});
  setInterval(schedule, 4000);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  mount();
})();