import React from 'react';
import { captureFrontendException } from '../../monitoring/sentry';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Une erreur inattendue a interrompu l application.',
    };
  }

  componentDidCatch(error, info) {
    void captureFrontendException(error, {
      componentStack: info?.componentStack || '',
    });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)] px-6 py-10 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none dark:backdrop-blur-xl">
            <div className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors duration-300 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              Application protegee
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 transition-colors duration-300 dark:text-slate-100">
              Une section s est arretee, pas toute la plateforme
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600 transition-colors duration-300 dark:text-slate-400">
              {this.state.message}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:brightness-105 dark:shadow-none"
              >
                Recharger l application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
