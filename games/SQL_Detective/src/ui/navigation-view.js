import {escapeHtml,starsMarkup} from '../lib/html.js';
import {TUTORIAL_COUNT,isCaseLocked,tutorialComplete} from '../lib/progression.js';

const $=id=>document.getElementById(id);

export function renderNavigation({cases,current,progress,language,t,onSelect}){
  $('progressText').textContent=`${progress.completed.length}/${cases.length} ${t('completed')}`;
  const tab=(item,index)=>{
    const locked=isCaseLocked(index,progress.completed,cases);
    const label=`${item.title[language]}, ${item.rating} ${t('stars')}${locked?`, ${t('locked')}`:''}`;
    return `<button type="button" role="tab" aria-selected="${index===current}" aria-controls="game" data-case="${index}" ${locked?'disabled':''} aria-label="${escapeHtml(label)}"><span>${index+1}</span><span class="case-tabs__label">${escapeHtml(item.title[language])}<small>${starsMarkup(item.rating)} ${item.rating}/5</small></span>${locked?` · ${escapeHtml(t('locked'))}`:''}</button>`;
  };
  $('tutorialTabs').innerHTML=cases.slice(0,TUTORIAL_COUNT).map(tab).join('');
  $('investigationTabs').innerHTML=cases.slice(TUTORIAL_COUNT).map((item,index)=>tab(item,index+TUTORIAL_COUNT)).join('');
  const investigationsOpen=tutorialComplete(progress.completed,cases);
  const investigationToggle=$('investigationToggle');
  const wasLocked=investigationToggle.dataset.locked==='true';
  investigationToggle.dataset.locked=String(!investigationsOpen);
  investigationToggle.disabled=!investigationsOpen;
  investigationToggle.setAttribute('aria-label',`${t('investigationCases')}${investigationsOpen?'':`, ${t('locked')}`}`);
  $('investigationLock').hidden=investigationsOpen;
  $('investigationStatus').textContent=investigationsOpen?t('investigationsOpen'):t('investigationsLocked');
  if(!investigationsOpen){
    investigationToggle.setAttribute('aria-expanded','false');
    $('investigationTabs').hidden=true;
  }else if(wasLocked){
    investigationToggle.setAttribute('aria-expanded','true');
    $('investigationTabs').hidden=false;
  }
  document.querySelectorAll('[data-case]').forEach(button=>button.onclick=()=>onSelect(Number(button.dataset.case)));
}
