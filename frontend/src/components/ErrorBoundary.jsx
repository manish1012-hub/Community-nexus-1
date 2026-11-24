import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-900/60 text-red-400 border border-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-slate-100">Client Interface Restored</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              An unexpected render state occurred. Click below to reload the PharmaCare AI workspace cleanly.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset & Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
