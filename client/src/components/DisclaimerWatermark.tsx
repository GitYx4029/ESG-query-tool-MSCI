/**
 * Disclaimer Watermark Component
 * 浅灰色水印，覆盖整个页面但不影响交互
 * 优化：增加透明度、调整字体大小、改进布局以提高可见性
 */

export default function DisclaimerWatermark() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden"
      style={{
        background: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 180px,
          rgba(180, 180, 180, 0.12) 180px,
          rgba(180, 180, 180, 0.12) 360px
        )`,
      }}
    >
      {/* 重复的水印文字 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='500' height='220' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50' y='110' font-size='28' font-weight='500' fill='rgba(120,120,120,0.25)' font-family='Arial, sans-serif' transform='rotate(-45 250 110)'%3E免责声明：仅供信息检索和便利学习参考，请勿用于非法用途，否则后果自负！%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '500px 220px',
        }}
      />
    </div>
  );
}
