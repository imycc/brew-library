# 訪客統計

網站使用 [GoatCounter](https://www.goatcounter.com/)；擁有人登入 [imycc 後台](https://imycc.goatcounter.com/) 查看訪客、瀏覽量、熱門配方與來源。訪客數與瀏覽量的定義見 [官方說明](https://www.goatcounter.com/help/sessions)。啟用前的網站流量沒有紀錄，不能回補。

GitHub repository 的 Actions variable `NEXT_PUBLIC_GOATCOUNTER_CODE=imycc` 在建置時注入公開帳戶代碼。它不是密碼或 API token。刪除變數並重新部署即可停止載入統計。

追蹤程式只在 `imycc.github.io` 送出瀏覽資料，首次載入及路徑切換各送一次 pageview。網址篩選、比較選取和 hash 變更不新增 pageview。路徑包含語言和 recipe ID，保留 `/brew-library` 前綴；查詢字串不作為頁面識別碼。GoatCounter 原始程式仍按其標準協議送出來源、畫面寬度與查詢參數等資料，詳見 [JavaScript API](https://www.goatcounter.com/help/js)。本機及 CI 驗證攔截統計請求，避免把自動測試算入流量。

學習、比較和器材頁另以 GoatCounter events 記錄低敏感度的互動漏斗：

| 頁面 | Events |
| --- | --- |
| 學習 | `learn_recipe_open`、`learn_lab_view` |
| 比較 | `compare_page_empty`、`compare_page_table`、`compare_recipe_select`、`compare_differences_toggle`、`compare_recipe_open` |
| 器材 | `equipment_experience_filter`、`equipment_recipe_filter`、`equipment_recipe_open` |

Events 只包含固定名稱及通用狀態標題，不記錄搜尋字、已選 recipe ID、配方內文或其他可識別資料。`learn_lab_view` 在實驗區至少 35% 進入畫面時只送一次；比較頁狀態每次載入只送一次。事件與 pageview 分開，於 [GoatCounter Events 說明](https://www.goatcounter.com/help/events)所述協議中傳送，可比較「進站」與「下一步動作」但不能當作個別 session 的完整追蹤。

驗證分兩層：瀏覽器攔截測試確認首次／換頁計數與資料路徑；部署後確認真實程式載入與收集端回應。後台顯示的實際數字需要擁有人登入確認。廣告攔截器或拒絕追蹤的瀏覽器可能使流量少於實際訪問。
