# 文章更新 API 使用指南

## 概述

`articleAPI.updateArticle()` 方法用于更新现有文章的信息，支持标准格式和传统格式的字段名。

## API 签名

```javascript
articleAPI.updateArticle(id, articleData)
```

### 参数

- `id` (必需): 文章ID，数字或字符串格式
- `articleData` (必需): 包含文章信息的对象

### 请求格式

**HTTP方法**: `PUT`  
**URL**: `/articles/{id}`  
**请求头**: 自动添加用户认证信息 (`Authorization` 或 `X-User-Id`)

### 请求体字段

支持以下字段（兼容多种格式）：

| 字段名 | 别名 | 类型 | 必需 | 描述 |
|--------|------|------|------|------|
| `title` | - | string | 是 | 文章标题 |
| `summary` | - | string | 否 | 文章摘要 |
| `content` | - | string | 是 | 文章内容 |
| `categoryId` | `category_id` | number | 否 | 分类ID |
| `isShared` | `is_shared` | boolean | 否 | 是否共享，默认false |
| `status` | - | string | 否 | 文章状态 (draft, published, etc.) |

## 使用示例

### 1. 标准格式

```javascript
import { articleAPI } from '@/services/api'

const articleData = {
  title: "如何使用Spring Boot",
  summary: "本文将介绍如何使用Spring Boot进行开发",
  content: "Spring Boot是一个开源的Java框架...",
  categoryId: 5,
  isShared: true,
  status: "draft"
}

try {
  const response = await articleAPI.updateArticle(123, articleData)
  if (response.code === 0) {
    console.log('文章更新成功:', response.data)
  } else {
    console.error('更新失败:', response.message)
  }
} catch (error) {
  console.error('请求失败:', error.message)
}
```

### 2. 传统格式（向后兼容）

```javascript
const articleData = {
  title: "Vue.js 入门指南",
  summary: "学习Vue.js的基础知识",
  content: "Vue.js是一个渐进式的JavaScript框架...",
  category_id: 3,  // 使用下划线格式
  is_shared: false, // 使用下划线格式
  status: "published"
}

const response = await articleAPI.updateArticle(456, articleData)
```

### 3. 最小数据集

```javascript
const minimalData = {
  title: "更新的标题",
  content: "更新的内容"
}

const response = await articleAPI.updateArticle(789, minimalData)
```

### 4. 在 Vue 组件中使用

```vue
<template>
  <div>
    <form @submit.prevent="handleUpdateArticle">
      <input v-model="article.title" placeholder="文章标题" required>
      <textarea v-model="article.content" placeholder="文章内容" required></textarea>
      <select v-model="article.categoryId">
        <option value="">选择分类</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
      <label>
        <input type="checkbox" v-model="article.isShared">
        公开分享
      </label>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '更新中...' : '更新文章' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { articleAPI } from '@/services/api'

const props = defineProps(['articleId'])
const emit = defineEmits(['updated', 'error'])

const isLoading = ref(false)
const article = reactive({
  title: '',
  summary: '',
  content: '',
  categoryId: null,
  isShared: false,
  status: 'draft'
})

const handleUpdateArticle = async () => {
  if (!article.title.trim() || !article.content.trim()) {
    emit('error', '标题和内容不能为空')
    return
  }

  isLoading.value = true
  
  try {
    const response = await articleAPI.updateArticle(props.articleId, article)
    
    if (response.code === 0) {
      emit('updated', response.data)
      console.log('文章更新成功')
    } else {
      emit('error', response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新文章失败:', error)
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
  message: "文章更新成功",
  detail: "文章已成功更新",
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
    updatedAt: "2024-01-02T00:00:00.000Z"
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

常见错误状态码和处理：

| 状态码 | 错误类型 | 处理建议 |
|--------|----------|----------|
| 400 | 参数错误 | 检查必需字段是否完整 |
| 401 | 未授权 | 用户需要重新登录 |
| 403 | 权限不足 | 用户没有编辑此文章的权限 |
| 404 | 文章不存在 | 文章ID无效或已被删除 |
| 409 | 冲突 | 文章标题重复或其他冲突 |
| 500 | 服务器错误 | 稍后重试 |

## 测试

运行测试用例：

```javascript
import { runUpdateArticleTests } from '@/tests/updateArticle.test.js'

// 运行所有测试
runUpdateArticleTests()
```

## 注意事项

1. **文章ID必需**: 更新文章时必须提供有效的文章ID
2. **字段兼容性**: 支持 `categoryId`/`category_id` 和 `isShared`/`is_shared` 两种格式
3. **自动认证**: 请求会自动添加用户认证信息
4. **状态管理**: 支持 `status` 字段来管理文章状态
5. **权限检查**: 只能更新属于当前用户的文章

## 相关 API

- `articleAPI.createArticle()` - 创建新文章
- `articleAPI.getArticle(id)` - 获取文章详情
- `articleAPI.deleteArticle(id)` - 删除文章
- `articleAPI.getUserArticles()` - 获取用户文章列表
