import React, { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Compass, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const modes = [
  {
    id: "Mentor",
    icon: Brain,
    title: "Mentor",
    desc: "AI offers options, perspectives, and sometimes its own view"
  },
  {
    id: "Coach",
    icon: Compass,
    title: "Coach",
    desc: "AI only asks questions — never leads, never judges"
  }
];

export default function TopicInput({ onStart }) {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState(null);

  const canStart = topic.trim().length > 0 && mode;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">MindTree</h1>
        </div>

        {/* Topic Input */}
        <div className="mb-10">
          <label className="block text-sm font-medium text-muted-foreground mb-3 tracking-wide uppercase">
            What topic do you want to explore?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Should our startup go marketplace or SaaS?"
            className="w-full bg-secondary/50 border border-border rounded-xl px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Mode Selection */}
        <div className="mb-10">
          <label className="block text-sm font-medium text-muted-foreground mb-3 tracking-wide uppercase">
            Choose your thinking mode
          </label>
          <div className="grid grid-cols-2 gap-4">
            {modes.map((m) => {
              const Icon = m.icon;
              const selected = mode === m.id;
              return (
                <motion.button
                  key={m.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(m.id)}
                  className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/30 hover:border-muted-foreground/30"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-3 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="font-semibold text-foreground mb-1">{m.title}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{m.desc}</div>
                  {selected && (
                    <motion.div
                      layoutId="mode-indicator"
                      className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={() => onStart(topic, mode)}
          disabled={!canStart}
          className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Start Exploring
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}