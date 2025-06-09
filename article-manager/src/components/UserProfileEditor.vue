<template>
  <div class="user-profile-editor">
    <div class="editor-header">
      <h2>编辑个人信息</h2>
      <p>更新您的昵称和个人简介</p>
    </div>

    <form @submit.prevent="handleUpdateProfile" class="profile-form">
      <!-- 错误和成功信息显示 -->
      <div v-if="errorMessage" class="error-message">
        <i class="error-icon">⚠️</i>
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="success-message">
        <i class="success-icon">✅</i>
        {{ successMessage }}
      </div>

      <div class="form-group">
        <label>
          <i class="icon">👤</i>
          昵称
        </label>
        <input
          v-model="profileForm.nickname"
          type="text"
          placeholder="请输入昵称"
          required
        >
      </div>

      <div class="form-group">
        <label>
          <i class="icon">📝</i>
          个人简介
        </label>
        <textarea
          v-model="profileForm.profile"
          placeholder="介绍一下自己吧..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="update-btn" :disabled="isLoading">
          <span v-if="isLoading">更新中...</span>
          <span v-else>更新信息</span>
        </button>
        <button type="button" @click="resetForm" class="reset-btn">
          重置
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { authAPI } from '@/services/api'

const profileForm = reactive({
  nickname: '',
  profile: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 清除消息当用户开始输入
watch([() => profileForm.nickname, () => profileForm.profile], () => {
  errorMessage.value = ''
  successMessage.value = ''
})

// 加载当前用户信息
const loadUserInfo = async () => {
  try {
    const response = await authAPI.getUserInfo()
    if (response.code === 200 && response.data) {
      const { nickname, profile } = response.data
      profileForm.nickname = nickname || ''
      profileForm.profile = profile || ''
    }
  } catch (error) {
    console.warn('加载用户信息失败:', error)
    // 如果无法加载，使用本地存储的基本信息
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    profileForm.nickname = user.nickname || user.username || ''
  }
}

// 更新用户信息
const handleUpdateProfile = async () => {
  if (!profileForm.nickname.trim()) {
    errorMessage.value = '昵称不能为空'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {    const userInfo = {
      nickname: profileForm.nickname.trim(),
      profile: profileForm.profile.trim()
    }
    
    const response = await authAPI.updateUserInfo(userInfo)
    
    // API响应格式：{code: 200, message: "string", detail: "string", data: {...}}
    if (response && response.code === 200) {
      successMessage.value = response.detail || response.message || '用户信息更新成功'
      
      // 更新本地存储的用户信息
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedUser = {
        ...user,
        nickname: userInfo.nickname,
        profile: userInfo.profile
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      console.log('用户信息更新成功:', response.data)
    } else {
      errorMessage.value = response?.detail || response?.message || '更新失败'
    }  } catch (error) {
    console.error('更新用户信息失败:', error)
    
    if (error.response) {
      const responseData = error.response.data
      
      // 首先检查响应体中是否有标准格式的错误信息
      if (responseData && typeof responseData.code !== 'undefined') {
        // 标准API响应格式：{code: xxx, message: "string", detail: "string", data: null}
        errorMessage.value = responseData.detail || responseData.message || '更新失败'
      } else {
        // 处理HTTP状态码错误
        switch (error.response.status) {
          case 400:
            errorMessage.value = responseData?.message || '用户信息格式不正确'
            break
          case 401:
            errorMessage.value = responseData?.message || '登录已过期，请重新登录'
            break
          case 403:
            errorMessage.value = responseData?.message || '没有权限更新用户信息'
            break
          case 409:
            errorMessage.value = responseData?.message || '昵称已被使用，请选择其他昵称'
            break
          case 404:
            errorMessage.value = responseData?.message || '用户不存在'
            break
          case 500:
            errorMessage.value = responseData?.message || '服务器错误，请稍后再试'
            break
          default:
            errorMessage.value = responseData?.message || '更新失败，请重试'
        }
      }
    } else if (error.request) {
      errorMessage.value = '网络连接失败，请检查网络后重试'
    } else {
      errorMessage.value = error.message || '更新失败，请重试'
    }
  } finally {
    isLoading.value = false
  }
}

// 重置表单
const resetForm = async () => {
  await loadUserInfo()
  errorMessage.value = ''
  successMessage.value = ''
}

// 组件挂载时加载用户信息
onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.user-profile-editor {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.editor-header {
  text-align: center;
  margin-bottom: 32px;
}

.editor-header h2 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
}

.editor-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.error-message,
.success-message {
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.icon {
  font-size: 16px;
}

.form-group input,
.form-group textarea {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.update-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.update-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-btn {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

@media (max-width: 768px) {
  .user-profile-editor {
    margin: 16px;
    padding: 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .update-btn,
  .reset-btn {
    width: 100%;
  }
}
</style>
