import * as XLSX from "xlsx";
import type { FtaNode, FtaResult } from "./fta-types";

interface Row {
  level: number;
  gate: string;
  name: string;
  countermeasure: string;
  verification: string;
  reference: string;
  query: string;
}

const indent = (level: number, text: string) => "  ".repeat(level) + text;

function flatten(node: FtaNode, level: number, rows: Row[]) {
  rows.push({
    level,
    gate: node.gate,
    name: indent(level, node.name),
    countermeasure: node.countermeasure,
    verification: node.verification,
    reference: node.reference,
    query: node.reference,
  });
  node.children?.forEach((c) => flatten(c, level + 1, rows));
}

export function exportFtaToExcel(topEvent: string, result: FtaResult) {
  const rows: Row[] = [
    {
      level: 0,
      gate: result.topGate,
      name: indent(0, `[トップ事象] ${topEvent}`),
      countermeasure: "",
      verification: "",
      reference: "",
      query: "",
    },
  ];
  result.causes.forEach((c) => flatten(c, 1, rows));

  const aoa: (string | number)[][] = [
    ["階層", "論理ゲート", "事象名", "対応策", "確認方法", "参考文献", "検索クエリ用ワード"],
    ...rows.map((r) => [
      r.level,
      r.gate,
      r.name,
      r.countermeasure,
      r.verification,
      r.reference,
      r.query,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 6 }, { wch: 10 }, { wch: 50 }, { wch: 40 },
    { wch: 30 }, { wch: 30 }, { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "FTA");
  XLSX.writeFile(wb, `FTA_${topEvent.slice(0, 20)}.xlsx`);
}
