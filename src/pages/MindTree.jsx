import React, { useState, useCallback, useRef, useEffect } from "react";
import TopicInput from "../components/mindtree/TopicInput";
import ThemeCards from "../components/mindtree/ThemeCards";
import TreePanel from "../components/mindtree/TreePanel";
import PressureTest from "../components/mindtree/PressureTest";
import RedTeamReport from "../components/mindtree/RedTeamReport";
import AppHeader from "../components/mindtree/AppHeader";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateThemes,
  generateRootAndBranches,
  generateSubBranches,
  pressureTestNode,
  suggestAlternative,
  generateReport
} from "../lib/aiPrompts";

// APP STATES: input | loading_themes | themes | tree | report
export default function MindTree() {
  // Core state
  const [appState, setAppState] = useState("input");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("");

  // Themes
  const [themes, setThemes] = useState([]);
  const [completedThemes, setCompletedThemes] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(null);

  // Tree
  const [rootQuestion, setRootQuestion] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandingNodeId, setExpandingNodeId] = useState(null);

  // Trees cache per theme — ref is always in sync for reliable reads
  const [treesCache, setTreesCache] = useState({});
  const treesCacheRef = useRef({});
  const updateTreesCache = useCallback((updater) => {
    updateTreesCache(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      treesCacheRef.current = next;
      return next;
    });
  }, []);

  // Pressure test
  const [pressureData, setPressureData] = useState(null);
  const [alternative, setAlternative] = useState(null);
  const [isLoadingPressure, setIsLoadingPressure] = useState(false);
  const [isLoadingAlt, setIsLoadingAlt] = useState(false);

  // Report
  const [report, setReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Count all liked nodes
  const countLiked = useCallback((nodes) => {
    let count = 0;
    for (const n of nodes) {
      if (n.liked) count++;
      if (n.children) count += countLiked(n.children);
    }
    return count;
  }, []);

  const likedCount = countLiked(branches);

  // Collect all liked nodes
  const collectLiked = useCallback((nodes) => {
    let result = [];
    for (const n of nodes) {
      if (n.liked) result.push({ label: n.label, assumption: n.assumption });
      if (n.children) result = result.concat(collectLiked(n.children));
    }
    // Also check cached trees
    return result;
  }, []);

  const getAllLiked = useCallback(() => {
    let all = [];
    // Pull from cache (always in sync with live branches)
    Object.values(treesCache).forEach(cached => {
      if (cached.branches) {
        all = all.concat(collectLiked(cached.branches));
      }
    });
    // Also include live branches if current theme not in cache yet
    if (currentTheme && !treesCache[currentTheme.id]) {
      all = all.concat(collectLiked(branches));
    }
    // Deduplicate by label
    const seen = new Set();
    return all.filter(item => {
      if (seen.has(item.label)) return false;
      seen.add(item.label);
      return true;
    });
  }, [branches, treesCache, collectLiked, currentTheme]);

  // Always count from cache (which is kept in sync), plus current branches if not in cache
  const totalLikedCount = (() => {
    let total = 0;
    // Count from all cached trees (they are kept in sync)
    Object.values(treesCache).forEach(cached => {
      if (cached.branches) {
        total += countLiked(cached.branches);
      }
    });
    // If current theme not yet saved to cache, count live branches too
    if (currentTheme && !treesCache[currentTheme.id]) {
      total += likedCount;
    }
    return total;
  })();

  // --- HANDLERS ---

  const handleStart = async (inputTopic, inputMode) => {
    setTopic(inputTopic);
    setMode(inputMode);
    setAppState("loading_themes");

    const result = await generateThemes(inputTopic, inputMode);
    setThemes(result);
    setAppState("themes");
  };

  const handleSelectTheme = async (theme) => {
    setCurrentTheme(theme);
    setSelectedNode(null);
    setPressureData(null);
    setAlternative(null);
    setShowReport(false);

    // Use ref for a reliable synchronous cache check
    const cached = treesCacheRef.current[theme.id];
    if (cached) {
      setRootQuestion(cached.rootQuestion);
      setBranches(cached.branches);
      setAppState("tree");
      return;
    }

    setAppState("loading_tree");
    const result = await generateRootAndBranches(topic, mode, theme.title, theme.description);
    const newBranches = result.branches.map(b => ({ ...b, liked: false, children: null, depth: 0 }));
    setRootQuestion(result.rootQuestion);
    setBranches(newBranches);
    updateTreesCache(prev => ({ ...prev, [theme.id]: { rootQuestion: result.rootQuestion, branches: newBranches } }));
    setAppState("tree");
  };

  const handleSelectNode = async (node) => {
    setSelectedNode(node);
    setPressureData(null);
    setAlternative(null);
    setShowReport(false);

    // Load pressure test
    setIsLoadingPressure(true);
    setIsLoadingAlt(true);

    const [pressure, alt] = await Promise.all([
      pressureTestNode(topic, mode, node.label, node.assumption),
      suggestAlternative(topic, findParentLabel(node.id, branches) || topic, node.label)
    ]);

    setPressureData(pressure);
    setIsLoadingPressure(false);
    setAlternative(alt);
    setIsLoadingAlt(false);
  };

  // Find parent label for a node
  const findParentLabel = (nodeId, nodes, parent = null) => {
    for (const n of nodes) {
      if (n.id === nodeId) return parent ? parent.label : null;
      if (n.children) {
        const found = findParentLabel(nodeId, n.children, n);
        if (found) return found;
      }
    }
    return null;
  };

  // Toggle liked
  const handleToggleLike = (nodeId) => {
    const toggle = (nodes) =>
      nodes.map(n => ({
        ...n,
        liked: n.id === nodeId ? !n.liked : n.liked,
        children: n.children ? toggle(n.children) : n.children
      }));
    setBranches(prev => {
      const updated = toggle(prev);
      return updated;
    });
  };

  // Keep cache in sync whenever branches change
  useEffect(() => {
    if (currentTheme && branches.length > 0 && appState === "tree") {
      treesCacheRef.current = {
        ...treesCacheRef.current,
        [currentTheme.id]: { rootQuestion, branches }
      };
      setTreesCache(treesCacheRef.current);
    }
  }, [branches, currentTheme, rootQuestion, appState]);

  // Expand node (generate sub-branches)
  const handleExpand = async (node) => {
    if (node.children && node.children.length > 0) {
      // Collapse
      const collapse = (nodes) =>
        nodes.map(n => ({
          ...n,
          children: n.id === node.id ? null : n.children ? collapse(n.children) : n.children
        }));
      setBranches(prev => collapse(prev));
      return;
    }

    const depth = getNodeDepth(node.id, branches);
    if (depth >= 3) return;

    setExpandingNodeId(node.id);
    const subs = await generateSubBranches(topic, mode, node.label, node.assumption, depth);
    const newChildren = subs.map(s => ({ ...s, id: `${node.id}-child-${s.id}-${Date.now()}`, liked: false, children: null, depth: depth + 1 }));

    const attach = (nodes) =>
      nodes.map(n => ({
        ...n,
        children: n.id === node.id ? newChildren : n.children ? attach(n.children) : n.children
      }));
    setBranches(prev => attach(prev));
    setExpandingNodeId(null);
  };

  const getNodeDepth = (nodeId, nodes, depth = 0) => {
    for (const n of nodes) {
      if (n.id === nodeId) return depth;
      if (n.children) {
        const found = getNodeDepth(nodeId, n.children, depth + 1);
        if (found !== -1) return found;
      }
    }
    return -1;
  };

  // Add alternative to tree
  const handleAddAlternative = () => {
    if (!alternative || !selectedNode) return;
    const parentId = findParentId(selectedNode.id, branches);
    const newNode = {
      id: "alt-" + Date.now(),
      label: alternative.label,
      assumption: alternative.assumption,
      aiSuggested: true,
      liked: false,
      children: null,
      depth: selectedNode.depth || 0
    };

    if (!parentId) {
      // Add to root
      setBranches(prev => [...prev, newNode]);
    } else {
      const addToParent = (nodes) =>
        nodes.map(n => ({
          ...n,
          children: n.id === parentId
            ? [...(n.children || []), newNode]
            : n.children ? addToParent(n.children) : n.children
        }));
      setBranches(prev => addToParent(prev));
    }
    setAlternative(null);
  };

  const findParentId = (nodeId, nodes, parentId = null) => {
    for (const n of nodes) {
      if (n.id === nodeId) return parentId;
      if (n.children) {
        const found = findParentId(nodeId, n.children, n.id);
        if (found !== undefined && found !== null) return found;
      }
    }
    return null;
  };

  // Back to themes
  const handleBackToThemes = () => {
    if (currentTheme) {
      updateTreesCache(prev => ({ ...prev, [currentTheme.id]: { rootQuestion, branches } }));
    }
    setSelectedNode(null);
    setPressureData(null);
    setAlternative(null);
    setExpandingNodeId(null);
    setIsLoadingPressure(false);
    setIsLoadingAlt(false);
    setAppState("themes");
    setShowReport(false);
  };

  const handleDoneWithTheme = () => {
    if (currentTheme) {
      updateTreesCache(prev => ({ ...prev, [currentTheme.id]: { rootQuestion, branches } }));
      setCompletedThemes(prev => prev.includes(currentTheme.id) ? prev : [...prev, currentTheme.id]);
    }
    setSelectedNode(null);
    setPressureData(null);
    setAlternative(null);
    setExpandingNodeId(null);
    setIsLoadingPressure(false);
    setIsLoadingAlt(false);
    setAppState("themes");
    setShowReport(false);
  };

  // New session - reset all state
  const handleNewSession = () => {
    setAppState("input");
    setTopic("");
    setMode("");
    setThemes([]);
    setCompletedThemes([]);
    setCurrentTheme(null);
    setRootQuestion("");
    setBranches([]);
    setSelectedNode(null);
    setExpandingNodeId(null);
    updateTreesCache({});
    setPressureData(null);
    setAlternative(null);
    setIsLoadingPressure(false);
    setIsLoadingAlt(false);
    setReport(null);
    setIsGeneratingReport(false);
    setShowReport(false);
  };

  // Generate report
  const handleGenerateReport = async () => {
    // If report already exists, just show it
    if (report) {
      setShowReport(true);
      return;
    }
    const liked = getAllLiked();
    if (liked.length < 3) return;
    setIsGeneratingReport(true);
    setShowReport(true);

    const result = await generateReport(topic, mode, liked);
    setReport(result);
    setIsGeneratingReport(false);
  };

  // --- RENDER ---

  // State: input
  if (appState === "input") {
    return <TopicInput onStart={handleStart} />;
  }

  // State: loading themes
  if (appState === "loading_themes") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse-glow">Mapping your topic...</p>
      </div>
    );
  }

  // State: loading tree
  if (appState === "loading_tree") {
    return (
      <div className="h-screen flex flex-col">
        <AppHeader
          topic={topic}
          mode={mode}
          likedCount={totalLikedCount}
          onGenerateReport={handleGenerateReport}
          isGeneratingReport={isGeneratingReport}
          showReport={showReport}
          onNewSession={handleNewSession}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-muted-foreground animate-pulse-glow">Building decision tree...</p>
            <button
              onClick={() => setAppState("themes")}
              className="mt-6 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // States: themes, tree, report (split panel)
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppHeader
        topic={topic}
        mode={mode}
        likedCount={totalLikedCount}
        onGenerateReport={handleGenerateReport}
        isGeneratingReport={isGeneratingReport}
        showReport={showReport}
        onNewSession={handleNewSession}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-[45%] border-r border-border overflow-y-auto bg-card/50">
          <AnimatePresence mode="wait">
            {appState === "themes" ? (
              <motion.div
                key="themes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ThemeCards
                  themes={themes}
                  completedThemes={completedThemes}
                  onSelectTheme={handleSelectTheme}
                />
              </motion.div>
            ) : (
              <motion.div
                key="tree"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <TreePanel
                  theme={currentTheme}
                  rootQuestion={rootQuestion}
                  branches={branches}
                  selectedNodeId={selectedNode?.id}
                  expandingNodeId={expandingNodeId}
                  onSelect={handleSelectNode}
                  onToggleLike={handleToggleLike}
                  onExpand={handleExpand}
                  onBackToThemes={handleBackToThemes}
                  onDoneWithTheme={handleDoneWithTheme}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel */}
        <div className="w-[55%] overflow-y-auto">
          <AnimatePresence mode="wait">
            {appState === "themes" ? (
              <motion.div
                key="themes-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center p-8"
              >
                <p className="text-muted-foreground text-lg">Select a theme to begin exploring →</p>
              </motion.div>
            ) : showReport ? (
              <motion.div
                key="report"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <RedTeamReport report={report} isLoading={isGeneratingReport} />
              </motion.div>
            ) : (
              <motion.div
                key="pressure"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <PressureTest
                  node={selectedNode}
                  pressureData={pressureData}
                  alternative={alternative}
                  isLoadingPressure={isLoadingPressure}
                  isLoadingAlt={isLoadingAlt}
                  mode={mode}
                  onAddAlternative={handleAddAlternative}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}