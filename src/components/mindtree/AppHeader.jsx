import React from "react";
import { Sparkles, Star, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AppHeader({
  topic,
  mode,
  likedCount,
  onGenerateReport,
  isGeneratingReport,
  showReport,
  onNewSession
}) {
  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-6 gap-4 shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="font-bold text-sm tracking-tight">MindTree</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border" />

      {/* Topic */}
      <span className="text-sm text-muted-foreground truncate max-w-[300px]">{topic}</span>

      {/* Mode badge */}
      <Badge variant="outline" className="text-xs border-primary/30 text-primary shrink-0">
        {mode}
      </Badge>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Liked count */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Star className={`w-3.5 h-3.5 ${likedCount > 0 ? "text-yellow-400 fill-yellow-400" : ""}`} />
        <span>{likedCount} starred</span>
      </div>

      {/* New Session */}
      <Button
        onClick={onNewSession}
        size="sm"
        variant="ghost"
        className="rounded-lg text-xs text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
        New Session
      </Button>

      {/* Generate Report */}
      <div className="flex flex-col items-end gap-0.5">
        <Button
          onClick={onGenerateReport}
          disabled={likedCount < 3 || isGeneratingReport}
          size="sm"
          className="rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 text-xs font-semibold"
        >
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          {isGeneratingReport ? "Generating..." : showReport ? "Report Ready" : "Generate Report"}
        </Button>
        {likedCount < 3 && (
          <span className="text-[10px] text-muted-foreground/60">
            Star {3 - likedCount} more to unlock
          </span>
        )}
      </div>
    </header>
  );
}