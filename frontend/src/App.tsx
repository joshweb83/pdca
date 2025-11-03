import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-primary">
              PDCA - 대학 성과관리 시스템
            </h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="rounded-lg border bg-card p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">환영합니다!</h2>
            <p className="text-muted-foreground mb-4">
              프로그램 기반 성과 관리 시스템이 곧 시작됩니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">프로그램 관리</h3>
                <p className="text-sm text-muted-foreground">
                  부서/학과별 프로그램 등록 및 관리
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">KPI & 지표</h3>
                <p className="text-sm text-muted-foreground">
                  성과 요소 입력 및 산출식 관리
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">성과 모니터링</h3>
                <p className="text-sm text-muted-foreground">
                  실시간 성과 추적 및 분석
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">외부 연동</h3>
                <p className="text-sm text-muted-foreground">
                  기존 시스템과 양방향 API 연동
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
