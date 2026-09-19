/*
 * Header Component
 * 设计风格：知识图谱风格，ESG三色体系
 * 顶部导航栏，包含Logo、搜索入口和导航链接
 */
import { Link, useLocation } from "wouter";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@/hooks/useNavigate";

export default function Header() {
  const [location] = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663376710174/iU5gURrSUnaBxwLDP9tjuN/esg-key-logo-HxZk28DJGUz5aanTJ4ejyZ.webp" alt="ESG Materiality" className="w-9 h-9" />
          <div className="flex flex-col">
            <span className="text-base font-bold text-foreground leading-tight tracking-tight" style={{ fontFamily: "var(--font-sans)" }}>
              ESG Materiality
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              行业关键议题查询工具
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
              location === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            行业查询
          </Link>
          <Link
            href="/materiality-map"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
              location === "/materiality-map" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            重要性议题地图
          </Link>
          <Link
            href="/company"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
              location === "/company" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            企业分析
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-white/95 backdrop-blur-md">
          <nav className="container py-3 flex flex-col gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium no-underline ${
                location === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              行业查询
            </Link>
            <Link
              href="/materiality-map"
              className={`px-3 py-2 rounded-md text-sm font-medium no-underline ${
                location === "/materiality-map" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              重要性议题地图
            </Link>
            <Link
              href="/company"
              className={`px-3 py-2 rounded-md text-sm font-medium no-underline ${
                location === "/company" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              企业分析
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
