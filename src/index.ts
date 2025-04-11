import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// 注意: 需要先安装 puppeteer 依赖
// npm install puppeteer @types/puppeteer
import puppeteer from "puppeteer";

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

// Add an addition tool
server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

// 添加 xe_auth_info 工具
server.tool("xe_auth_info",
  "获取XE系统登录后的Cookie信息",
  {},
  async () => {
    try {
      // 启动浏览器
      const browser = await puppeteer.launch({
        headless: false, // 设置为true可以不显示浏览器窗口
        defaultViewport: null,
        args: ['--window-size=1280,800']
      });
      const context = await browser.createBrowserContext(); 
      const page = await context.newPage();
      
      // 步骤1: 进入登录页面
      await page.goto('{loginUrl}', {
        waitUntil: 'networkidle2'
      });
      console.error('已进入登录页面');
      
      // 步骤2: 输入账号密码
      await page.type('input[name="userName"]', '{userName}');
      await page.type('input[name="password"]', '{password}');
      
      // 点击登录按钮
      await Promise.all([
        page.click('button[type="button"].submit-btn'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
      console.error('已输入账号密码并点击登录');
      
      // 步骤3: 跳转到选择公司页面并点击
      if (page.url().includes('SelectCompany')) {
        console.error('已进入选择公司页面');
        
        // 寻找data-tip属性中包含"天空公司"的元素并点击
        await page.waitForSelector('[data-tip]', { timeout: 10000 });
        
        const companyElements = await page.$$('[data-tip]');
        // 收集所有 dataTip 内容
        const dataTipList = [];
        
        for (const element of companyElements) {
          const dataTip = await page.evaluate(el => el.getAttribute('data-tip'), element,);
          console.error('dataTip:', dataTip);
          dataTipList.push(dataTip);
        }
        
        // 关闭浏览器
        await browser.close();
        
        // 返回所有 dataTip 内容
        return {
          content: [
            {
              type: "text",
              text: `选择公司页面上所有 dataTip 内容:\n\n${JSON.stringify(dataTipList, null, 2)}`
            }
          ]
        };
      }

        return {
          content: [
            {
              type: "text",
              text: "登录成功"
            }
          ]
        };
      
      // 步骤4: 进入tube页面并获取cookie
      // 使用 setTimeout 替代 waitForTimeout 方法
      // await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒确保页面完全加载
      
      // // 检查是否成功跳转到目标页面
      // if (page.url().includes('tst-apolloxe.mayohr.com/tube')) {
      //   console.error('已成功进入tube页面');
        
      //   // 获取所有cookie
      //   const cookies = await context.cookies();
      //   console.error('获取到的cookie信息:', cookies);
        
      //   // 关闭浏览器
      //   await browser.close();
        
      //   // 返回cookie信息
      //   return {
      //     content: [
      //       {
      //         type: "text",
      //         text: "登录成功"
      //       }
      //     ]
      //   };
      // } else {
      //   console.error('未能成功进入tube页面，当前URL:', page.url());
      //   await browser.close();
      //   return {
      //     content: [
      //       {
      //         type: "text",
      //         text: `登录流程未完成，当前页面URL: ${page.url()}`
      //       }
      //     ]
      //   };
      // }
    } catch (error: unknown) {
      console.error('执行过程中出错:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `执行过程中出错: ${errorMessage}`
          }
        ]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});