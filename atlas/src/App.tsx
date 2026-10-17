import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Box,
  ChevronDown,
  ChevronUp,
  Compass,
  CornerDownLeft,
  Cpu,
  Crosshair,
  Eye,
  HardDrive,
  Layers,
  Map,
  Network,
  Play,
  PowerOff,
  Sparkles,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import { IsometricScene, type CameraPreset } from './scene/IsometricScene';
import { useTopologyStore, VisualAlertLevel } from './store/useTopologyStore';

export default function App() {
  const {
    nodes,
    selectedNodeId,
    activeTargetId,
    selectNode,
    isConnected,
    eventLogs,
    connectToNexus,
    toggleContainerState,
    runMcpCommand,
  } = useTopologyStore();

  const [promptInput, setPromptInput] = useState('');
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [isClusterDropdownOpen, setIsClusterDropdownOpen] = useState(false);
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    connectToNexus();
  }, [connectToNexus]);

  // Raccourcis clavier style Linear / Raycast (Ctrl+K / Cmd+K et Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        selectNode(null);
        setIsClusterDropdownOpen(false);
        setIsQuickActionsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectNode]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const runningCount = nodes.filter((n) => n.alertLevel === VisualAlertLevel.Healthy).length;
  const criticalCount = nodes.filter((n) => n.alertLevel === VisualAlertLevel.Critical).length;

  const avgCpu = nodes.length
    ? Math.round(nodes.reduce((acc, n) => acc + (n.cpuUsage ?? 0), 0) / nodes.length)
    : 0;
  const totalRam = nodes.reduce((acc, n) => acc + (n.ramMb ?? 0), 0);

  const latestLog = eventLogs[0];

  const copySreDiagnostic = () => {
    const errorContainers = nodes.filter((n) => n.alertLevel === VisualAlertLevel.Critical);
    const recentLogs = eventLogs
      .slice(0, 8)
      .map((l) => `[${l.timestamp}] [${l.source}] ${l.message}`)
      .join('\n');

    const diagnosticPrompt = `Tu es l'agent IA d'astreinte SRE pour "French Connection Atlas" (SRE diagnostic).
Voici l'état instantané de l'infrastructure d'exploitation :
- Total Conteneurs : ${nodes.length} Docks
- Santé : ${runningCount} UP, ${criticalCount} DOWN (En panne d'urgence : ${errorContainers.map((c) => c.name).join(', ') || 'Aucun'})
- Métriques Globales : Charge CPU ${avgCpu}%, RAM allouée ${totalRam}MB

🚨 ÉLÉMENT EN INCIDENT 🚨
${
  errorContainers
    .map(
      (c) => `Nom: ${c.name}\nImage:${c.image}\nÉtat: ${c.rawState}\nDerniers logs:\n${c.logs?.join('\n') || 'Pas de logs stderr.'}`,
    )
    .join('\n---\n') || 'Aucun incident actif.'
}

📜 JOURNAL DE BORD DU TERMINAL :
${recentLogs}

Commente la cause racine, puis formule précisément une commande Atlas "Spot inspect <nom_du_conteneur>" ou "Auto-Heal" pour résoudre l'incident. Explique ton plan d'action !`;

    navigator.clipboard.writeText(diagnosticPrompt);
    alert('📋 État du terminal et des incidents copié ! Colle ce diagnostic à ton IA dans ton navigateur.');
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    const cmd = promptInput;
    setPromptInput('');
    await runMcpCommand(cmd);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#eef2f6] text-slate-900 select-none antialiased">
      {/* SCÈNE 3D ISOMÉTRIQUE */}
      <IsometricScene showAllLabels={showAllLabels} cameraPreset={cameraPreset} />

      {/* BARRE SUPÉRIEURE */}
      <header className="absolute top-3.5 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        {/* Gauche : Identité + Toggle Labels */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-xl border border-slate-200/80 px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-900">
              French Connection
            </span>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/60">
              SPOT-MCP
            </span>
          </div>

          <button
            onClick={() => setShowAllLabels((v) => !v)}
            className={`px-3 py-1.5 rounded-full border text-[11px] font-mono font-medium flex items-center gap-1.5 transition cursor-pointer shadow-[0_2px_10px_rgba(15,23,42,0.04)] backdrop-blur-xl ${
              showAllLabels
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white/95 border-slate-200/80 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Labels: {showAllLabels ? 'Tous' : 'Survol'}</span>
          </button>
        </div>

        {/* Centre : Sélecteur d'angle de caméra (ISO 3D / PLAN 2D / SUIVI SPOT) */}
        <div className="hidden md:flex items-center bg-white/95 backdrop-blur-xl border border-slate-200/80 p-1 rounded-full shadow-[0_2px_10px_rgba(15,23,42,0.04)] pointer-events-auto font-mono text-[10px]">
          <button
            onClick={() => setCameraPreset('iso')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold transition cursor-pointer ${
              cameraPreset === 'iso' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>ISO 3D</span>
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold transition cursor-pointer ${
              cameraPreset === 'top' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3 h-3" />
            <span>PLAN 2D</span>
          </button>
          <button
            onClick={() => setCameraPreset('spot')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold transition cursor-pointer ${
              cameraPreset === 'spot'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>CAM SPOT-01</span>
          </button>
        </div>

        {/* Droite : Télémétrie + Menu Quais */}
        <div className="relative flex items-center gap-2 pointer-events-auto font-mono text-[11px] tabular-nums">
          {/* Nouveau bouton de Diagnostics pour Gemini Browser */}
          <button
            onClick={copySreDiagnostic}
            title="Copier le diagnostic SRE pour Gemini dans le presse-papier"
            className="bg-white/95 hover:bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex items-center gap-1.5 font-semibold font-mono text-[11px] text-slate-800 cursor-pointer transition pointer-events-auto"
          >
            <Terminal className="w-3.5 h-3.5 text-rose-600" strokeWidth={1.75} />
            <span>diagnostic SRE (Gemini)</span>
          </button>

          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200/80">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="font-semibold text-slate-700">
                {isConnected ? 'NEXUS' : 'SIM'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-500 pr-3 border-r border-slate-200/80">
              <span>
                CPU <strong className="text-slate-900 font-semibold">{avgCpu}%</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                RAM <strong className="text-slate-900 font-semibold">{totalRam}M</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{runningCount} UP</span>
            </div>

            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 text-rose-600 font-semibold pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>{criticalCount} DOWN</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsClusterDropdownOpen((v) => !v)}
            className="bg-white/95 hover:bg-white backdrop-blur-xl border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer transition"
          >
            <Box className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            <span>Quais ({nodes.length})</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                isClusterDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isClusterDropdownOpen && (
            <div className="absolute right-0 top-11 w-72 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)] z-30">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 py-1.5 border-b border-slate-100 flex justify-between">
                <span>Unités Déployées</span>
                <span>CPU</span>
              </div>
              <div className="mt-1 space-y-0.5 max-h-64 overflow-y-auto">
                {nodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      selectNode(n.id);
                      setIsClusterDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      selectedNodeId === n.id
                        ? 'bg-slate-900 text-white font-semibold'
                        : n.alertLevel === VisualAlertLevel.Critical
                        ? 'bg-rose-50/80 text-rose-900 hover:bg-rose-100/80'
                        : 'hover:bg-slate-100/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          n.alertLevel === VisualAlertLevel.Critical
                            ? 'bg-rose-500 animate-ping'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-[11px] truncate">{n.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${
                          selectedNodeId === n.id
                            ? 'bg-white/15 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {n.networks[0]}
                      </span>
                      <span className="text-[10px] opacity-75 w-7 text-right">{n.cpuUsage ?? 0}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* BAS GAUCHE : Ticker d'événements dépliable */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto font-mono">
        {isLogsExpanded ? (
          <section className="w-88 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl p-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] text-[11px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-700" strokeWidth={1.75} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Journal Temps Réel ({eventLogs.length})
                </span>
              </div>
              <button
                onClick={() => setIsLogsExpanded(false)}
                className="text-slate-400 hover:text-slate-800 p-0.5 rounded cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {eventLogs.map((ev) => (
                <div key={ev.id} className="leading-snug flex gap-2 text-[10px]">
                  <span className="text-slate-400 shrink-0 tabular-nums">{ev.timestamp}</span>
                  <span
                    className={`font-semibold shrink-0 ${
                      ev.source === 'MCP-AGENT'
                        ? 'text-amber-600'
                        : ev.level === 'crit'
                        ? 'text-rose-600'
                        : 'text-sky-600'
                    }`}
                  >
                    {ev.source}
                  </span>
                  <span className="text-slate-700">{ev.message}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <button
            onClick={() => setIsLogsExpanded(true)}
            className="bg-white/95 hover:bg-white backdrop-blur-xl border border-slate-200/80 px-3.5 py-2 rounded-full shadow-[0_4px_14px_rgba(15,23,42,0.06)] flex items-center gap-2 text-[11px] max-w-xs cursor-pointer transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-slate-600 truncate">
              {latestLog ? `${latestLog.source}: ${latestLog.message}` : 'Flux télémétrique actif'}
            </span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        )}
      </div>

      {/* BAS CENTRE : Command Bar Spot-01 avec Raccourci ⌘K */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-auto z-20">
        <div className="relative">
          {isQuickActionsOpen && (
            <div className="absolute bottom-13 left-0 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] flex items-center gap-1.5">
              <button
                onClick={() => {
                  runMcpCommand('Auto-Heal : Redémarrer les conteneurs en panne');
                  setIsQuickActionsOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Wrench className="w-3 h-3 text-emerald-600" strokeWidth={1.75} />
                Spot Auto-Heal ({criticalCount})
              </button>
              <button
                onClick={() => {
                  runMcpCommand('Chaos DMZ');
                  setIsQuickActionsOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" strokeWidth={1.75} />
                Drain DMZ
              </button>
              <button
                onClick={() => {
                  runMcpCommand('Casse tout');
                  setIsQuickActionsOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-800 text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <PowerOff className="w-3 h-3 text-rose-600" strokeWidth={1.75} />
                Casse tout
              </button>
            </div>
          )}

          <form
            onSubmit={handlePromptSubmit}
            className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-full p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] flex items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => setIsQuickActionsOpen((v) => !v)}
              className={`px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                isQuickActionsOpen
                  ? 'bg-slate-900 text-white'
                  : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-900 border border-amber-400/40'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-600" strokeWidth={2} />
              <span>Spot-01</span>
              <ChevronUp
                className={`w-3 h-3 transition-transform ${isQuickActionsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <div className="flex items-center gap-2 flex-1 px-2">
              <Bot className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
              <input
                ref={inputRef}
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Assigner une mission à Spot-01..."
                className="w-full bg-transparent text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                ⌘K
              </kbd>
            </div>

            <button
              type="submit"
              className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center cursor-pointer transition shrink-0"
              title="Exécuter la mission"
            >
              <CornerDownLeft className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </form>
        </div>
      </footer>

      {/* TIROIR D'INSPECTION DROIT (Avec Sparkline CPU & Dispatch direct de Spot) */}
      {selectedNode && (
        <aside className="absolute top-14 right-4 w-84 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl p-4 shadow-[0_12px_32px_rgba(15,23,42,0.12)] font-mono text-xs pointer-events-auto z-20">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
                <Box className="w-4 h-4 text-white" strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs leading-none">{selectedNode.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">ID // {selectedNode.id}</div>
              </div>
            </div>
            <button
              onClick={() => selectNode(null)}
              className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">STATUS</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase flex items-center gap-1.5 ${
                  selectedNode.alertLevel === VisualAlertLevel.Healthy
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedNode.alertLevel === VisualAlertLevel.Healthy ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                {selectedNode.rawState}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">IMAGE</span>
              <span className="text-slate-700 truncate max-w-45 text-[11px]">{selectedNode.image}</span>
            </div>

            <div className="pt-2.5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                <Network className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                <span>SECTORS (SUBNETS)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.networks.map((net) => (
                  <span
                    key={net}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]"
                  >
                    {net}
                  </span>
                ))}
              </div>
            </div>

            {/* Télémétrie avec mini Sparkline SVG */}
            <div className="pt-2.5 border-t border-slate-100 space-y-2 tabular-nums">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} /> CPU TELEMETRY
                </span>
                <div className="flex items-center gap-2">
                  <svg className="w-14 h-4 stroke-sky-600 fill-none" viewBox="0 0 60 16">
                    <polyline
                      strokeWidth="1.5"
                      points={`0,12 12,${14 - (selectedNode.cpuUsage ?? 10) * 0.1} 24,9 36,${
                        13 - (selectedNode.cpuUsage ?? 10) * 0.12
                      } 48,7 60,${15 - (selectedNode.cpuUsage ?? 0) * 0.14}`}
                    />
                  </svg>
                  <span className="text-slate-900 font-semibold">{selectedNode.cpuUsage ?? 0}%</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 transition-all duration-500"
                  style={{ width: `${selectedNode.cpuUsage ?? 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} /> RAM ALLOCATION
                </span>
                <span className="text-slate-900 font-semibold">{selectedNode.ramMb ?? 0} MB</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, ((selectedNode.ramMb ?? 0) / 512) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                <span>STDOUT STREAM</span>
              </div>
              <div className="bg-slate-900 text-slate-200 rounded-xl p-2.5 space-y-1 max-h-24 overflow-y-auto text-[10px]">
                {(selectedNode.logs ?? []).map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.includes('FATAL') || line.includes('ERR') || line.includes('stopped')
                        ? 'text-rose-400 font-semibold'
                        : 'text-slate-300'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons d'action : Dispatch Robot Spot-01 ou Toggle direct */}
            <div className="pt-1 space-y-1.5">
              <button
                onClick={() => runMcpCommand(`Spot inspect ${selectedNode.name}`)}
                disabled={activeTargetId === selectedNode.id}
                className="w-full py-2 px-3 rounded-xl font-semibold uppercase tracking-wider text-[10px] transition cursor-pointer bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Bot className="w-3.5 h-3.5" strokeWidth={2} />
                <span>
                  {selectedNode.alertLevel === VisualAlertLevel.Critical
                    ? 'Dépêcher Spot-01 (Réparer)'
                    : 'Envoyer Spot-01 inspecter'}
                </span>
              </button>

              <button
                onClick={() => toggleContainerState(selectedNode.id)}
                className={`w-full py-1.5 px-3 rounded-xl font-semibold uppercase tracking-wider text-[10px] transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                  selectedNode.alertLevel === VisualAlertLevel.Healthy
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                }`}
              >
                {selectedNode.alertLevel === VisualAlertLevel.Healthy ? (
                  <>
                    <PowerOff className="w-3 h-3" strokeWidth={1.75} />
                    <span>Stop Direct (SIGTERM)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" strokeWidth={1.75} />
                    <span>Start Direct</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}