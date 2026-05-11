import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, Minus, Sparkles, ChevronRight } from "lucide-react";

export default function TreeNode({
  node,
  depth,
  selectedNodeId,
  onSelect,
  onToggleLike,
  onExpand,
  expandingNodeId
}) {
  const isSelected = selectedNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isExpanding = expandingNodeId === node.id;

  return (
    <div className="relative">
      {/* Connecting line */}
      {depth > 0 && (
        <div className="absolute left-3 -top-3 w-px h-3 bg-border" />
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative"
        style={{ marginLeft: depth * 24 }}
      >
        {/* Horizontal connector */}
        {depth > 0 && (
          <div className="absolute -left-4 top-5 w-4 h-px bg-border" />
        )}

        <div
          onClick={() => onSelect(node)}
          className={`group flex items-start gap-3 p-3 pr-4 rounded-lg cursor-pointer transition-all duration-200 border ${
            isSelected
              ? "bg-primary/10 border-primary/40 shadow-sm shadow-primary/10"
              : "bg-secondary/20 border-transparent hover:bg-secondary/40 hover:border-border"
          }`}
        >
          {/* Left accent bar when selected */}
          {isSelected && (
            <motion.div
              layoutId="node-selected"
              className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary"
            />
          )}

          {/* Expand/collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (depth < 3) onExpand(node);
            }}
            className={`mt-0.5 shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              depth >= 3
                ? "opacity-0 cursor-default"
                : "hover:bg-primary/20 text-muted-foreground hover:text-primary"
            }`}
          >
            {isExpanding ? (
              <div className="w-3.5 h-3.5 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
            ) : hasChildren ? (
              <Minus className="w-3.5 h-3.5" />
            ) : depth < 3 ? (
              <Plus className="w-3.5 h-3.5" />
            ) : null}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium leading-snug ${
                isSelected ? "text-primary" : "text-foreground"
              }`}>
                {node.label}
              </span>
              {node.aiSuggested && (
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent/20 text-accent text-[10px] font-semibold">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI pick
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
              {node.assumption}
            </p>
          </div>

          {/* Star */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(node.id);
            }}
            className="shrink-0 mt-0.5 p-1 rounded transition-colors hover:bg-primary/10"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                node.liked
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground/40 hover:text-yellow-400/60"
              }`}
            />
          </button>
        </div>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1 space-y-1 relative"
            >
              {/* Vertical line for children */}
              <div
                className="absolute left-3 top-0 w-px bg-border"
                style={{ height: "calc(100% - 12px)" }}
              />
              {node.children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedNodeId={selectedNodeId}
                  onSelect={onSelect}
                  onToggleLike={onToggleLike}
                  onExpand={onExpand}
                  expandingNodeId={expandingNodeId}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}