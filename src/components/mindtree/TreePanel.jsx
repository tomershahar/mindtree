import React from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import TreeNode from "./TreeNode";

export default function TreePanel({
  theme,
  rootQuestion,
  branches,
  selectedNodeId,
  expandingNodeId,
  onSelect,
  onToggleLike,
  onExpand,
  onBackToThemes,
  onDoneWithTheme
}) {
  return (
    <div className="p-6 flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBackToThemes}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All themes
        </button>
        <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
          {theme.title}
        </span>
      </div>

      {/* Root Question */}
      <div className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm font-semibold text-primary">{rootQuestion}</p>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto space-y-1 pb-4">
        {branches.map((branch) => (
          <TreeNode
            key={branch.id}
            node={branch}
            depth={0}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
            onToggleLike={onToggleLike}
            onExpand={onExpand}
            expandingNodeId={expandingNodeId}
          />
        ))}
      </div>

      {/* Done button */}
      <Button
        onClick={onDoneWithTheme}
        variant="outline"
        className="mt-4 w-full rounded-xl border-border hover:bg-secondary/60"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Done with this theme
      </Button>
    </div>
  );
}