(function loadSqlEngine(){
  const load=source=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.dataset.sqlEngine='';
    script.src=source;
    script.onload=resolve;
    script.onerror=()=>{script.remove();reject(new Error(`Could not load ${source}`));};
    document.head.append(script);
  });

  globalThis.sqlEngineReady=load('./vendor/sql-wasm.js')
    .catch(()=>load('./node_modules/sql.js/dist/sql-wasm.js'))
    .then(()=>{
      if(typeof globalThis.initSqlJs!=='function')throw new Error('SQLite initializer is unavailable');
      return globalThis.initSqlJs;
    });
})();
