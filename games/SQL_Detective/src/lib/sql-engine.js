const WRITE_KEYWORDS=/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA|REPLACE|VACUUM|REINDEX)\b/i;
const quote=id=>`"${String(id).replaceAll('"','""')}"`;

function typeFor(values){
  const present=values.filter(value=>value!==null&&value!==undefined);
  if(present.every(Number.isInteger))return 'INTEGER';
  if(present.every(value=>typeof value==='number'))return 'REAL';
  return 'TEXT';
}

export function validateReadOnly(sql){
  const query=sql.trim();
  if(!query)throw new Error('EMPTY');
  if(/^\.tables\s*;?$/i.test(query))return '.tables';
  if(!/^(SELECT|WITH)\b/i.test(query))throw new Error('READ_ONLY');
  if(WRITE_KEYWORDS.test(query))throw new Error('READ_ONLY');
  const statements=query.replace(/;\s*$/,'').split(';').filter(Boolean);
  if(statements.length!==1)throw new Error('ONE_STATEMENT');
  return query;
}

export async function executeSql(sql,tables,initializer=null){
  const query=validateReadOnly(sql);
  if(query==='.tables')return Object.keys(tables).sort().map(table=>({table}));
  const resolvedInitializer=typeof initializer==='function'?initializer:await globalThis.sqlEngineReady;
  if(typeof resolvedInitializer!=='function')throw new Error('ENGINE');
  const scriptUrl=globalThis.document?.querySelector('[data-sql-engine]')?.src;
  const engineBase=scriptUrl?new URL('.',scriptUrl):new URL('../../vendor/',import.meta.url);
  const SQL=await resolvedInitializer({locateFile:file=>new URL(file,engineBase).href});
  const db=new SQL.Database();
  try{
    for(const [table,rows] of Object.entries(tables)){
      if(!rows.length)continue;
      const columns=Object.keys(rows[0]);
      const definition=columns.map(column=>`${quote(column)} ${typeFor(rows.map(row=>row[column]))}`).join(', ');
      db.run(`CREATE TABLE ${quote(table)} (${definition})`);
      const statement=db.prepare(`INSERT INTO ${quote(table)} (${columns.map(quote).join(', ')}) VALUES (${columns.map(()=>'?').join(', ')})`);
      try{for(const row of rows)statement.run(columns.map(column=>row[column]??null));}finally{statement.free();}
    }
    const result=db.exec(query)[0];
    if(!result)return [];
    return result.values.map(values=>Object.fromEntries(result.columns.map((column,index)=>[column,values[index]])));
  }catch(error){
    if(/^\w+(?::\w+)?$/.test(error.message))throw error;
    const wrapped=new Error(`SQLITE:${error.message}`);wrapped.cause=error;throw wrapped;
  }finally{db.close();}
}

export function matchesExpected(rows,expected){
  if(rows.length!==expected.length)return false;
  return expected.every((wanted,index)=>Object.entries(wanted).every(([key,value])=>rows[index]?.[key]===value));
}
