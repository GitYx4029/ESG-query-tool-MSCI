import { Link } from "wouter";
import { Map, FileText, Building2, ArrowRight } from "lucide-react";
import { AnalysisEntryLink } from "@/components/AnalysisGate";
import Header from "@/components/Header";

const features = [
  {
    title: "重要性议题地图",
    href: "/materiality-map",
    description: "按行业查看关键议题、重要性分布及方法学来源。",
    icon: Map,
  },
  {
    title: "ESG报告对照",
    href: "/report-analysis",
    description: "上传PDF或图片，查找披露证据并回查原页。",
    icon: FileText,
  },
  {
    title: "企业分析",
    href: "/company",
    description: "进入企业评分分析与专题分析。",
    icon: Building2,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
            ESG 行业议题与报告分析
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            浏览行业重要性议题、对照报告披露，开展企业分析。
          </p>
        </div>
        <section
          aria-label="主要功能"
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
        >
          {features.map(feature => {
            const EntryLink = feature.href === "/company" ? AnalysisEntryLink : Link;
            const Icon = feature.icon;
            return (
              <EntryLink
                key={feature.href}
                href={feature.href}
                className="group flex flex-col rounded-2xl border border-border bg-white p-6 md:p-7 no-underline transition-all hover:border-esg-env/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-esg-env focus-visible:ring-offset-2"
              >
                <div className="w-11 h-11 rounded-xl bg-esg-env-bg text-esg-env flex items-center justify-center">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-foreground">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-7 flex items-center gap-2 text-sm font-medium text-esg-env">
                  <span>进入</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </EntryLink>
            );
          })}
        </section>
      </main>
    </div>
  );
}
