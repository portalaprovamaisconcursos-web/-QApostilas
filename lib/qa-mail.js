// Resend: mensagens transacionais. Nunca expor a chave no navegador.
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function enviar({para,assunto,titulo,mensagem,link,botao}) {
  if (!process.env.RESEND_API_KEY || !para || !/^\S+@\S+\.\S+$/.test(para)) return false;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#202936;line-height:1.6"><h2 style="color:#1555ba">+QApostilas</h2><h3>${esc(titulo)}</h3><p>${esc(mensagem)}</p>${link ? `<p><a style="background:#1766d2;color:white;padding:12px 18px;text-decoration:none;border-radius:7px" href="${esc(link)}">${esc(botao||'Área do Aluno')}</a></p>`:''}<p style="font-size:13px;color:#667085">Dúvidas? Responda este e-mail.</p></div>`;
  try {
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM||'+QApostilas <pedidos@maisqapostilas.com.br>',to:[para],reply_to:process.env.EMAIL_REPLY_TO||'maisqapostilas@gmail.com',subject:assunto,html})});
    if(!r.ok) console.error('Resend:',r.status,(await r.text()).slice(0,200));
    return r.ok;
  }catch(e){console.error('Resend:',e.message);return false;}
}
module.exports={enviar};
