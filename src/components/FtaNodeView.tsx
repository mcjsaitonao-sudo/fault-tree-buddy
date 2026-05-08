import { useState } from "react";
import { ChevronDown, ChevronRight, Search, Wrench, CheckCircle2, BookOpen } from "lucide-react";
import type { FtaNode, Gate } from "@/lib/fta-types";
import { cn } from "@/lib/utils";

interface Props {
  node: FtaNode;
  level: number;
  onUpdate: (next: FtaNode) => void;
}

const gateClass = (g: Gate) =>
  g === "AND"
    ? "bg-[var(--gate-and)] text-white"
    : "bg-[var(--gate-or)] text-white";

const levelBar = (level: number) => {
  if (level === 1) return "border-l-4 border-[var(--level-1)]";
  if (level === 2) return "border-l-4 border-[var(--level-2)]";
  return "border-l-4 border-[var(--level-3)]";
};

export function FtaNodeView({ node, level, onUpdate }: Props) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const toggleGate = () => {
    onUpdate({ ...node, gate: node.gate === "AND" ? "OR" : "AND" });
  };

  const updateChild = (idx: number, next: FtaNode) => {
    const children = [...(node.children ?? [])];
    children[idx] = next;
    onUpdate({ ...node, children });
  };

  const searchUrl = node.reference
    ? `https://www.google.com/search?q=${encodeURIComponent(node.reference)}`
    : null;

  return (
    <div className={cn("pl-3 my-2", levelBar(level))}>
      <div className="rounded-lg bg-card border border-border p-3 shadow-sm">
        <div className="flex items-start gap-2 flex-wrap">
          {hasChildren && (
            <button
              onClick={() => setOpen(!open)}
              className="text-muted-foreground hover:text-foreground mt-0.5"
              aria-label="toggle"
            >
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <button
            onClick={toggleGate}
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-md shrink-0 hover:opacity-80 transition",
              gateClass(node.gate),
            )}
            title="クリックでAND/OR切替"
          >
            {node.gate}
          </button>
          <span className="text-xs text-muted-foreground shrink-0">L{level}</span>
          <span className="font-medium text-foreground flex-1 min-w-[200px]">{node.name}</span>
        </div>

        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
          <div className="flex gap-2">
            <Wrench size={14} className="mt-0.5 text-primary shrink-0" />
            <div>
              <div className="text-xs font-semibold text-muted-foreground">対応策</div>
              <div className="text-foreground">{node.countermeasure}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 size={14} className="mt-0.5 text-primary shrink-0" />
            <div>
              <div className="text-xs font-semibold text-muted-foreground">確認方法</div>
              <div className="text-foreground">{node.verification}</div>
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <BookOpen size={14} className="mt-0.5 text-primary shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-muted-foreground">参考文献</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-foreground">{node.reference}</span>
                {searchUrl && (
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition"
                  >
                    <Search size={12} />
                    Google検索
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasChildren && open && (
        <div className="ml-4 mt-1">
          {node.children!.map((c, i) => (
            <FtaNodeView key={i} node={c} level={level + 1} onUpdate={(n) => updateChild(i, n)} />
          ))}
        </div>
      )}
    </div>
  );
}
