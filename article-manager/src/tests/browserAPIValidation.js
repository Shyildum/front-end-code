/**
 * 浏览器环境下的API导出验证
 * 可以在控制台中直接运行
 */

// 导入localStorage模拟器（解决测试环境问题）
import '../utils/localStorageMock.js'

// 导入API
import { userAPI, articleAPI, categoryAPI, authAPI } from '../services/api.js'

/**
 * 验证API导出的简化版本
 */
window.validateAPIExports = function() {
  console.log('🔍 开始验证API导出...\n')
  
  const results = {
    userAPI: {
      exported: !!userAPI,
      methods: [],
      missing: []
    },
    articleAPI: {
      exported: !!articleAPI,
      methods: [],
      missing: []
    },
    categoryAPI: {
      exported: !!categoryAPI,
      methods: [],
      missing: []
    },
    authAPI: {
      exported: !!authAPI,
      methods: [],
      missing: []
    }
  }
  
  // 验证 userAPI
  const expectedUserMethods = [
    'register', 'loginByName', 'loginByEmail', 'logout', 
    'changePassword', 'getUserInfo', 'updateUserInfo'
  ]
  
  if (userAPI) {
    expectedUserMethods.forEach(method => {
      if (typeof userAPI[method] === 'function') {
        results.userAPI.methods.push(method)
      } else {
        results.userAPI.missing.push(method)
      }
    })
  }
  
  // 验证 articleAPI
  const expectedArticleMethods = [
    'getAllArticles', 'simpleSearch', 'complexSearch', 'getUserArticles',
    'getSharedArticles', 'getArticle', 'createArticle', 'updateArticle',
    'deleteArticle', 'publishArticle', 'unpublishArticle', 'shareArticle',
    'unshareArticle', 'getStatistics', 'batchDelete', 'getRecentArticles',
    'exportArticle', 'getVersionHistory', 'restoreVersion', 'getArticles',
    'searchArticles', 'getMyArticles'
  ]
  
  if (articleAPI) {
    expectedArticleMethods.forEach(method => {
      if (typeof articleAPI[method] === 'function') {
        results.articleAPI.methods.push(method)
      } else {
        results.articleAPI.missing.push(method)
      }
    })
  }
  
  // 验证 categoryAPI
  const expectedCategoryMethods = [
    'getCategoryTree', 'getCategories', 'getCategory', 'createCategory',
    'updateCategory', 'deleteCategory', 'moveCategory', 'getCategoryArticleCount',
    'getCategoryArticles', 'batchDelete', 'getCategoryStatistics', 'searchCategories',
    'getFavoriteCategories', 'favoriteCategory', 'unfavoriteCategory'
  ]
  
  if (categoryAPI) {
    expectedCategoryMethods.forEach(method => {
      if (typeof categoryAPI[method] === 'function') {
        results.categoryAPI.methods.push(method)
      } else {
        results.categoryAPI.missing.push(method)
      }
    })
  }
  
  // 验证 authAPI
  const expectedAuthMethods = [
    'loginByUsername', 'loginByEmail', 'login', 'register',
    'getUserInfo', 'updateUserInfo', 'logout'
  ]
  
  if (authAPI) {
    expectedAuthMethods.forEach(method => {
      if (typeof authAPI[method] === 'function') {
        results.authAPI.methods.push(method)
      } else {
        results.authAPI.missing.push(method)
      }
    })
  }
  
  // 输出结果
  console.log('📊 验证结果:\n')
  
  Object.keys(results).forEach(apiName => {
    const api = results[apiName]
    const status = api.exported ? '✅' : '❌'
    const methodCount = api.methods.length
    const missingCount = api.missing.length
    
    console.log(`${status} ${apiName}:`)
    console.log(`   导出状态: ${api.exported ? '已导出' : '未导出'}`)
    console.log(`   可用方法: ${methodCount} 个`)
    console.log(`   缺失方法: ${missingCount} 个`)
    
    if (missingCount > 0) {
      console.log(`   缺失的方法: ${api.missing.join(', ')}`)
    }
    console.log('')
  })
  
  // 总结
  const totalAPIs = Object.keys(results).length
  const exportedAPIs = Object.values(results).filter(api => api.exported).length
  const totalMethods = Object.values(results).reduce((sum, api) => sum + api.methods.length, 0)
  const totalMissing = Object.values(results).reduce((sum, api) => sum + api.missing.length, 0)
  
  console.log('📈 总结:')
  console.log(`   API对象: ${exportedAPIs}/${totalAPIs} 已导出`)
  console.log(`   API方法: ${totalMethods} 个可用`)
  console.log(`   缺失方法: ${totalMissing} 个`)
  
  if (totalMissing === 0 && exportedAPIs === totalAPIs) {
    console.log('\n🎉 所有API都已正确导出！')
  } else {
    console.log('\n⚠️ 存在缺失的API或方法')
  }
  
  return results
}

/**
 * 显示API使用示例
 */
window.showAPIExamples = function() {
  console.log(`
🔧 API使用示例:

1️⃣ 用户API (userAPI):
   await userAPI.register({ username: 'test', email: 'test@example.com', password: '123456' })
   await userAPI.loginByName({ username: 'test', password: '123456' })
   await userAPI.updateUserInfo({ nickname: '昵称', avatar: 'url', profile: '简介' })

2️⃣ 文章API (articleAPI):
   await articleAPI.getAllArticles(1, 10)
   await articleAPI.simpleSearch('关键词', 1, 10)
   await articleAPI.createArticle({ title: '标题', summary: '摘要', content: '内容' })
   await articleAPI.getArticle(123)
   await articleAPI.getSharedArticles(1, 10)

3️⃣ 分类API (categoryAPI):
   await categoryAPI.getCategories()
   await categoryAPI.createCategory({ name: '分类名', description: '描述' })

4️⃣ 认证API (authAPI) - 向后兼容:
   await authAPI.login({ username: 'test', password: '123456' })
   await authAPI.getUserInfo()

💡 在控制台运行: validateAPIExports() 来验证所有API导出
`)
}

console.log('✅ API验证工具已加载')
console.log('🔍 运行 validateAPIExports() 来验证API导出')
console.log('📖 运行 showAPIExamples() 来查看使用示例')
