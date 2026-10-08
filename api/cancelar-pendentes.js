// Executado a cada hora pelo GitHub Actions com token secreto.
// Não cancela pagamentos aprovados, em processamento, ou cujo estado não pôde ser verificado.
const crypto=require('crypto');
const {db}=require('../lib/qa-db');
const {enviar}=require('../lib/qa-mail');
const MP='https://api.mercadopago.com';
const site=(process.env.SITE_URL||'https://www.maisqapostilas.com.br').replace(/\/$/,'');
const reply=(res,code,obj)=>{res.statusCode=code;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(obj));};
async function pagamentos(id){
  const r=await fetch(`${MP}/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(id)}&limit=100`,{headers:{Authorization:`Bearer ${process.env.MP_ACCESS_TOKEN}`}});
  if(!r.ok)throw new Error(`Consulta MP ${r.status}`);return (await r.json()).results||[];
}
async function cancelarMp(p){
  const r=await fetch(`${MP}/v1/payments/${encodeURIComponent(p.id)}`,{method:'PUT',headers:{Authorization:`Bearer ${process.env.MP_ACCESS_TOKEN}`,'Content-Type':'application/json','X-Idempotency-Key':`qa-cancel-${p.id}`},body:JSON.stringify({status:'cancelled'})});
  if(!r.ok)throw new Error(`MP não confirmou cancelamento de ${p.id}: ${r.status}`);
  const data=await r.json();if(data.status!=='cancelled')throw new Error('Status MP não confirmado');
}
module.exports=async(req,res)=>{
  if(req.method!=='POST')return reply(res,405,{error:'Método inválido'});
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const secret=process.env.QA_CRON_SECRET||'';
  if(!secret||!token||token.length!==secret.length||!crypto.timingSafeEqual(Buffer.from(token),Buffer.from(secret)))return reply(res,401,{error:'Não autorizado'});
  if(!process.env.MP_ACCESS_TOKEN||!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_KEY)return reply(res,503,{error:'Configuração incompleta'});
  const stats={verificados:0,cancelados:0,em_analise:0,erros:0,emails_enviados:0};
  try{
    const limite=new Date(Date.now()-24*3600*1000).toISOString();
    const lista=await db(`pedidos?status=eq.aguardando_pagamento&created_at=lt.${encodeURIComponent(limite)}&select=*&order=created_at.asc&limit=50`);
    for(const pedido of lista||[]){
      try{
        stats.verificados++;
        // Sem preference do MP: pedidos manuais/parceiros não são cancelados automaticamente.
        if(!pedido.mp_preference_id){stats.em_analise++;continue;}
        const ps=await pagamentos(pedido.id);
        const aprovado=ps.find(p=>p.status==='approved');
        if(aprovado){
          if(aprovado.currency_id==='BRL'&&Math.abs(Number(aprovado.transaction_amount)-Number(pedido.total||pedido.valor))<.01){
            await db(`pedidos?id=eq.${pedido.id}&status=eq.aguardando_pagamento`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'pagamento_confirmado',pago_em:aprovado.date_approved||new Date().toISOString(),mp_payment_id:String(aprovado.id)})});
          }else{stats.erros++}continue;
        }
        if(ps.some(p=>['authorized','in_process','in_mediation'].includes(p.status))){stats.em_analise++;continue;}
        // Não alterar pedidos cujo pagamento não pode ser cancelado com segurança.
        const ativos=ps.filter(p=>['pending','in_process','authorized'].includes(p.status));
        if(ativos.some(p=>p.status!=='pending')){stats.em_analise++;continue;}
        for(const pay of ativos)await cancelarMp(pay);
        const agora=new Date().toISOString();
        const rows=await db(`pedidos?id=eq.${pedido.id}&status=eq.aguardando_pagamento&select=id`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'cancelado',cancelado_em:agora,motivo_cancelamento:'prazo_24h',updated_at:agora})});
        if(!rows?.length)continue;
        stats.cancelados++;
        await db('pedido_eventos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({pedido_id:pedido.id,tipo:'pedido_cancelado',descricao:'Pedido cancelado após 24 horas sem pagamento confirmado; Mercado Pago consultado'})}).catch(()=>{});
        const ok=await enviar({para:pedido.cliente_email,assunto:`Pedido ${pedido.codigo||pedido.id} cancelado — +QApostilas`,titulo:'Pedido cancelado por falta de pagamento',mensagem:`Olá, ${pedido.cliente_nome||'cliente'}! O pedido ${pedido.codigo||pedido.id}, referente a ${pedido.produto_titulo||'sua apostila'}, foi cancelado porque não identificamos pagamento no prazo de 24 horas. Se você efetuou o pagamento, responda este e-mail com o comprovante para verificarmos.`,link:site+'/minha-conta',botao:'Consultar meus pedidos'});
        if(ok){stats.emails_enviados++;await db(`pedidos?id=eq.${pedido.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({email_cancelamento_enviado_em:new Date().toISOString()})});}
      }catch(e){stats.erros++;console.error('Pedido',pedido.id,e.message)}
    }
    // Reenvio de avisos que falharam (sem cancelar novamente).
    const semEmail=await db(`pedidos?motivo_cancelamento=eq.prazo_24h&email_cancelamento_enviado_em=is.null&status=eq.cancelado&select=*&limit=30`);
    for(const pedido of semEmail||[]){
      try{const ok=await enviar({para:pedido.cliente_email,assunto:`Pedido ${pedido.codigo||pedido.id} cancelado — +QApostilas`,titulo:'Cancelamento do seu pedido',mensagem:`Olá, ${pedido.cliente_nome||'cliente'}! O pedido ${pedido.codigo||pedido.id} foi cancelado após 24 horas sem pagamento confirmado. Se você pagou, responda este e-mail para conferirmos.`,link:site+'/minha-conta'});
        if(ok){stats.emails_enviados++;await db(`pedidos?id=eq.${pedido.id}&email_cancelamento_enviado_em=is.null`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({email_cancelamento_enviado_em:new Date().toISOString()})});}
      }catch(e){stats.erros++;console.error('Email',pedido.id,e.message)}
    }
    return reply(res,200,{ok:true,...stats});
  }catch(e){console.error('Cron:',e.message);return reply(res,500,{error:'Falha na verificação',...stats});}
};
