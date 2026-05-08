import type { FtaSummary } from "@/lib/fta-types";
import { AlertTriangle, ListChecks, FileText } from "lucide-react";

export function SummaryPanel({ summary, topEvent }: { summary: FtaSummary; topEvent: string }) {
  return (
    <aside className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5 sticky top-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">トップ事象</div>
        <div className="text-base font-semibold text-foreground">{topEvent}</div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <FileText size={16} className="text-primary" />
          解析の概観
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{summary.overview}</p>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <AlertTriangle size={16} className="text-[var(--gate-and)]" />
          主要リスク要因
        </div>
        <ul className="space-y-1.5">
          {summary.keyRisks.map((r, i) => (
            <li key={i} className="text-sm text-foreground flex gap-2">
              <span className="text-muted-foreground">{i + 1}.</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <ListChecks size={16} className="text-[var(--gate-or)]" />
          対応策の優先順位
        </div>
        <ol className="space-y-1.5">
          {summary.priorities.map((p, i) => (
            <li key={i} className="text-sm text-foreground flex gap-2">
              <span className="font-bold text-primary">{i + 1}.</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
