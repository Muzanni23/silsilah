"use client";

import { useCallback, useMemo, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Person, Marriage, Gender, LinkStatus, DataStatus } from "@/lib/types";
import PersonSidebar from "./person-sidebar";
import PersonNode from "./person-node";
import { Search, X, Download, GitBranch } from "lucide-react";
import { toPng } from "html-to-image";

const nodeTypes = { person: PersonNode };

const GEN_COLORS: Record<number, string> = {
  1: "#818cf8", 2: "#34d399", 3: "#fbbf24",
  4: "#f87171", 5: "#a78bfa", 6: "#38bdf8",
};

function getChildrenOf(personId: string, allPersons: Person[]): Person[] {
  return allPersons.filter((p) => p.fatherId === personId || p.motherId === personId);
}

function getSpousesOf(personId: string, allPersons: Person[], allMarriages: Marriage[]): Person[] {
  const spouseIds = new Set<string>();
  allMarriages.forEach((m) => {
    if (m.husbandId === personId) spouseIds.add(m.wifeId);
    if (m.wifeId === personId) spouseIds.add(m.husbandId);
  });
  return allPersons.filter((p) => spouseIds.has(p.id));
}

function buildTree(persons: Person[], marriages: Marriage[]) {
  const linked = persons;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Pemetaan objek silsilah untuk akses cepat
  const personsMap = new Map<string, Person>();
  linked.forEach((p) => personsMap.set(p.id, p));

  const childrenMap = new Map<string, Person[]>();
  linked.forEach((p) => {
    if (p.fatherId) {
      if (!childrenMap.has(p.fatherId)) {
        childrenMap.set(p.fatherId, []);
      }
      childrenMap.get(p.fatherId)!.push(p);
    }
  });

  // Cari leluhur/root utama (yang tidak memiliki ayah terdaftar di data)
  const roots = linked.filter((p) => !p.fatherId || !personsMap.has(p.fatherId));

  // Urutkan roots berdasarkan nomor generasi terkecil, lalu nama
  roots.sort((a, b) => {
    const genA = a.generationNumber || 1;
    const genB = b.generationNumber || 1;
    if (genA !== genB) return genA - genB;
    return a.fullName.localeCompare(b.fullName);
  });

  const positions = new Map<string, { x: number; y: number }>();
  let cursorX = 0;
  const NODE_W = 180;
  const NODE_H = 70;
  const GAP_X = 50; // Spasi horizontal antar node sibling
  const GAP_Y = 120; // Spasi vertikal antar generasi

  function layoutNode(nodeId: string, depth: number): number {
    const children = childrenMap.get(nodeId) || [];
    const person = personsMap.get(nodeId);
    
    // Gunakan generationNumber yang sah jika tersedia, atau hitung dari kedalaman
    const gen = person?.generationNumber || (depth + 1);
    const y = (gen - 1) * (NODE_H + GAP_Y);

    if (children.length === 0) {
      // Leaf node: letakkan di cursorX saat ini, lalu geser cursorX ke kanan
      const x = cursorX;
      cursorX += NODE_W + GAP_X;
      positions.set(nodeId, { x, y });
      return x;
    }

    // Internal node: posisikan seluruh anak terlebih dahulu secara rekursif
    const childXPositions: number[] = [];
    children.forEach((child) => {
      const childX = layoutNode(child.id, depth + 1);
      childXPositions.push(childX);
    });

    // Posisikan parent tepat di tengah-tengah rata-rata koordinat anak-anaknya
    const minChildX = Math.min(...childXPositions);
    const maxChildX = Math.max(...childXPositions);
    let x = (minChildX + maxChildX) / 2;

    // Jika posisi tengah parent berada di sebelah kiri batas cursorX saat ini,
    // maka geser parent beserta seluruh sub-pohon keturunannya ke kanan.
    if (x < cursorX) {
      const shift = cursorX - x;
      shiftSubtree(nodeId, shift);
      x = cursorX;
    }

    // Perbarui cursorX umum agar node berikutnya tidak bertabrakan
    cursorX = Math.max(cursorX, x + NODE_W + GAP_X);
    positions.set(nodeId, { x, y });
    return x;
  }

  function shiftSubtree(nodeId: string, shift: number) {
    const pos = positions.get(nodeId);
    if (pos) {
      pos.x += shift;
    }
    const children = childrenMap.get(nodeId) || [];
    children.forEach((child) => {
      shiftSubtree(child.id, shift);
    });
  }

  // Jalankan penyusunan tata letak pohon untuk setiap root
  roots.forEach((root) => {
    layoutNode(root.id, 0);
  });

  // Untuk node yang terputus (jika ada data abnormal), letakkan di ujung kanan agar aman
  linked.forEach((person) => {
    if (!positions.has(person.id)) {
      const gen = person.generationNumber || 1;
      const y = (gen - 1) * (NODE_H + GAP_Y);
      const x = cursorX;
      cursorX += NODE_W + GAP_X;
      positions.set(person.id, { x, y });
    }
  });

  // Tengahkan seluruh pohon secara horizontal di sekitar koordinat x = 0
  let minX = Infinity;
  let maxX = -Infinity;
  positions.forEach((pos) => {
    if (pos.x < minX) minX = pos.x;
    if (pos.x > maxX) maxX = pos.x;
  });
  const totalTreeWidth = maxX - minX;
  const offsetX = minX + totalTreeWidth / 2;

  positions.forEach((pos) => {
    pos.x -= offsetX;
  });

  // Konstruksi node dan edge final untuk React Flow
  linked.forEach((person) => {
    const pos = positions.get(person.id) || { x: 0, y: 0 };
    const gen = person.generationNumber || 1;

    nodes.push({
      id: person.id,
      type: "person",
      position: pos,
      data: {
        person,
        spouses: getSpousesOf(person.id, persons, marriages),
        childrenCount: getChildrenOf(person.id, persons).length,
        genColor: GEN_COLORS[gen] || "#888",
      },
    });

    if (person.fatherId) {
      edges.push({
        id: `e-${person.fatherId}-${person.id}`,
        source: person.fatherId,
        target: person.id,
        type: "smoothstep",
        style: { stroke: GEN_COLORS[gen] || "#3a3a4a", strokeWidth: 2 },
        animated: false,
      });
    }
  });

  return { nodes, edges };
}

function TreeContent({ initialPersons, initialMarriages }: { initialPersons: Person[], initialMarriages: Marriage[] }) {
  const { nodes: initNodes, edges: initEdges } = useMemo(() => buildTree(initialPersons, initialMarriages), [initialPersons, initialMarriages]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [genFilter, setGenFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);
  
  const stats = useMemo(() => {
    const branches = new Set(initialPersons.map((p) => p.familyBranch).filter(Boolean));
    return { branches: [...branches] as string[] };
  }, [initialPersons]);

  const selectedPerson = useMemo(
    () => initialPersons.find((p) => p.id === selectedId),
    [selectedId, initialPersons]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedId(node.id);
  }, []);

  const filteredNodes = useMemo(() => {
    return initNodes.filter((n) => {
      const p = (n.data as { person: Person }).person;
      const matchSearch = !search || p.fullName.toLowerCase().includes(search.toLowerCase()) || p.nickname?.toLowerCase().includes(search.toLowerCase());
      let matchGen = true;
      if (genFilter === "1-3") matchGen = (p.generationNumber || 0) <= 3;
      else if (genFilter === "4-6") matchGen = (p.generationNumber || 0) >= 4;
      const matchBranch = branchFilter === "all" || p.familyBranch === branchFilter;
      return matchSearch && matchGen && matchBranch;
    });
  }, [initNodes, search, genFilter, branchFilter]);

  const filteredIds = new Set(filteredNodes.map((n) => n.id));
  const visibleEdges = initEdges.filter(
    (e) => filteredIds.has(e.source) && filteredIds.has(e.target)
  );

  // Export ke PNG
  const handleExport = async () => {
    if (!flowRef.current) return;
    setExporting(true);
    try {
      const el = flowRef.current.querySelector(".react-flow__viewport") as HTMLElement;
      if (!el) return;
      const dataUrl = await toPng(el, {
        backgroundColor: "#0a0a0f",
        pixelRatio: 2,
        filter: (node) => {
          // Hilangkan controls & minimap dari export
          const cl = (node as HTMLElement).classList;
          if (!cl) return true;
          return !cl.contains("react-flow__controls") && !cl.contains("react-flow__minimap");
        },
      });
      const link = document.createElement("a");
      link.download = "pohon-keluarga-bani-abd-mutthalib.png";
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-1 h-full relative">
      {/* Filter Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            placeholder="Cari nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-36"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Gen Filter */}
        <div className="glass rounded-xl flex overflow-hidden">
          {[
            { key: "all", label: "Semua" },
            { key: "1-3", label: "Gen 1–3" },
            { key: "4-6", label: "Gen 4–6" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setGenFilter(f.key)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                genFilter === f.key
                  ? "bg-gold-muted text-gold-light"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Branch Filter */}
        <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
          <GitBranch size={14} className="text-muted" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-foreground cursor-pointer"
          >
            <option value="all" className="bg-card">Semua Cabang</option>
            {stats.branches.map((b) => (
              <option key={b} value={b} className="bg-card">{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Export Button */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => window.open('/cetak/buku', '_blank')}
          className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
        >
          <Download size={14} /> Cetak Buku
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? "Mengekspor..." : "Export PNG"}
        </button>
      </div>

      {/* Generation Labels */}
      <div className="absolute left-4 top-20 z-10 flex flex-col gap-[110px] pointer-events-none">
        {[1, 2, 3, 4, 5, 6].map((gen) => (
          <span
            key={gen}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border text-muted"
            style={{ color: GEN_COLORS[gen] }}
          >
            Gen {gen}
          </span>
        ))}
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1" ref={flowRef}>
        <ReactFlow
          nodes={filteredNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1a2e" />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const p = (n.data as { person: Person }).person;
              return p.isAlive ? "#22c55e" : "#6b7280";
            }}
            maskColor="rgba(10,10,15,0.8)"
          />
        </ReactFlow>
      </div>

      {/* Sidebar */}
      {selectedPerson && (
        <PersonSidebar
          person={selectedPerson}
          allPersons={initialPersons}
          allMarriages={initialMarriages}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export default function FamilyTreeCanvas({ initialPersons = [], initialMarriages = [] }: { initialPersons?: Person[], initialMarriages?: Marriage[] }) {
  return (
    <ReactFlowProvider>
      <TreeContent initialPersons={initialPersons} initialMarriages={initialMarriages} />
    </ReactFlowProvider>
  );
}
