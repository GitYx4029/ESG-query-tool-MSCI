import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock LLM and storage
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            issueName: "Opportunities in Green Building",
            overallAssessment: "该企业在绿色建筑方面有较好的披露水平。",
            analyses: [
              {
                indicatorName: "Green Building Certification Performance",
                status: "met",
                summary: "报告中详细披露了绿色建筑认证情况。",
                source: "报告第4章第2节，第52页",
                details: "企业披露了LEED认证覆盖率达到65%。",
              },
            ],
          }),
        },
      },
    ],
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "esg-reports/test-report.pdf",
    url: "https://cdn.example.com/esg-reports/test-report.pdf",
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("esgAnalysis.analyzeDisclosure", () => {
  it("accepts valid input and returns structured analysis", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.esgAnalysis.analyzeDisclosure({
      issueName: "Opportunities in Green Building",
      companyName: "Test Corp",
      reportBase64: Buffer.from("fake pdf content").toString("base64"),
      reportFileName: "test-report.pdf",
      indicators: [
        {
          name: "Green Building Certification Performance",
          score: 3.0,
          type: "performance",
          methodologyHint:
            "衡量企业物业组合中获得绿色建筑认证的比例和等级",
        },
      ],
      methodologyOverview:
        "评估房地产企业在绿色建筑领域的战略定位和业务机遇",
    });

    expect(result).toBeDefined();
    expect(result.issueName).toBe("Opportunities in Green Building");
    expect(result.overallAssessment).toBeTruthy();
    expect(result.analyses).toHaveLength(1);
    expect(result.analyses[0]?.indicatorName).toBe(
      "Green Building Certification Performance"
    );
    expect(result.analyses[0]?.status).toBe("met");
    expect(result.analyses[0]?.source).toContain("第52页");
  });

  it("returns fallback result when LLM fails", async () => {
    // Override mock to simulate failure
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("LLM service unavailable")
    );

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.esgAnalysis.analyzeDisclosure({
      issueName: "Health & Safety",
      companyName: "Test Corp",
      reportBase64: Buffer.from("fake pdf content").toString("base64"),
      reportFileName: "test-report.pdf",
      indicators: [
        {
          name: "Health & Safety Policy",
          score: 5.0,
          type: "management",
          methodologyHint: "评估企业健康安全管理政策的完整性",
        },
      ],
      methodologyOverview: "评估企业在健康与安全方面的管理实践",
    });

    expect(result).toBeDefined();
    expect(result.issueName).toBe("Health & Safety");
    expect(result.overallAssessment).toContain("LLM service unavailable");
    expect(result.analyses).toHaveLength(1);
    expect(result.analyses[0]?.status).toBe("not_found");
  });
});
