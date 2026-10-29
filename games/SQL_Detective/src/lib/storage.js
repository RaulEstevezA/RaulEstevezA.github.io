const KEY='sqldetective.progress', VERSION=1;
const blank=()=>({version:VERSION,completed:[],tutorialSeen:false,currentCase:0,dossiers:{}});
export function loadProgress(){try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.version===VERSION)return {...blank(),...saved};}catch{}return blank();}
export function saveProgress(progress){try{localStorage.setItem(KEY,JSON.stringify(progress));return true;}catch{return false;}}
export function resetProgress(){try{localStorage.removeItem(KEY);}catch{}return blank();}
export {KEY,VERSION};
