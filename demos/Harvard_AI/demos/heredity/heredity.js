const PROBS={gene:[.96,.03,.01],trait:{0:[.99,.01],1:[.44,.56],2:[.35,.65]},mutation:.01};
const FAMILIES=[
  {title:'Harry · James · Lily',people:[{name:'Harry',mother:'Lily',father:'James',trait:null},{name:'James',mother:null,father:null,trait:true},{name:'Lily',mother:null,father:null,trait:false}]},
  {title:'Arthur · Molly · hijos',titleEn:'Arthur · Molly · children',people:[{name:'Arthur',mother:null,father:null,trait:false},{name:'Charlie',mother:'Molly',father:'Arthur',trait:false},{name:'Fred',mother:'Molly',father:'Arthur',trait:true},{name:'Ginny',mother:'Molly',father:'Arthur',trait:null},{name:'Molly',mother:null,father:null,trait:false},{name:'Ron',mother:'Molly',father:'Arthur',trait:null}]},
  {title:'Rose · padres · abuelos',titleEn:'Rose · parents · grandparents',people:[{name:'Arthur',mother:null,father:null,trait:false},{name:'Hermione',mother:null,father:null,trait:false},{name:'Molly',mother:null,father:null,trait:null},{name:'Ron',mother:'Molly',father:'Arthur',trait:false},{name:'Rose',mother:'Hermione',father:'Ron',trait:true}]}
];

const T={
  es:{backHub:'AI Demos',eyebrow:'Probabilidad · Inferencia',subtitle:'Observa cómo la evidencia familiar modifica la probabilidad de heredar un gen y manifestar un rasgo.',familyLabel:'Datos familiares',familyTitle:'Familia y evidencia',reset:'Reiniciar',familyCopy:'Cambia la evidencia conocida de cualquier persona. Las probabilidades se recalculan usando todas las combinaciones compatibles.',calculate:'Calcular probabilidades',howTitle:'Cómo se calcula',howCopy:'El algoritmo enumera las posibles copias del gen y la presencia del rasgo, descarta los mundos incompatibles con la evidencia y normaliza la probabilidad conjunta restante.',inferenceLabel:'Distribución posterior',inferenceTitle:'Resultados',calculated:'Calculado',people:'Personas',evidence:'Evidencias',worlds:'Mundos válidos',mutation:'Mutación',worldsLabel:'Hipótesis',worldsTitle:'Mundos más probables',posteriorProbability:'Probabilidad posterior',worldsCopy:'Cada mundo asigna a toda la familia una cantidad de copias del gen y un estado del rasgo.',originLabel:'Origen',originTitle:'Proyecto de Harvard CS50 AI',originCopy:'Adaptación del ejercicio Heredity de la unidad Uncertainty. Conserva las probabilidades, la tasa de mutación y la enumeración exhaustiva de la implementación original en Python.',viewCode:'Ver código original',backToHub:'Volver a AI Demos',family:'Familia {number}',founder:'Sin padres',child:'Hijo/a',parents:'Madre: {mother} · Padre: {father}',traitEvidence:'Evidencia del rasgo',unknown:'Desconocida',present:'Presente',absent:'Ausente',status:'{worlds} mundos compatibles evaluados en {time} ms.',traitChance:'Rasgo {value}',copies0:'0 copias',copies1:'1 copia',copies2:'2 copias',world:'Mundo {number}',geneSummary:'{copies} · rasgo {trait}',yes:'sí',no:'no'},
  en:{backHub:'AI Demos',eyebrow:'Probability · Inference',subtitle:'Watch family evidence change the probability of inheriting a gene and expressing a trait.',familyLabel:'Family data',familyTitle:'Family and evidence',reset:'Reset',familyCopy:'Change the known evidence for any person. Probabilities are recalculated from every compatible combination.',calculate:'Calculate probabilities',howTitle:'How it works',howCopy:'The algorithm enumerates possible gene copies and trait states, discards worlds that conflict with the evidence, and normalizes the remaining joint probability.',inferenceLabel:'Posterior distribution',inferenceTitle:'Results',calculated:'Calculated',people:'People',evidence:'Evidence',worlds:'Valid worlds',mutation:'Mutation',worldsLabel:'Hypotheses',worldsTitle:'Most likely worlds',posteriorProbability:'Posterior probability',worldsCopy:'Each world assigns a number of gene copies and a trait state to every family member.',originLabel:'Origin',originTitle:'Harvard CS50 AI project',originCopy:'Adaptation of the Heredity exercise from the Uncertainty unit. It preserves the probabilities, mutation rate, and exhaustive enumeration from the original Python implementation.',viewCode:'View original code',backToHub:'Back to AI Demos',family:'Family {number}',founder:'No parents',child:'Child',parents:'Mother: {mother} · Father: {father}',traitEvidence:'Trait evidence',unknown:'Unknown',present:'Present',absent:'Absent',status:'{worlds} compatible worlds evaluated in {time} ms.',traitChance:'Trait {value}',copies0:'0 copies',copies1:'1 copy',copies2:'2 copies',world:'World {number}',geneSummary:'{copies} · trait {trait}',yes:'yes',no:'no'}
};

let language=localStorage.getItem('lang')||((navigator.language||'').toLowerCase().startsWith('es')?'es':'en');
let familyIndex=0,evidence=[],inference=null;

function t(key,values={}){let text=T[language][key];Object.entries(values).forEach(([name,value])=>{text=text.replace(`{${name}}`,value);});return text;}
function family(){return FAMILIES[familyIndex];}
function resetEvidence(){evidence=family().people.map(person=>person.trait);calculate();}
function transmit(genes){return genes===2?1-PROBS.mutation:genes===1?.5:PROBS.mutation;}
function percent(value){return `${(value*100).toFixed(1)}%`;}
function probabilityLabel(value){return value>=.0001?`${(value*100).toFixed(3)}%`:value.toExponential(2);}

function calculate(){
  const started=performance.now(),people=family().people,names=people.map(person=>person.name),indexByName=Object.fromEntries(names.map((name,index)=>[name,index]));
  const result=people.map(()=>({gene:[0,0,0],trait:[0,0]})),topWorlds=[];
  let validWorlds=0,totalWeight=0;
  for(let traitMask=0;traitMask<2**people.length;traitMask++){
    const traits=people.map((_,index)=>Boolean(traitMask&(1<<index)));
    if(evidence.some((known,index)=>known!==null&&known!==traits[index]))continue;
    for(let code=0;code<3**people.length;code++){
      const genes=people.map((_,index)=>Math.floor(code/(3**index))%3);
      let weight=1;
      people.forEach((person,index)=>{
        let geneChance=PROBS.gene[genes[index]];
        if(person.mother&&person.father){
          const fromMother=transmit(genes[indexByName[person.mother]]),fromFather=transmit(genes[indexByName[person.father]]);
          geneChance=genes[index]===2?fromMother*fromFather:genes[index]===1?fromMother*(1-fromFather)+(1-fromMother)*fromFather:(1-fromMother)*(1-fromFather);
        }
        weight*=geneChance*PROBS.trait[genes[index]][traits[index]?1:0];
      });
      validWorlds++;totalWeight+=weight;
      people.forEach((_,index)=>{result[index].gene[genes[index]]+=weight;result[index].trait[traits[index]?1:0]+=weight;});
      topWorlds.push({weight,genes:[...genes],traits:[...traits]});topWorlds.sort((a,b)=>b.weight-a.weight);topWorlds.length=Math.min(topWorlds.length,6);
    }
  }
  result.forEach(person=>{const geneTotal=person.gene.reduce((sum,value)=>sum+value,0),traitTotal=person.trait[0]+person.trait[1];person.gene=person.gene.map(value=>value/geneTotal);person.trait=person.trait.map(value=>value/traitTotal);});
  inference={result,worlds:topWorlds.map(world=>({...world,posterior:world.weight/totalWeight})),validWorlds,time:Math.max(1,Math.round(performance.now()-started))};
  render();
}

function renderTabs(){document.querySelector('#family-tabs').innerHTML=FAMILIES.map((item,index)=>`<button type="button" role="tab" aria-selected="${index===familyIndex}" data-family="${index}">${t('family',{number:index})}<span class="sr-only"> · ${language==='es'?item.title:(item.titleEn||item.title)}</span></button>`).join('');document.querySelectorAll('[data-family]').forEach(button=>button.addEventListener('click',()=>{familyIndex=Number(button.dataset.family);resetEvidence();}));}
function renderFamily(){document.querySelector('#family-tree').innerHTML=family().people.map((person,index)=>`<article class="person-evidence"><div class="person-evidence__heading"><h3>${person.name}</h3><span>${t(person.mother?'child':'founder')}</span></div><p>${person.mother?t('parents',{mother:person.mother,father:person.father}):t('founder')}</p><label>${t('traitEvidence')}<select data-evidence="${index}"><option value="unknown" ${evidence[index]===null?'selected':''}>${t('unknown')}</option><option value="true" ${evidence[index]===true?'selected':''}>${t('present')}</option><option value="false" ${evidence[index]===false?'selected':''}>${t('absent')}</option></select></label></article>`).join('');document.querySelectorAll('[data-evidence]').forEach(select=>select.addEventListener('change',()=>{evidence[Number(select.dataset.evidence)]=select.value==='unknown'?null:select.value==='true';calculate();}));}
function renderProbabilities(){document.querySelector('#probability-grid').innerHTML=family().people.map((person,index)=>{const probabilities=inference.result[index];return `<article class="probability-card"><div class="probability-card__heading"><h3>${person.name}</h3><span class="trait-probability">${t('traitChance',{value:percent(probabilities.trait[1])})}</span></div>${[2,1,0].map(copies=>`<div class="gene-row"><span>${t(`copies${copies}`)}</span><div class="probability-track"><i style="width:${percent(probabilities.gene[copies])}"></i></div><strong>${percent(probabilities.gene[copies])}</strong></div>`).join('')}</article>`;}).join('');}
function renderWorlds(){document.querySelector('#world-list').innerHTML=inference.worlds.map((world,worldIndex)=>`<article class="world-card"><div class="world-card__heading"><strong>${t('world',{number:worldIndex+1})}</strong><span>${probabilityLabel(world.posterior)}</span></div><ul>${family().people.map((person,index)=>`<li><strong>${person.name}</strong> · ${t('geneSummary',{copies:t(`copies${world.genes[index]}`),trait:t(world.traits[index]?'yes':'no')})}</li>`).join('')}</ul></article>`).join('');}
function render(){renderTabs();renderFamily();document.querySelector('#inference-state').textContent=t('calculated');document.querySelector('#inference-status').textContent=t('status',{worlds:inference.validWorlds.toLocaleString(language),time:inference.time});document.querySelector('#metric-people').textContent=family().people.length;document.querySelector('#metric-evidence').textContent=evidence.filter(value=>value!==null).length;document.querySelector('#metric-worlds').textContent=inference.validWorlds.toLocaleString(language);renderProbabilities();renderWorlds();}
function setLanguage(next){language=T[next]?next:'en';document.documentElement.lang=language;document.querySelectorAll('[data-i18n]').forEach(element=>{element.textContent=t(element.dataset.i18n);});document.querySelectorAll('[data-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lang===language)));localStorage.setItem('lang',language);if(inference)render();}

document.querySelector('#calculate').addEventListener('click',calculate);document.querySelector('#reset-evidence').addEventListener('click',resetEvidence);document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
evidence=family().people.map(person=>person.trait);calculate();setLanguage(language);
