# MCP調用架構說明

## MCP架構概述

Model Context Protocol (MCP) 是一種客戶端-服務端架構，用於實現工具調用和資源訪問。在XE系統登入流程中，我們使用了這種架構來實現瀏覽器自動化操作。

```
+----------------+         +----------------+         +----------------+
|                |  調用   |                |  執行   |                |
| MCP 客戶端     | ------> | MCP 服務端     | ------> | 外部系統/工具  |
| (Node.js應用)  |         | (Node.js服務)  |         | (Puppeteer瀏覽器)|
+----------------+         +----------------+         +----------------+
```

## 組件說明

### 1. MCP服務端 (Server)

- 定義在 `src/index.ts` 文件中
- 使用 `McpServer` 類實例化
- 註冊多個工具 (tools)，如 `xe_init_browser`、`xe_login` 等
- 透過 `StdioServerTransport` 與客戶端通信
- 服務端工具實現了具體的業務邏輯，如瀏覽器的啟動、登入操作等

主要代碼：
```typescript
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

server.tool("xe_init_browser", "初始化浏览器并进入登录页面", {}, 
  async () => { /* 執行邏輯 */ }
);

// 其他工具...

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. MCP客戶端 (Client)

- 使用 `McpClient` 類實例化
- 透過 `invoke` 方法調用服務端工具
- 處理工具調用的結果
- 可以是Node.js應用程式或透過AI助手的自然語言介面

典型調用：
```typescript
// 初始化MCP客戶端
const mcp = new McpClient();

// 調用服務端工具
const result = await mcp.invoke("mcp-test", "xe_init_browser", {});
```

## 調用流程

1. **客戶端發起調用**：
   - 客戶端準備工具名稱和參數
   - 通過 `invoke` 方法發送調用請求

2. **服務端處理請求**：
   - 服務端接收到調用請求
   - 根據工具名稱找到對應的處理函數
   - 執行處理函數並獲取結果

3. **返回結果**：
   - 服務端將執行結果返回給客戶端
   - 客戶端處理並顯示結果

## 配置關係

MCP客戶端需要知道如何連接到服務端，這通過配置文件實現：

- 配置文件通常位於 `~/.cursor/mcp.json` (macOS/Linux) 或 `%USERPROFILE%\.cursor\mcp.json` (Windows)
- 配置指定了服務名稱、啟動命令和參數

```json
{
  "mcpServers": {
    "mcp-test": {
      "command": "node",
      "args": ["構建後的項目路徑/build/index.js"]
    }
  }
}
```

## 實際執行模型

### 直接使用Node.js進行調用

在這種模式下，用戶編寫Node.js程式使用MCP客戶端庫，直接調用MCP服務：

```
用戶 --> Node.js程式 --> MCP客戶端 --> MCP服務端 --> Puppeteer --> 瀏覽器
```

### 透過AI助手進行調用

在這種模式下，用戶通過自然語言與AI助手交互，AI助手負責調用MCP服務：

```
用戶 --> 自然語言 --> AI助手 --> MCP客戶端 --> MCP服務端 --> Puppeteer --> 瀏覽器
```

## 執行正確性保證

MCP架構確保了調用的正確性和可靠性：

1. **類型檢查**：使用Zod進行參數驗證
2. **錯誤處理**：服務端捕獲並報告錯誤
3. **會話管理**：使用全局變量管理會話狀態
4. **資源釋放**：自動關閉瀏覽器並清理會話

## 總結

MCP架構是一種強大的客戶端-服務端通信模式，特別適合工具調用場景。在XE系統登入流程中，我們使用這種架構實現了複雜的瀏覽器自動化過程，並支持多種調用方式，包括程式化調用和自然語言調用。

此架構的核心優勢是：
- **標準化**：統一的調用接口
- **可擴展性**：輕鬆添加新工具
- **靈活性**：支持多種調用方式
- **安全性**：類型檢查和錯誤處理 