// Use dynamic import for client components with Monaco editor
import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';

// Use dynamic import with ssr disabled for the component that contains Monaco editor
const PatternAnalyzerInterface = dynamic(
  () => import('@/components/pattern-analyzer/pattern-analyzer-interface'),
  { ssr: false }
);

export const metadata = {
  title: 'Pattern Analyzer | GitLLM',
  description: 'Analyze code patterns across GitHub repositories',
};

export default function PatternAnalyzerPage() {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="light"
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="container mx-auto px-4 max-w-none">
          <div className="w-full mx-auto mb-10">
            <h1 className="text-4xl font-semibold text-gray-900 mb-4 text-center">
              Code Pattern Analyzer
            </h1>
            <p className="text-lg text-gray-600 mb-8 text-center">
              Search for similar code implementations across GitHub repositories
              and analyze differences
            </p>
            <PatternAnalyzerInterface />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
