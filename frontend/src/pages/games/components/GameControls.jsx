import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CornerDownLeft, ArrowLeftRight, ArrowRight, Save, FolderOpen } from "lucide-react";

export default function GameControls({
  onAction,
  onSave,
  onLoad,
  onBack,
  showHelp,
  disabled,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => onAction?.("LEFT")}
      >
        <ArrowLeftRight className="h-4 w-4 mr-2" />
        Left
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => onAction?.("RIGHT")}
      >
        <ArrowRight className="h-4 w-4 mr-2" />
        Right
      </Button>
      <Button
        variant="default"
        size="sm"
        disabled={disabled}
        onClick={() => onAction?.("ENTER")}
      >
        <CornerDownLeft className="h-4 w-4 mr-2" />
        Enter
      </Button>

      <Separator orientation="vertical" className="h-8 mx-1" />

      <Button variant="outline" size="sm" onClick={onBack}>
        Back
      </Button>

      <Button variant="outline" size="sm" onClick={() => onAction?.("HELP")}>
        <HelpCircle className="h-4 w-4 mr-2" />
        Help
      </Button>

      <Separator orientation="vertical" className="h-8 mx-1" />

      <Button variant="outline" size="sm" onClick={onSave}>
        <Save className="h-4 w-4 mr-2" />
        Save
      </Button>
      <Button variant="outline" size="sm" onClick={onLoad}>
        <FolderOpen className="h-4 w-4 mr-2" />
        Load
      </Button>

      {showHelp ? <Badge variant="secondary">Hint: ON</Badge> : null}
    </div>
  );
}