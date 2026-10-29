export function getDossierState(progress,caseId){
  progress.dossiers??={};
  progress.dossiers[caseId]??={stage:0};
  return progress.dossiers[caseId];
}

export function advanceDossier(caseData,state,rows,matcher){
  const stage=caseData.investigation?.stages[state.stage];
  if(!stage||!matcher(rows,stage.expected))return false;
  state.stage++;
  return true;
}

export function accusationMatches(investigation,values){
  return Object.entries(investigation.answer).every(([key,value])=>values[key]===value);
}
