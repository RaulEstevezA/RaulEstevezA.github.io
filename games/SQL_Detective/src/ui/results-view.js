import {escapeHtml} from '../lib/html.js';

const $=id=>document.getElementById(id);

export function clearResults(){
  $('resultTable').hidden=true;
  $('solution').hidden=true;
  $('resultEmpty').hidden=false;
  $('queryStatus').textContent='';
  $('rowCount').textContent='';
}

export function renderRows(rows,t){
  if(!rows.length)$('resultTable').innerHTML=`<p class="empty-state">0 ${escapeHtml(t('rows'))}</p>`;
  else{
    const columns=Object.keys(rows[0]);
    $('resultTable').innerHTML=`<table><thead><tr>${columns.map(column=>`<th scope="col">${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(column=>`<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  $('resultEmpty').hidden=true;
  $('resultTable').hidden=false;
  $('rowCount').textContent=`${rows.length} ${rows.length===1?t('row'):t('rows')}`;
}

export function setQueryStatus(message,type='success'){
  $('queryStatus').className=`status status--${type}`;
  $('queryStatus').textContent=message;
}

export function renderSolution({caseData,language,t,hasNext,onNext}){
  $('solution').hidden=false;
  $('solution').innerHTML=`<strong>${escapeHtml(t('solved'))}</strong><h3>${escapeHtml(t('solution'))}</h3><p>${escapeHtml(caseData.solution[language])}</p>${hasNext?`<button class="button button--primary" id="nextCase" type="button">${escapeHtml(t('next'))}</button>`:`<p>${escapeHtml(t('allSolved'))}</p>`}`;
  if(hasNext)$('nextCase').onclick=onNext;
  $('caseDifficulty').classList.add('badge--success');
}
