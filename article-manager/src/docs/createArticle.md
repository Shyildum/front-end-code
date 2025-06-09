# 文章创建 API 使用指南

## 概述

`articleAPI.createArticle()` 方法用于创建新文章，与您提供的 fetch API 逻辑完全兼容。

## API 签名

```javascript
articleAPI.createArticle(articleData)
```

### 参数

- `articleData` (必需): 包含文章信息的对象

### 请求格式

**HTTP方法**: `POST`  
**URL**: `/articles`  
**请求头**: 自动添加用户认证信息 (`X-User-Id` 和 `Content-Type`)

## 与您的逻辑对比

### 您的原生 fetch 逻辑
```javascript
var myHeaders = new Headers();
myHeaders.append("X-User-Id", "");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
   "title": "如何使用Spring Boot",
   "summary": "本文将介绍如何使用Spring Boot进行开发",
   "content": "Spring Boot是一个开源的Java框架...",
   "categoryId": 5,
   "isShared": true,
   "status": "draft"
});

var requestOptions = {
   method: 'POST',
   headers: myHeaders,
   body: raw,
   redirect: 'follow'
};

fetch("/articles", requestOptions)
   .then(response => response.text())
   .then(result => console.log(result))
   .catch(error => console.log('error', error));
```

### 我们的 API 实现（完全兼容）
```javascript
import { articleAPI } from '@/services/api'

const articleData = {
   "title": "如何使用Spring Boot",
   "summary": "本文将介绍如何使用Spring Boot进行开发",
   "content": "Spring Boot是一个开源的Java框架...",
   "categoryId": 5,
   "isShared": true,
   "status": "draft"
}

try {
  const response = await articleAPI.createArticle(articleData)
  if (response.code === 0) {
    console.log('文章创建成功:', response.data)
  } else {
    console.error('创建失败:', response.message)
  }
} catch (error) {
  console.error('请求失败:', error.message)
}
```

## 兼容性分析

| 特性 | 您的逻辑 | 我们的API | 状态 |
|------|----------|-----------|------|
| HTTP方法 | `POST` | `POST` | ✅ 完全匹配 |
| URL路径 | `/articles` | `/articles` | ✅ 完全匹配 |
| X-User-Id 头 | 手动添加 | 自动添加 | ✅ 自动处理 |
| Content-Type | `application/json` | 自动设置 | ✅ 自动处理 |
| 请求体格式 | JSON字符串 | 对象（自动序列化） | ✅ 简化使用 |
| 字段支持 | 标准格式 | 多格式兼容 | ✅ 增强支持 |
| 错误处理 | 基础 | 标准化 | ✅ 改进 |

## 支持的字段

### 必需字段
- `title`: 文章标题（字符串）
- `content`: 文章内容（字符串，支持Markdown）

### 可选字段
| 字段名 | 别名 | 类型 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `summary` | - | string | - | 文章摘要 |
| `categoryId` | `category_id` | number | - | 分类ID |
| `isShared` | `is_shared` | boolean | false | 是否公开分享 |
| `status` | - | string | - | 文章状态 (draft, published, etc.) |

## 使用示例

### 1. 完全兼容您的逻辑
```javascript
// 使用与您提供的逻辑完全相同的数据格式
const articleData = {
   "title": "如何使用Spring Boot",
   "summary": "本文将介绍如何使用Spring Boot进行开发",
   "content": "Spring Boot是一个开源的Java框架...",
   "categoryId": 5,
   "isShared": true,
   "status": "draft"
}

const response = await articleAPI.createArticle(articleData)
```

### 2. 传统格式（向后兼容）
```javascript
const articleData = {
   title: "Vue.js 学习笔记",
   summary: "Vue.js 基础知识总结",
   content: "# Vue.js 简介\n\nVue.js 是一个渐进式的JavaScript框架...",
   category_id: 3,     // 使用下划线格式
   is_shared: false,   // 使用下划线格式
   status: "published"
}

const response = await articleAPI.createArticle(articleData)
```

### 3. 最小数据集
```javascript
const minimalData = {
   title: "我的第一篇文章",
   content: "这是我的第一篇文章内容。"
}

const response = await articleAPI.createArticle(minimalData)
```

### 4. 在 Vue 组件中使用
```vue
<template>
  <div class="create-article">
    <form @submit.prevent="handleCreateArticle">
      <div class="form-group">
        <label>文章标题</label>
        <input 
          v-model="article.title" 
          type="text" 
          placeholder="请输入文章标题"
          required 
        >
      </div>
      
      <div class="form-group">
        <label>文章摘要</label>
        <textarea 
          v-model="article.summary" 
          placeholder="请输入文章摘要"
          rows="3"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label>文章内容</label>
        <textarea 
          v-model="article.content" 
          placeholder="请输入文章内容"
          rows="10"
          required
        ></textarea>
      </div>
      
      <div class="form-group">
        <label>分类</label>
        <select v-model="article.categoryId">
          <option value="">选择分类</option>
          <option v-for="category in categories" 
                  :key="category.id" 
                  :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="article.isShared">
          公开分享此文章
        </label>
      </div>
      
      <div class="form-group">
        <label>状态</label>
        <select v-model="article.status">
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>
      </div>
      
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '创建中...' : '创建文章' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { articleAPI } from '@/services/api'

const emit = defineEmits(['created', 'error'])

const isLoading = ref(false)
const categories = ref([]) // 从 categoryAPI 获取

const article = reactive({
  title: '',
  summary: '',
  content: '',
  categoryId: null,
  isShared: false,
  status: 'draft'
})

const handleCreateArticle = async () => {
  if (!article.title.trim() || !article.content.trim()) {
    emit('error', '标题和内容不能为空')
    return
  }

  isLoading.value = true
  
  try {
    const response = await articleAPI.createArticle(article)
    
    if (response.code === 0) {
      emit('created', response.data)
      console.log('文章创建成功:', response.data)
      
      // 重置表单
      Object.assign(article, {
        title: '',
        summary: '',
        content: '',
        categoryId: null,
        isShared: false,
        status: 'draft'
      })
    } else {
      emit('error', response.message || '创建失败')
    }
  } catch (error) {
    console.error('创建文章失败:', error)
    emit('error', error.message || '网络错误，请重试')
  } finally {
    isLoading.value = false
  }
}
</script>
```

## 响应格式

### 成功响应
```javascript
{
  code: 0,
  message: "文章创建成功",
  detail: "文章已成功创建",
  data: {
    id: 123,
    title: "如何使用Spring Boot",
    summary: "本文将介绍如何使用Spring Boot进行开发",
    content: "Spring Boot是一个开源的Java框架...",
    categoryId: 5,
    isShared: true,
    status: "draft",
    userId: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

### 错误响应
```javascript
{
  code: 1001,
  message: "参数错误",
  detail: "文章标题不能为空",
  data: null
}
```

## 错误处理

常见错误及处理建议：

| 状态码 | 错误类型 | 处理建议 |
|--------|----------|----------|
| 400 | 参数错误 | 检查必需字段 |
| 401 | 未授权 | 用户需要登录 |
| 403 | 权限不足 | 检查用户权限 |
| 409 | 冲突 | 标题重复等 |
| 500 | 服务器错误 | 稍后重试 |

## 测试

运行测试用例：

```javascript
import { runCreateArticleTests, validateCreateArticleCompatibility } from '@/tests/createArticle.test.js'

// 验证兼容性
validateCreateArticleCompatibility()

// 运行完整测试
runCreateArticleTests()
```

## 注意事项

1. **自动认证**: 请求头会自动添加用户认证信息
2. **字段兼容**: 支持多种字段名格式
3. **数据验证**: 前端和后端都会验证必需字段
4. **错误处理**: 提供详细的错误信息
5. **响应格式**: 统一的响应格式便于处理

## 总结

我们的 `articleAPI.createArticle()` 方法与您提供的原生 fetch 逻辑 **100% 兼容**，并提供了以下增强：

✅ **完全兼容**: 支持您提供的所有字段和格式  
✅ **自动处理**: 认证头和内容类型自动添加  
✅ **错误处理**: 标准化的错误处理机制  
✅ **类型安全**: 更好的 TypeScript 支持  
✅ **易于使用**: 简化的 API 调用方式
