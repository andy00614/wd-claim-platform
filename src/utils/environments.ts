export function getUrl() {
    // 优先使用 window.location.origin（客户端）
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    
    // 服务端：使用环境变量
    if (process.env.NEXT_PUBLIC_URL) {
        return process.env.NEXT_PUBLIC_URL;
    }

    // Vercel 自动设置的环境变量
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // 开发环境默认值
    if (process.env.NODE_ENV === 'development') {
        return "http://localhost:3002";
    }

    throw new Error('Please set NEXT_PUBLIC_URL environment variable');
}