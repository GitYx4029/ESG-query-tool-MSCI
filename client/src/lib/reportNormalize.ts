// Retrieval aliases only; original quotations are never converted. This is a
// bounded ESG vocabulary, not a general-purpose Chinese translation library.
const pairs = `國国 際际 報报 發发 展展 業业 務务 關关 於于 團团 體体 員员 勞劳 動动 權权 益益 職职 健健 康康 與与 環环 境境 氣气 溫温 變变 資资 源源 綠绿 碳碳 範范 圍围 供供 應应 鏈链 審审 核核 採采 購购 道道 德德 廉廉 潔洁 腐腐 敗败 賄贿 賂赂 舉举 訓训 練练 險险 認认 證证 監监 督督 責责 護护 勢势 淨净 風风 違违 規规 處处 罰罚 質质 產产 品品 數数 據据 總总 統统 單单 位位 傷伤 死死 亡亡 題题 標标 年年 時时 間间 財财 會会 計计 運运 營营 設设 備备 電电 儲储 紡纺 織织 絨绒 裝装 來来 費费 耗耗 壓压 力力 適适 應应 節节 減减 廢废 棄弃 污污 輸输 號号 確确 強强 度度 話话 線线 訪访 匿匿 保保 密密 訴诉 訟讼 貪贪 誠诚 效效 進进 溝沟 諮咨 詢询 討讨 論论 策策 約约 聯联 續续 負负 勝胜 選选 優优 化化 學学 治治 理理 佔占 議议 許许 燒烧 為为 這这 個个 過过 種种 實实 際际 現现 對对 廠厂 樣样 臺台 號号 類类 機机 開开 識识 從从 專专 項项 風风 節节 億亿 萬万 達达 轉转 結结 構构 門门 售售 銷销 響响 經经 繼继 書书 賠赔 償偿 顧顾 啟启 績绩 儘尽 給给 並并 離离 率率 獎奖 獲获 劃划 尋寻 檢检 測测 儀仪 擁拥 斷断 風风 層层 覆覆 蓋盖 際际 復复 衛卫 歸归 轄辖 鑒鉴 獨独 簽签 署署 證证 勵励 熱热 懲惩 戰战 術术 參参 龍龙`;
const map = Object.fromEntries(pairs.split(/\s+/).map(pair => [pair[0], pair[1]]));
export const normalizeText = (text: string) => text.normalize("NFKC").toLowerCase()
  .replace(/[\u3400-\u9fff]/g, char => map[char] ?? char)
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
  .replace(/([\p{Script=Han}])\s+(?=[\p{Script=Han}])/gu, "$1")
  .replace(/\s+/g, " ").trim();
