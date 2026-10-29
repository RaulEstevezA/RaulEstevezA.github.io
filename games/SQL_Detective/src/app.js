import {cases} from './data/cases.js';
import {advanceDossier,accusationMatches,getDossierState} from './features/dossier.js';
import {createI18n,detectLanguage,storeLanguage} from './lib/i18n.js';
import {firstAvailableCase,isCaseLocked} from './lib/progression.js';
import {executeSql,matchesExpected} from './lib/sql-engine.js';
import {loadProgress,resetProgress,saveProgress} from './lib/storage.js';
import {sqlReference,text,tutorial} from './locales/translations.js';
import {renderCase} from './ui/case-view.js';
import {openLore,openReference,openTutorial} from './ui/dialog-view.js';
import {renderDossier} from './ui/dossier-view.js';
import {renderNavigation} from './ui/navigation-view.js';
import {clearResults,renderRows,renderSolution,setQueryStatus} from './ui/results-view.js';

const $=id=>document.getElementById(id);
const i18n=createI18n(text,detectLanguage());
let progress=loadProgress();
let current=Math.min(progress.currentCase,cases.length-1);
if(isCaseLocked(current,progress.completed,cases))current=firstAvailableCase(progress.completed,cases);

const t=key=>i18n.t(key);
const currentCase=()=>cases[current];
const currentDossierState=()=>getDossierState(progress,currentCase().id);

function selectCase(index){
  current=index;
  progress.currentCase=current;
  saveProgress(progress);
  render();
}

function render(){
  const caseData=currentCase();
  renderNavigation({cases,current,progress,language:i18n.language,t,onSelect:selectCase});
  renderCase({caseData,index:current,completed:progress.completed.includes(caseData.id),language:i18n.language,t});
  renderDossier({caseData,state:caseData.investigation?currentDossierState():null,language:i18n.language,t});
  $('queryInput').value='';
  clearResults();
}

function translate(){
  document.documentElement.lang=i18n.language;
  document.querySelectorAll('[data-i18n]').forEach(element=>element.textContent=t(element.dataset.i18n));
  document.querySelectorAll('[data-i18n-aria-label]').forEach(element=>element.setAttribute('aria-label',t(element.dataset.i18nAriaLabel)));
  document.querySelectorAll('[data-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lang===i18n.language)));
  document.title='SQL Detective | Raul Estevez';
  render();
}

function solve(){
  const caseData=currentCase();
  if(!progress.completed.includes(caseData.id)){
    progress.completed.push(caseData.id);
    if(!saveProgress(progress))setQueryStatus(`${$('queryStatus').textContent} ${t('storage')}`.trim());
  }
  renderNavigation({cases,current,progress,language:i18n.language,t,onSelect:selectCase});
  renderSolution({caseData,language:i18n.language,t,hasNext:current<cases.length-1,onNext:()=>selectCase(current+1)});
}

function recordDossierEvidence(caseData,rows){
  const state=currentDossierState();
  if(!advanceDossier(caseData,state,rows,matchesExpected))return;
  saveProgress(progress);
  renderDossier({caseData,state,language:i18n.language,t});
  setQueryStatus(state.stage===caseData.investigation.stages.length?t('allClues'):t('clueFound'));
}

function queryErrorMessage(error){
  const separator=error.message.indexOf(':');
  const code=separator<0?error.message:error.message.slice(0,separator);
  const detail=separator<0?'':error.message.slice(separator+1);
  return detail?`${t('invalid')} ${detail}`:t(`errors.${code}`)||t('invalid');
}

async function runQuery(){
  const button=$('runButton');
  const caseData=currentCase();
  button.disabled=true;
  try{
    const rows=await executeSql($('queryInput').value,caseData.tables);
    renderRows(rows,t);
    setQueryStatus(`${rows.length} ${rows.length===1?t('row'):t('rows')}`);
    if(caseData.investigation)recordDossierEvidence(caseData,rows);
    else if(matchesExpected(rows,caseData.expected))solve();
  }catch(error){
    setQueryStatus(queryErrorMessage(error),'error');
  }finally{
    button.disabled=false;
    button.textContent=t('run');
  }
}

function showTutorial(){
  openTutorial({items:tutorial,language:i18n.language});
  progress.tutorialSeen=true;
  saveProgress(progress);
}

function submitAccusation(event){
  event.preventDefault();
  const investigation=currentCase().investigation?.accusation;
  if(!investigation)return;
  const values=Object.fromEntries([...document.querySelectorAll('[data-accusation-key]')].map(field=>[field.dataset.accusationKey,field.value]));
  const correct=accusationMatches(investigation,values);
  $('accusationStatus').className=`status ${correct?'status--success':'status--error'}`;
  $('accusationStatus').textContent=t(correct?'correctAccusation':'wrongAccusation');
  if(correct)solve();
}

function bindStaticEvents(){
  document.querySelectorAll('[data-lang]').forEach(button=>button.onclick=()=>{
    i18n.setLanguage(button.dataset.lang);
    storeLanguage(i18n.language);
    translate();
  });
  document.querySelectorAll('[data-collapse-target]').forEach(button=>button.onclick=()=>{
    const content=$(button.dataset.collapseTarget);
    const expanded=button.getAttribute('aria-expanded')==='true';
    button.setAttribute('aria-expanded',String(!expanded));
    content.hidden=expanded;
  });
  document.querySelectorAll('.dialog__close').forEach(button=>button.onclick=()=>button.closest('dialog').close());
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
  $('runButton').onclick=runQuery;
  $('queryInput').addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();runQuery();}});
  $('exampleButton').onclick=()=>{if(currentCase().example){$('queryInput').value=currentCase().example;$('queryInput').focus();}};
  $('loreButton').onclick=()=>openLore({caseData:currentCase(),index:current,language:i18n.language,t});
  $('referenceButton').onclick=()=>openReference({reference:sqlReference,language:i18n.language});
  $('tutorialButton').onclick=showTutorial;
  $('resetButton').onclick=()=>$('resetDialog').showModal();
  $('confirmReset').onclick=()=>{progress=resetProgress();current=0;$('resetDialog').close();render();};
  $('accusationForm').onsubmit=submitAccusation;
}

bindStaticEvents();
translate();
if(!progress.tutorialSeen)showTutorial();
