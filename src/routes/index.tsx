import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, GitBranch, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { FtaResult, FtaNode, Gate } from "@/lib/fta-types";
import { FtaNodeView } from "@/components/FtaNodeView";
import { SummaryPanel } from "@/components/SummaryPanel";
import { exportFtaToExcel } from "@/lib/fta-export";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "FTA高度化支援アプリ | 故障の木解析" },
      { name: "description", content: "AIによる階層型FTA解析、論理ゲート(AND/OR)、対応策・参考文献の自動生成、Excel出力に対応した信頼性工学支援ツール。" },
    ],
  }),
});

function Index() {
  const [topEvent, setTopEvent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FtaResult | null>(null);
  const [submitted, setSubmitted] = useState("");

  const analyze = async () => {
    if (!topEvent.trim()) {
      toast.error("トップ事象を入力してください");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fta-analyze", {
        body: { topEvent: topEvent.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as FtaResult);
      setSubmitted(topEvent.trim());
      toast.success("FTA解析が完了しました");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "解析に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const updateCause = (idx: number, next: FtaNode) => {
    if (!result) return;
    const causes = [...result.causes];
    causes[idx] = next;
    setResult({ ...result, causes });
  };

  const toggleTopGate = () => {
    if (!result) return;
    setResult({ ...result, topGate: result.topGate === "AND" ? "OR" : ("AND" as Gate) });
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <GitBranch size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">FTA高度化支援</h1>
            <p className="text-xs text-muted-foreground">論理ゲート対応の故障の木解析（Fault Tree Analysis）</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm mb-6">
          <label className="block text-sm font-semibold text-foreground mb-2">
            トップ事象（解析対象の故障/不具合）
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topEvent}
              onChange={(e) => setTopEvent(e.target.value)}
              placeholder="例: 産業用ロボットアームの動作停止"
              className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && !loading && analyze()}
            />
            <button
              onClick={analyze}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? "解析中..." : "AI解析を実行"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            第1次要因(最大6) → 第2次要因(各最大3) → 第3次要因(各最大4)の階層で生成します。
          </p>
        </section>

        {result && (
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground">故障の木</h2>
                <button
                  onClick={() => exportFtaToExcel(submitted, result)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent text-sm font-medium transition"
                >
                  <Download size={14} />
                  Excel出力
                </button>
              </div>

              <div className="rounded-lg bg-card border border-border p-4 shadow-sm mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={toggleTopGate}
                    className={`text-xs font-bold px-2 py-0.5 rounded-md text-white ${
                      result.topGate === "AND" ? "bg-[var(--gate-and)]" : "bg-[var(--gate-or)]"
                    }`}
                  >
                    {result.topGate}
                  </button>
                  <span className="text-xs text-muted-foreground">トップ</span>
                  <span className="font-semibold text-foreground">{submitted}</span>
                </div>
              </div>

              <div>
                {result.causes.map((c, i) => (
                  <FtaNodeView key={i} node={c} level={1} onUpdate={(n) => updateCause(i, n)} />
                ))}
              </div>
            </section>

            <SummaryPanel summary={result.summary} topEvent={submitted} />
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <GitBranch size={48} className="mx-auto mb-3 opacity-40" />
            <p>トップ事象を入力してAI解析を実行してください</p>
          </div>
        )}
      </main>
    </div>
  );
}
