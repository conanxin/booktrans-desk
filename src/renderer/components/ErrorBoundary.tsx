import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  errorSummary: string | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    errorSummary: null
  };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      errorSummary: sanitizeErrorSummary(error)
    };
  }

  componentDidCatch(error: unknown): void {
    console.error("Renderer render error", sanitizeErrorSummary(error));
  }

  render() {
    if (!this.state.errorSummary) {
      return this.props.children;
    }

    return (
      <main className="error-boundary">
        <section className="error-boundary-panel">
          <p className="error-boundary-label">渲染错误</p>
          <h1>BookTrans Desk 无法显示当前界面。</h1>
          <p>
            请打开 DevTools，将 Console 中的错误提交到 GitHub issue。不要粘贴 API 密钥、Authorization Header 或私密书籍正文。
          </p>
          <pre>{this.state.errorSummary}</pre>
        </section>
      </main>
    );
  }
}

function sanitizeErrorSummary(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[redacted api key]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, "Bearer [redacted]")
    .replace(/[A-Za-z]:\\[^\s)"']+/g, "[local path]")
    .replace(/\/(?:Users|home|mnt)\/[^\s)"']+/g, "[local path]")
    .slice(0, 500);
}
