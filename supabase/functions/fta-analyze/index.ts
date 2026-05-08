// FTA analysis edge function using Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topEvent } = await req.json();
    if (!topEvent || typeof topEvent !== "string") {
      return new Response(JSON.stringify({ error: "topEvent is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `あなたは信頼性工学（FTA: Fault Tree Analysis）の専門家です。
ユーザーが提示するトップ事象に対して、階層的な故障の木を生成します。
厳守すべき制約:
- 第1次要因は最大6件
- 各1次要因の下に第2次要因を最大3件
- 各2次要因の下に第3次要因を最大4件
- 各事象に論理ゲート(AND/OR)を設定（その事象が下位事象から発生する論理関係）
- 各事象に「対応策」「確認方法」「参考文献名（書籍・規格・論文等の名称のみ。URLではなく検索キーワードとして使える文字列）」を付与
- 専門用語は正確に。数式の変数は添字を使わず通常のアルファベットで表記
- 必ずツールコールで構造化データを返す`;

    const tool = {
      type: "function",
      function: {
        name: "build_fault_tree",
        description: "Construct a hierarchical fault tree.",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                overview: { type: "string", description: "解析全体の概観（200字程度）" },
                keyRisks: { type: "array", items: { type: "string" }, description: "主要リスク要因（3-5件）" },
                priorities: { type: "array", items: { type: "string" }, description: "対応策の優先順位（3-5件）" },
              },
              required: ["overview", "keyRisks", "priorities"],
              additionalProperties: false,
            },
            topGate: { type: "string", enum: ["AND", "OR"] },
            causes: {
              type: "array",
              maxItems: 6,
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  gate: { type: "string", enum: ["AND", "OR"] },
                  countermeasure: { type: "string" },
                  verification: { type: "string" },
                  reference: { type: "string" },
                  children: {
                    type: "array",
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        gate: { type: "string", enum: ["AND", "OR"] },
                        countermeasure: { type: "string" },
                        verification: { type: "string" },
                        reference: { type: "string" },
                        children: {
                          type: "array",
                          maxItems: 4,
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              gate: { type: "string", enum: ["AND", "OR"] },
                              countermeasure: { type: "string" },
                              verification: { type: "string" },
                              reference: { type: "string" },
                            },
                            required: ["name", "gate", "countermeasure", "verification", "reference"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["name", "gate", "countermeasure", "verification", "reference", "children"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["name", "gate", "countermeasure", "verification", "reference", "children"],
                additionalProperties: false,
              },
            },
          },
          required: ["summary", "topGate", "causes"],
          additionalProperties: false,
        },
      },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `トップ事象: ${topEvent}\n\nこの事象に対するFTAを生成してください。` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "build_fault_tree" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "レート制限を超えました。少し待ってから再試行してください。" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "クレジットが不足しています。Lovable AIワークスペースに残高を追加してください。" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gatewayエラー" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AIが構造化結果を返しませんでした" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fta-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
