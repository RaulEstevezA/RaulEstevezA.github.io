const SIZE = 8;
const BOARDS = [
  [6, 11, 20, 23, 37, 42, 55, 60],
  [5, 14, 18, 27, 33, 46, 52, 63],
  [7, 9, 22, 28, 35, 41, 50, 61],
  [12, 15, 19, 31, 38, 44, 54, 59],
  [3, 17, 24, 30, 39, 45, 56, 62],
  [8, 13, 21, 29, 34, 47, 53, 58]
];
const translations = {
  es: { backHub:'AI Demos',eyebrow:'Conocimiento · Inferencia lógica',subtitle:'Observa cómo un agente transforma pistas locales en una base de conocimiento y deduce movimientos seguros.',boardLabel:'Tablero',boardTitle:'8 × 8 · 8 minas',boardNumber:'Tablero {current} / {total}',newBoard:'Nuevo tablero',aiStep:'Siguiente movimiento de la IA',aiRun:'Resolver automáticamente',safe:'Segura',mine:'Mina deducida',unknown:'Desconocida',reasoningLabel:'Razonamiento',knowledgeTitle:'Base de conocimiento',moves:'Movimientos',knownSafes:'Seguras conocidas',knownMines:'Minas deducidas',sentences:'Frases activas',sentencesTitle:'Frases lógicas',logTitle:'Última inferencia',howTitle:'Cómo razona',howCopy:'Cada pista crea una frase del tipo «estas celdas contienen N minas». Si una frase es subconjunto de otra, la IA resta ambas para obtener conocimiento nuevo.',originLabel:'Origen',originTitle:'Proyecto de Harvard CS50 AI',originCopy:'Adaptación interactiva del ejercicio Minesweeper de la unidad Knowledge. Reproduce en JavaScript la representación de frases, celdas seguras, minas y deducción por subconjuntos de la implementación original en Python.',viewCode:'Ver código original',backToHub:'Volver a AI Demos',ready:'Selecciona una celda o deja que la IA realice un movimiento.',safeMove:'Movimiento seguro',randomMove:'Movimiento sin certeza',revealed:'Pista {count} revelada en {cell}.',clue:'Pista revelada',deducedSafe:'Deducida como segura',deducedMine:'Deducida como mina',newSentence:'Nueva frase',subset:'Deducción por subconjuntos',noKnowledge:'La base de conocimiento todavía está vacía.',noInference:'Las inferencias aparecerán después de revelar una celda.',lost:'La IA ha encontrado una mina al explorar sin certeza.',won:'Tablero resuelto: todas las celdas seguras han sido reveladas.',cell:'celda',mineSymbol:'M',empty:'vacía'},
  en: { backHub:'AI Demos',eyebrow:'Knowledge · Logical inference',subtitle:'Watch an agent turn local clues into a knowledge base and deduce safe moves.',boardLabel:'Board',boardTitle:'8 × 8 · 8 mines',boardNumber:'Board {current} / {total}',newBoard:'New board',aiStep:'Next AI move',aiRun:'Solve automatically',safe:'Safe',mine:'Deduced mine',unknown:'Unknown',reasoningLabel:'Reasoning',knowledgeTitle:'Knowledge base',moves:'Moves',knownSafes:'Known safes',knownMines:'Deduced mines',sentences:'Active sentences',sentencesTitle:'Logical sentences',logTitle:'Latest inference',howTitle:'How it reasons',howCopy:'Each clue creates a sentence of the form “these cells contain N mines.” If one sentence is a subset of another, the AI subtracts them to obtain new knowledge.',originLabel:'Origin',originTitle:'Harvard CS50 AI project',originCopy:'Interactive adaptation of the Minesweeper exercise from the Knowledge unit. It reproduces in JavaScript the sentence, safe-cell, mine, and subset-inference model from the original Python implementation.',viewCode:'View original code',backToHub:'Back to AI Demos',ready:'Select a cell or let the AI make a move.',safeMove:'Safe move',randomMove:'Move without certainty',revealed:'Clue {count} revealed at {cell}.',clue:'Clue revealed',deducedSafe:'Deduced safe',deducedMine:'Deduced mine',newSentence:'New sentence',subset:'Subset inference',noKnowledge:'The knowledge base is empty.',noInference:'Inferences will appear after a cell is revealed.',lost:'The AI found a mine while exploring without certainty.',won:'Board solved: every safe cell has been revealed.',cell:'cell',mineSymbol:'M',empty:'empty'}
};

class Sentence {
  constructor(cells, count) { this.cells = new Set(cells); this.count = count; }
  key() { return `${[...this.cells].sort((a,b)=>a-b).join(',')}=${this.count}`; }
}

let language = localStorage.getItem('lang') || ((navigator.language || '').startsWith('es') ? 'es' : 'en');
let mines, revealed, safes, knownMines, knowledge, logEntries, gameOver, running;
let boardIndex = Math.floor(Math.random() * BOARDS.length);
let currentStatus = { key:'ready', values:{}, tone:'' };
const boardElement = document.querySelector('#mine-board');
const statusElement = document.querySelector('#mine-status');
const sentenceList = document.querySelector('#sentence-list');
const inferenceLog = document.querySelector('#inference-log');
const moveType = document.querySelector('#move-type');

function t(key, values={}) { let value=translations[language][key]; Object.entries(values).forEach(([name,replacement])=>{value=value.replace(`{${name}}`,replacement);}); return value; }
function setStatus(key, values={}, tone='') { currentStatus={key,values,tone}; statusElement.textContent=t(key,values); statusElement.dataset.tone=tone; }
function label(index) { return `[${Math.floor(index/SIZE)+1}, ${(index%SIZE)+1}]`; }
function neighbors(index) { const row=Math.floor(index/SIZE), col=index%SIZE, result=[]; for(let r=row-1;r<=row+1;r++) for(let c=col-1;c<=col+1;c++) if(r>=0&&r<SIZE&&c>=0&&c<SIZE&&(r!==row||c!==col)) result.push(r*SIZE+c); return result; }
function nearbyMines(index) { return neighbors(index).filter((cell)=>mines.has(cell)).length; }
function formatSentence(sentence) { return `{ ${[...sentence.cells].sort((a,b)=>a-b).map(label).join(', ')} } = ${sentence.count}`; }
function addLog(type, text) { logEntries.unshift({type,text}); logEntries=logEntries.slice(0,8); }

function markSafe(cell) { if(!safes.has(cell)){ safes.add(cell); knowledge.forEach((sentence)=>sentence.cells.delete(cell)); addLog('deducedSafe',label(cell)); } }
function markMine(cell) { if(!knownMines.has(cell)){ knownMines.add(cell); knowledge.forEach((sentence)=>{if(sentence.cells.delete(cell)) sentence.count-=1;}); addLog('deducedMine',label(cell)); } }
function cleanKnowledge() { const unique=new Map(); knowledge.filter((s)=>s.cells.size>0&&s.count>=0&&s.count<=s.cells.size).forEach((s)=>unique.set(s.key(),s)); knowledge=[...unique.values()]; }

function infer() {
  let changed=true;
  while(changed){
    changed=false;
    cleanKnowledge();
    for(const sentence of [...knowledge]){
      if(sentence.count===0) for(const cell of [...sentence.cells]) if(!safes.has(cell)){markSafe(cell);changed=true;}
      if(sentence.count===sentence.cells.size) for(const cell of [...sentence.cells]) if(!knownMines.has(cell)){markMine(cell);changed=true;}
    }
    cleanKnowledge();
    const current=[...knowledge];
    for(let i=0;i<current.length;i++) for(let j=0;j<current.length;j++){
      if(i===j) continue;
      const small=current[i], large=current[j];
      if(small.cells.size>=large.cells.size || ![...small.cells].every((cell)=>large.cells.has(cell))) continue;
      const cells=[...large.cells].filter((cell)=>!small.cells.has(cell));
      const sentence=new Sentence(cells,large.count-small.count);
      if(cells.length && sentence.count>=0 && sentence.count<=cells.length && !knowledge.some((item)=>item.key()===sentence.key())){
        knowledge.push(sentence); addLog('subset',formatSentence(sentence)); changed=true;
      }
    }
  }
  cleanKnowledge();
}

function addKnowledge(cell) {
  revealed.add(cell); markSafe(cell);
  let count=nearbyMines(cell);
  const candidates=[];
  for(const neighbor of neighbors(cell)){
    if(knownMines.has(neighbor)) count-=1;
    else if(!safes.has(neighbor)) candidates.push(neighbor);
  }
  if(candidates.length){ const sentence=new Sentence(candidates,count); if(!knowledge.some((item)=>item.key()===sentence.key())){knowledge.push(sentence);addLog('newSentence',formatSentence(sentence));} }
  infer();
}

function reveal(cell, source='human') {
  if(gameOver||revealed.has(cell)||knownMines.has(cell)) return;
  if(mines.has(cell)) { gameOver=true; revealed.add(cell); setStatus('lost',{},'lost'); addLog('randomMove',label(cell)); render(); return; }
  addKnowledge(cell); addLog('clue',t('revealed',{count:nearbyMines(cell),cell:label(cell)}));
  moveType.textContent=source==='safe'?t('safeMove'):source==='random'?t('randomMove'):'—';
  if(revealed.size===SIZE*SIZE-mines.size){gameOver=true;setStatus('won',{},'safe');}
  else setStatus('revealed',{count:nearbyMines(cell),cell:label(cell)},source==='safe'?'safe':source==='random'?'risk':'');
  render();
}

function aiMove() {
  if(gameOver) return false;
  const safeMove=[...safes].filter((cell)=>!revealed.has(cell))[0];
  const candidates=Array.from({length:SIZE*SIZE},(_,i)=>i).filter((cell)=>!revealed.has(cell)&&!knownMines.has(cell));
  const cell=safeMove ?? candidates[0];
  if(cell===undefined){gameOver=true;return false;}
  reveal(cell,safeMove!==undefined?'safe':'random');
  return !gameOver;
}

function render() {
  boardElement.replaceChildren();
  for(let index=0;index<SIZE*SIZE;index++){
    const button=document.createElement('button'); button.type='button'; button.className='mine-cell';
    let state='unknown', text='';
    if(revealed.has(index)){ if(mines.has(index)){state='exploded';text=t('mineSymbol');} else {state='revealed';text=nearbyMines(index)||'';} }
    else if(knownMines.has(index)){state='mine';text=t('mineSymbol');}
    else if(safes.has(index)){state='safe';}
    button.dataset.state=state; button.textContent=text; button.disabled=gameOver||knownMines.has(index); button.setAttribute('aria-label',`${t('cell')} ${label(index)}, ${text||state}`); button.addEventListener('click',()=>reveal(index)); boardElement.append(button);
  }
  document.querySelector('#metric-moves').textContent=String(revealed.size);
  document.querySelector('#metric-safes').textContent=String(safes.size);
  document.querySelector('#metric-mines').textContent=String(knownMines.size);
  document.querySelector('#metric-sentences').textContent=String(knowledge.length);
  document.querySelector('#board-number').textContent=t('boardNumber',{current:boardIndex+1,total:BOARDS.length});
  sentenceList.innerHTML=knowledge.length?knowledge.map((sentence)=>`<div class="sentence">${formatSentence(sentence)}</div>`).join(''):`<p class="knowledge-empty">${t('noKnowledge')}</p>`;
  inferenceLog.innerHTML=logEntries.length?logEntries.map((entry)=>`<div class="inference-entry"><strong>${t(entry.type)}</strong> · ${entry.text}</div>`).join(''):`<p class="knowledge-empty">${t('noInference')}</p>`;
  document.querySelector('#new-board').disabled=running; document.querySelector('#ai-step').disabled=gameOver||running; document.querySelector('#ai-run').disabled=gameOver||running;
}

function reset(nextBoard=false) { if(nextBoard)boardIndex=(boardIndex+1)%BOARDS.length;mines=new Set(BOARDS[boardIndex]);revealed=new Set();safes=new Set();knownMines=new Set();knowledge=[];logEntries=[];gameOver=false;running=false;setStatus('ready');moveType.textContent='—';render(); }
async function runAi(){running=true;render();while(!gameOver&&aiMove()){await new Promise((resolve)=>setTimeout(resolve,180));}running=false;render();}
function setLanguage(next){language=translations[next]?next:'en';document.documentElement.lang=language;document.querySelectorAll('[data-i18n]').forEach((element)=>{element.textContent=t(element.dataset.i18n);});document.querySelectorAll('[data-lang]').forEach((button)=>button.setAttribute('aria-pressed',String(button.dataset.lang===language)));localStorage.setItem('lang',language);setStatus(currentStatus.key,currentStatus.values,currentStatus.tone);render();}

document.querySelector('#new-board').addEventListener('click',()=>reset(true));
document.querySelector('#ai-step').addEventListener('click',aiMove);
document.querySelector('#ai-run').addEventListener('click',runAi);
document.querySelectorAll('[data-lang]').forEach((button)=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
reset(); setLanguage(language);
