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
server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
}));
// Add a dynamic greeting resource
server.resource("greeting", new ResourceTemplate("greeting://{name}", { list: undefined }), async (uri, { name }) => ({
    contents: [{
            uri: uri.href,
            text: `Hello, ${name}!`
        }]
}));
// 添加 xe_auth_info 工具
server.tool("xe_auth_info", "获取XE系统登录后的Cookie信息", {}, async () => {
    try {
        // 启动浏览器
        const browser = await puppeteer.launch({
            headless: false, // 设置为true可以不显示浏览器窗口
            defaultViewport: null,
            args: ['--window-size=1280,800']
        });
        const page = await browser.newPage();
        // 步骤1: 进入登录页面
        await page.goto('https://tst-auth.mayohr.com/HRM/Account/Login?original_target=https%3A%2F%2Ftst-apolloxe.mayohr.com%2Ftube&lang=zh-tw', {
            waitUntil: 'networkidle2'
        });
        console.error('已进入登录页面');
        // 步骤2: 输入账号密码
        await page.type('input[name="userName"]', 'huanuage_lee@bestscrivener.com');
        await page.type('input[name="password"]', 'Huanuage0058');
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
            await page.waitForSelector('[data-tip]');
            const companyElements = await page.$$('[data-tip]');
            let found = false;
            for (const element of companyElements) {
                const dataTip = await page.evaluate(el => el.getAttribute('data-tip'), element);
                if (dataTip && dataTip.includes('天空公司')) {
                    await Promise.all([
                        element.click(),
                        page.waitForNavigation({ waitUntil: 'networkidle2' })
                    ]);
                    console.error('已点击包含"天空公司"的元素');
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.error('未找到包含"天空公司"的元素');
            }
        }
        // 步骤4: 进入tube页面并获取cookie
        // 使用 setTimeout 替代 waitForTimeout 方法
        await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒确保页面完全加载
        // 检查是否成功跳转到目标页面
        if (page.url().includes('tst-apolloxe.mayohr.com/tube')) {
            console.error('已成功进入tube页面');
            // 获取所有cookie
            // const cookies = await page.cookies();
            // 关闭浏览器
            // await browser.close();
            // 返回cookie信息
            return {
                content: [
                    {
                        type: "text",
                        text: "登录成功"
                    }
                ]
            };
        }
        else {
            console.error('未能成功进入tube页面，当前URL:', page.url());
            await browser.close();
            return {
                content: [
                    {
                        type: "text",
                        text: `登录流程未完成，当前页面URL: ${page.url()}`
                    }
                ]
            };
        }
    }
    catch (error) {
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
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
