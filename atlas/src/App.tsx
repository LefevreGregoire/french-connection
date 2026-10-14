import { useEffect } from 'react';
import { Activity, Box, Cpu, Layers, Network, Radio, ShieldAlert, X } from 'lucide-react';
import { IsometricScene } from './scene/IsometricScene';
import { useTopologyStore, VisualAlertLevel } from './store/useTopologyStore';

export default function App() {
  const {
    nodes,
    selectedNodeId,
    selectNode,
    isConnected,
    error,
    connectToNexus,
    toggleContainerState,
  } = useTopologyStore();

  useEffect(() => {
    connectToNexus();
  }, [connectToNexus]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const runningCount = nodes.filter((n) => n.alertLevel === VisualAlertLevel.Healthy).length;
  const criticalCount = nodes.filter((n) => n.alertLevel === VisualAlertLevel.Critical).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050811] select-none">
      {/* SCÈNE 3D ISOMÉTRIQUE */}
      <IsometricScene />

      {/* HUD SUPÉRIEUR : Barre de statut globale */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-xl pointer-events-auto shadow-2xl">
          <Layers className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-white">
              French Connection <span className="text-cyan-400">// ATLAS</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Digital Twin Infrastructure Map
            </div>
          </div>
        </div>

        {/* Compteurs temps réel */}
        <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-xl pointer-events-auto font-mono text-xs">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <Radio className={`w-4 h-4 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-red-500'}`} />
            <span className={isConnected ? 'text-emerald-300' : 'text-red-400'}>
              {isConnected ? 'NEXUS LINKED' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Activity className="w-4 h-4" />
            <span>{runningCount} UP</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-400 pl-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{criticalCount} DOWN</span>
          </div>
        </div>
      </header>

      {/* BANNIÈRE D'ERREUR OU ÉTAT VIDE */}
      {error && (
        <div className="absolute bottom-6 left-6 bg-red-950/90 border border-red-500/60 text-red-200 px-4 py-2.5 rounded-lg text-xs font-mono">
          {error}
        </div>
      )}

      {isConnected && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-950/90 border border-slate-800 px-6 py-4 rounded-xl text-center font-mono">
            <p className="text-sm text-cyan-400 mb-1">Aucun conteneur détecté sur Docker</p>
            <p className="text-xs text-slate-400">
              Lance <code className="text-white">docker run -d --name test-nginx nginx:alpine</code> dans un terminal !
            </p>
          </div>
        </div>
      )}

      {/* HUD LATÉRAL : Inspecteur de conteneur au clic */}
      {selectedNode && (
        <aside className="absolute top-20 right-4 w-80 bg-slate-950/90 backdrop-blur-lg border border-slate-800 rounded-xl p-4 shadow-2xl font-mono text-xs pointer-events-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm truncate">{selectedNode.name}</span>
            </div>
            <button
              onClick={() => selectNode(null)}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">CONTAINER ID</span>
              <span className="text-slate-200">{selectedNode.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">STATE</span>
              <span
                className={`px-2 py-0.5 rounded font-bold uppercase ${
                  selectedNode.alertLevel === VisualAlertLevel.Healthy
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'bg-red-950 text-red-300 border border-red-500/40'
                }`}
              >
                {selectedNode.rawState}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">IMAGE</span>
              <span className="text-slate-200 truncate max-w-[170px]">{selectedNode.image}</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                <Network className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>NETWORKS</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.networks.map((net) => (
                  <span
                    key={net}
                    className="px-2 py-0.5 rounded bg-fuchsia-950/60 border border-fuchsia-500/40 text-fuchsia-300"
                  >
                    {net}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>RESOURCES</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <button
                onClick={() => toggleContainerState(selectedNode.id)}
                className={`w-full py-2 px-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-all cursor-pointer border ${
                  selectedNode.alertLevel === VisualAlertLevel.Healthy
                    ? 'bg-red-950/80 hover:bg-red-900 border-red-500/60 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                    : 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                }`}
              >
                {selectedNode.alertLevel === VisualAlertLevel.Healthy
                  ? '⚡ Simuler Panne (docker stop)'
                  : '▶ Relancer Conteneur (docker start)'}
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
} 
