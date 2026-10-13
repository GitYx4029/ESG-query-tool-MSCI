import { useState } from "react";
import FeedbackPrompt from "./FeedbackPrompt";
import {
  getStatisticsConsent,
  setStatisticsConsent,
  hasCommunityApi,
} from "@/lib/community";
export default function BottomEmphasisBar() {
  const [consent, setConsent] = useState(getStatisticsConsent);
  return (
    <footer className="border-t bg-gray-50 px-4 py-4">
      <div className="container space-y-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <FeedbackPrompt compact />
          <span>小红书：爱吃奶酪的C</span>
          <a href="mailto:playfulesgbycarol@163.com">
            playfulesgbycarol@163.com
          </a>
          <a
            className="ml-auto"
            href={`${import.meta.env.BASE_URL}admin/insights`}
          >
            项目管理
          </a>
        </div>
        {hasCommunityApi ? (
          <div>
            <label className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => {
                  setConsent(e.target.checked);
                  setStatisticsConsent(e.target.checked);
                }}
              />
              允许匿名使用统计（可随时关闭）
            </label>
            <p className="mt-1">
              仅统计功能操作与候选行业，不记录报告、评分、文件名或联系方式。反馈单独保存，联系须经你同意。
            </p>
          </div>
        ) : (
          <p>匿名功能统计暂未开启。反馈可通过邮件草稿发送。</p>
        )}
        <p>独立公益学习参考 · 非 MSCI 官方产品 · v1.9.0</p>
      </div>
    </footer>
  );
}
