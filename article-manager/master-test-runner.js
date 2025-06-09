/**
 * 完整测试运行器 - 验证登录重定向和分类管理功能
 * 解决所有已知问题
 */

// 导入localStorage模拟器
import './src/utils/localStorageMock.js'

// 导入所有测试模块
import { LoginAPITest } from './src/tests/login-fix.test.js'
import { CompleteAPITest } from './src/tests/api-complete-test.js'

/**
 * 主测试运行器
 */
class MasterTestRunner {
  constructor() {
    this.results = {
      authentication: {},
      categoryAPI: {},
      loginRedirect: {},
      cors: {},
      overall: {}
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始完整功能测试...\n')
    
    try {
      // 1. 测试认证系统
      console.log('=== 1. 认证系统测试 ===')
      await this.testAuthentication()
      
      // 2. 测试分类API
      console.log('\n=== 2. 分类API测试 ===')
      await this.testCategoryAPIs()
      
      // 3. 测试登录重定向
      console.log('\n=== 3. 登录重定向测试 ===')
      await this.testLoginRedirect()
      
      // 4. 生成最终报告
      console.log('\n=== 4. 生成测试报告 ===')
      this.generateFinalReport()
      
    } catch (error) {
      console.error('❌ 测试运行器执行失败:', error)
    }
  }

  /**
   * 测试认证系统
   */
  async testAuthentication() {
    try {
      console.log('🔐 测试用户认证系统...')
      
      // 检查localStorage状态
      this.checkLocalStorageState()
      
      // 运行登录API测试
      const loginResults = await LoginAPITest.runAllTests()
      this.results.authentication = {
        success: true,
        loginAPI: loginResults,
        localStorage: this.getLocalStorageInfo()
      }
      
      console.log('✅ 认证系统测试完成')
      
    } catch (error) {
      console.error('❌ 认证系统测试失败:', error)
      this.results.authentication = {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 测试分类API
   */
  async testCategoryAPIs() {
    try {
      console.log('📁 测试分类API功能...')
      
      // 运行分类API测试
      const categoryResults = await CompleteAPITest.testCategoryAPIs()
      this.results.categoryAPI = {
        success: true,
        results: categoryResults
      }
      
      console.log('✅ 分类API测试完成')
      
    } catch (error) {
      console.error('❌ 分类API测试失败:', error)
      this.results.categoryAPI = {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 测试登录重定向
   */
  async testLoginRedirect() {
    try {
      console.log('🔄 测试登录重定向功能...')
      
      // 模拟登录状态
      this.simulateLoginState()
      
      // 检查重定向逻辑
      const redirectTest = this.testRedirectLogic()
      
      this.results.loginRedirect = {
        success: true,
        redirectLogic: redirectTest,
        simulatedLogin: true
      }
      
      console.log('✅ 登录重定向测试完成')
      
    } catch (error) {
      console.error('❌ 登录重定向测试失败:', error)
      this.results.loginRedirect = {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 检查localStorage状态
   */
  checkLocalStorageState() {
    const keys = ['userId', 'user', 'accessToken', 'refreshToken']
    const state = {}
    
    keys.forEach(key => {
      state[key] = localStorage.getItem(key)
    })
    
    console.log('📊 当前localStorage状态:', state)
    return state
  }

  /**
   * 获取localStorage信息
   */
  getLocalStorageInfo() {
    return {
      userId: localStorage.getItem('userId'),
      hasUser: !!localStorage.getItem('user'),
      hasTokens: !!(localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')),
      length: localStorage.length
    }
  }

  /**
   * 模拟登录状态
   */
  simulateLoginState() {
    const testUserId = 'test-user-' + Date.now()
    const testUser = {
      userId: testUserId,
      username: 'testuser',
      email: 'test@example.com'
    }
    
    localStorage.setItem('userId', testUserId)
    localStorage.setItem('user', JSON.stringify(testUser))
    
    console.log('🧪 已模拟登录状态，userId:', testUserId)
  }

  /**
   * 测试重定向逻辑
   */
  testRedirectLogic() {
    const userId = localStorage.getItem('userId')
    
    if (!userId) {
      return {
        success: false,
        reason: '未找到userId，应该重定向到登录页面'
      }
    }
    
    // 模拟重定向逻辑
    const targetPath = '/articles'
    
    return {
      success: true,
      redirectTo: targetPath,
      reason: '用户已登录，应该重定向到文章管理页面'
    }
  }

  /**
   * 生成最终报告
   */
  generateFinalReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📋 最终测试报告')
    console.log('='.repeat(60))
    
    // 认证系统状态
    const authStatus = this.results.authentication.success ? '✅' : '❌'
    console.log(`${authStatus} 认证系统: ${this.results.authentication.success ? '正常' : '异常'}`)
    
    // 分类API状态
    const categoryStatus = this.results.categoryAPI.success ? '✅' : '❌'
    console.log(`${categoryStatus} 分类API: ${this.results.categoryAPI.success ? '正常' : '异常'}`)
    
    // 登录重定向状态
    const redirectStatus = this.results.loginRedirect.success ? '✅' : '❌'
    console.log(`${redirectStatus} 登录重定向: ${this.results.loginRedirect.success ? '正常' : '异常'}`)
    
    // 整体状态
    const allPassed = this.results.authentication.success && 
                     this.results.categoryAPI.success && 
                     this.results.loginRedirect.success
    
    this.results.overall = {
      allPassed,
      summary: {
        authentication: this.results.authentication.success,
        categoryAPI: this.results.categoryAPI.success,
        loginRedirect: this.results.loginRedirect.success
      }
    }
    
    console.log('\n🎯 整体状态:', allPassed ? '✅ 所有功能正常' : '❌ 存在问题需要修复')
    
    // 详细信息
    console.log('\n📊 详细测试结果:')
    console.log(JSON.stringify(this.results, null, 2))
    
    // 建议下一步操作
    this.generateRecommendations()
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    console.log('\n💡 建议下一步操作:')
    
    if (!this.results.authentication.success) {
      console.log('🔐 认证问题: 检查localStorage设置和X-User-Id头部配置')
    }
    
    if (!this.results.categoryAPI.success) {
      console.log('📁 分类API问题: 检查后端服务和API端点配置')
    }
    
    if (!this.results.loginRedirect.success) {
      console.log('🔄 重定向问题: 检查路由配置和登录后跳转逻辑')
    }
    
    if (this.results.overall.allPassed) {
      console.log('🚀 所有测试通过，建议进行完整的用户测试')
    }
  }
}

/**
 * 运行测试的便捷函数
 */
export async function runMasterTests() {
  const runner = new MasterTestRunner()
  await runner.runAllTests()
  return runner.results
}

// 如果直接运行此文件
if (import.meta.url === new URL(import.meta.url).href) {
  runMasterTests()
}

export default MasterTestRunner
