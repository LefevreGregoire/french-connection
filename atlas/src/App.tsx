import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Box,
  CornerDownLeft,
  Cpu,
  HardDrive,
  Layers,
  Network,
  Play,
  PowerOff,
  Radio,
  Server,
  Sparkles,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import { IsometricScene } from './scene/IsometricScene';
import { useTopologyStore, VisualAlertLevel } from './store/useTopologyStore';

export default function App() {
  const {
    nodes,
    selectedNodeId,
    selectNode,
    isConnected,
    eventLogs,
    connectToNexus,
    toggleContainerState,
    runMcpCommand,
  } = useTopologyStore();

  const [promptInput, setPromptInput] = useState('');

  useEffect(() => {
    connectToNexus();
  }, [connectToNexus]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const runningCount = nodes.filter((n) => n.alertLevel === VisualAlertLevel.Healthy).length;
  const criticalCount = nodes.filter((n) => n.alertLevel === VisualAlertLevel.Critical).length;

  const avgCpu = nodes.length
    ? Math.round(nodes.reduce((acc, n) => acc + (n.cpuUsage ?? 0), 0) / nodes.length)
    : 0;
  const totalRam = nodes.reduce((acc, n) => acc + (n.ramMb ?? 0), 0);

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    const cmd = promptInput;
    setPromptInput('');
    await runMcpCommand(cmd);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#dbeafe] text-slate-900 select-none antialiased">
      {/* SCÈNE 3D ISOMÉTRIQUE CLAIRE */}
      <IsometricScene />

      {/* TOP BAR : Light Mode Silicon Valley */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3.5 bg-white/90 backdrop-blur-xl border border-slate-200/90 px-4 py-2.5 rounded-xl pointer-events-auto shadow-lg shadow-slate-900/5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-sm">
            <Layers className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-900">
                French Connection
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                PORT TERMINAL
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              3D Container Logistics & Infrastructure Twin
            </div>
          </div>
        </div>

        {/* Compteurs globaux clairs */}
        <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xl border border-slate-200/90 px-4 py-2.5 rounded-xl pointer-events-auto font-mono text-xs shadow-lg shadow-slate-900/5 tabular-nums">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
            <Radio
              className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-600' : 'text-amber-500'}`}
              strokeWidth={2}
            />
            <span className="text-[11px] font-semibold text-slate-700">
              {isConnected ? 'NEXUS // LINKED' : 'SIMULATOR // ACTIVE'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{runningCount}</span>
            <span className="text-slate-500 font-normal text-[11px]">RUNNING</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 font-semibold pl-1">
            <span className={`w-2 h-2 rounded-full bg-rose-500 ${criticalCount > 0 ? 'animate-ping' : ''}`} />
            <span>{criticalCount}</span>
            <span className="text-slate-500 font-normal text-[11px]">CRITICAL</span>
          </div>
        </div>
      </header>

      {/* PANNEAU GAUCHE : Journal d'audit clair */}
      <section className="absolute bottom-24 left-4 w-88 bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-xl p-3.5 font-mono text-[11px] pointer-events-auto shadow-lg shadow-slate-900/5">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-sky-600" strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-700">
              Port Activity & MCP Feed
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {eventLogs.map((ev) => (
            <div key={ev.id} className="leading-relaxed flex gap-2 text-[11px]">
              <span className="text-slate-400 shrink-0 tabular-nums">{ev.timestamp}</span>
              <span
                className={`font-bold shrink-0 ${
                  ev.source === 'MCP-AGENT'
                    ? 'text-amber-600'
                    : ev.level === 'crit'
                    ? 'text-rose-600'
                    : 'text-sky-600'
                }`}
              >
                [{ev.source}]
              </span>
              <span className="text-slate-700 truncate">{ev.message}</span>
            </div>
          ))}
        </div>
      </section>

      {/* BARRE CENTRALE BASSE : Command Bar Agent IA (Chef de Quai) */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl p-3 shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
              MCP Field Engineer Orders
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => runMcpCommand('Auto-Heal : Redémarrer les conteneurs en panne')}
                className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Wrench className="w-3 h-3 text-emerald-600" strokeWidth={2} />
                Auto-Heal ({criticalCount})
              </button>
              <button
                onClick={() => runMcpCommand('Chaos DMZ')}
                className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" strokeWidth={2} />
                Drain Quai DMZ
              </button>
              <button
                onClick={() => runMcpCommand('Casse tout')}
                className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <PowerOff className="w-3 h-3 text-rose-600" strokeWidth={2} />
                Casse tout
              </button>
            </div>
          </div>

          <form onSubmit={handlePromptSubmit} className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 flex-1 bg-slate-50 border border-slate-200 focus-within:border-sky-500 focus-within:bg-white rounded-xl px-3.5 py-2 transition">
              <Bot className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={2} />
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Ordonner à l'ingénieur IA (ex: 'Auto-Heal', 'Stop postgres', 'Casse tout')..."
                className="w-full bg-transparent text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <span>EXEC</span>
              <CornerDownLeft className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </form>
        </div>
      </footer>

      {/* PANNEAU LATÉRAL DROIT : Manifeste Conteneur ou Vue Globale du Port */}
      <aside className="absolute top-20 right-4 w-88 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-xl p-4 shadow-xl shadow-slate-900/10 font-mono text-xs pointer-events-auto">
        {selectedNode ? (
          <>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Box className="w-4 h-4 text-sky-600" strokeWidth={2} />
                <div>
                  <div className="font-bold text-slate-900 text-sm leading-none">{selectedNode.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1">CONTAINER ID // {selectedNode.id}</div>
                </div>
              </div>
              <button
                onClick={() => selectNode(null)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">STATUS</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    selectedNode.alertLevel === VisualAlertLevel.Healthy
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border border-rose-300'
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IMAGE</span>
                <span className="text-slate-700 font-medium truncate max-w-[190px] text-[11px]">
                  {selectedNode.image}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <Network className="w-3.5 h-3.5 text-sky-600" strokeWidth={2} />
                  <span>ASSIGNED DOCKS (SUBNETS)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.networks.map((net) => (
                    <span
                      key={net}
                      className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-[11px]"
                    >
                      {net}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2.5 tabular-nums">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Cpu className="w-3.5 h-3.5 text-sky-600" strokeWidth={2} /> CPU LOAD
                  </span>
                  <span className="text-slate-900 font-bold">{selectedNode.cpuUsage ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${selectedNode.cpuUsage ?? 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} /> MEMORY
                  </span>
                  <span className="text-slate-900 font-bold">{selectedNode.ramMb ?? 0} MB</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, ((selectedNode.ramMb ?? 0) / 512) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-sky-600" strokeWidth={2} />
                  <span>CONTAINER LOGS</span>
                </div>
                <div className="bg-slate-900 text-slate-200 rounded-lg p-2.5 space-y-1 max-h-28 overflow-y-auto text-[10px] leading-relaxed">
                  {(selectedNode.logs ?? []).map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.includes('FATAL') || line.includes('ERR') || line.includes('stopped')
                          ? 'text-rose-400 font-semibold'
                          : 'text-slate-200'
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => toggleContainerState(selectedNode.id)}
                  className={`w-full py-2 px-3 rounded-lg font-bold uppercase tracking-wider text-[11px] transition cursor-pointer border flex items-center justify-center gap-2 ${
                    selectedNode.alertLevel === VisualAlertLevel.Healthy
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
                  }`}
                >
                  {selectedNode.alertLevel === VisualAlertLevel.Healthy ? (
                    <>
                      <PowerOff className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Simuler Panne (docker stop)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Relancer Conteneur (docker start)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* VUE D'ENSEMBLE DU PORT PAR DÉFAUT (Style Clair NodeVille) */
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-sky-600" strokeWidth={2} />
                <div>
                  <div className="font-bold text-slate-900 text-xs tracking-wide uppercase">
                    Port Cluster Overview
                  </div>
                  <div className="text-[10px] text-slate-500">Proxmox VE • 3 Quais Actifs</div>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  criticalCount === 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-300'
                }`}
              >
                {criticalCount === 0 ? 'HEALTHY' : `${criticalCount} ALERT`}
              </span>
            </div>

            <div className="space-y-2 tabular-nums">
              <div className="flex justify-between text-[11px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CLUSTER CPU AVG
                </span>
                <span className="text-slate-900 font-bold">{avgCpu}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${avgCpu}%` }} />
              </div>

              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  TOTAL ALLOCATED RAM
                </span>
                <span className="text-slate-900 font-bold">{totalRam} MB</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalRam / 2048) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Conteneurs à Quai ({nodes.length})</span>
                <span className="text-slate-400 font-normal">Cliquer pour inspecter</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {nodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => selectNode(n.id)}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      n.alertLevel === VisualAlertLevel.Critical
                        ? 'bg-rose-50 border-rose-300 hover:bg-rose-100'
                        : 'bg-slate-50/80 border-slate-200 hover:border-sky-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          n.alertLevel === VisualAlertLevel.Critical ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-[10px] text-slate-500 font-semibold tabular-nums">
                        {n.cpuUsage ?? 0}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-900 font-bold truncate">{n.name}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider truncate mt-0.5">
                      {n.networks[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}