import {escapeHtml,starsMarkup} from '../lib/html.js';

const $=id=>document.getElementById(id);

export function renderCase({caseData,index,completed,language,t}){
  $('caseNumber').textContent=`${t('case')} ${index+1} · ${caseData.concepts.join(' · ')}`;
  $('caseTitle').textContent=caseData.title[language];
  $('caseStory').textContent=caseData.story[language];
  $('caseObjective').textContent=caseData.objective[language];
  $('caseDifficulty').innerHTML=`${starsMarkup(caseData.rating)} <span>${caseData.rating}/5 · ${escapeHtml(t(`difficulty.${caseData.difficulty}`))}</span>`;
  $('caseDifficulty').setAttribute('aria-label',`${caseData.rating} ${t('stars')} · ${t(`difficulty.${caseData.difficulty}`)}`);
  $('caseDifficulty').className=`badge difficulty ${completed?'badge--success':''}`;

  const withoutHelp=caseData.rating>=4;
  const hiddenSchema=caseData.id==='last-signal';
  $('exampleButton').hidden=withoutHelp;
  $('hintsDetails').hidden=withoutHelp;
  $('schemaPanel').hidden=hiddenSchema;
  $('schema').innerHTML=hiddenSchema?'':Object.entries(caseData.tables).map(([name,rows])=>`<section class="schema__table"><strong>${escapeHtml(name)}</strong><div>${Object.keys(rows[0]||{}).map(column=>`<code>${escapeHtml(column)}</code>`).join('')}</div></section>`).join('');
  $('hints').innerHTML=caseData.hints[language].map(hint=>`<li>${escapeHtml(hint)}</li>`).join('');
}
