async function db(path, options={}) {
  const r=await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:process.env.SUPABASE_SERVICE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_KEY}`,'Content-Type':'application/json',...(options.headers||{})}});
  const t=await r.text();let d;try{d=t?JSON.parse(t):null}catch{d=t}
  if(!r.ok)throw new Error(`Supabase ${r.status}: ${String(t).slice(0,300)}`);return d;
}
module.exports={db};
