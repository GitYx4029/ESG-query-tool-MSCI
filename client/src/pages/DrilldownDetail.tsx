import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Share2, FileBarChart2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Pillar color mapping
const PILLAR_COLORS: Record<string, string> = {
  Environment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  Social: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Governance: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

function getPillarColor(pillar: string) {
  return PILLAR_COLORS[pillar] ?? "bg-gray-100 text-gray-800";
}

// Score bar component
function ScoreBar({
  score,
  maxScore = 10,
  color = "bg-primary",
}: {
  score: number;
  maxScore?: number;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

// Parsed data display
function ParsedDataView({ data }: { data: unknown }) {
  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <FileBarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>暂无解析数据</p>
        <p className="text-xs mt-1">上传时若未包含解析数据，此处将为空</p>
      </div>
    );
  }

  // Try to render as structured ESG data
  const parsed = data as Record<string, unknown>;

  // Check if it's our standard ESG drilldown format
  if (parsed.overallRating || parsed.pillars || parsed.keyIssues) {
    return <StructuredESGView data={parsed} />;
  }

  // Fallback: render as JSON
  return (
    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function StructuredESGView({ data }: { data: Record<string, unknown> }) {
  const pillars = (data.pillars as Record<string, unknown>[]) ?? [];
  const keyIssues = (data.keyIssues as Record<string, unknown>[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Overall rating */}
      {!!data.overallRating && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold">{String(data.overallRating)}</div>
            <div className="text-xs text-muted-foreground">综合评级</div>
          </div>
          {data.overallScore !== undefined && (
            <div className="flex-1">
              <ScoreBar score={Number(data.overallScore)} />
            </div>
          )}
        </div>
      )}

      {/* Pillars */}
      {pillars.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">三大支柱得分</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pillars.map((pillar, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${getPillarColor(String(pillar.name ?? ""))}`}
              >
                <div className="font-medium text-sm">{String(pillar.name ?? "")}</div>
                <div className="text-2xl font-bold mt-1">
                  {pillar.score !== undefined ? Number(pillar.score).toFixed(1) : "—"}
                </div>
                {pillar.weight !== undefined && (
                  <div className="text-xs opacity-70 mt-0.5">
                    权重 {(Number(pillar.weight) * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Issues */}
      {keyIssues.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">关键议题详情</h3>
          <div className="space-y-3">
            {keyIssues.map((issue, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getPillarColor(String(issue.pillar ?? ""))}`}
                    >
                      {String(issue.pillar ?? "")}
                    </Badge>
                    <span className="font-medium text-sm">{String(issue.name ?? "")}</span>
                  </div>
                  {issue.weight !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      权重 {(Number(issue.weight) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                {issue.score !== undefined && (
                  <ScoreBar score={Number(issue.score)} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DrilldownDetail() {
  const params = useParams<{ id: string }>();
  const drilldownId = parseInt(params.id ?? "0", 10);
  const { isAuthenticated } = useAuth();
  const isStaticSite = import.meta.env.BASE_URL !== "/";

  const { data: drilldown, isLoading, error } = trpc.drilldown.getDetail.useQuery(
    { drilldownId },
    { enabled: !isStaticSite && isAuthenticated && drilldownId > 0 }
  );

  const handleDownload = () => {
    if (!drilldown?.s3FileUrl) return;
    window.open(drilldown.s3FileUrl, "_blank");
    toast.success("正在下载原始文件...");
  };

  if (isStaticSite) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>企业 Drilldown 分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>此链接属于需要登录和云端保存的旧报告详情。</p>
              <p>在当前 GitHub Pages 版本中，请进入“企业分析”并在浏览器本地上传 Excel 文件。</p>
              <Link href="/company">
                <Button>进入企业分析</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">请先登录以查看报告</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium">{error.message}</p>
        <Link href="/drilldowns">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </Link>
      </div>
    );
  }

  if (!drilldown) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Back button + header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link href="/drilldowns">
            <Button variant="ghost" size="sm" className="-ml-2 mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回列表
            </Button>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{drilldown.industryName}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>上传于 {formatDate(drilldown.createdAt)}</span>
            {drilldown.originalFilename && (
              <span className="truncate max-w-[200px]">{drilldown.originalFilename}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            下载原始文件
          </Button>
          <Link href="/drilldowns">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              管理分享
            </Button>
          </Link>
        </div>
      </div>

      {/* Parsed data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileBarChart2 className="w-4 h-4" />
            ESG 评级分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ParsedDataView data={drilldown.parsedData} />
        </CardContent>
      </Card>

      {/* Note about full analysis */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          如需完整的行业 Drilldown 分析（方法学解析、同行对标、LLM 对照），请前往
          <Link href="/drilldown/real-estate" className="underline font-medium mx-1">
            行业分析页面
          </Link>
          并上传此报告。
        </span>
      </div>
    </div>
  );
}
