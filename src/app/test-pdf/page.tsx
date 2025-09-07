'use client';

import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// 设置worker路径
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function TestPDF() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('请上传PDF文件');
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setImages([]);

    try {
      // 读取文件
      const arrayBuffer = await file.arrayBuffer();
      
      // 加载PDF文档
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      
      const imagePromises: Promise<string>[] = [];
      
      // 遍历每一页
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        imagePromises.push(
          (async () => {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2 }); // 缩放比例，2表示2倍清晰度
            
            // 创建canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas context not available');
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // 渲染PDF页面到canvas
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;
            
            // 转换为图片URL
            return canvas.toDataURL('image/png');
          })()
        );
      }
      
      // 等待所有页面渲染完成
      const results = await Promise.all(imagePromises);
      setImages(results);
    } catch (error) {
      console.error('PDF处理错误:', error);
      alert('PDF处理失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">PDF转图片预览</h1>
      
      {/* 上传区域 */}
      <div className="mb-8">
        <label className="block">
          <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">点击上传PDF文件</span>
            </p>
            <p className="text-xs text-gray-500">仅支持PDF格式</p>
            {fileName && (
              <p className="mt-2 text-sm text-blue-600">已选择: {fileName}</p>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">正在处理PDF...</span>
        </div>
      )}

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            预览结果 (共 {images.length} 页)
          </h2>
          <div className="grid gap-6">
            {images.map((image, index) => (
              <div key={index} className="border rounded-lg overflow-hidden shadow-lg">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <span className="text-sm font-medium text-gray-700">
                    第 {index + 1} 页
                  </span>
                </div>
                <div className="p-4 bg-gray-50">
                  <img 
                    src={image} 
                    alt={`Page ${index + 1}`}
                    className="w-full h-auto shadow-md"
                  />
                </div>
                <div className="p-3 bg-white border-t">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `page-${index + 1}.png`;
                      link.href = image;
                      link.click();
                    }}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    下载图片
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}