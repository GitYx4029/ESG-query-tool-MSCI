import { keyIssueHierarchy, issueNamesCN, getMethodologyUrl, MSCI_METHODOLOGY_INDEX_URL } from "@/lib/esgData";
import { methodologyRegistry } from "@/lib/methodologyRegistry";
const allIssues = Object.values(keyIssueHierarchy).flatMap(themes => Object.values(themes).flat());
const verifiedCount = allIssues.filter(issue => methodologyRegistry[issue]?.status === "verified").length;
export default function MethodologyVerification() {
  return (
        <details className="border rounded-xl p-4">
          <summary className="cursor-pointer font-bold">
            方法学文件核验状态：{verifiedCount}/{allIssues.length}{" "}
            份已核验标题与版本
          </summary>
          <p className="text-xs text-muted-foreground mt-3 mb-3">
            检查日期：2026-10-13。此状态不代表全部内容已复核；无法核验的文件提供官方目录入口。文件可能由
            MSCI 更新，使用时请核对封面日期。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">议题</th>
                  <th>文件版本</th>
                  <th>状态</th>
                  <th>入口</th>
                </tr>
              </thead>
              <tbody>
                {allIssues.map(issue => {
                  const r = methodologyRegistry[issue];
                  return (
                    <tr key={issue} className="border-b">
                      <td className="py-3">{issueNamesCN[issue]}</td>
                      <td className="text-center">{r?.version || "待核验"}</td>
                      <td className="text-center">
                        {r?.status === "verified"
                          ? "标题与版本已核验"
                          : "版本待核验"}
                      </td>
                      <td className="text-center">
                        <a
                          href={getMethodologyUrl(issue)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-esg-gov"
                        >
                          {r?.status === "verified"
                            ? "公开 PDF ↗"
                            : "官方目录 ↗"}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <a
            className="block text-sm text-esg-gov mt-4"
            href={MSCI_METHODOLOGY_INDEX_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            MSCI 方法学资源目录 ↗
          </a>
        </details>
  );
}
