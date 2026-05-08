export type Gate = "AND" | "OR";

export interface FtaNode {
  name: string;
  gate: Gate;
  countermeasure: string;
  verification: string;
  reference: string;
  children?: FtaNode[];
}

export interface FtaSummary {
  overview: string;
  keyRisks: string[];
  priorities: string[];
}

export interface FtaResult {
  summary: FtaSummary;
  topGate: Gate;
  causes: FtaNode[];
}
