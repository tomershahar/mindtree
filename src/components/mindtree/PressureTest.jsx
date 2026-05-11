import React from "react";
import { motion } from "framer-motion";
import { Plus, Zap, Target, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const lensConfig = {
  financial: { icon: "💰", label: "Financial", color: "text-yellow-400" },
  market: { icon: "🌍", label: "Market", color: "text-blue-400" },
  execution: { icon: "⚙️", label: "Execution", color: "text-orange-400" }
};

export default function PressureTest({
  node,
  pressureData,
  alternative,
  isLoadingPressure,
  isLoadingAlt,
  mode,
  onAddAlternative
}) {
  if (!node) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">← Select any branch to pressure-test it</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Node Header */}
      <motion.div
        key={node.id + "-header"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-foreground mb-2">{node.label}</h2>
        <p className="text-sm text-muted-foreground italic leading-relaxed">{node.assumption}</p>
      </motion.div>

      {/* Pressure Test */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AI Pressure Test
          </h3>
        </div>

        {isLoadingPressure ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
            <p className="text-center text-sm text-muted-foreground animate-pulse-glow">
              Pressure testing...
            </p>
          </div>
        ) : pressureData ? (
          <motion.div
            key={node.id + "-pressure"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {Object.entries(lensConfig).map(([key, config]) => {
              const data = pressureData[key];
              if (!data) return null;
              return (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-secondary/30 border border-border"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{config.icon}</span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed font-medium">
                    {data.question}
                  </p>
                  {mode === "Mentor" && data.riskRead && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed italic border-t border-border/50 pt-2">
                      {data.riskRead}
                    </p>
                  )}
                </div>
              );
            })}
          </motion.div>
        ) : null}
      </div>

      {/* Alternative Branch */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            What if instead...
          </h3>
        </div>

        {isLoadingAlt ? (
          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 animate-pulse">
            <div className="h-4 bg-muted rounded w-2/3 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ) : alternative ? (
          <motion.div
            key={node.id + "-alt"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-accent/5 border border-accent/20"
          >
            <div className="font-semibold text-foreground mb-1">{alternative.label}</div>
            <p className="text-sm text-muted-foreground mb-1 italic">{alternative.assumption}</p>
            <p className="text-xs text-muted-foreground mb-3">{alternative.reason}</p>
            <Button
              onClick={onAddAlternative}
              size="sm"
              variant="outline"
              className="border-accent/30 hover:bg-accent/10 text-accent"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add to tree
            </Button>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}