export function getUrl() {
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // 设置在 Vercel 中的生产环境 URL
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Vercel 自动设置（适用于 preview deployments）
        'http://localhost:3000/' // 本地开发环境
    
    // 确保 URL 格式正确
    url = url.startsWith('http') ? url : `https://${url}`
    url = url.endsWith('/') ? url : `${url}/`
    
    return url
}