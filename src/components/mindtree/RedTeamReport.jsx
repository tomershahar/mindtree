import React from "react";
import { motion } from "framer-motion";
import { Copy, Check, AlertTriangle, CheckCircle2, Search, ArrowRight, Code, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";

export default function RedTeamReport({ report, isLoading }) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const formatReportAsMarkdown = () => {
    if (!report) return "";
    let md = "# Red Team Report\n\n";
    md += "## ⚠️ Weak Assumptions\n\n";
    report.weakAssumptions?.forEach((a) => {
      md += `**${a.name}**\n${a.why}\n\n`;
    });
    md += "## ✅ Strong Branches\n\n";
    report.strongBranches?.forEach((b) => {
      md += `**${b.name}**\n${b.why}\n\n`;
    });
    md += "## 🔍 Synthesis\n\n";
    report.synthesis?.forEach((s) => {
      md += `- ${s}\n`;
    });
    md += `\n## → Recommended Next Step\n\n${report.nextStep}\n\n`;
    if (report.outputFormat === "prompt") {
      md += `## 💻 Cursor/Lovable Prompt\n\n\`\`\`\n${report.outputContent}\n\`\`\`\n`;
    } else {
      md += `## 📋 Argument Summary\n\n${report.outputContent}\n`;
    }
    return md;
  };

  const handleExportPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    const maxW = pageW - margin * 2;
    let y = 20;

    const addText = (text, opts = {}) => {
      const { fontSize = 11, bold = false, color = [220, 220, 230], indent = 0 } = opts;
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxW - indent);
      lines.forEach(line => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin + indent, y);
        y += fontSize * 0.5;
      });
      y += 2;
    };

    const addSection = (title) => {
      y += 4;
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(130, 150, 255);
      doc.text(title.toUpperCase(), margin, y);
      y += 6;
    };

    addText("Red Team Report", { fontSize: 22, bold: true, color: [240, 240, 255] });
    y += 4;

    addSection("⚠  Weak Assumptions");
    report.weakAssumptions?.forEach(a => {
      addText(a.name, { bold: true, color: [255, 210, 100] });
      addText(a.why, { color: [180, 180, 200], indent: 4 });
      y += 2;
    });

    addSection("✓  Strong Branches");
    report.strongBranches?.forEach(b => {
      addText(b.name, { bold: true, color: [100, 220, 150] });
      addText(b.why, { color: [180, 180, 200], indent: 4 });
      y += 2;
    });

    addSection("🔍  Synthesis");
    report.synthesis?.forEach((s, i) => {
      addText(`${i + 1}. ${s}`, { color: [200, 210, 240], indent: 4 });
    });

    addSection("→  Recommended Next Step");
    addText(report.nextStep, { color: [220, 200, 255], indent: 4 });

    addSection(report.outputFormat === "prompt" ? "💻  Cursor/Lovable Prompt" : "📋  Argument Summary");
    addText(report.outputContent, { color: [200, 210, 230], indent: 4 });

    doc.save("red-team-report.pdf");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatReportAsMarkdown());
    setCopied(true);
    toast({ title: "Report copied!", description: "Markdown copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse-glow">Generating red team report...</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">Red Team Report</h2>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="rounded-lg">
            <Download className="w-4 h-4 mr-1.5" />
            Export PDF
          </Button>
          <Button onClick={handleCopy} variant="outline" size="sm" className="rounded-lg">
            {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? "Copied!" : "Copy Report"}
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Weak Assumptions */}
        <Section icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />} title="Weak Assumptions" color="yellow">
          {report.weakAssumptions?.map((a, i) => (
            <div key={i} className="p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/15">
              <div className="font-semibold text-foreground mb-1">{a.name}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.why}</p>
            </div>
          ))}
        </Section>

        {/* Strong Branches */}
        <Section icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} title="Strong Branches" color="green">
          {report.strongBranches?.map((b, i) => (
            <div key={i} className="p-4 rounded-xl bg-green-400/5 border border-green-400/15">
              <div className="font-semibold text-foreground mb-1">{b.name}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.why}</p>
            </div>
          ))}
        </Section>

        {/* Synthesis */}
        <Section icon={<Search className="w-4 h-4 text-primary" />} title="Synthesis" color="blue">
          <div className="space-y-2">
            {report.synthesis?.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-primary text-sm font-bold mt-0.5">{i + 1}.</span>
                <p className="text-sm text-foreground leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Next Step */}
        <Section icon={<ArrowRight className="w-4 h-4 text-accent" />} title="Recommended Next Step" color="purple">
          <div className="p-4 rounded-xl bg-accent/5 border border-accent/15">
            <p className="text-sm text-foreground leading-relaxed font-medium">{report.nextStep}</p>
          </div>
        </Section>

        {/* Output */}
        <Section
          icon={report.outputFormat === "prompt" ? <Code className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
          title={report.outputFormat === "prompt" ? "Cursor/Lovable Prompt" : "Argument Summary"}
          color="blue"
        >
          <div className="p-4 rounded-xl bg-secondary/50 border border-border font-mono text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {report.outputContent}
          </div>
        </Section>
      </motion.div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}