import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4 shadow-lg border bg-card">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-esg-gov-bg rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-esg-gov" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-sans)" }}>404</h1>

          <h2 className="text-xl font-semibold text-foreground mb-4" style={{ fontFamily: "var(--font-sans)" }}>
            页面未找到
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
            抱歉，您访问的页面不存在。
            <br />
            该页面可能已被移动或删除。
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-esg-gov hover:opacity-90 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
