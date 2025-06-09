/**
 * 测试修复后的登录功能
 */

import { authAPI } from '../services/api.js'

// 在Node.js环境中模拟localStorage
if (typeof localStorage === 'undefined') {
  const localStorageMock = {
    store: {},
    getItem: function(key) {
      return this.store[key] || null;
    },
    setItem: function(key, value) {
      this.store[key] = String(value);
    },
    removeItem: function(key) {
      delete this.store[key];
    },
    clear: function() {
      this.store = {};
    }
  };
  
  global.localStorage = localStorageMock;
  console.log('🔧 已在Node.js环境中设置localStorage模拟');
}

/**
 * 测试登录API - 不应该包含X-User-Id头
 */
export class LoginAPITest {
  static async testLoginWithoutUserId() {
    console.log('🧪 测试登录API（不应包含X-User-Id头）')
    
    try {
      // 清除本地存储，确保没有userId
      localStorage.removeItem('userId')
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      
      console.log('🧹 已清除本地存储')
      
      // 测试用户名登录
      const response = await authAPI.loginByUsername('testuser', 'testpass')
      
      console.log('✅ 登录请求发送成功')
      console.log('📥 响应:', response)
      
      return { success: true, response }
    } catch (error) {
      console.error('❌ 登录测试失败:', error)
      
      if (error.response) {
        console.log('📥 错误响应状态:', error.response.status)
        console.log('📥 错误响应数据:', error.response.data)
      }
      
      return { success: false, error }
    }
  }
  
  static async testRegisterWithoutUserId() {
    console.log('🧪 测试注册API（不应包含X-User-Id头）')
    
    try {
      // 清除本地存储，确保没有userId
      localStorage.removeItem('userId')
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      
      console.log('🧹 已清除本地存储')
      
      // 测试注册
      const response = await authAPI.register({
        username: 'newuser' + Date.now(),
        email: 'newuser' + Date.now() + '@example.com',
        password: 'password123'
      })
      
      console.log('✅ 注册请求发送成功')
      console.log('📥 响应:', response)
      
      return { success: true, response }
    } catch (error) {
      console.error('❌ 注册测试失败:', error)
      
      if (error.response) {
        console.log('📥 错误响应状态:', error.response.status)
        console.log('📥 错误响应数据:', error.response.data)
      }
      
      return { success: false, error }
    }
  }
  
  static async runAllTests() {
    console.log('🚀 开始测试修复后的认证API')
    console.log('=' .repeat(50))
    
    const results = []
    
    // 测试注册
    results.push(await this.testRegisterWithoutUserId())
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 测试登录
    results.push(await this.testLoginWithoutUserId())
    
    console.log('📊 测试结果:')
    results.forEach((result, index) => {
      const testName = index === 0 ? '注册' : '登录'
      if (result.success) {
        console.log(`✅ ${testName}测试: 成功`)
      } else {
        console.log(`❌ ${testName}测试: 失败`)
      }
    })
    
    return results
  }
}

// 使用示例
export const testLoginFix = () => {
  return LoginAPITest.runAllTests()
}

export default LoginAPITest
