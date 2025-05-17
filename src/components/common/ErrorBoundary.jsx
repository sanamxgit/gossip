import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Optionally report to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      
      // If no fallback provided and silent mode is enabled, render nothing
      if (this.props.silent) {
        return null;
      }
      
      // Default fallback UI
      return (
        <div className="error-boundary">
          <p>Something went wrong with this component.</p>
          {this.props.showReload && (
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              type="button"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary; 