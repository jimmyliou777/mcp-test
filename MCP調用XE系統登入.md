# XE系統登入指南

本文檔詳細說明如何使用MCP工具執行XE系統登入流程，以及如何透過AI自然語言進行調用。

## 目錄

- [技術概述](#技術概述)
- [登入流程](#登入流程)
  - [完整流程步驟](#完整流程步驟)
  - [程式碼調用方式](#程式碼調用方式)
  - [登入結果說明](#登入結果說明)
  - [操作注意事項](#操作注意事項)
- [透過AI自然語言調用](#透過ai自然語言調用)
  - [調用流程說明](#調用流程說明)
  - [自然語言調用示例](#自然語言調用示例)
  - [AI調用特性](#ai調用特性)
  - [常用自然語言命令](#常用自然語言命令)
  - [故障排除建議](#故障排除建議)
- [完整的Node.js調用示例](#完整的node.js調用示例)

## 技術概述

XE系統登入工具基於以下技術構建：

- **Node.js + TypeScript**：提供基礎的開發環境
- **Model Context Protocol (MCP)**：提供工具調用的標準接口
- **Puppeteer**：實現瀏覽器自動化操作
- **AI自然語言處理**：提供便捷的人機交互體驗

## 登入流程

### 完整流程步驟

XE系統登入流程包含四個主要步驟，每個步驟使用對應的工具執行：

1. **初始化瀏覽器** - 使用 `xe_init_browser` 工具
2. **執行登入操作** - 使用 `xe_login` 工具
3. **選擇公司** - 使用 `xe_select_company` 工具
4. **獲取狀態和Cookie資訊** - 使用 `xe_check_status` 工具

### 程式碼調用方式

以下是具體的調用方法與說明：

> **注意**：以下程式碼範例是在Node.js環境中執行的，需要先安裝並配置MCP客戶端套件。

#### Node.js環境配置

在使用下面的程式碼之前，請確保已經完成以下準備工作：

1. 安裝MCP客戶端套件：
   ```bash
   npm install @modelcontextprotocol/sdk
   ```

2. 在程式碼中引入並初始化MCP客戶端：
   ```javascript
   import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
   
   // 初始化MCP客戶端
   const mcp = new McpClient();
   ```

3. 確保`mcp.json`配置文件中已正確設置服務器配置（參見README.md中的配置說明）

#### 1. 初始化瀏覽器

```javascript
// 初始化瀏覽器並進入登入頁面
const result = await mcp.invoke("mcp-test", "xe_init_browser", {});
```

此步驟會打開一個新的瀏覽器視窗並導航至登入頁面。系統將返回提示信息，指示進入下一步。

#### 2. 執行登入操作

```javascript
// 執行登入操作
const loginResult = await mcp.invoke("mcp-test", "xe_login", {});
```

執行此步驟後，需要在開啟的瀏覽器視窗中手動輸入帳號密碼，並點擊登入按鈕。工具將檢測登入按鈕的點擊事件，完成後會返回導航後的URL信息。

#### 3. 選擇公司

```javascript
// 選擇公司
const companyResult = await mcp.invoke("mcp-test", "xe_select_company", {});
```

此步驟會在公司選擇頁面自動尋找並點擊目標公司（預設為"天空公司"）。如果找不到目標公司，則返回頁面上所有可用的公司列表。

#### 4. 獲取狀態和Cookie資訊

```javascript
// 獲取最終狀態和Cookie資訊
const statusResult = await mcp.invoke("mcp-test", "xe_check_status", {});
```

最後一步會獲取當前頁面的URL、登入狀態以及關鍵Cookie資訊，並關閉瀏覽器。

### 登入結果說明

成功登入後將獲得以下資訊（以表格格式顯示）：

| 項目 | 值 |
|-----|-----|
| 當前URL | https://tst-apolloxe.mayohr.com/tube |
| 登入狀態 | company_selected |
| 是否到達目標頁面 | 是 |
| Cookie總數量 | 12 |

以及關鍵Cookie資訊：

| Cookie名稱 | 值 | 網域 | 路徑 | 過期時間 | HttpOnly | Secure |
|------------|-----|------|------|----------|----------|--------|
| __ModuleSessionCookie | [JWT令牌] | .mayohr.com | / | [過期時間] | 否 | 否 |
| LoggedInDomain | tst-apolloxe.mayohr.com | .mayohr.com | / | [過期時間] | 否 | 否 |

### 操作注意事項

- 登入過程需要人工介入輸入帳號密碼
- Cookie中的`__ModuleSessionCookie`是JWT格式的認證令牌
- 工具會自動關閉瀏覽器並清理會話
- 每次新的登入流程都需要從第一步開始執行

## 透過AI自然語言調用

除了透過程式碼直接調用MCP工具，您還可以使用AI助手透過自然語言來執行XE系統登入流程。

### 調用流程說明

1. **初始化對話** - 向AI助手說明您要執行XE系統登入操作
2. **執行登入流程** - AI會依序調用相關工具並提供指引
3. **結果呈現** - 最終結果將以結構化的表格形式展示

### 自然語言調用示例

以下是使用自然語言調用的範例對話：

```
用戶: 使用tool xe_init_browser 執行XE系統登入並獲取登入訊息包含cookies，請以表格形式呈現

AI助手: [調用xe_init_browser工具]
瀏覽器已初始化並進入登入頁面，現在請在開啟的瀏覽器視窗中手動輸入您的帳號和密碼，然後點擊登入按鈕，完成後我將繼續下一步。

[用戶在瀏覽器中完成操作]

AI助手: [調用xe_login工具]
已檢測到登入操作完成，現在需要選擇公司。

[調用xe_select_company工具]
已選擇公司，現在執行最後一步獲取cookie資訊。

[調用xe_check_status工具]
[顯示登入結果表格]
```

### AI調用特性

使用AI進行自然語言調用有以下特點：

1. **互動式引導** - AI會引導您完成每個步驟，提供清晰的指示
2. **即時反饋** - 每個步驟的執行結果會立即顯示
3. **人機協作** - 需要手動輸入帳號密碼的步驟，AI會指導您完成
4. **結構化輸出** - 最終結果會以易於閱讀的表格形式呈現
5. **自動化連續操作** - AI會自動依序執行所有必要的步驟

### 常用自然語言命令

以下是一些可用於調用XE登入流程的自然語言命令範例：

- "使用xe_init_browser工具執行XE系統登入流程"
- "幫我登入XE系統並取得cookie資訊"
- "執行完整的XE登入流程並以表格顯示結果"
- "請透過MCP工具登入XE系統"
- "以步驟方式引導我完成XE系統登入"

### 故障排除建議

如果在使用自然語言調用過程中遇到問題，可以嘗試以下解決方法：

1. **瀏覽器初始化失敗**：
   - 檢查網絡連接
   - 確認系統已安裝必要的瀏覽器環境
   - 再次明確指示AI重新執行初始化

2. **登入步驟超時**：
   - 確保在點擊登入按鈕後，通知AI繼續下一步
   - 如果登入按鈕點擊無反應，可請AI重新執行登入步驟

3. **公司選擇失敗**：
   - 若系統找不到目標公司，AI會顯示可用的公司列表
   - 可指示AI選擇特定名稱的公司："請選擇列表中的xxx公司"

4. **流程中斷**：
   - 如果流程中斷，可以明確告知AI從哪個步驟繼續："我已完成登入，請繼續執行選擇公司步驟"
   - 若需要重新開始，可說明："請重新初始化瀏覽器開始整個流程"

## 完整的Node.js調用示例

以下是一個完整的Node.js腳本示例，展示如何在程式中依序調用所有XE系統登入工具：

```javascript
// xe-login-example.js
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import readline from 'readline';

// 創建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 創建一個Promise包裝的用戶輸入函數
function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

// 主函數
async function main() {
  try {
    // 初始化MCP客戶端
    const mcp = new McpClient();
    
    console.log('開始XE系統登入流程...');
    
    // 步驟1: 初始化瀏覽器
    console.log('初始化瀏覽器...');
    const initResult = await mcp.invoke("mcp-test", "xe_init_browser", {});
    console.log(initResult.content[0].text);
    
    // 等待用戶在瀏覽器中完成登入操作
    await askQuestion('請在瀏覽器中輸入帳號密碼並點擊登入按鈕，完成後按Enter繼續...');
    
    // 步驟2: 執行登入操作
    console.log('執行登入驗證...');
    const loginResult = await mcp.invoke("mcp-test", "xe_login", {});
    console.log(loginResult.content[0].text);
    
    // 步驟3: 選擇公司
    console.log('選擇公司...');
    const companyResult = await mcp.invoke("mcp-test", "xe_select_company", {});
    console.log(companyResult.content[0].text);
    
    // 步驟4: 獲取狀態和Cookie資訊
    console.log('獲取狀態和Cookie資訊...');
    const statusResult = await mcp.invoke("mcp-test", "xe_check_status", {});
    
    // 輸出結果
    console.log('\n--- XE系統登入結果 ---');
    console.log(statusResult.content[0].text);
    
    // 格式化並顯示關鍵Cookie資訊
    const resultText = statusResult.content[0].text;
    const cookiesJson = resultText.substring(
      resultText.indexOf('關鍵Cookie信息:') + 9
    );
    
    try {
      const cookies = JSON.parse(cookiesJson);
      console.log('\n--- 格式化Cookie資訊 ---');
      
      cookies.forEach(cookie => {
        console.log(`名稱: ${cookie.name}`);
        console.log(`值: ${cookie.value.substring(0, 30)}...`); // 只顯示值的前30個字符
        console.log(`網域: ${cookie.domain}`);
        console.log(`路徑: ${cookie.path}`);
        console.log(`過期時間: ${cookie.expires}`);
        console.log(`HttpOnly: ${cookie.httpOnly}`);
        console.log(`Secure: ${cookie.secure}`);
        console.log('-------------------');
      });
    } catch (e) {
      console.log('無法解析Cookie資訊:', e.message);
    }
    
  } catch (error) {
    console.error('登入過程出錯:', error);
  } finally {
    // 關閉命令行交互界面
    rl.close();
  }
}

// 運行主函數
main();
```

### 使用說明

1. 將上述代碼保存為`xe-login-example.js`
2. 確保已經安裝了所需的依賴包
3. 使用以下命令運行腳本:

```bash
node xe-login-example.js
```

4. 根據提示在開啟的瀏覽器中完成登入操作，並在命令行中按Enter繼續執行流程
5. 腳本將自動執行剩餘步驟並顯示最終的登入結果

### 關鍵設計說明

- 使用`readline`模組實現用戶輸入，讓腳本等待用戶在瀏覽器中完成登入
- 按順序依次調用四個XE登入工具
- 格式化輸出Cookie信息，便於閱讀
- 使用try-catch結構捕獲可能的錯誤
- 在finally塊中確保腳本執行完畢後關閉readline接口

## 進階使用場景

本工具除了基本的登入功能外，還可以用於以下進階場景：

1. **自動化測試** - 將登入流程整合到自動化測試流程中
2. **系統監控** - 定期檢查系統是否可正常登入
3. **API開發** - 使用獲取的Cookie資訊開發進一步的API調用
4. **安全檢測** - 分析登入流程中的安全特性和潛在漏洞

---

**版本記錄**

- V1.0 初始版本 (2024-04-30)

如有任何問題或建議，請聯繫系統管理員。 