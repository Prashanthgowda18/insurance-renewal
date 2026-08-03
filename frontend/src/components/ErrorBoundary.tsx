import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Uncaught UI Error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 glass-card border-l-4 border-l-danger bg-red-950/30 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-danger shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-text-primary">An unexpected UI error occurred</h2>
              <p className="text-xs text-text-subtle mt-0.5">
                The application encountered an error while rendering this section.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="p-3 bg-black/40 rounded-lg border border-white/10">
              <p className="text-xs font-mono text-danger font-semibold">{this.state.error.message}</p>
            </div>
          )}

          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-2 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
