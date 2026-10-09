// ==UserScript==
// @name         LowK3y Crime Companion
// @namespace    https://github.com/5cyp4csmpb-ctrl/Lowkey-crime-companion
// @version      0.3.1
// @description  Read-only inline crime skill badges; hides uncertain values. No panels or buttons.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowkey-crime-companion/main/lowk3y-crime-companion.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowkey-crime-companion/main/lowk3y-crime-companion.user.js
// ==/UserScript==
(() => {
  'use strict';
  const cls='lk3y-cc-note';
  const names=new Set(['search for cash','bootlegging','graffiti','shoplifting','pickpocketing',
    'card skimming','burglary','hustling','disposal','cracking','forgery','scamming','arson']);
  const style=document.createElement('style');
  style.textContent=`
    .${cls}{display:inline-block!important;vertical-align:middle!important;margin-left:6px!important;
    padding:1px 5px!important;border:1px solid #637d6b!important;border-radius:3px!important;
    background:#202b23!important;color:#c3dbc7!important;font:normal 10px/1.4 Arial,sans-serif!important;
    letter-spacing:0!important;text-transform:none!important;white-space:nowrap!important;pointer-events:none!important}
    .${cls}[data-mastered="1"]{border-color:#648fa4!important;color:#b7dfff!important}
  `;
  (document.head||document.documentElement).appendChild(style);
  function numberFrom(value){
    if(value==null)return null;
    const str=String(value).trim();
    const m=str.match(/(?:crime\s*)?skill(?:\s*level)?\s*[:=]?\s*(100|[1-9]?\d)(?!\d)/i)
      ||str.match(/^(100|[1-9]?\d)(?:\s*\/\s*100)?$/);
    return m?Number(m[1]):null;
  }
  function isCrimePage(){
    const u=(location.pathname+location.search+location.hash).toLowerCase();
    return u.includes('crimes')||u.includes('sid=crime');
  }
  function candidateCard(title){
    let el=title.parentElement;
    for(let i=0;i<7&&el;i++,el=el.parentElement){
      const rect=el.getBoundingClientRect();
      if(rect.height<55||rect.height>520||rect.width<220)continue;
      // A crime row/detail has its own skill progress bar. Navigation headings do not.
      const progress=el.querySelector('[class*="progress" i],[class*="skill-bar" i],[class*="skillBar" i],[role="progressbar"]');
      if(!progress)continue;
      const crimeTitles=[...el.querySelectorAll('h1,h2,h3,h4,span,div')].filter(n=>
        n.children.length===0&&names.has((n.textContent||'').trim().toLowerCase()));
      if(crimeTitles.length>2)continue;
      return el;
    }
    return null;
  }
  function detectSkill(card,title){
    const values=new Set();
    // Only explicit skill attributes or clearly labelled skill text are trusted.
    const nodes=card.querySelectorAll('[aria-label],[title],[data-skill],[data-level],[aria-valuenow],[class*="skill" i]');
    for(const node of nodes){
      if(node===title||node.contains(title)||node.classList.contains(cls))continue;
      const attributes=['data-skill','aria-label','title','data-level'];
      for(const attr of attributes){
        const raw=node.getAttribute(attr);
        if(!raw)continue;
        if(attr==='data-level'&&!/skill/i.test(String(node.className)))continue;
        if((attr==='aria-label'||attr==='title')&&!/skill/i.test(raw))continue;
        const n=numberFrom(raw);
        if(n!==null)values.add(n);
      }
      if(/skill/i.test(String(node.className))){
        const raw=node.children.length===0?(node.textContent||'').trim():'';
        const n=numberFrom(raw);
        if(n!==null)values.add(n);
      }
    }
    return values.size===1?[...values][0]:null;
  }
  function scan(){
    if(!isCrimePage())return;
    const nodes=document.querySelectorAll('h1,h2,h3,h4,span,div');
    for(const title of nodes){
      if(title.classList.contains(cls)||title.closest('.'+cls))continue;
      if(title.children.length&&[...title.children].some(n=>n.nodeType===1&&n.textContent.trim()))continue;
      const name=(title.textContent||'').trim().replace(/\s+/g,' ').toLowerCase();
      if(!names.has(name))continue;
      const bounds=title.getBoundingClientRect();
      if(bounds.width<35||bounds.width>350||bounds.height<12||bounds.height>80)continue;
      const card=candidateCard(title);
      if(!card)continue;
      const skill=detectSkill(card,title);
      let label=title.nextElementSibling;
      if(!label?.classList.contains(cls))label=null;
      if(skill===null){label?.remove();continue;}
      if(!label){
        label=document.createElement('span');
        label.className=cls;
        title.insertAdjacentElement('afterend',label);
      }
      label.textContent=skill===100?'Mastered ✓':`Skill ${skill}/100`;
      label.dataset.mastered=skill===100?'1':'0';
    }
    // Remove any labels left behind when Torn changes the active view.
    for(const label of document.querySelectorAll('.'+cls)){
      if(!label.previousElementSibling||!names.has((label.previousElementSibling.textContent||'').trim().toLowerCase()))
        label.remove();
    }
  }
  let timeout;
  const observer=new MutationObserver(()=>{clearTimeout(timeout);timeout=setTimeout(scan,450);});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',()=>setTimeout(scan,500));
  window.addEventListener('popstate',()=>setTimeout(scan,500));
  scan();
})();