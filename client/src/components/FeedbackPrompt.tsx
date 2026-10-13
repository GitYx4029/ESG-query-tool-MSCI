import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_VERSION, type FeedbackInput } from "@shared/community";
import { hasCommunityApi, pageCategory, submitFeedback } from "@/lib/community";
const categories = {
  missing_industry: "找不到行业",
  unclear: "内容看不懂",
  incorrect: "信息或链接有误",
  feature: "希望增加功能",
  other: "其他",
};

export default function FeedbackPrompt({
  industry = "",
  compact = false,
}: {
  industry?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<FeedbackInput["outcome"]>("partial");
  const [category, setCategory] = useState<FeedbackInput["category"]>("other");
  const [role, setRole] = useState<FeedbackInput["role"]>("other");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const input: FeedbackInput = {
    outcome,
    category,
    role,
    message,
    contact: consent ? contact : "",
    consentToContact: consent,
    page: pageCategory(),
    industry,
    version: APP_VERSION,
  };
  const emailBody = `使用结果：${outcome}\n问题类型：${categories[category]}\n使用场景：${role}\n行业：${industry || "未选择"}\n页面：${input.page}\n版本：${APP_VERSION}\n建议：${message}\n${consent && contact ? `可联系：${contact}` : "无需联系"}`;
  return (
    <div className={compact ? "" : "rounded-xl border p-4 bg-white"}>
      {!compact && <p className="text-sm mb-2">这次找到需要的信息了吗？</p>}
      <div className="flex flex-wrap gap-2">
        {(compact
          ? [["partial", "反馈建议"]]
          : [
              ["yes", "找到了"],
              ["partial", "部分找到"],
              ["no", "没有找到"],
            ]
        ).map(([value, label]) => (
          <button
            key={value}
            className="border rounded-lg min-h-11 px-3 py-2 text-sm"
            onClick={() => {
              setOutcome(value as FeedbackInput["outcome"]);
              setStatus("");
              setSaved(false);
              setOpen(true);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>反馈建议</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            请勿填写报告内容、企业内部数据或其他敏感信息。联系方式可选。
          </p>
          {saved ? (
            <p role="status">反馈已保存，谢谢！</p>
          ) : (
            <form
              className="space-y-3"
              onSubmit={async e => {
                e.preventDefault();
                setBusy(true);
                try {
                  await submitFeedback(input);
                  setSaved(true);
                } catch (error) {
                  setStatus(
                    error instanceof Error ? error.message : "保存失败"
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="block text-sm">
                问题类型
                <select
                  className="w-full border rounded-lg p-2 mt-1"
                  value={category}
                  onChange={e =>
                    setCategory(e.target.value as FeedbackInput["category"])
                  }
                >
                  {Object.entries(categories).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                使用场景
                <select
                  className="w-full border rounded-lg p-2 mt-1"
                  value={role}
                  onChange={e =>
                    setRole(e.target.value as FeedbackInput["role"])
                  }
                >
                  <option value="other">其他／不填写</option>
                  <option value="enterprise">企业 ESG 工作</option>
                  <option value="consultant">咨询／研究工作</option>
                  <option value="student">学习／课程研究</option>
                </select>
              </label>
              <label className="block text-sm">
                补充说明（可选）
                <textarea
                  maxLength={1000}
                  className="w-full border rounded-lg p-2 mt-1"
                  rows={3}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </label>
              <label className="flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                />
                愿意接受项目管理员联系，跟进这条建议
              </label>
              {consent && (
                <label className="block text-sm">
                  联系方式（可选）
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    maxLength={120}
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                  />
                </label>
              )}
              {status && (
                <p role="alert" className="text-xs text-red-700">
                  {status}
                </p>
              )}
              {hasCommunityApi && (
                <button
                  disabled={busy}
                  type="submit"
                  className="bg-esg-gov text-white px-4 py-2 rounded-lg"
                >
                  {busy ? "保存中…" : "提交反馈"}
                </button>
              )}
              <a
                className="inline-block border px-4 py-2 rounded-lg text-sm ml-2"
                href={`mailto:playfulesgbycarol@163.com?subject=${encodeURIComponent("ESG公益工具反馈")}&body=${encodeURIComponent(emailBody)}`}
              >
                生成反馈邮件
              </a>
              {!hasCommunityApi && (
                <p className="text-xs text-muted-foreground">
                  将打开邮件草稿，由你确认发送；网站尚未保存此反馈。
                </p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
