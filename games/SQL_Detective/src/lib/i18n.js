export function detectLanguage(storage=globalThis.localStorage,navigatorLanguage=globalThis.navigator?.language){
  try{
    const stored=storage?.getItem('sqldetective.language')||storage?.getItem('lang');
    if(stored)return stored;
  }catch{}
  return (navigatorLanguage||'en').startsWith('es')?'es':'en';
}

export function createI18n(catalog,initialLanguage){
  let language=initialLanguage;
  return {
    get language(){return language;},
    setLanguage(value){language=value;},
    t(key){return key.split('.').reduce((value,part)=>value?.[part],catalog[language])??key;}
  };
}

export function storeLanguage(language,storage=globalThis.localStorage){
  try{
    storage?.setItem('sqldetective.language',language);
    storage?.setItem('lang',language);
  }catch{}
}
