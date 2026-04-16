import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Carrinho vazio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];
    const validatedItems: any[] = [];

    for (const item of items) {
      const { tipo_ingresso_id, lote_id, quantidade } = item;

      if (!tipo_ingresso_id || !lote_id || !quantidade || quantidade < 1 || quantidade > 50) {
        return new Response(
          JSON.stringify({ error: `Item inválido: quantidade deve ser entre 1 e 50.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: lote, error: loteErr } = await supabase
        .from("lotes_ingresso")
        .select("*")
        .eq("id", lote_id)
        .single();

      if (loteErr || !lote) {
        return new Response(
          JSON.stringify({ error: `Lote não encontrado.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (today < lote.data_inicio || today > lote.data_fim) {
        return new Response(
          JSON.stringify({ error: `Lote "${lote.nome}" expirado ou ainda não aberto.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const disponivel = lote.quantidade_total - (lote.quantidade_vendida || 0);
      if (disponivel < quantidade) {
        return new Response(
          JSON.stringify({ error: `Estoque insuficiente para "${lote.nome}". Disponíveis: ${disponivel}.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const valor_total = Number(lote.preco) * quantidade;

      validatedItems.push({
        tipo_ingresso_id,
        lote_id,
        quantidade,
        preco_unitario: Number(lote.preco),
        valor_total,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, items: validatedItems }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
