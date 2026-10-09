// ==UserScript==
// @name         LowK3y Crime Companion
// @namespace    https://github.com/5cyp4csmpb-ctrl/Lowkey-crime-companion
// @version      0.3.0
// @description  Inline read-only crime skill hints for Torn PDA; no panel or gameplay automation.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowkey-crime-companion/main/lowk3y-crime-companion.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowkey-crime-companion/main/lowk3y-crime-companion.user.js
// ==/UserScript==
(() => {
  'use strict';
  const PREFIX='lk3y-cc-';
  const crimes=new Set(['search for cash','bootlegging','graffiti','shoplifting','pickpocketing',
    'card skimming','burglary','hustling','disposal','cracking','forgery','scamming','arson']);
  const style=document.createElement('style');
  style.textContent=`
    .${PREFIX}note{display:inline-block!important;vertical-align:middle!important;margin:0 0 0 7px!important;
    padding:1px 5px!important;max-width:120px!important;border:1px solid rgba(144,170,144,.45)!important;
    border-radius:3px!important;background:rgba(20,35,24,.75)!important;color:#b8d1b8!important;
    font:normal 10px/1.4 Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;
    white-space:nowrap!important;pointer-events:none!important}
    .${PREFIX}note[data-status="mastered"]{border-color:rgba(93,167,200,.6)!important;color:#b4dfff!important}
    .${PREFIX}note[data-status="unknown"]{border-color:rgba(140,140,140,.4)!important;color:#aaa!important}
    @media(max-width:390px){.${PREFIX}note{font-size:9px!important;padding:1px 3px!important;margin-left:4px!important}}
  `;
  (document.head||document.documentElement).appendChild(style);
  function readNumber(value){
    if(value==null)return null;
    const m=String(value).trim().match(/^(?:skill(?: level)?\s*[:\-]?\s*)?(100|[1-9]?\d)(?:\s*\/\s*100)?$/i);
    return m?Number(m[1]):null;
  }
  function skillFromRow(title){
    // Stay within the immediate crime card; never read numbers from neighbouring crimes.
    let card=title.parentElement;
    for(let i=0;i<5&&card;i++,card=card.parentElement){
      const rect=card.getBoundingClientRect();
      if(rect.height<45||rect.height>150||rect.width<180)continue;
      const possible=[];
      const elements=card.querySelectorAll('[class*="skill" i],[class*="level" i],[aria-label],[title],[data-skill]');
      for(const el of elements){
        if(el===title||el.contains(title)||el.closest('.'+PREFIX+'note'))continue;
        const cls=String(el.className||'');
        const label=(el.getAttribute('aria-label')||'')+' '+(el.getAttribute('title')||'');
        const explicitlySkill=/skill|crime.?level/i.test(cls+' '+label)||el.hasAttribute('data-skill');
        if(!explicitlySkill)continue;
        const raw=[el.getAttribute('data-skill'),el.getAttribute('aria-valuenow'),el.getAttribute('aria-label'),el.getAttribute('title'),el.children.length===0?el.textContent:null];
        for(const val of raw){
          const number=readNumber(val);
          if(number!==null)possible.push(number);
        }
      }
      const unique=[...new Set(possible)];
      if(unique.length===1)return unique[0];
      if(unique.length>1)return null;
    }
    return null;
  }
  function scan(){
    const nodes=document.querySelectorAll('span,div,h2,h3,h4,a');
    for(const node of nodes){
      if(node.classList.contains(PREFIX+'note')||node.closest('.'+PREFIX+'note'))continue;
      if(node.children.length&&[...node.children].some(c=>c.nodeType===1&&c.textContent.trim()))continue;
      const crime=(node.textContent||'').trim().replace(/\s+/g,' ').toLowerCase();
      if(!crimes.has(crime))continue;
      const r=node.getBoundingClientRect();
      if(r.width<35||r.width>350||r.height<10||r.height>85)continue;
      let tag=node.nextElementSibling;
      if(!tag?.classList.contains(PREFIX+'note')){
        tag=document.createElement('span');
        tag.className=PREFIX+'note';
        node.insertAdjacentElement('afterend',tag);
      }
      const skill=skillFromRow(node);
      const status=skill===null?'unknown':skill===100?'mastered':'progress';
      const label=skill===null?'Skill ?':skill===100?'Mastered ✓':'Skill '+skill+'/100';
      if(tag.textContent!==label)tag.textContent=label;
      tag.dataset.status=status;
      tag.title=skill===null?'Crime skill not reliably detected; no estimate shown':'Crime skill shown by Torn';
    }
  }
  let timer;
  const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,300);});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',()=>setTimeout(scan,400));
  window.addEventListener('popstate',()=>setTimeout(scan,400));
  scan();
})();