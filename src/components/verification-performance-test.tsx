import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVerificationProgress } from '@/hooks/useVerificationProgress';
import { CheckCircle, Clock, Zap } from 'lucide-react';

const testCases = [
  {
    name: "Business Claim",
    content: "Elon Musk just launched a competitor to OpenAI",
    expectedCategory: "business"
  },
  {
    name: "Health Claim", 
    content: "WHO has declared COVID-19 completely eradicated",
    expectedCategory: "health"
  },
  {
    name: "Political Claim",
    content: "The new Nigerian constitution bans crypto trading",
    expectedCategory: "political"
  }
];

export const VerificationPerformanceTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    duration: number;
    confidence: number;
    status: string;
    sources: number;
  }>>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  
  const {
    totalProgress,
    isProcessing,
    startVerification,
    result,
    error
  } = useVerificationProgress();

  const runPerformanceTest = async (testCase: any) => {
    setCurrentTest(testCase.name);
    const startTime = Date.now();
    
    try {
      await startVerification(testCase.content);
      
      if (result) {
        const duration = Date.now() - startTime;
        setTestResults(prev => [...prev, {
          test: testCase.name,
          duration,
          confidence: result.confidence || 0,
          status: result.status || 'unknown',
          sources: result.sources?.length || 0
        }]);
      }
    } catch (err) {
      console.error('Test failed:', err);
    } finally {
      setCurrentTest(null);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    for (const testCase of testCases) {
      await runPerformanceTest(testCase);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const averageTime = testResults.length > 0 
    ? testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length 
    : 0;

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Verification Performance Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests}
            disabled={isProcessing}
            size="sm"
          >
            {isProcessing ? 'Testing...' : 'Run All Tests'}
          </Button>
          {testCases.map(testCase => (
            <Button
              key={testCase.name}
              variant="outline"
              size="sm"
              onClick={() => runPerformanceTest(testCase)}
              disabled={isProcessing}
            >
              {testCase.name}
            </Button>
          ))}
        </div>

        {/* Current Test Progress */}
        {currentTest && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Testing: {currentTest}</span>
              <span className="text-sm">{Math.round(totalProgress)}%</span>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Average Time</div>
                <div className="text-lg font-semibold">{(averageTime / 1000).toFixed(1)}s</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Tests Completed</div>
                <div className="text-lg font-semibold">{testResults.length}</div>
              </div>
            </div>

            {/* Test Results */}
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{result.test}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {result.confidence}% confidence
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {result.sources} sources
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {(result.duration / 1000).toFixed(1)}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <span className="text-sm text-red-800 dark:text-red-200">Error: {error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};