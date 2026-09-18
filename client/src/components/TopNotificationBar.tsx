/**
 * Top Notification Bar Component
 * 显示免责声明和反馈方式信息
 */
import { AlertCircle, Mail, MessageCircle } from 'lucide-react';

export default function TopNotificationBar() {
  return (
    <div className="bg-gray-50 border-b border-gray-200 py-2.5 px-4">
      <div className="container mx-auto">
        {/* 免责声明 */}
        <div className="flex items-start gap-2.5 mb-2 text-sm">
          <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <span className="text-gray-600">
            <strong>免责声明：</strong>仅供信息检索和便利学习参考，请勿用于非法用途，否则后果自负！
          </span>
        </div>

        {/* 反馈方式 */}
        <div className="flex items-center gap-2.5 text-sm">
          <MessageCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-600">
            期待大家通过本人小红书账号
            <span className="text-blue-600 font-medium mx-1">"爱吃奶酪的C"</span>
            或邮箱
            <a
              href="mailto:playfulesgbycarol@163.com"
              className="text-blue-600 hover:text-blue-700 font-medium mx-1"
            >
              playfulesgbycarol@163.com
            </a>
            提建议
          </span>
        </div>
      </div>
    </div>
  );
}
