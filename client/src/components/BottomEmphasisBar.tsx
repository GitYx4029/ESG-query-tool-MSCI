/**
 * Bottom Emphasis Bar Component
 * 饱和度较低的浅绿色-蓝色科技渐变背景，强调反馈信息
 */
import { Mail, MessageCircle } from 'lucide-react';

export default function BottomEmphasisBar() {
  return (
    <div
      className="py-4 px-4 text-white"
      style={{
        background: 'linear-gradient(135deg, rgba(132, 204, 165, 0.85) 0%, rgba(130, 180, 220, 0.85) 100%)',
      }}
    >
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
          <span className="font-medium">💡 欢迎反馈建议：</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span>小红书 "爱吃奶酪的C"</span>
            </div>
            <span className="text-white/60">|</span>
            <a
              href="mailto:playfulesgbycarol@163.com"
              className="flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              <span>playfulesgbycarol@163.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
