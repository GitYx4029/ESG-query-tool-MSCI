import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
const { createElement } = React;
import { Router } from "wouter";
import { AnalysisGateProvider, ProtectedAnalysis } from "./AnalysisGate";

describe("enterprise-analysis access gate", () => {
  it("starts locked despite a remembered correct password in an old tab", () => {
    vi.stubGlobal("sessionStorage", { getItem: () => "4029", removeItem: vi.fn() });
    vi.stubGlobal("React", React);
    try {
      const html = renderToStaticMarkup(createElement(Router, { ssrPath: "/company" }, createElement(AnalysisGateProvider, null, createElement(ProtectedAnalysis, null, createElement("p", null, "PRIVATE_ANALYSIS_CONTENT")))));
      expect(html).not.toContain("PRIVATE_ANALYSIS_CONTENT");
      expect(html).toContain("此功能暂仅向管理员开放");
    } finally { vi.unstubAllGlobals(); }
  });
});
