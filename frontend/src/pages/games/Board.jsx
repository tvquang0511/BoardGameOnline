import React from "react";
import { cn } from "@/lib/utils";

export default function Board({ size, cursor, getCellView }) {
  return (
    <div className="w-full overflow-auto">
      <div
        className="grid gap-1 rounded-lg border bg-muted p-2 mx-auto w-fit"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: size * size }).map((_, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const v = getCellView(r, c) || {};
          const isCursor = cursor.r === r && cursor.c === c;

          // ✅ if select cell -> remove border
          const cellBorder = v.noBorder ? "border-transparent" : "border";

          return (
            <div
              key={i}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 rounded-sm",
                cellBorder,
                "flex items-center justify-center",
                "text-[10px] font-semibold select-none",
                "bg-background",
                v.bgClass,
                v.textClass,
                v.ring ? "ring-2 ring-primary" : "",
                isCursor ? "outline outline-2 outline-primary" : ""
              )}
              title={v.title || ""}
            >
              {v.text || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}