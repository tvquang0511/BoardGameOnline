import React from "react";
import { cn } from "@/lib/utils";

export default function GameBoardFrame({ title, children, footer, className }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="border-b px-4 py-3 flex items-center justify-between gap-3">
          <div className="font-semibold">{title}</div>
        </div>
        <div className="p-4">{children}</div>
        {footer ? <div className="border-t p-4">{footer}</div> : null}
      </div>
    </div>
  );
}