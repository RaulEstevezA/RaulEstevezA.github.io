import {escapeHtml} from '../lib/html.js';

const $=id=>document.getElementById(id);

export function renderDossier({caseData,state,language,t}){
  $('dossierPanel').hidden=!caseData.investigation;
  if(!caseData.investigation)return;
  const {stages,accusation}=caseData.investigation;
  const stage=stages[state.stage];
  $('dossierStageProgress').textContent=stage?`${t('stage')} ${state.stage+1}/${stages.length}`:`${stages.length}/${stages.length}`;
  $('dossierStageTitle').textContent=stage?stage.title[language]:t('allClues');
  $('dossierStageBriefing').textContent=stage?stage.briefing[language]:'';
  $('dossierClues').innerHTML=stages.slice(0,state.stage).map(item=>`<li>${escapeHtml(item.clue[language])}</li>`).join('');
  $('dossierEmpty').hidden=state.stage>0;
  $('accusationPanel').hidden=Boolean(stage);
  $('accusationStatus').textContent='';
  $('accusationStatus').className='status';
  if(!stage){
    $('accusationFields').innerHTML=accusation.fields.map(field=>`<label>${escapeHtml(field.label[language])}<select data-accusation-key="${escapeHtml(field.key)}" required><option value="">${escapeHtml(t('choose'))}</option>${field.options.map(option=>`<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select></label>`).join('');
  }
}
