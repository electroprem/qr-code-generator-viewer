import { Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';

const Generator = lazy(() => import('@features/generator/GeneratorPage').then(m => ({ default: m.GeneratorPage })));
const Scanner = lazy(() => import('@features/scanner/ScannerPage').then(m => ({ default: m.ScannerPage })));
const Settings = lazy(() => import('@features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const History = lazy(() => import('@features/history/HistoryPage').then(m => ({ default: m.HistoryPage })));
const Batch = lazy(() => import('@features/batch/BatchPage').then(m => ({ default: m.BatchPage })));

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" />
  </div>
);

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('💥 ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😱</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">{this.state.error?.message}</p>
            <pre className="text-xs text-red-500 bg-red-500/10 p-4 rounded overflow-auto text-left">
              {this.state.error?.stack}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Layout>
          <Routes>
            <Route path="/" element={<Generator />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/history" element={<History />} />
            <Route path="/batch" element={<Batch />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;