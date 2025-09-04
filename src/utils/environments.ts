export function getUrl() {
    if (process.env.NEXT_PUBLIC_URL) {
        return process.env.NEXT_PUBLIC_URL;
    }

    // Vercel 自动设置的环境变量
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // 只在开发环境使用 localhost
    if (process.env.NODE_ENV === 'development') {
        return "http://localhost:3000";
    }

    // 生产环境应该抛出错误或使用 window.location.origin
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    throw new Error('Please set NEXT_PUBLIC_URL environment variable');
}