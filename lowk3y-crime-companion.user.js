// ==UserScript==
// @name         LowK3y Crime Companion
// @namespace    https://github.com/5cyp4csmpb-ctrl/Lowkey-crime-companion
// @version      0.2.0
// @description  Small, inline Crimes 2.0 guidance. No panel, no floating button, no automated actions.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowkey-crime-companion/main/lowk3y-crime-companion.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowkey-crime-companion/main/lowk3y-crime-companion.user.js
// ==/UserScript==
(() => {
  'use strict';
  const PREFIX = 'lk3y-cc-';
  const guidance = new Map([
    ['search for cash','Starter crime'],['bootlegging','Build skill'],['graffiti','Build skill'],
    ['shoplifting','Build skill'],['pickpocketing','Build skill'],['card skimming','Build skill'],
    ['burglary','Build skill'],['hustling','Build skill'],['disposal','Build skill'],
    ['cracking','Build skill'],['forgery','Build skill'],['scamming','Range matters'],
    ['arson','Build skill']
  ]);
  const css = `
    .${PREFIX}note {display:inline-block!important;vertical-align:middle!important;margin:0 0 0 7px!important;
      padding:1px 5px!important;max-width:115px!important;border:1px solid rgba(144,170,144,.45)!important;
      border-radius:3px!important;background:rgba(20,35,24,.75)!important;color:#b8d1b8!important;
      font:normal 10px/1.4 Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;
      white-space:nowrap!important;pointer-events:none!important}
    @media(max-width:390px){.${PREFIX}note{font-size:9px!important;padding:1px 3px!important;margin-left:4px!important}}
  `;
  const style = document.createElement('style');
  style.id = PREFIX + 'style';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  let pending = false;
  function scan() {
    pending = false;
    const nodes = document.querySelectorAll('span,div,h2,h3,h4,a');
    for (const node of nodes) {
      if (node.classList.contains(PREFIX + 'note') || node.closest('[id^="' + PREFIX + '"]')) continue;
      if (node.children.length && [...node.children].some(c => c.nodeType === 1 && c.textContent.trim())) continue;
      const crime = (node.textContent || '').trim().replace(/\s+/g,' ').toLowerCase();
      if (!guidance.has(crime)) continue;
      if (node.dataset.lk3yCrimeDone === '1') continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 35 || rect.width > 350 || rect.height < 10 || rect.height > 85) continue;
      // Add the hint after the title, not inside the title's existing text.
      const parent = node.parentElement;
      if (!parent || parent.querySelector(':scope > .' + PREFIX + 'note')) continue;
      const tag = document.createElement('span');
      tag.className = PREFIX + 'note';
      tag.textContent = guidance.get(crime);
      tag.title = 'LowK3y Crime Companion · general tip (not a skill estimate)';
      node.insertAdjacentElement('afterend', tag);
      node.dataset.lk3yCrimeDone = '1';
    }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(scan, 350);
  }
  const observer = new MutationObserver(mutations => {
    if (mutations.every(m => [...m.addedNodes].every(n =>
      n.nodeType === 1 && (n.classList?.contains(PREFIX + 'note') || n.id === PREFIX + 'style')))) return;
    schedule();
  });
  observer.observe(document.documentElement, {subtree:true,childList:true});
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  scan();
})();