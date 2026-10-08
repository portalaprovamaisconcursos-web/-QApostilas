// +QApostilas: acesso ao PDF com registro autenticado (clique, não conclusão do download).
// Requer SUPABASE_URL e SUPABASE_SERVICE_KEY na Vercel.
const send = (res, status, data) => { res.statusCode=status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(data)); };
async function db(path, options={}) {
  const r=await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { apikey:process.env.SUPABASE_SERVICE_KEY, Authorization:`Bearer ${process.env.SUPABASE_SERVICE_KEY}`, 'Content-Type':'application/json', ...(options.headers||{}) } });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  const txt=await r.text(); return txt ? JSON.parse(txt) : null;
}
module.exports=async (req,res)=>{
  if (req.method!=='POST') return send(res,405,{error:'Método não permitido'});
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return send(res,503,{error:'Servidor não configurado'});
    const jwt=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
    if (!jwt) return send(res,401,{error:'Faça login na Área do Aluno'});
    const auth=await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:process.env.SUPABASE_SERVICE_KEY,Authorization:`Bearer ${jwt}`}});
    if (!auth.ok) return send(res,401,{error:'Sessão expirada'});
    const user=await auth.json();
    if (!user.id || !user.email) return send(res,401,{error:'Sessão inválida'});
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const id=Number(body.pedido_id);
    if (!Number.isSafeInteger(id)||id<1) return send(res,400,{error:'Pedido inválido'});
    const pedidos=await db(`pedidos?id=eq.${id}&select=id,status,cliente_user_id,cliente_email,produto_id,pdf_signed_url,pdf_signed_url_expira_em,primeiro_acesso_pdf_em,quantidade_acessos_pdf`);
    const pedido=pedidos?.[0];
    if (!pedido) return send(res,404,{error:'Pedido não encontrado'});
    if (pedido.cliente_user_id!==user.id && String(pedido.cliente_email||'').toLowerCase()!==String(user.email).toLowerCase()) return send(res,403,{error:'Acesso não autorizado'});
    if (!['pagamento_confirmado','em_andamento','entregue','entregue_transportadora'].includes(pedido.status)) return send(res,403,{error:'Pagamento não confirmado'});
    let link=null;
    if (pedido.pdf_signed_url && (!pedido.pdf_signed_url_expira_em || new Date(pedido.pdf_signed_url_expira_em)>new Date())) link=pedido.pdf_signed_url;
    if (!link && pedido.produto_id) {
      const produtos=await db(`produtos?id=eq.${encodeURIComponent(pedido.produto_id)}&select=download_url,pdf_storage_path`);
      const prod=produtos?.[0];
      if (prod?.pdf_storage_path) {
        const path=prod.pdf_storage_path.split('/').map(encodeURIComponent).join('/');
        const r=await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/sign/apostilas-pdf/${path}`,{method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});
        const data=await r.json();
        if (r.ok && data.signedURL) link=`${process.env.SUPABASE_URL}${data.signedURL}`;
      }
      if (!link && prod?.download_url && /^https:\/\//i.test(prod.download_url)) link=prod.download_url;
    }
    if (!link || !/^https:\/\//i.test(link)) return send(res,404,{error:'Arquivo não disponível; contate o suporte'});
    const agora=new Date().toISOString();
    // Conta cliques; atualizações simultâneas podem perder incrementos, sem impacto no acesso.
    await db(`pedidos?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({primeiro_acesso_pdf_em:pedido.primeiro_acesso_pdf_em||agora,ultimo_acesso_pdf_em:agora,quantidade_acessos_pdf:(Number(pedido.quantidade_acessos_pdf)||0)+1})});
    await db('pedido_eventos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({pedido_id:id,tipo:'pdf_acessado',descricao:'Cliente solicitou abertura do arquivo na Área do Aluno'})});
    return send(res,200,{ok:true,url:link});
  } catch(e) { console.error('pdf-access:',e.message); return send(res,500,{error:'Não foi possível registrar o acesso. Tente novamente.'}); }
};
