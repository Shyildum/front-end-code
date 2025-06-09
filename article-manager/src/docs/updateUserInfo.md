# 用户信息更新API使用指南

## API规范

### 接口地址
```
PUT /users/info
```

### 请求头
```
X-User-Id: {用户ID}
Authorization: Bearer {accessToken}  // 可选，优先使用
Content-Type: application/json
```

### 请求体
```json
{
    "nickname": "奶龙",
    "avatar": "https://example.com/avatar.jpg",
    "profile": "这是我的个人简介"
}
```

### 响应格式
```json
{
    "code": 0,
    "message": "用户信息更新成功",
    "detail": "用户信息已成功更新",
    "data": {}
}
```

## 使用方法

### 1. 基本用法

```javascript
import { authAPI } from '@/services/api'

// 更新用户信息
const updateProfile = async () => {
  try {
    const userInfo = {
      nickname: "奶龙",
      avatar: "https://example.com/avatar.jpg",
      profile: "这是我的个人简介"
    }
    
    const response = await authAPI.updateUserInfo(userInfo)
      if (response.code === 200) {
      console.log('更新成功:', response.message)
      // 更新成功后的处理逻辑
    } else {
      console.error('更新失败:', response.detail)
    }
  } catch (error) {
    console.error('请求失败:', error)
  }
}
```

### 2. 在Vue组件中使用

```vue
<template>
  <div class="profile-form">
    <input v-model="form.nickname" placeholder="昵称" />
    <input v-model="form.avatar" placeholder="头像链接" />
    <textarea v-model="form.profile" placeholder="个人简介"></textarea>
    <button @click="handleUpdate" :disabled="loading">
      {{ loading ? '更新中...' : '更新信息' }}
    </button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { authAPI } from '@/services/api'

const loading = ref(false)
const form = reactive({
  nickname: '',
  avatar: '',
  profile: ''
})

const handleUpdate = async () => {
  loading.value = true
  
  try {
    const response = await authAPI.updateUserInfo(form)
    
    if (response.code === 200) {
      // 更新本地存储的用户信息
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedUser = { ...user, ...form }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      alert('更新成功!')
    } else {
      alert('更新失败: ' + response.detail)
    }
  } catch (error) {
    alert('请求失败: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>
```

### 3. 错误处理

```javascript
const updateUserInfo = async (userInfo) => {
  try {
    const response = await authAPI.updateUserInfo(userInfo)
    return response
  } catch (error) {
    if (error.response) {
      // 服务器返回错误响应
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          throw new Error('用户信息格式不正确')
        case 401:
          throw new Error('登录已过期，请重新登录')
        case 403:
          throw new Error('没有权限更新用户信息')
        case 404:
          throw new Error('用户不存在')
        case 409:
          throw new Error('昵称已被使用')
        default:
          throw new Error(data?.detail || '更新失败')
      }
    } else if (error.request) {
      throw new Error('网络连接失败')
    } else {
      throw new Error(error.message || '更新失败')
    }
  }
}
```

## 特性说明

### 1. 自动用户ID验证
- API会自动从localStorage获取用户ID
- 如果用户ID不存在，会抛出错误提示用户登录

### 2. 双重认证支持
- 优先使用Bearer token认证
- 如果没有token，则使用X-User-Id header

### 3. 数据验证
- 昵称不能为空
- 用户名和邮箱必须唯一（由服务器验证）
- 头像URL格式验证（可选）

### 4. 本地存储同步
- 更新成功后，建议同步更新localStorage中的用户信息
- 确保UI显示与服务器数据一致

## 集成示例

查看以下文件了解完整的集成示例：

1. **API实现**: `src/services/api.js` - `userAPI.updateUserInfo`
2. **组件示例**: `src/components/UserProfileEditor.vue`
3. **页面集成**: `src/views/Dashboard.vue`
4. **测试用例**: `src/tests/updateUserInfo.test.js`

## 测试

在浏览器控制台中运行测试：

```javascript
// 导入测试模块
import('./tests/updateUserInfo.test.js').then(module => {
  // 运行所有测试
  module.runAllTests()
})
```

或者单独测试：

```javascript
// 测试正常更新
window.testUpdateUserInfo()

// 测试无用户ID情况
window.testUpdateWithoutUserId()

// 测试空昵称情况
window.testUpdateWithEmptyNickname()
```
