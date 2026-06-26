import React from "react";
import { Link } from "react-router-dom";
import { WarningCircle } from "@phosphor-icons/react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#030305] text-white p-6">
          <div className="text-center max-w-lg p-8 border border-red-500/20 bg-red-500/5 rounded-2xl">
            <WarningCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-medium mb-2">Something went wrong</h1>
            <p className="text-slate-400 mb-6 text-sm">
              We've encountered an unexpected error. Our engineering team has been notified.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-full transition-colors"
              >
                Reload Page
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false })}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors"
              >
                Go Home
              </Link>
            </div>
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <div className="mt-8 text-left bg-black/50 p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono text-red-300">
                <p className="font-bold">{this.state.error.toString()}</p>
                <pre className="mt-2 text-slate-500">{this.state.errorInfo?.componentStack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
