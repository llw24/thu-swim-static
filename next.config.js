/** @type {import('next').NextConfig} */
//
// 静态导出配置：
// - output: 'export'   构建时生成纯 HTML 到 out/，不需要任何服务器
// - basePath           GitHub Pages 项目页挂在 /<仓库名>/ 子路径下；
//                      本地开发不设 NEXT_PUBLIC_BASE_PATH 即为根路径
// - trailingSlash      生成 /news/xxx/ 目录形式，GitHub Pages 可直接命中 index.html
// - images.unoptimized 静态导出不支持默认图片优化器
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

module.exports = nextConfig;
