# MCP Test 项目

这是一个基于 Model Context Protocol (MCP) 的测试项目，主要用于实现自定义工具和资源的服务端功能。

## 功能特点

- 基于 MCP SDK 实现的服务器
- 提供基础数学运算工具（加法）
- 支持动态问候语资源
- 集成 Puppeteer 实现的 XE 系统自动化登录工具

## 技术栈

- Node.js
- TypeScript
- Model Context Protocol SDK
- Puppeteer
- Zod（用于参数验证）

## 安装步骤

1. 克隆项目到本地

```bash
git clone [项目地址]
cd mcp-test
```

2. 安装依赖

```bash
npm install
```

主要依赖包括：
- @modelcontextprotocol/sdk
- puppeteer
- zod

## 使用方法

### 启动服务器

```bash
npm start
```

### 可用工具

1. 加法工具 (add)
   - 输入参数：
     - a: 数字
     - b: 数字
   - 返回：两数之和

2. XE系统登录工具 (xe_auth_info)
   - 功能：自动化登录XE系统并获取相关信息
   - 无需输入参数

### 可用资源

1. 问候语资源 (greeting)
   - URI模板：`greeting://{name}`
   - 返回：个性化的问候语消息

## 开发说明

- 服务器配置位于 `src/index.ts`
- 使用 StdioServerTransport 进行通信
- 所有工具和资源都在主文件中定义

## 注意事项

- 运行 Puppeteer 相关功能时，确保系统已安装相关依赖
- XE系统登录工具需要正确的账号权限
- 建议在测试环境中使用

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

[添加许可证信息] 