import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const themeIcons = ["🎯", "💡", "🛡️", "⚡", "🎪"];

export default function ThemeCards({ themes, completedThemes, onSelectTheme }) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-muted-foreground mb-6 tracking-wide uppercase">
        Themes to Explore
      </h2>
      <div className="space-y-3">
        {themes.map((theme, i) => {
          const isComplete = completedThemes.includes(theme.id);
          return (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              whileHover={{ x: 4 }}
              onClick={() => onSelectTheme(theme)}
              className="w-full text-left p-5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-muted-foreground/30 transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <span className="text-xl mt-0.5">{themeIcons[i % themeIcons.length]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {theme.title}
                    </span>
                    {isComplete && (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}