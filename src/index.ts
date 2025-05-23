import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// 注意: 需要先安装 puppeteer 依赖
// npm install puppeteer @types/puppeteer
import puppeteer from "puppeteer";

// 添加类型声明，解决TypeScript类型问题
declare global {
  // eslint-disable-next-line no-var
  var __xe_session: {
    browser: any;
    context: any;
    page: any;
    state: string;
  } | null;
}

// 初始化全局会话变量
global.__xe_session = null;

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

// 第一阶段：初始化浏览器并进入登录页面
server.tool("xe_init_browser",
  "初始化浏览器并进入登录页面",
  {},
  async () => {
    try {
      // 启动浏览器
      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--window-size=1280,800']
      });
      const context = await browser.createBrowserContext(); 
      const page = await context.newPage();
      
      // 保存当前会话信息到全局变量，以便其他工具使用
      global.__xe_session = {
        browser,
        context,
        page,
        state: 'initialized'
      };
      
      console.error('已初始化浏览器会话');
      
      // 进入登录页面
      await page.goto('https://tst-auth.mayohr.com/HRM//account/logout?original_target=https%3A%2F%2Ftst-apolloxe.mayohr.com%2Ftube&lang=zh-tw', {
        waitUntil: 'domcontentloaded'
      });
      
      console.error('已进入登录页面');
      
      return {
        content: [{ 
          type: "text", 
          text: "浏览器已初始化并进入登录页面，请继续使用 xe_login 工具进行登录" 
        }]
      };
    } catch (error: unknown) {
      console.error('初始化浏览器出错:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `初始化浏览器出错: ${errorMessage}` }]
      };
    }
  }
);

// 第二阶段：执行登录操作
server.tool("xe_login",
  "登录XE系统",
  {},
  async () => {
    try {
      // 获取全局保存的会话
      const session = global.__xe_session;
      if (!session || !session.page) {
        return {
          content: [{ 
            type: "text", 
            text: "会话未初始化，请先使用 xe_init_browser 工具" 
          }]
        };
      }
      
      const { page } = session;
      console.error('获取到已保存的会话，等待用户在浏览器中输入账号密码并登录');
      
      // 将焦点设置到用户名输入框，方便用户开始输入
      await page.focus('input[name="userName"]');
      
      // 提示用户手动输入
      console.error('请在浏览器中手动输入账号密码，然后点击登录按钮');
      
      // 等待登录按钮被点击
      try {
        // 监听登录按钮的点击事件
        await page.evaluate(() => {
          return new Promise(resolve => {
            const loginBtn = document.querySelector('button[type="button"].submit-btn');
            if (loginBtn) {
              loginBtn.addEventListener('click', () => {
                console.log('登录按钮被点击');
                resolve(true);
              });
            }
          });
        });
        
        console.error('检测到登录按钮被点击');
        
        // 等待短暂时间以确保导航开始
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 更新会话状态
        session.state = 'user_login_initiated';
        
        return {
          content: [{ 
            type: "text", 
            text: `已检测到登录操作，当前URL: ${page.url()}，请继续使用 xe_select_company 工具选择公司` 
          }]
        };
      } catch (error) {
        console.error('等待登录按钮点击时出错:', error);
        return {
          content: [{ 
            type: "text", 
            text: "等待用户登录超时，请重试并确保点击登录按钮" 
          }]
        };
      }
    } catch (error: unknown) {
      console.error('登录过程出错:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `登录过程出错: ${errorMessage}` }]
      };
    }
  }
);

// 第三阶段：选择公司
server.tool("xe_select_company",
  "选择XE系统中的公司",
  {},
  async () => {
    try {
      // 获取全局保存的会话
      const session = global.__xe_session;
      if (!session || !session.page) {
        return {
          content: [{ 
            type: "text", 
            text: "会话未初始化，请先使用 xe_init_browser 和 xe_login 工具" 
          }]
        };
      }
      
      const { page } = session;
      console.error('获取到已保存的会话，准备选择公司');
      
      // 检查是否在公司选择页面
      if (!page.url().includes('SelectCompany')) {
        return {
          content: [{ 
            type: "text", 
            text: `当前不在公司选择页面，当前URL: ${page.url()}` 
          }]
        };
      }
      
      console.error('已进入选择公司页面');
      
      // 等待数据提示元素出现
      await page.waitForSelector('[data-tip]', { timeout: 10000 });
      
      // 寻找包含"天空公司"的元素
      const companyElements = await page.$$('[data-tip]');
      let targetElement = null;
      const dataTipList = [];
      
      for (const element of companyElements) {
        const dataTip = await page.evaluate((el: Element) => el.getAttribute('data-tip'), element);
        dataTipList.push(dataTip);
        console.error('dataTip:', dataTip);
        if (dataTip && dataTip.includes('天空公司')) {
          targetElement = element;
          break;
        }
      }
      
      if (targetElement) {
        // 点击目标公司
        await targetElement.click();
        console.error('已点击目标公司');
        
        // 更新会话状态
        session.state = 'company_selected';
        
        return {
          content: [{ 
            type: "text", 
            text: `已选择公司，请继续使用 xe_check_status 工具检查状态` 
          }]
        };
      } else {
        // 没有找到目标公司
        return {
          content: [{ 
            type: "text", 
            text: `未找到"天空公司"，但发现以下公司:\n${dataTipList.join('\n')}` 
          }]
        };
      }
    } catch (error: unknown) {
      console.error('选择公司过程出错:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `选择公司过程出错: ${errorMessage}` }]
      };
    }
  }
);

// 第四阶段：检查状态并获取结果
server.tool("xe_check_status",
  "检查XE系统登录状态并获取Cookie信息",
  {},
  async () => {
    try {
      // 获取全局保存的会话
      const session = global.__xe_session;
      if (!session || !session.page) {
        return {
          content: [{ 
            type: "text", 
            text: "会话未初始化，请完成前序步骤" 
          }]
        };
      }
      
      const { page, browser, context } = session;
      console.error('获取到已保存的会话，准备检查状态');
      
      // 获取当前URL
      const currentUrl = page.url();
      console.error('当前URL:', currentUrl);
      
      // 等待短暂时间，让页面有机会加载
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 获取所有cookie
      const cookies = await context.cookies();
      console.error('获取到的cookie数量:', cookies.length);
      
      // 定义Cookie类型
      interface Cookie {
        name: string;
        value: string;
        domain: string;
        path: string;
        expires?: number;
        httpOnly?: boolean;
        secure?: boolean;
        [key: string]: any;
      }
      
      // 筛选指定的cookie
      const targetCookies = cookies.filter((cookie: Cookie) => 
        cookie.name === '__ModuleSessionCookie' || 
        cookie.name === 'LoggedInDomain'
      );
      
      console.error('获取到的目标cookie数量:', targetCookies.length);
      
      // 将cookie格式化为易于阅读的格式
      const cookieDetails = targetCookies.map((cookie: Cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires ? new Date(cookie.expires * 1000).toISOString() : 'Session',
        httpOnly: cookie.httpOnly,
        secure: cookie.secure
      }));
      
      // 创建结果对象
      const result = {
        url: currentUrl,
        state: session.state,
        isTargetPage: currentUrl.includes('tst-apolloxe.mayohr.com/tube'),
        cookieCount: cookies.length,
        targetCookies: cookieDetails
      };
      
      // 关闭浏览器并清理会话
      await browser.close();
      global.__xe_session = null;
      
      return {
        content: [{ 
          type: "text", 
          text: `登录流程已完成：
当前URL: ${result.url}
登录状态: ${result.state}
是否到达目标页面: ${result.isTargetPage}
Cookie数量: ${result.cookieCount}

关键Cookie信息:
${JSON.stringify(result.targetCookies, null, 2)}`
        }]
      };
    } catch (error: unknown) {
      console.error('检查状态过程出错:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      try {
        // 尝试关闭浏览器
        if (global.__xe_session && global.__xe_session.browser) {
          await global.__xe_session.browser.close();
        }
      } catch (e) {
        console.error('关闭浏览器失败:', e);
      }
      global.__xe_session = null;
      
      return {
        content: [{ type: "text", text: `检查状态过程出错: ${errorMessage}` }]
      };
    }
  }
);

// 原有的 xe_auth_info 工具（可以保留作为一站式调用，但可能会超时）
// server.tool("xe_auth_info",
//   "获取XE系统登录后的Cookie信息",
//   {},
//   async () => {
//     // ... 原有实现 ...
//   }
// );

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});