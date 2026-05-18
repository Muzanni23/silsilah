"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Person, Gender } from "@/lib/types";

interface PersonNodeData {
  person: Person;
  spouses: Person[];
  childrenCount: number;
  genColor: string;
}

function PersonNodeComponent({ data, selected }: { data: PersonNodeData; selected?: boolean }) {
  const { person, childrenCount, genColor } = data;
  const initials = person.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const genderColor = person.gender === Gender.MALE ? "#60a5fa" : "#f472b6";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-1" />
      <div
        className={`group relative px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer min-w-[160px] ${
          selected
            ? "border-2 shadow-lg scale-105"
            : "border-border hover:border-border-light hover:shadow-md"
        }`}
        style={{
          background: "rgba(19, 19, 26, 0.9)",
          borderColor: selected ? genColor : undefined,
          boxShadow: selected ? `0 0 20px ${genColor}30` : undefined,
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: person.isAlive
                ? `linear-gradient(135deg, ${genderColor}30, ${genderColor}15)`
                : "rgba(107, 114, 128, 0.2)",
              color: person.isAlive ? genderColor : "#6b7280",
            }}
          >
            {initials}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate max-w-[100px]">
              {person.fullName}
            </p>
            {person.nickname && (
              <p className="text-[10px] text-muted truncate">({person.nickname})</p>
            )}
          </div>

          {/* Status dot */}
          <div
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ background: person.isAlive ? "#22c55e" : "#6b7280" }}
            title={person.isAlive ? "Masih hidup" : "Wafat"}
          />
        </div>

        {/* Meta */}
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
          {person.generationNumber && (
            <span style={{ color: genColor }}>Gen {person.generationNumber}</span>
          )}
          {childrenCount > 0 && <span>· {childrenCount} anak</span>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-1" />
    </>
  );
}

export default memo(PersonNodeComponent);
