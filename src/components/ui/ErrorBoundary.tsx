import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error reporting service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private isConvexError(error: Error): boolean {
    return error.message.includes('ConvexError') || 
           error.message.includes('InvalidCursor') ||
           error.message.includes('[CONVEX');
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isConvexError = this.isConvexError(this.state.error);
      
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {isConvexError ? 'Erro de Dados' : 'Algo deu errado'}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {isConvexError ? (
                  <>
                    Ocorreu um problema ao carregar os dados. Isso pode acontecer quando 
                    os filtros são alterados rapidamente ou há problemas de conectividade.
                  </>
                ) : (
                  <>
                    Ocorreu um erro inesperado. Nossa equipe foi notificada e está 
                    trabalhando para resolver o problema.
                  </>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={this.handleRetry}
                className="flex items-center gap-2"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
              >
                Recarregar Página
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium">
                  Detalhes do Erro (desenvolvimento)
                </summary>
                <div className="mt-2 text-xs">
                  <p className="font-semibold">Erro:</p>
                  <pre className="whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p className="font-semibold mt-2">Component Stack:</p>
                      <pre className="whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for function components
export function useErrorHandler() {
  const handleError = (error: Error) => {
    console.error('Manual error handling:', error);
    
    // Send to error reporting service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  };

  return { handleError };
} 