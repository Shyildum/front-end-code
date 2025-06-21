<template>
  <div 
    class="markdown-content"
    v-html="renderedContent"
  ></div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

// Props
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

// 配置 marked 选项
const defaultOptions = {
  breaks: true,          // 支持 GitHub 风格的换行
  gfm: true,            // 启用 GitHub Flavored Markdown
  headerIds: true,      // 为标题生成 ID
  mangle: false,        // 不对邮箱地址进行混淆
  sanitize: false,      // 不进行 HTML 清理（如果需要安全性，可以开启）
}

// 合并用户选项和默认选项
const mergedOptions = computed(() => ({
  ...defaultOptions,
  ...props.options
}))

// 渲染 Markdown 内容
const renderedContent = computed(() => {
  if (!props.content) {
    return ''
  }
  
  try {
    // 配置 marked
    marked.setOptions(mergedOptions.value)
    
    // 在渲染Markdown之前，先处理##标签（特殊标记）
    let processedContent = props.content
    // 匹配##开头的文本（直到遇到空格、换行或其他分隔符）
    processedContent = processedContent.replace(/(##[^\s<]+)/g, '<span class="hash-tag">$1</span>')
    
    // 渲染 Markdown
    return marked.parse(processedContent)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    // 如果渲染失败，返回原始内容
    return `<pre>${props.content}</pre>`
  }
})
</script>

<style scoped>
.markdown-content {
  line-height: 1.6;
  color: #333;
  max-width: 100%;
  word-wrap: break-word;
}

/* 深度选择器：样式化渲染后的 HTML 内容 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-content :deep(h1) {
  font-size: 2em;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h3) {
  font-size: 1.25em;
}

.markdown-content :deep(h4) {
  font-size: 1em;
}

.markdown-content :deep(h5) {
  font-size: 0.875em;
}

.markdown-content :deep(h6) {
  font-size: 0.85em;
  color: #777;
}

.markdown-content :deep(p) {
  margin-bottom: 1em;
}

.markdown-content :deep(blockquote) {
  margin: 1em 0;
  padding: 0 1em;
  color: #666;
  border-left: 4px solid #ddd;
  background-color: #f9f9f9;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 1em;
  padding-left: 2em;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25em;
}

.markdown-content :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875em;
  color: #d73a49;
}

.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid #e1e4e8;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #333;
  font-size: 0.875em;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #ddd;
  padding: 0.5em;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f2f2f2;
  font-weight: 600;
}

.markdown-content :deep(a) {
  color: #0366d6;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1em 0;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 2px solid #eee;
  margin: 2em 0;
}

/* 任务列表样式 */
.markdown-content :deep(input[type="checkbox"]) {
  margin-right: 0.5em;
}

/* 代码高亮 */
.markdown-content :deep(.hljs) {
  background-color: #f6f8fa !important;
}

/* ##标签样式 - 显示为蓝色 */
.markdown-content :deep(.hash-tag) {
  color: #3b82f6;
  font-weight: 500;
}
</style>
