import FeedbackPrompt from "./FeedbackPrompt";
export default function BottomEmphasisBar() {
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
        <p>独立公益学习参考 · 非 MSCI 官方产品 · v1.9.0</p>
      </div>
    </footer>
  );
}
