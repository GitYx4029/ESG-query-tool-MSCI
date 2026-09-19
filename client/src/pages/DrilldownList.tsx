import { useState, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  Trash2,
  Share2,
  Eye,
  Link2,
  X,
  FileBarChart2,
  Users,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const INDUSTRY_OPTIONS = [
  "Real Estate Management & Development",
  "Diversified Banks",
  "Regional Banks",
  "Software",
  "Technology Hardware, Storage & Peripherals",
  "Semiconductors & Semiconductor Equipment",
  "Oil, Gas & Consumable Fuels",
  "Electric Utilities",
  "Pharmaceuticals",
  "Biotechnology",
  "Food Products",
  "Automobiles",
  "Aerospace & Defense",
  "其他行业",
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:...;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ─── Upload Dialog ─────────────────────────────────────────────────────────

function UploadDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [industry, setIndustry] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.drilldown.upload.useMutation({
    onSuccess: () => {
      toast.success("上传成功！");
      onSuccess();
      onClose();
      setIndustry("");
      setFile(null);
    },
    onError: (err) => {
      toast.error(err.message || "上传失败，请重试");
    },
  });

  const handleSubmit = async () => {
    if (!file || !industry) {
      toast.error("请选择行业和文件");
      return;
    }
    const fileBase64 = await fileToBase64(file);
    uploadMutation.mutate({
      fileName: file.name,
      fileBase64,
      industryName: industry,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>上传 Drilldown 报告</DialogTitle>
          <DialogDescription>
            上传 MSCI ESG Ratings Drilldown Excel 文件。原始文件将加密存储，仅您可见。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>行业分类</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="选择行业..." />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Drilldown Excel 文件</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileBarChart2 className="w-4 h-4 text-primary" />
                  <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>点击选择 .xlsx 文件</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploadMutation.isPending}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || !file || !industry}
          >
            {uploadMutation.isPending ? "上传中..." : "确认上传"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Share Dialog ──────────────────────────────────────────────────────────

function ShareDialog({
  drilldownId,
  open,
  onClose,
}: {
  drilldownId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit" | "admin">("view");
  const [publicLinkToken, setPublicLinkToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const utils = trpc.useUtils();
  const shareMutation = trpc.drilldown.share.useMutation({
    onSuccess: (data) => {
      if (data.type === "public_link" && data.shareToken) {
        setPublicLinkToken(data.shareToken);
      } else {
        toast.success(`已分享给 ${email}`);
        setEmail("");
        if (drilldownId) utils.drilldown.listShares.invalidate({ drilldownId });
      }
    },
    onError: (err) => toast.error(err.message || "分享失败"),
  });

  const handleEmailShare = () => {
    if (!drilldownId || !email) return;
    shareMutation.mutate({ drilldownId, email, permission, publicLink: false });
  };

  const handlePublicLink = () => {
    if (!drilldownId) return;
    shareMutation.mutate({ drilldownId, publicLink: true, permission: "view" });
  };

  const copyLink = () => {
    if (!publicLinkToken) return;
    const url = `${window.location.origin}/shared/${publicLinkToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail("");
    setPublicLinkToken(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享报告</DialogTitle>
          <DialogDescription>通过邮箱邀请或生成公开链接分享此报告</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Email share */}
          <div className="space-y-2">
            <Label>邮箱分享</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入对方邮箱..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailShare()}
              />
              <Select
                value={permission}
                onValueChange={(v) => setPermission(v as "view" | "edit" | "admin")}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">查看</SelectItem>
                  <SelectItem value="edit">编辑</SelectItem>
                  <SelectItem value="admin">管理</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={handleEmailShare}
              disabled={!email || shareMutation.isPending}
              className="w-full"
            >
              发送邀请
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">或</span>
            </div>
          </div>

          {/* Public link */}
          <div className="space-y-2">
            <Label>公开链接</Label>
            {publicLinkToken ? (
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/shared/${publicLinkToken}`}
                  className="text-xs"
                />
                <Button size="sm" variant="outline" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePublicLink}
                disabled={shareMutation.isPending}
                className="w-full"
              >
                <Link2 className="w-4 h-4 mr-2" />
                生成公开链接
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shares Manager Dialog ─────────────────────────────────────────────────

function SharesManagerDialog({
  drilldownId,
  open,
  onClose,
}: {
  drilldownId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: shares, isLoading } = trpc.drilldown.listShares.useQuery(
    { drilldownId: drilldownId! },
    { enabled: open && drilldownId !== null }
  );

  const revokeMutation = trpc.drilldown.revokeShare.useMutation({
    onSuccess: () => {
      toast.success("已撤销分享");
      if (drilldownId) utils.drilldown.listShares.invalidate({ drilldownId });
    },
    onError: (err) => toast.error(err.message || "撤销失败"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>管理分享</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">加载中...</p>
          ) : !shares?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无分享记录</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>分享对象</TableHead>
                  <TableHead>权限</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell className="text-sm">
                      {share.shareToken
                        ? "公开链接"
                        : share.sharedWithEmail ?? "未知"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{share.permission}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {share.shareToken ? "链接" : "邮箱"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => revokeMutation.mutate({ shareId: share.id })}
                        disabled={revokeMutation.isPending}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────

function DeleteConfirmDialog({
  drilldownId,
  open,
  onClose,
  onSuccess,
}: {
  drilldownId: number | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const deleteMutation = trpc.drilldown.deleteOne.useMutation({
    onSuccess: () => {
      toast.success("报告已删除");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message || "删除失败"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            确认删除
          </DialogTitle>
          <DialogDescription>
            此操作不可撤销。报告将被永久删除，所有分享链接也将失效。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => drilldownId && deleteMutation.mutate({ drilldownId })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function DrilldownList() {
  const { user, isAuthenticated } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<number | null>(null);
  const [sharesManagerTarget, setSharesManagerTarget] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const isStaticSite = import.meta.env.BASE_URL !== "/";

  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.drilldown.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const refresh = () => utils.drilldown.list.invalidate();

  if (isStaticSite) {
    return (
      <div className="container py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>企业分析</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>企业 Drilldown 分析可以直接在“企业分析”页面上传 Excel 文件，并在浏览器本地完成解析。</p>
            <p>当前 GitHub Pages 为静态展示版本，暂不提供登录、云端保存和分享报告功能。</p>
            <Link href="/company"><Button>进入企业分析</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileBarChart2 className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">请先登录以管理您的 Drilldown 报告</p>
      </div>
    );
  }

  const isAdmin = data?.isAdmin;
  const ownedList = data?.owned ?? [];
  const sharedList = data?.shared ?? [];
  const allList = data?.all ?? [];

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Drilldown 管理</h1>
            <p className="text-muted-foreground text-sm mt-1">
              上传、管理和分享您的 MSCI ESG Ratings Drilldown 报告
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="shrink-0">
            <Upload className="w-4 h-4 mr-2" />
            上传报告
          </Button>
        </div>

        {/* Free tier notice */}
        {!isAdmin && user && (user as { subscriptionTier?: string }).subscriptionTier === "free" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              免费账户最多上传 3 个报告（当前：{ownedList.length}/3）。
              升级 Pro 可解锁无限上传。
            </span>
          </div>
        )}

        {/* Loading / Error */}
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        )}
        {error && (
          <div className="text-center py-12 text-destructive">
            加载失败：{error.message}
          </div>
        )}

        {/* Admin: all drilldowns */}
        {isAdmin && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4" />
                所有报告（管理员视图）
                <Badge variant="secondary">{allList.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DrilldownTable
                rows={allList}
                showOwner
                onShare={(id) => setShareTarget(id)}
                onManageShares={(id) => setSharesManagerTarget(id)}
                onDelete={(id) => setDeleteTarget(id)}
                currentUserId={user?.id}
              />
            </CardContent>
          </Card>
        )}

        {/* Regular user: owned */}
        {!isAdmin && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileBarChart2 className="w-4 h-4" />
                我的报告
                <Badge variant="secondary">{ownedList.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ownedList.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <FileBarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>还没有上传任何报告</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1"
                    onClick={() => setUploadOpen(true)}
                  >
                    立即上传
                  </Button>
                </div>
              ) : (
                <DrilldownTable
                  rows={ownedList}
                  onShare={(id) => setShareTarget(id)}
                  onManageShares={(id) => setSharesManagerTarget(id)}
                  onDelete={(id) => setDeleteTarget(id)}
                  currentUserId={user?.id}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Regular user: shared with me */}
        {!isAdmin && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Share2 className="w-4 h-4" />
                分享给我的
                <Badge variant="secondary">{sharedList.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sharedList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无分享给您的报告
                </div>
              ) : (
                <DrilldownTable
                  rows={sharedList}
                  showOwner
                  readOnly
                  currentUserId={user?.id}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={refresh}
      />
      <ShareDialog
        drilldownId={shareTarget}
        open={shareTarget !== null}
        onClose={() => setShareTarget(null)}
      />
      <SharesManagerDialog
        drilldownId={sharesManagerTarget}
        open={sharesManagerTarget !== null}
        onClose={() => setSharesManagerTarget(null)}
      />
      <DeleteConfirmDialog
        drilldownId={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onSuccess={refresh}
      />
    </TooltipProvider>
  );
}

// ─── Drilldown Table ───────────────────────────────────────────────────────

type DrilldownRow = {
  id: number;
  industryName: string;
  originalFilename?: string | null;
  s3FileUrl: string;
  createdAt: Date | string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  sharePermission?: string | null;
};

function DrilldownTable({
  rows,
  showOwner = false,
  readOnly = false,
  onShare,
  onManageShares,
  onDelete,
  currentUserId,
}: {
  rows: DrilldownRow[];
  showOwner?: boolean;
  readOnly?: boolean;
  onShare?: (id: number) => void;
  onManageShares?: (id: number) => void;
  onDelete?: (id: number) => void;
  currentUserId?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>行业</TableHead>
            <TableHead>文件名</TableHead>
            {showOwner && <TableHead>所有者</TableHead>}
            <TableHead>上传时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Badge variant="outline" className="text-xs font-normal">
                  {row.industryName}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {row.originalFilename ?? "—"}
              </TableCell>
              {showOwner && (
                <TableCell className="text-sm text-muted-foreground">
                  {row.ownerName ?? row.ownerEmail ?? "—"}
                </TableCell>
              )}
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(row.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/drilldown/${row.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>查看详情</TooltipContent>
                  </Tooltip>

                  {!readOnly && onShare && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => onShare(row.id)}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>分享</TooltipContent>
                    </Tooltip>
                  )}

                  {!readOnly && onManageShares && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => onManageShares(row.id)}
                        >
                          <Users className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>管理分享</TooltipContent>
                    </Tooltip>
                  )}

                  {!readOnly && onDelete && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => onDelete(row.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
