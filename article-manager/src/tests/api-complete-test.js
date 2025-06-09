/**
 * 完整的API测试套件
 * 测试所有API方法的兼容性，特别验证分类API的修正
 */

// 导入localStorage模拟器（解决Node.js环境测试问题）
import '../utils/localStorageMock.js'

import {
  // 用户认证相关
  loginByName,
  loginByEmail,
  register,
  logout,
  changePassword,
  getUserInfo,
  updateUserInfo,
  
  // 文章管理相关
  getAllArticles,
  simpleSearch,
  complexSearch,
  getUserArticles,
  getSharedArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  
  // 分类管理相关
  getCategoryTree,
  getCategoryPath,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // 向后兼容方法
  login,
  getCurrentUser,
  updateUserProfile,
  getArticleDetails
} from '../services/api.js'

/**
 * 分类API测试 - 重点测试修正后的方法
 */
class CategoryAPITest {
  static async testCategoryTree() {
    console.log('🔍 测试分类树API...')
    try {
      // 测试修正后的URL: /categories/tree/
      const response = await getCategoryTree()
      console.log('✅ 分类树API测试成功:', response)
      return { success: true, url: '/categories/tree/', response }
    } catch (error) {
      console.error('❌ 分类树API测试失败:', error.message)
      return { success: false, url: '/categories/tree/', error: error.message }
    }
  }

  static async testCategoryPath(categoryId = null) {
    console.log('🔍 测试分类路径API...')
    try {
      // 测试新添加的API: /categories/path/ 或 /categories/path/{id}/
      const response = await getCategoryPath(categoryId)
      const url = categoryId ? `/categories/path/${categoryId}/` : '/categories/path/'
      console.log('✅ 分类路径API测试成功:', response)
      return { success: true, url, response }
    } catch (error) {
      console.error('❌ 分类路径API测试失败:', error.message)
      const url = categoryId ? `/categories/path/${categoryId}/` : '/categories/path/'
      return { success: false, url, error: error.message }
    }
  }

  static async testGetCategories(id = null) {
    console.log('🔍 测试获取分类列表API...')
    try {
      const response = await getCategories(id)
      const url = id ? `/categories/${id}/` : '/categories/'
      console.log('✅ 获取分类列表API测试成功:', response)
      return { success: true, url, response }
    } catch (error) {
      console.error('❌ 获取分类列表API测试失败:', error.message)
      const url = id ? `/categories/${id}/` : '/categories/'
      return { success: false, url, error: error.message }
    }
  }

  static async testCreateCategory() {
    console.log('🔍 测试创建分类API...')
    try {
      const categoryData = {
        name: 'Test Category',
        description: 'Test Description',
        parentId: null,
        color: '#667eea',
        icon: 'folder'
      }
      const response = await createCategory(categoryData)
      console.log('✅ 创建分类API测试成功:', response)
      return { success: true, url: '/categories', response }
    } catch (error) {
      console.error('❌ 创建分类API测试失败:', error.message)
      return { success: false, url: '/categories', error: error.message }
    }
  }

  static async testUpdateCategory(categoryId = 1) {
    console.log('🔍 测试更新分类API...')
    try {
      const categoryData = {
        name: 'Updated Category',
        description: 'Updated Description',
        parentId: null,
        color: '#f093fb',
        icon: 'star'
      }
      const response = await updateCategory(categoryId, categoryData)
      console.log('✅ 更新分类API测试成功:', response)
      return { success: true, url: `/categories/${categoryId}/`, response }
    } catch (error) {
      console.error('❌ 更新分类API测试失败:', error.message)
      return { success: false, url: `/categories/${categoryId}/`, error: error.message }
    }
  }

  static async testDeleteCategory(categoryId = 1) {
    console.log('🔍 测试删除分类API...')
    try {
      const response = await deleteCategory(categoryId)
      console.log('✅ 删除分类API测试成功:', response)
      return { success: true, url: `/categories/${categoryId}/`, response }
    } catch (error) {
      console.error('❌ 删除分类API测试失败:', error.message)
      return { success: false, url: `/categories/${categoryId}/`, error: error.message }
    }
  }

  static async runAllTests() {
    console.log('🚀 开始分类API完整测试...')
    const results = []

    // 测试所有分类API
    results.push(await this.testCategoryTree())
    results.push(await this.testCategoryPath())
    results.push(await this.testCategoryPath(1)) // 测试带ID的路径
    results.push(await this.testGetCategories())
    results.push(await this.testGetCategories(1)) // 测试获取特定分类
    results.push(await this.testCreateCategory())
    results.push(await this.testUpdateCategory())
    results.push(await this.testDeleteCategory())

    return results
  }
}

/**
 * 文章API测试 - 验证已修正的方法
 */
class ArticleAPITest {
  static async testSimpleSearch() {
    console.log('🔍 测试简单搜索API...')
    try {
      const keyword = 'test'
      const response = await simpleSearch(keyword)
      console.log('✅ 简单搜索API测试成功:', response)
      return { success: true, url: `/articles/simple-search/${keyword}/`, response }
    } catch (error) {
      console.error('❌ 简单搜索API测试失败:', error.message)
      return { success: false, url: `/articles/simple-search/test/`, error: error.message }
    }
  }

  static async testCreateArticle() {
    console.log('🔍 测试创建文章API...')
    try {
      const articleData = {
        title: 'Test Article',
        summary: 'Test Summary',
        content: 'Test Content',
        categoryId: 1,
        isShared: false,
        status: 'draft'
      }
      const response = await createArticle(articleData)
      console.log('✅ 创建文章API测试成功:', response)
      return { success: true, url: '/articles', response }
    } catch (error) {
      console.error('❌ 创建文章API测试失败:', error.message)
      return { success: false, url: '/articles', error: error.message }
    }
  }

  static async testUpdateArticle(articleId = 1) {
    console.log('🔍 测试更新文章API...')
    try {
      const articleData = {
        title: 'Updated Article',
        summary: 'Updated Summary',
        content: 'Updated Content',
        categoryId: 2,
        isShared: true,
        status: 'published'
      }
      const response = await updateArticle(articleId, articleData)
      console.log('✅ 更新文章API测试成功:', response)
      return { success: true, url: `/articles/${articleId}`, response }
    } catch (error) {
      console.error('❌ 更新文章API测试失败:', error.message)
      return { success: false, url: `/articles/${articleId}`, error: error.message }
    }
  }

  static async testGetArticle(articleId = 1) {
    console.log('🔍 测试获取文章详情API...')
    try {
      const response = await getArticle(articleId)
      console.log('✅ 获取文章详情API测试成功:', response)
      return { success: true, url: `/articles/${articleId}`, response }
    } catch (error) {
      console.error('❌ 获取文章详情API测试失败:', error.message)
      return { success: false, url: `/articles/${articleId}`, error: error.message }
    }
  }

  static async testGetSharedArticles() {
    console.log('🔍 测试获取共享文章API...')
    try {
      const response = await getSharedArticles(1, 10)
      console.log('✅ 获取共享文章API测试成功:', response)
      return { success: true, url: '/articles/shared/1/10', response }
    } catch (error) {
      console.error('❌ 获取共享文章API测试失败:', error.message)
      return { success: false, url: '/articles/shared/1/10', error: error.message }
    }
  }

  static async runAllTests() {
    console.log('🚀 开始文章API完整测试...')
    const results = []

    results.push(await this.testSimpleSearch())
    results.push(await this.testCreateArticle())
    results.push(await this.testUpdateArticle())
    results.push(await this.testGetArticle())
    results.push(await this.testGetSharedArticles())

    return results
  }
}

/**
 * 用户API测试
 */
class UserAPITest {
  static async testLogin() {
    console.log('🔍 测试用户登录API...')
    try {
      const credentials = {
        username: 'testuser',
        password: 'testpass'
      }
      const response = await loginByName(credentials)
      console.log('✅ 用户登录API测试成功:', response)
      return { success: true, url: '/users/login-by-name', response }
    } catch (error) {
      console.error('❌ 用户登录API测试失败:', error.message)
      return { success: false, url: '/users/login-by-name', error: error.message }
    }
  }

  static async testRegister() {
    console.log('🔍 测试用户注册API...')
    try {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      }
      const response = await register(userData)
      console.log('✅ 用户注册API测试成功:', response)
      return { success: true, url: '/users/register', response }
    } catch (error) {
      console.error('❌ 用户注册API测试失败:', error.message)
      return { success: false, url: '/users/register', error: error.message }
    }
  }

  static async runAllTests() {
    console.log('🚀 开始用户API完整测试...')
    const results = []

    results.push(await this.testLogin())
    results.push(await this.testRegister())

    return results
  }
}

/**
 * 完整测试运行器
 */
export class CompleteAPITest {
  static async runAllTests() {
    console.log('🎯 开始完整API兼容性测试...')
    const startTime = Date.now()

    const allResults = {
      user: await UserAPITest.runAllTests(),
      article: await ArticleAPITest.runAllTests(),
      category: await CategoryAPITest.runAllTests()
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // 统计结果
    const summary = this.generateSummary(allResults, duration)
    this.printSummary(summary)

    return {
      results: allResults,
      summary,
      duration
    }
  }

  static generateSummary(results, duration) {
    let totalTests = 0
    let passedTests = 0
    let failedTests = 0
    const failedDetails = []

    Object.entries(results).forEach(([category, tests]) => {
      tests.forEach(test => {
        totalTests++
        if (test.success) {
          passedTests++
        } else {
          failedTests++
          failedDetails.push({
            category,
            url: test.url,
            error: test.error
          })
        }
      })
    })

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(2),
      duration,
      failedDetails
    }
  }

  static printSummary(summary) {
    console.log('\n📊 API测试结果摘要:')
    console.log('=' .repeat(50))
    console.log(`总测试数: ${summary.totalTests}`)
    console.log(`通过测试: ${summary.passedTests}`)
    console.log(`失败测试: ${summary.failedTests}`)
    console.log(`成功率: ${summary.successRate}%`)
    console.log(`测试耗时: ${summary.duration}ms`)

    if (summary.failedDetails.length > 0) {
      console.log('\n❌ 失败的测试详情:')
      summary.failedDetails.forEach((fail, index) => {
        console.log(`${index + 1}. [${fail.category}] ${fail.url}: ${fail.error}`)
      })
    }

    console.log('\n🎉 API测试完成!')
  }

  // 用于手动测试的简化方法
  static async testCategoryAPIs() {
    console.log('🔧 快速测试分类API修正...')
    return await CategoryAPITest.runAllTests()
  }

  static async testArticleAPIs() {
    console.log('🔧 快速测试文章API修正...')
    return await ArticleAPITest.runAllTests()
  }
}

export default CompleteAPITest

// 使用示例:
// import CompleteAPITest from './api-complete-test.js'
// CompleteAPITest.runAllTests()
// CompleteAPITest.testCategoryAPIs()
