import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

/**
 * ESG 报告对照分析路由
 * 接收企业ESG报告（base64）和方法学指标信息，
 * 使用LLM逐条对照分析披露情况
 */
export const esgAnalysisRouter = router({
  analyzeDisclosure: publicProcedure
    .input(
      z.object({
        issueName: z.string().min(1),
        companyName: z.string().min(1),
        reportBase64: z.string().min(1),
        reportFileName: z.string().min(1),
        indicators: z.array(
          z.object({
            name: z.string(),
            score: z.number(),
            type: z.enum(["management", "performance"]),
            methodologyHint: z.string(),
          })
        ),
        methodologyOverview: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        issueName,
        companyName,
        reportBase64,
        reportFileName,
        indicators,
        methodologyOverview,
      } = input;

      // 1. Upload report to S3 to get a URL for LLM file_url
      const fileBuffer = Buffer.from(reportBase64, "base64");
      const fileKey = `esg-reports/${nanoid(8)}-${reportFileName}`;
      const mimeType = reportFileName.endsWith(".pdf")
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      const { url: reportUrl } = await storagePut(fileKey, fileBuffer, mimeType);

      // 2. Build indicator descriptions for the prompt
      const indicatorDescriptions = indicators
        .map(
          (ind, idx) =>
            `${idx + 1}. [${ind.type === "management" ? "管理实践" : "绩效"}] ${ind.name} (当前得分: ${ind.score.toFixed(1)}/10)\n   方法学评分要点: ${ind.methodologyHint || "无具体方法学描述"}`
        )
        .join("\n");

      // 3. Call LLM with the report file and methodology context
      const systemPrompt = `你是一位专业的ESG分析师，精通MSCI ESG评级方法学。你的任务是对照MSCI方法学指标，逐条分析企业ESG报告中的信息披露情况。

分析原则：
1. 对每个指标，在报告中查找相关披露内容
2. 判断披露是否满足MSCI方法学的评分要求
3. 必须标注信息出处（报告中的具体章节、页码或段落）
4. 如果报告中未找到相关信息，明确标注"未找到相关披露"
5. 分析要客观、具体，避免笼统评价

你必须严格按照JSON格式输出结果。`;

      const userPrompt = `请分析以下企业的ESG报告，对照"${issueName}"议题下的各项指标进行披露情况评估。

企业名称：${companyName}
议题名称：${issueName}
方法学概述：${methodologyOverview}

需要对照分析的指标：
${indicatorDescriptions}

请逐条分析每个指标在报告中的披露情况，并给出总体评估。对于每个指标，请判断：
- "met"：报告中有充分的相关披露，基本满足方法学要求
- "partial"：报告中有部分相关信息，但不够完整或具体
- "not_met"：报告中有相关内容但明显不满足要求
- "not_found"：报告中未找到与该指标相关的信息

请特别注意标注信息出处（如"第X章第X节"、"第X页"、"XX部分"等）。`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "file_url",
                  file_url: {
                    url: reportUrl,
                    mime_type: "application/pdf",
                  },
                },
                {
                  type: "text",
                  text: userPrompt,
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "esg_disclosure_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  issueName: {
                    type: "string",
                    description: "议题名称",
                  },
                  overallAssessment: {
                    type: "string",
                    description:
                      "总体评估，概述该议题下企业的整体披露水平和改进建议",
                  },
                  analyses: {
                    type: "array",
                    description: "各指标的逐条分析结果",
                    items: {
                      type: "object",
                      properties: {
                        indicatorName: {
                          type: "string",
                          description: "指标名称",
                        },
                        status: {
                          type: "string",
                          enum: ["met", "partial", "not_met", "not_found"],
                          description: "披露状态",
                        },
                        summary: {
                          type: "string",
                          description:
                            "简要总结该指标的披露情况（1-2句话）",
                        },
                        source: {
                          type: "string",
                          description:
                            "信息出处，如'报告第3章第2节，第45页'或'ESG绩效数据表，第78页'",
                        },
                        details: {
                          type: "string",
                          description:
                            "详细分析，包括报告中的具体内容摘要和与方法学要求的对比",
                        },
                      },
                      required: [
                        "indicatorName",
                        "status",
                        "summary",
                        "source",
                        "details",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["issueName", "overallAssessment", "analyses"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = result.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("LLM returned empty or non-string content");
        }

        const parsed = JSON.parse(content);
        return parsed as {
          issueName: string;
          overallAssessment: string;
          analyses: Array<{
            indicatorName: string;
            status: "met" | "partial" | "not_met" | "not_found";
            summary: string;
            source: string;
            details: string;
          }>;
        };
      } catch (error) {
        console.error("[ESG Analysis] LLM call failed:", error);
        // Return a fallback result
        return {
          issueName,
          overallAssessment: `分析过程中遇到错误：${error instanceof Error ? error.message : "未知错误"}。请稍后重试，或检查上传的报告格式是否正确。`,
          analyses: indicators.map((ind) => ({
            indicatorName: ind.name,
            status: "not_found" as const,
            summary: "分析失败，请重试",
            source: "",
            details: `无法完成对该指标的分析。错误信息：${error instanceof Error ? error.message : "未知错误"}`,
          })),
        };
      }
    }),
});
