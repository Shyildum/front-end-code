<template>
  <div class="auth-container">    <!-- 左侧品牌区域 -->
    <div class="brand-section">
      <div class="brand-description">
        <div class="brand-header">
          <Logo />
          <h1 class="brand-name">ArtMan</h1>
        </div>
        <h2>管理您的创作世界</h2>
        <p>专业的文章管理平台，让创作更高效，让内容更有价值。支持多种格式，智能分类，轻松管理您的所有文章。</p>
        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-icon">📝</span>
            <span>智能编辑器</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <span>数据分析</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔒</span>
            <span>安全可靠</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧登录表单 -->
    <div class="auth-card">
      <div class="auth-header">
        <h1>🔐 用户登录</h1>
        <p>欢迎回来！请登录您的账户</p>
      </div>      <form @submit.prevent="handleLogin" class="auth-form">
        <!-- 登录方式切换 -->
        <div class="login-type-switch">
          <button 
            type="button" 
            :class="['switch-btn', { active: loginType === 'username' }]"
            @click="loginType = 'username'"
          >
            👤 用户名登录
          </button>
          <button 
            type="button" 
            :class="['switch-btn', { active: loginType === 'email' }]"
            @click="loginType = 'email'"
          >
            📧 邮箱登录
          </button>
        </div>

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="error-message">
          <i class="error-icon">⚠️</i>
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label>
            <i class="icon">{{ loginType === 'username' ? '👤' : '📧' }}</i>
            {{ loginType === 'username' ? '用户名' : '邮箱地址' }}
          </label>
          <input
            v-model="loginForm.credential"
            :type="loginType === 'email' ? 'email' : 'text'"
            :placeholder="loginType === 'username' ? '请输入用户名' : '请输入邮箱地址'"
            required
          >
        </div>

        <div class="form-group">
          <label>
            <i class="icon">🔒</i>
            密码
          </label>
          <div class="password-input">
            <input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              required
            >
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="password-toggle"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox">
            <input v-model="loginForm.rememberMe" type="checkbox">
            <span class="checkmark"></span>
            记住我
          </label>
          <a href="#" class="forgot-link">忘记密码？</a>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading">登录中...</span>
          <span v-else>登录</span>
        </button>

        <div class="divider">
          <span>或者</span>
        </div>

        <div class="social-login">
          <button type="button" class="social-btn google">
            <span>🔍 Google 登录</span>
          </button>
          <button type="button" class="social-btn github">
            <span>🐙 GitHub 登录</span>
          </button>
        </div>

        <div class="auth-footer">
          <p>
            还没有账户？
            <router-link to="/register" class="link">立即注册</router-link>
          </p>
        </div>
      </form>
    </div>

    <div class="auth-background">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/components/Logo.vue'
import { authAPI } from '@/services/api'

const router = useRouter()

const loginForm = reactive({
  credential: '',
  password: '',
  rememberMe: false
})

const loginType = ref('username') // 'username' 或 'email'
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// 监听登录方式切换，清空凭据输入
watch(loginType, () => {
  loginForm.credential = ''
  errorMessage.value = ''
})

// 清除错误信息当用户开始输入
watch(() => loginForm.credential, () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
})

watch(() => loginForm.password, () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
})

const handleLogin = async () => {
  console.log('🚀 开始登录流程...')
  
  if (!loginForm.credential.trim() || !loginForm.password.trim()) {
    errorMessage.value = '请填写完整的登录信息'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  
  try {
    console.log('📝 登录信息:', {
      type: loginType.value,
      credential: loginForm.credential,
      rememberMe: loginForm.rememberMe
    })
    
    let response
    
    if (loginType.value === 'username') {
      console.log('👤 使用用户名登录...')
      response = await authAPI.loginByUsername(loginForm.credential, loginForm.password)
    } else {
      console.log('📧 使用邮箱登录...')
      response = await authAPI.loginByEmail(loginForm.credential, loginForm.password)
    }    console.log('📥 API响应:', response)

    // API响应格式：{code: 200, message: "string", detail: "string", data: {...}}
    if (response && response.code === 200 && response.data) {
      console.log('✅ 登录成功！用户数据:', response.data)
      
      // 验证本地存储
      const storedUserId = localStorage.getItem('userId')
      const storedUser = localStorage.getItem('user')
      
      console.log('💾 本地存储状态:', {
        userId: storedUserId,
        user: storedUser ? JSON.parse(storedUser) : null
      })
      
      // 如果选择了记住我，可以设置更长的过期时间
      if (loginForm.rememberMe) {
        console.log('🔐 用户选择记住登录状态')
      }

      // 跳转到文章管理页面
      console.log('🎯 准备跳转到文章管理页面...')
      console.log('📍 当前路由:', router.currentRoute.value.path)
      
      // 使用 window.location 强制跳转，确保成功
      console.log('🔄 使用 window.location 跳转...')
      window.location.href = '/articles'
    } else {
      console.log('❌ 登录失败:', response)
      // 登录失败，显示错误信息
      errorMessage.value = response?.detail || response?.message || '登录失败，请检查用户名和密码'
    }
  } catch (error) {
    console.error('💥 登录过程中发生错误:', error)    // 处理API返回的错误信息
    if (error.response) {
      console.log('📥 错误响应:', error.response)
      const responseData = error.response.data
      
      // 首先检查响应体中是否有标准格式的错误信息
      if (responseData && typeof responseData.code !== 'undefined') {
        // 标准API响应格式：{code: xxx, message: "string", detail: "string", data: null}
        errorMessage.value = responseData.detail || responseData.message || '登录失败'
      } else {
        // 处理HTTP状态码错误
        switch (error.response.status) {
          case 400:
            errorMessage.value = responseData?.message || '用户名或密码格式不正确'
            break
          case 401:
            errorMessage.value = responseData?.message || '用户名或密码错误'
            break
          case 404:
            errorMessage.value = responseData?.message || '用户不存在'
            break
          case 429:
            errorMessage.value = responseData?.message || '登录尝试过多，请稍后再试'
            break
          case 500:
            errorMessage.value = responseData?.message || '服务器错误，请稍后再试'
            break
          default:
            errorMessage.value = responseData?.message || '登录失败，请重试'
        }
      }
    } else if (error.request) {
      console.log('🌐 网络请求错误:', error.request)
      errorMessage.value = '网络连接失败，请检查网络后重试'
    } else {
      console.log('⚠️ 其他错误:', error.message)
      errorMessage.value = error.message || '登录失败，请重试'
    }
  } finally {
    isLoading.value = false
    console.log('🏁 登录流程结束')
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;  background: 
    linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)),
    url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80') center/cover no-repeat;
  position: relative;
  overflow: hidden;
}

/* 左侧品牌区域 */
.brand-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  color: white;
  position: relative;
  z-index: 10;
}

/* Logo 尺寸控制 */
.brand-section .logo-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

/* 品牌头部布局 */
.brand-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
}

.brand-name {
  font-size: 42px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
}

.brand-description {
  margin-top: 0;
  max-width: 500px;
}

.brand-description h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 20px 0;
  line-height: 1.2;
  background: linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-description p {
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 30px 0;
  opacity: 0.9;
  color: #F3F4F6;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #F3F4F6;
  opacity: 0.8;
}

.feature-icon {
  font-size: 18px;
  width: 24px;
}

/* 右侧登录卡片 */

.auth-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 420px;
  margin: 40px 240px 40px auto;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.2);
  align-self: center;
}

/* 移除动画效果 */

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-header h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.auth-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-type-switch {
  display: flex;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.switch-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
  color: #666;
}

.switch-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.switch-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.5);
  color: #333;
}

/* 错误信息样式 */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 8px;
}

.error-icon {
  font-size: 16px;
  flex-shrink: 0;
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
  color: #333;
  font-size: 14px;
}

.icon {
  font-size: 16px;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  padding: 4px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox input {
  width: 18px;
  height: 18px;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.forgot-link:hover {
  text-decoration: underline;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.divider {
  text-align: center;
  position: relative;
  color: #999;
  font-size: 14px;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e1e5e9;
  z-index: 1;
}

.divider span {
  background: rgba(255, 255, 255, 0.95);
  padding: 0 15px;
  position: relative;
  z-index: 2;
}

.social-login {
  display: flex;
  gap: 12px;
}

.social-btn {
  flex: 1;
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #333;
}

.social-btn:hover {
  border-color: #667eea;
  transform: translateY(-1px);
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
}

.auth-footer p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.floating-shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
}

.shape-3 {
  width: 80px;
  height: 80px;
  top: 80%;
  left: 20%;
}

/* 移除浮动动画 */

@media (max-width: 1024px) {
  .auth-container {
    flex-direction: column;
  }
  
  .brand-section {
    padding: 40px 20px;
    text-align: center;
  }
  
  .brand-description h2 {
    font-size: 28px;
  }
  
  .auth-card {
    margin: 20px auto;
    padding: 30px 20px;
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .brand-section {
    padding: 30px 20px;
  }
  
  .brand-description {
    margin-top: 20px;
  }
  
  .brand-description h2 {
    font-size: 24px;
  }
  
  .brand-description p {
    font-size: 14px;
  }
  
  .feature-list {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .auth-card {
    margin: 20px auto;
    padding: 30px 20px;
  }
  
  .social-login {
    flex-direction: column;
  }
  
  .brand-description h2 {
    font-size: 20px;
  }
  
  .feature-list {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
