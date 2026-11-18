import { Component, type ErrorInfo, type ReactNode } from "react";
import "./index.scss";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <p>页面出错了</p>
          <button type="button" className="is-click" onClick={() => window.location.reload()}>
            刷新
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
