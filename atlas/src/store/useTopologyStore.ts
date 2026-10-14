import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';

export enum VisualAlertLevel {
  Healthy = 0,
  Warning = 1,
  Critical = 2,
  Neutral = 3,
}

export interface ContainerNode {
  id: string;
  name: string;
  image: string;
  rawState: string;
  alertLevel: VisualAlertLevel;
  networks: string[];
}

// Topologie de secours locale : s'affiche immédiatement en attendant que Nexus (.NET 8) réponde
const FALLBACK_NODES: ContainerNode[] = [
  { id: 'a1b2c3d4e5f1', name: 'nginx-proxy-mgr', image: 'jc21/nginx-proxy-manager:latest', rawState: 'running', alertLevel: VisualAlertLevel.Healthy, networks: ['dmz', 'lan-backend'] },
  { id: 'a1b2c3d4e5f2', name: 'waf-crowdsec', image: 'crowdsecurity/crowdsec:latest', rawState: 'running', alertLevel: VisualAlertLevel.Healthy, networks: ['dmz'] },
  { id: 'a1b2c3d4e5f3', name: 'core-api-dotnet', image: 'nexus/core-api:8.0', rawState: 'running', alertLevel: VisualAlertLevel.Healthy, networks: ['lan-backend', 'lan-data'] },
  { id: 'a1b2c3d4e5f4', name: 'postgres-primary', image: 'postgres:16-alpine', rawState: 'running', alertLevel: VisualAlertLevel.Healthy, networks: ['lan-data'] },
  { id: 'a1b2c3d4e5f5', name: 'redis-session', image: 'redis:7-alpine', rawState: 'running', alertLevel: VisualAlertLevel.Healthy, networks: ['lan-data'] },
  { id: 'a1b2c3d4e5f6', name: 'legacy-worker', image: 'debian:bookworm-slim', rawState: 'exited', alertLevel: VisualAlertLevel.Critical, networks: ['lan-backend'] },
];

interface TopologyState {
  nodes: ContainerNode[];
  selectedNodeId: string | null;
  isConnected: boolean;
  error: string | null;
  selectNode: (id: string | null) => void;
  connectToNexus: () => Promise<void>;
  toggleContainerState: (id: string) => Promise<void>;
}

let isConnecting = false;

export const useTopologyStore = create<TopologyState>((set, get) => ({
  // On initialise directement avec la topologie pour un affichage 3D immédiat
  nodes: FALLBACK_NODES,
  selectedNodeId: null,
  isConnected: false,
  error: null,

  selectNode: (id) => set({ selectedNodeId: id }),

  connectToNexus: async () => {
    if (isConnecting || get().isConnected) return;
    isConnecting = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/topology') // Passe par le proxy Vite (:5173 -> 127.0.0.1:5000)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('TopologyUpdated', (updatedNodes: ContainerNode[]) => {
      set({ nodes: updatedNodes, isConnected: true, error: null });
    });

    connection.onreconnecting(() => set({ isConnected: false }));
    connection.onreconnected(() => set({ isConnected: true, error: null }));
    connection.onclose(() => {
      set({ isConnected: false });
      isConnecting = false;
    });

    const tryStart = async () => {
      try {
        await connection.start();
        set({ isConnected: true, error: null });
      } catch {
        set({
          isConnected: false,
          error: 'Mode Simulation Autonome actif (en attente de Nexus sur :5000...)',
        });
        // Réessaie automatiquement toutes les 3 secondes dès que .NET a fini de démarrer
        setTimeout(tryStart, 3000);
      }
    };

    await tryStart();
  },

  toggleContainerState: async (id: string) => {
    // 1. Si Nexus (.NET 8) est connecté, on passe par l'API backend + SignalR
    if (get().isConnected) {
      try {
        await fetch(`/api/sim/toggle/${id}`, { method: 'POST' });
        return;
      } catch {
        // Fallback local en cas de coupure
      }
    }

    // 2. Sinon, bascule immédiate en mémoire locale pour tester la 3D sans blocage !
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== id) return node;
        const isRunning = node.rawState === 'running';
        return {
          ...node,
          rawState: isRunning ? 'exited' : 'running',
          alertLevel: isRunning ? VisualAlertLevel.Critical : VisualAlertLevel.Healthy,
        };
      }),
    }));
  },
}));