import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    console.error("Erreur de rendu 3D attrapée :", error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-cyan-400 font-mono text-xs">
          <div className="bg-slate-900 border border-cyan-500/40 p-4 rounded-xl text-center">
            <p className="font-bold mb-1">Contexte 3D en cours de chargement...</p>
            <p className="text-slate-400 text-[11px]">Si le message persiste, rafraîchis la page.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}