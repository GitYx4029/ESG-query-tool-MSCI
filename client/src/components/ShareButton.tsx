import { useState } from "react";
import { trackEvent } from "@/lib/community";

export default function ShareButton({
  url = window.location.href,
}: {
  url?: string;
}) {
  const [copy, setCopy] = useState("");
  return (
    <div>
      <button
        className="border rounded-lg px-3 py-3 text-sm bg-white"
        onClick={async () => {
          trackEvent("share_click");
          try {
            await navigator.clipboard.writeText(url);
            setCopy("链接已复制");
          } catch {
            setCopy(url);
          }
        }}
      >
        复制链接
      </button>
      {copy && (
        <p
          role="status"
          className="mt-1 text-xs text-muted-foreground break-all max-w-[280px]"
        >
          {copy}
        </p>
      )}
    </div>
  );
}
