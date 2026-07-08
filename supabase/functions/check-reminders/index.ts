// Edge function que corre cada minuto (ver supabase/schema.sql) y manda a Telegram
// los recordatorios que ya vencieron. Así el envío no depende de que la Mac esté prendida.

import { createClient } from "jsr:@supabase/supabase-js@2";

// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las inyecta Supabase solas, no hay que configurarlas
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID")!;

async function sendTelegram(text: string) {
  const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: telegramChatId,
      text: `Recordatorio: ${text}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram respondió ${response.status}`);
  }
}

Deno.serve(async () => {
  const { data: pendientes, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("notified", false)
    .lte("notify_at", new Date().toISOString());

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  for (const reminder of pendientes ?? []) {
    try {
      await sendTelegram(reminder.text);
      await supabase.from("reminders").update({ notified: true }).eq("id", reminder.id);
    } catch (err) {
      console.error(`no se pudo mandar el recordatorio ${reminder.id}:`, err);
    }
  }

  return new Response(JSON.stringify({ enviados: pendientes?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
