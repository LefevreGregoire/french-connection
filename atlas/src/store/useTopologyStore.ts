import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';

export const VisualAlertLevel = {
  Healthy: 0,
  Warning: 1,
  Critical: 2,
  Neutral: 3,
} as const;

export type VisualAlertLevel = (typeof VisualAlertLevel)[keyof typeof VisualAlertLevel];

export interface ContainerNode {
  id: string;
  name: string;
  image: string;
  rawState: string;
  alertLevel: VisualAlertLevel;
  networks: string[];
  cpuUsage?: number;
  ramMb?: number;
  logs?: string[];
}

export interface AgentEventLog {
  id: string;
  timestamp: string;
  source: 'NEXUS' | 'MCP-AGENT' | 'DOCKER';
  message: string;
  level: 'info' | 'warn' | 'crit';
}

const FALLBACK_NODES: ContainerNode[] = [
  {
    id: 'a1b2c3d4e5f1',
    name: 'nginx-proxy-mgr',
    image: 'jc21/nginx-proxy-manager:latest',
    rawState: 'running',
    alertLevel: VisualAlertLevel.Healthy,
    networks: ['dmz', 'lan-backend'],
    cpuUsage: 14,
    ramMb: 128,
    logs: [
      '[GET] 200 /api/v1/health - 2.1ms (TLSv1.3)',
      '[PROXY] Upstream -> http://core-api-dotnet:5000',
      '[WAF] Handshake validated with crowdsec-bouncer',
    ],
  },
  {
    id: 'a1b2c3d4e5f2',
    name: 'waf-crowdsec',
    image: 'crowdsecurity/crowdsec:latest',
    rawState: 'running',
    alertLevel: VisualAlertLevel.Healthy,
    networks: ['dmz'],
    cpuUsage: 22,
    ramMb: 210,
    logs: [
      '[INFO] CrowdSec LAPI listening on :8080',
      '[SCENARIO] http-probing: 0 ban active',
      '[HEARTBEAT] CAPI metrics synced successfully',
    ],
  },
  {
    id: 'a1b2c3d4e5f3',
    name: 'core-api-dotnet',
    image: 'nexus/core-api:8.0',
    rawState: 'running',
    alertLevel: VisualAlertLevel.Healthy,
    networks: ['lan-backend', 'lan-data'],
    cpuUsage: 38,
    ramMb: 340,
    logs: [
      '[INF] Now listening on: http://[::]:5000',
      '[INF] SignalR Hub /hubs/topology active',
      '[DB] EF Core connection pool healthy (postgres-primary)',
    ],
  },
  {
    id: 'a1b2c3d4e5f4',
    name: 'postgres-primary',
    image: 'postgres:16-alpine',
    rawState: 'running',
    alertLevel: VisualAlertLevel.Healthy,
    networks: ['lan-data'],
    cpuUsage: 19,
    ramMb: 512,
    logs: [
      'LOG: database system is ready to accept connections',
      'LOG: checkpoint starting: time',
      'LOG: checkpoint complete: wrote 14 buffers (0.1%)',
    ],
  },
  {
    id: 'a1b2c3d4e5f5',
    name: 'redis-session',
    image: 'redis:7-alpine',
    rawState: 'running',
    alertLevel: VisualAlertLevel.Healthy,
    networks: ['lan-data'],
    cpuUsage: 6,
    ramMb: 64,
    logs: [
      '* Ready to accept connections tcp',
      '* DB saved on disk (RDB snapshot)',
      '* 142 active session keys in memory',
    ],
  },
  {
    id: 'a1b2c3d4e5f6',
    name: 'legacy-worker',
    image: 'debian:bookworm-slim',
    rawState: 'exited',
    alertLevel: VisualAlertLevel.Critical,
    networks: ['lan-backend'],
    cpuUsage: 0,
    ramMb: 0,
    logs: [
      '[WARN] Memory allocation spike detected (98%)',
      '[ERR] Unhandled SIGTERM in batch processor',
      '[FATAL] Container exited with code 137 (OOMKilled)',
    ],
  },
];

const INITIAL_EVENTS: AgentEventLog[] = [
  { id: '1', timestamp: '13:30:00', source: 'NEXUS', message: 'Topologie 3D initialisée (3 sous-réseaux détectés)', level: 'info' },
  { id: '2', timestamp: '13:30:02', source: 'DOCKER', message: 'Alerte critique : legacy-worker est à l’état EXITED (137)', level: 'crit' },
  { id: '3', timestamp: '13:30:04', source: 'MCP-AGENT', message: 'Drone IA en patrouille orbitale. Prêt pour intervention.', level: 'info' },
];

interface TopologyState {
  nodes: ContainerNode[];
  selectedNodeId: string | null;
  activeTargetId: string | null;
  isConnected: boolean;
  error: string | null;
  eventLogs: AgentEventLog[];
  selectNode: (id: string | null) => void;
  connectToNexus: () => Promise<void>;
  toggleContainerState: (id: string) => Promise<void>;
  runMcpCommand: (command: string) => Promise<void>;
}

let isConnecting = false;
const nowTime = () => new Date().toLocaleTimeString('fr-FR', { hour12: false });

export const useTopologyStore = create<TopologyState>((set, get) => ({
  nodes: FALLBACK_NODES,
  selectedNodeId: null,
  activeTargetId: null,
  isConnected: false,
  error: null,
  eventLogs: INITIAL_EVENTS,

  selectNode: (id) => set({ selectedNodeId: id }),

  connectToNexus: async () => {
    if (isConnecting || get().isConnected) return;
    isConnecting = true;

    try {
      const check = await fetch('/api/topology').catch(() => null);
      if (!check || !check.ok) {
        set({ isConnected: false, error: null });
        isConnecting = false;
        return;
      }
    } catch {
      isConnecting = false;
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/topology')
      .withAutomaticReconnect()
      .build();

    connection.on('TopologyUpdated', (updatedNodes: ContainerNode[]) => {
      const enriched = updatedNodes.map((n) => {
        const existing = FALLBACK_NODES.find((f) => f.id === n.id);
        const isUp = n.rawState === 'running';
        return {
          ...n,
          cpuUsage: n.cpuUsage ?? (isUp ? existing?.cpuUsage ?? 18 : 0),
          ramMb: n.ramMb ?? (isUp ? existing?.ramMb ?? 128 : 0),
          logs: n.logs?.length ? n.logs : existing?.logs ?? [`[DOCKER] State: ${n.rawState.toUpperCase()}`],
        };
      });
      set({ nodes: enriched, isConnected: true, error: null });
    });

    try {
      await connection.start();
      set({ isConnected: true, error: null });
    } catch {
      set({ isConnected: false });
      isConnecting = false;
    }
  },

  toggleContainerState: async (id: string) => {
    const target = get().nodes.find((n) => n.id === id);
    if (!target) return;

    const willStart = target.rawState !== 'running';

    if (get().isConnected) {
      try {
        await fetch(`/api/sim/toggle/${id}`, { method: 'POST' });
      } catch {
        // Fallback local
      }
    }

    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== id) return node;
        return {
          ...node,
          rawState: willStart ? 'running' : 'exited',
          alertLevel: willStart ? VisualAlertLevel.Healthy : VisualAlertLevel.Critical,
          cpuUsage: willStart ? 24 : 0,
          ramMb: willStart ? 180 : 0,
          logs: [
            ...(node.logs ?? []).slice(-4),
            willStart
              ? `[${nowTime()}] Container started successfully (healthcheck: PASS)`
              : `[${nowTime()}] SIGTERM received -> Container stopped`,
          ],
        };
      }),
      eventLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: nowTime(),
          source: 'DOCKER',
          message: `${target.name} est passé à l'état ${willStart ? 'RUNNING' : 'EXITED'}`,
          level: willStart ? 'info' : 'crit',
        },
        ...state.eventLogs.slice(0, 18),
      ],
    }));
  },

  runMcpCommand: async (command: string) => {
    const cmd = command.toLowerCase().trim();
    const state = get();

    const pushLog = (message: string, level: 'info' | 'warn' | 'crit' = 'info') =>
      set((s) => ({
        eventLogs: [
          { id: crypto.randomUUID(), timestamp: nowTime(), source: 'MCP-AGENT', message, level },
          ...s.eventLogs.slice(0, 18),
        ],
      }));

    pushLog(`Exécution du plan MCP : "${command}"`, 'info');

    // 1. Commande "Casse tout" / "Kill all" / "Chaos total"
    if (cmd.includes('casse') || cmd.includes('kill all') || cmd.includes('tout couper') || cmd.includes('apocalypse')) {
      const runningNodes = state.nodes.filter((n) => n.rawState === 'running');
      if (runningNodes.length === 0) {
        pushLog('Tous les conteneurs sont déjà à l’arrêt.', 'warn');
        return;
      }
      for (const node of runningNodes) {
        set({ activeTargetId: node.id, selectedNodeId: node.id });
        await new Promise((r) => setTimeout(r, 650));
        await get().toggleContainerState(node.id);
      }
      set({ activeTargetId: null });
      pushLog(`Chaos total exécuté : ${runningNodes.length} conteneur(s) abattu(s).`, 'crit');
      return;
    }

    // 2. Commande "Auto-Heal" / "Répare tout" / "Restart all"
    if (cmd.includes('heal') || cmd.includes('répar') || cmd.includes('repar') || cmd.includes('restart') || cmd.includes('relanc')) {
      const brokenNodes = state.nodes.filter((n) => n.alertLevel === VisualAlertLevel.Critical);
      if (brokenNodes.length === 0) {
        pushLog('Diagnostic terminé : 100% des conteneurs sont opérationnels.', 'info');
        return;
      }
      for (const broken of brokenNodes) {
        set({ activeTargetId: broken.id, selectedNodeId: broken.id });
        await new Promise((r) => setTimeout(r, 750));
        await get().toggleContainerState(broken.id);
      }
      set({ activeTargetId: null });
      pushLog(`Remédiation réussie : ${brokenNodes.length} conteneur(s) restauré(s).`, 'info');
      return;
    }

    // 3. Commande ciblant un conteneur spécifique par son nom (ex: "stop postgres", "coupe nginx", "redis")
    const matchedNode = state.nodes.find((n) =>
      n.name.toLowerCase().split('-').some((part) => part.length > 2 && cmd.includes(part))
    );
    if (matchedNode) {
      set({ activeTargetId: matchedNode.id, selectedNodeId: matchedNode.id });
      await new Promise((r) => setTimeout(r, 750));
      await get().toggleContainerState(matchedNode.id);
      set({ activeTargetId: null });
      return;
    }

    // 4. Commande ciblant une zone (ex: "Chaos DMZ" ou "LAN")
    if (cmd.includes('dmz') || cmd.includes('chaos') || cmd.includes('panne')) {
      const dmzNodes = state.nodes.filter((n) => n.networks.includes('dmz') && n.rawState === 'running');
      for (const dmzNode of dmzNodes) {
        set({ activeTargetId: dmzNode.id, selectedNodeId: dmzNode.id });
        await new Promise((r) => setTimeout(r, 700));
        await get().toggleContainerState(dmzNode.id);
      }
      set({ activeTargetId: null });
      return;
    }

    pushLog(`Ordre non reconnu. Essaie "Auto-Heal", "Casse tout", "Stop postgres" ou "Chaos DMZ".`, 'warn');
  },
}));