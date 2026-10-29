export const TUTORIAL_COUNT=3;

export function tutorialComplete(completed,cases){
  return cases.slice(0,TUTORIAL_COUNT).every(item=>completed.includes(item.id));
}

export function isCaseLocked(index,completed,cases){
  if(index<TUTORIAL_COUNT)return index>0&&!completed.includes(cases[index-1].id);
  return !tutorialComplete(completed,cases);
}

export function firstAvailableCase(completed,cases){
  const tutorialIndex=cases.slice(0,TUTORIAL_COUNT).findIndex(item=>!completed.includes(item.id));
  return tutorialIndex<0?TUTORIAL_COUNT:Math.max(0,tutorialIndex);
}
