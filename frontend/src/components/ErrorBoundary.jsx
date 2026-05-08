import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-primary)] p-4 text-[var(--color-text-primary)]">
          <div className="max-w-md w-full bg-[var(--color-bg-secondary)] border border-red-500/20 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Oops, something went wrong.</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              The application encountered an unexpected error.
            </p>
            <div className="bg-[var(--color-bg-tertiary)] p-3 rounded-lg text-left text-xs font-mono text-red-400 mb-6 overflow-x-auto">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-all shadow-md font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}