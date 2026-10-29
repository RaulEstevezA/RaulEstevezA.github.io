import {escapeHtml} from '../lib/html.js';

const $=id=>document.getElementById(id);

export function openTutorial({items,language}){
  $('tutorialContent').innerHTML=`<ol>${items[language].map(item=>`<li>${item}</li>`).join('')}</ol>`;
  $('tutorialDialog').showModal();
}

export function openLore({caseData,index,language,t}){
  $('loreContent').innerHTML=`<span class="eyebrow">${escapeHtml(t('case'))} ${index+1}</span><h3>${escapeHtml(caseData.title[language])}</h3><div class="lore__story">${caseData.lore[language].map(paragraph=>`<p>${escapeHtml(paragraph)}</p>`).join('')}</div><div class="lore__objective"><strong>${escapeHtml(t('find'))}</strong><p>${escapeHtml(caseData.objective[language])}</p></div>`;
  $('loreDialog').showModal();
}

export function openReference({reference,language}){
  $('referenceContent').innerHTML=reference.map(section=>`<section class="reference__section"><h3>${escapeHtml(section.group[language])}</h3><div class="reference__grid">${section.items.map(item=>`<article class="reference__item"><h4>${escapeHtml(item.name)}</h4><code>${escapeHtml(item.syntax)}</code><p>${escapeHtml(item.description[language])}</p></article>`).join('')}</div></section>`).join('');
  $('referenceDialog').showModal();
}
