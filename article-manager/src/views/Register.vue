<template>
  <div class="auth-container">
    <!-- 左侧品牌区域 -->
    <div class="brand-section">
      <div class="brand-description">
        <div class="brand-header">
          <Logo />
          <h1 class="brand-name">ArtMan</h1>
        </div>
        <h2>开始您的创作之旅</h2>
        <p>加入我们的文章管理平台，体验前所未有的创作和管理体验。智能工具助力您的每一篇文章，让创作变得更加简单高效。</p>
        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-icon">✨</span>
            <span>智能创作</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🚀</span>
            <span>快速发布</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">👥</span>
            <span>团队协作</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧注册表单 -->
    <div class="auth-card">
      <div class="auth-header">
        <h1>📝 创建账户</h1>
        <p>加入我们，开始您的文章管理之旅</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
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
            用户名
          </label>
          <input
            v-model="registerForm.username"
            type="text"
            placeholder="请输入用户名"
            required
          >
        </div>

        <div class="form-group">
          <label>
            <i class="icon">📧</i>
            邮箱
          </label>
          <input
            v-model="registerForm.email"
            type="email"
            placeholder="请输入邮箱地址"
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
              v-model="registerForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码(至少6位)"
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
          <div class="password-strength">
            <div class="strength-bar">
              <div class="strength-fill" :class="passwordStrength.class" :style="{width: passwordStrength.width}"></div>
            </div>
            <span class="strength-text">{{ passwordStrength.text }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>
            <i class="icon">🔐</i>
            确认密码
          </label>
          <div class="password-input">
            <input
              v-model="registerForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              required
            >
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="password-toggle"
            >
              {{ showConfirmPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="passwordMismatch" class="error-text">密码不匹配</span>
        </div>

        <div class="form-group">
          <label class="checkbox">
            <input v-model="registerForm.agreeTerms" type="checkbox" required>
            <span class="checkmark"></span>
            我同意 <a href="#" class="link">服务条款</a> 和 <a href="#" class="link">隐私政策</a>
          </label>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading || !isFormValid">
          <span v-if="isLoading">注册中...</span>
          <span v-else>创建账户</span>
        </button>

        <div class="auth-footer">
          <p>
            已有账户？
            <router-link to="/login" class="link">立即登录</router-link>
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
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/components/Logo.vue'
import { authAPI } from '@/services/api'

const router = useRouter()

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 清除消息当用户开始输入
watch([() => registerForm.username, () => registerForm.email, () => registerForm.password], () => {
  errorMessage.value = ''
  successMessage.value = ''
})

// 密码强度计算
const passwordStrength = computed(() => {
  const password = registerForm.password
  if (password.length === 0) {
    return { class: '', width: '0%', text: '' }
  }
  
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) {
    return { class: 'weak', width: '33%', text: '弱' }
  } else if (score <= 4) {
    return { class: 'medium', width: '66%', text: '中' }
  } else {
    return { class: 'strong', width: '100%', text: '强' }
  }
})

// 密码匹配检查
const passwordMismatch = computed(() => {
  return registerForm.confirmPassword.length > 0 && 
         registerForm.password !== registerForm.confirmPassword
})

// 表单验证
const isFormValid = computed(() => {
  return registerForm.username.length >= 3 &&
         registerForm.email.includes('@') &&
         registerForm.password.length >= 6 &&
         registerForm.password === registerForm.confirmPassword &&
         registerForm.agreeTerms
})

const handleRegister = async () => {
  if (!isFormValid.value) {
    errorMessage.value = '请填写完整且正确的注册信息'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const userData = {
      username: registerForm.username.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password
    }

    const response = await authAPI.register(userData)
    
    // 注册成功
    successMessage.value = '注册成功！正在跳转到登录页面...'
    
    // 等待一会儿显示成功消息，然后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
      } catch (error) {
    console.error('注册失败:', error)
    
    // 处理API返回的错误信息
    if (error.message) {
      // 这是从API响应拦截器抛出的错误
      errorMessage.value = error.message
    } else if (error.response) {
      const responseData = error.response.data
      switch (error.response.status) {
        case 400:
          if (responseData?.detail?.includes('username') || responseData?.detail?.includes('用户名')) {
            errorMessage.value = '用户名已存在或格式不正确'
          } else if (responseData?.detail?.includes('email') || responseData?.detail?.includes('邮箱')) {
            errorMessage.value = '邮箱已被使用或格式不正确'
          } else {
            errorMessage.value = responseData?.detail || '注册信息格式不正确'
          }
          break
        case 409:
          errorMessage.value = responseData?.detail || '用户名或邮箱已存在'
          break
        case 422:
          errorMessage.value = responseData?.detail || '输入信息不符合要求，请检查用户名、邮箱和密码格式'
          break
        case 500:
          errorMessage.value = responseData?.detail || '服务器错误，请稍后再试'
          break
        default:
          errorMessage.value = responseData?.detail || responseData?.message || '注册失败，请重试'
      }
    } else if (error.request) {
      errorMessage.value = '网络连接失败，请检查网络后重试'
    } else {
      errorMessage.value = '注册出现异常，请重试'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  background: 
    linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)),
    url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80') center/cover no-repeat;
  position: relative;
  overflow: hidden;
  padding: 20px 0;
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
  margin-top: 40px;
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

/* 右侧注册卡片 */
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

.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background: #e1e5e9;
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 3px;
}

.strength-fill.weak {
  background: #ff6b6b;
}

.strength-fill.medium {
  background: #ffa726;
}

.strength-fill.strong {
  background: #4caf50;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
}

.error-text {
  color: #ff6b6b;
  font-size: 12px;
  margin-top: 4px;
}

/* 错误和成功信息样式 */
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

.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
  font-size: 14px;
  margin-bottom: 8px;
}

.success-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.checkbox input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
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
  
  .brand-description h2 {
    font-size: 20px;
  }
  
  .feature-list {
    flex-direction: column;
    gap: 12px;
  }
}
</style>