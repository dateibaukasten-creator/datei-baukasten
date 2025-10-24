// netlify/functions/send-digest.js
export default async (req) => {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") || "";
  const debug = url.searchParams.get("debug") === "1";

  // Debug: zeig an, ob alle Variablen da sind (keine Werte, nur Ja/Nein)
  if (debug) {
    const have = (k) => Boolean(process.env[k] && String(process.env[k]).length);
    return new Response(JSON.stringify({
      debug: true,
      need: ["RESEND_API_KEY","FROM_EMAIL","BOSS_EMAIL","APPROVE_BASE_URL","DIGEST_SECRET","BOSS_TOKEN"],
      have: {
        RESEND_API_KEY: have("RESEND_API_KEY"),
        FROM_EMAIL:     have("FROM_EMAIL"),
        BOSS_EMAIL:     have("BOSS_EMAIL"),
        APPROVE_BASE_URL: have("APPROVE_BASE_URL"),
        DIGEST_SECRET:  have("DIGEST_SECRET"),
        BOSS_TOKEN:     have("BOSS_TOKEN"),
      }
    }), { status: 200, headers: { "Content-Type": "application/json" }});
  }

  if (secret !== (process.env.DIGEST_SECRET || "")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const approve = `${process.env.APPROVE_BASE_URL}?token=${encodeURIComponent(process.env.BOSS_TOKEN)}&decision=go`;
  const skip    = `${process.env.APPROVE_BASE_URL}?token=${encodeURIComponent(process.env.BOSS_TOKEN)}&decision=skip`;

  const html = `
  <div style="font-family:system-ui,Segoe UI,Arial">
    <h2>Wöchentliche Freigabe – Datei-Baukasten</h2>
    <p>Aktionen: 10 neue SEO-Seiten + Titel-A/B + Screens aktualisieren.</p>
    <p>
      <a href="${approve}" style="background:#10b981;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">JA – MACH ES</a>
      &nbsp;&nbsp;
      <a href="${skip}" style="background:#94a3b8;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Diese Runde überspringen</a>
    </p>
    <p style="color:#666;font-size:12px">Ignorieren = Nichts passiert.</p>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "Boss Mode <no-reply@example.com>",
        to:   [process.env.BOSS_EMAIL || "you@example.com"],
        subject: "Freigabe – Datei-Baukasten",
        html,
        reply_to: "datei.baukasten@gmail.com"
      })
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ ok:false, error:text }), { status: 500, headers: { "Content-Type":"application/json" }});
    }
    return new Response(JSON.stringify({ ok:true }), { status: 200, headers: { "Content-Type":"application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status: 500, headers: { "Content-Type":"application/json" }});
  }
};
