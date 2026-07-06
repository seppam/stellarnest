import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('🔥 StellarNest Crash:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          fontFamily: 'monospace',
          background: '#1a1a2e',
          color: '#e94560',
          minHeight: '100vh',
        }}>
          <h1 style={{ color: '#fff', marginBottom: '16px' }}>
            🔥 StellarNest Crashed
          </h1>
          <div style={{ background: '#16213e', padding: '20px', borderRadius: '12px', overflow: 'auto' }}>
            <p style={{ color: '#f0a500', fontWeight: 'bold', marginBottom: '8px' }}>
              Error Message:
            </p>
            <pre style={{ color: '#eee', fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.toString()}
            </pre>

            {this.state.errorInfo && (
              <>
                <p style={{ color: '#f0a500', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
                  Component Stack:
                </p>
                <pre style={{ color: '#888', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}

            <details style={{ marginTop: '20px' }}>
              <summary style={{ cursor: 'pointer', color: '#0f3460' }}>Full Error Details</summary>
              <pre style={{ color: '#ccc', fontSize: '12px', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                {this.state.error?.stack || 'No stack trace available'}
              </pre>
            </details>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: '#e94560',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              🔄 Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
