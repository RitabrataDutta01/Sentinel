import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <h2 className="text-lg font-bold mb-4">Something went wrong.</h2>
          <div className="mb-4">
            <p className="mb-2">{
              this.props.fallbackMessage ||
              'There was an error in this part of the application.'
            }</p>
            {this.props.showDetails && (
              <div className="text-sm mt-2">
                <p>Details: {this.state.error?.toString()}</p>
              </div>
            )}
          </div>
          {this.props.onReset && (
            <button
              onClick={this.props.onReset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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