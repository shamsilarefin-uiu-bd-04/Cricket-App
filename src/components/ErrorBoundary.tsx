import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { StorageService } from '../utils/storage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught unhandled render exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetDefaults = () => {
    if (window.confirm('Reset all tournament, team, and match data back to initial defaults?')) {
      StorageService.resetToDefaults();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 selection:bg-amber-500">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4 text-3xl">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
              Rooftop Cricket Tournament
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mb-4">
              An unexpected render issue occurred. Your data is protected.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 border border-red-950/60 rounded-xl p-3 text-left mb-6 max-h-36 overflow-auto">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                  Error Details:
                </span>
                <p className="text-xs font-mono text-red-300 break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetDefaults}
                className="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Database to Defaults</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
