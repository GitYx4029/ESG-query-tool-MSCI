import { createContext, useContext, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "./Header";

import {
  PASSWORD_KEY,
  getAdminPassword,
  matchesUiPassword,
} from "@/lib/adminSession";
const GateContext = createContext<{
  unlocked: boolean;
  unlock: (password: string) => boolean;
  lock: () => void;
}>({ unlocked: false, unlock: (_password: string) => false, lock: () => {} });

export function AnalysisGateProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() =>
    matchesUiPassword(getAdminPassword())
  );
  const unlock = (password: string) => {
    if (!matchesUiPassword(password)) return false;
    sessionStorage.setItem(PASSWORD_KEY, password);
    setUnlocked(true);
    return true;
  };
  const lock = () => {
    sessionStorage.removeItem(PASSWORD_KEY);
    setUnlocked(false);
  };
  return (
    <GateContext.Provider value={{ unlocked, unlock, lock }}>
      {children}
    </GateContext.Provider>
  );
}

export const useAnalysisGate = () => useContext(GateContext);

export function ProtectedAnalysis({ children }: { children: ReactNode }) {
  const { unlocked, unlock } = useAnalysisGate();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  if (unlocked) return children;
  return (
    <>
      <Header />
      <div className="container py-12 text-center">
        <h1 className="text-xl font-bold">企业分析 · 管理员入口</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          此功能暂仅向管理员开放。
        </p>
      </div>
      <Dialog
        open
        onOpenChange={open => {
          if (!open) navigate("/");
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>请输出管理员密码</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!unlock(password)) setError("密码不正确，请重试");
            }}
            className="space-y-3"
          >
            <label htmlFor="admin-password" className="text-sm">
              管理员密码
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="off"
              autoFocus
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full border rounded-lg p-3"
            />
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="border rounded-lg px-4 py-2"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-esg-gov text-white rounded-lg px-4 py-2"
              >
                进入
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
