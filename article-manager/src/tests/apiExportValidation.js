/**
 * API导出验证脚本
 * 检查所有API方法是否正确导出和可用
 */

import { userAPI, articleAPI, categoryAPI, authAPI } from '../services/api.js'

// 颜色输出辅助函数
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}\n=== ${msg} ===${colors.reset}`)
}

/**
 * 验证API对象的结构和方法
 */
function validateAPIObject(apiName, apiObject, expectedMethods) {
  log.header(`验证 ${apiName}`)
  
  if (!apiObject) {
    log.error(`${apiName} 未正确导出`)
    return false
  }
  
  log.success(`${apiName} 对象已导出`)
  
  let allMethodsValid = true
  const missingMethods = []
  const invalidMethods = []
  
  for (const methodName of expectedMethods) {
    if (!(methodName in apiObject)) {
      missingMethods.push(methodName)
      allMethodsValid = false
    } else if (typeof apiObject[methodName] !== 'function') {
      invalidMethods.push(methodName)
      allMethodsValid = false
    } else {
      log.success(`✓ ${methodName}`)
    }
  }
  
  if (missingMethods.length > 0) {
    log.error(`缺失方法: ${missingMethods.join(', ')}`)
  }
  
  if (invalidMethods.length > 0) {
    log.error(`非函数方法: ${invalidMethods.join(', ')}`)
  }
  
  // 检查额外的方法
  const actualMethods = Object.keys(apiObject).filter(key => typeof apiObject[key] === 'function')
  const extraMethods = actualMethods.filter(method => !expectedMethods.includes(method))
  
  if (extraMethods.length > 0) {
    log.info(`额外方法: ${extraMethods.join(', ')}`)
  }
  
  log.info(`总计: ${actualMethods.length} 个方法`)
  
  return allMethodsValid
}

/**
 * 验证所有API导出
 */
export function validateAllAPIExports() {
  log.header('API 导出验证开始')
  
  let overallValid = true
  
  // 1. 验证 userAPI
  const userAPIMethods = [
    '_handleLoginResponse',
    'register',
    'loginByName',
    'loginByEmail',
    'logout',
    'changePassword',
    'getUserInfo',
    'updateUserInfo'
  ]
  
  if (!validateAPIObject('userAPI', userAPI, userAPIMethods)) {
    overallValid = false
  }
  
  // 2. 验证 articleAPI
  const articleAPIMethods = [
    'getAllArticles',
    'simpleSearch',
    'complexSearch',
    'getUserArticles',
    'getSharedArticles',
    'getArticle',
    'createArticle',
    'updateArticle',
    'deleteArticle',
    'publishArticle',
    'unpublishArticle',
    'shareArticle',
    'unshareArticle',
    'getStatistics',
    'batchDelete',
    'getRecentArticles',
    'exportArticle',
    'getVersionHistory',
    'restoreVersion',
    'getArticles',
    'searchArticles',
    'getMyArticles'
  ]
  
  if (!validateAPIObject('articleAPI', articleAPI, articleAPIMethods)) {
    overallValid = false
  }
  
  // 3. 验证 categoryAPI
  const categoryAPIMethods = [
    'getCategoryTree',
    'getCategories',
    'getCategory',
    'createCategory',
    'updateCategory',
    'deleteCategory',
    'moveCategory',
    'getCategoryArticleCount',
    'getCategoryArticles',
    'batchDelete',
    'getCategoryStatistics',
    'searchCategories',
    'getFavoriteCategories',
    'favoriteCategory',
    'unfavoriteCategory'
  ]
  
  if (!validateAPIObject('categoryAPI', categoryAPI, categoryAPIMethods)) {
    overallValid = false
  }
  
  // 4. 验证 authAPI
  const authAPIMethods = [
    'loginByUsername',
    'loginByEmail',
    'login',
    'register',
    'getUserInfo',
    'updateUserInfo',
    'logout'
  ]
  
  if (!validateAPIObject('authAPI', authAPI, authAPIMethods)) {
    overallValid = false
  }
  
  // 总结
  log.header('验证结果')
  
  if (overallValid) {
    log.success('🎉 所有API都已正确导出！')
  } else {
    log.error('❌ 存在API导出问题')
  }
  
  return overallValid
}

/**
 * 生成API使用示例
 */
export function generateAPIUsageExamples() {
  log.header('API 使用示例')
  
  console.log(`
${colors.bold}1. 用户相关 API${colors.reset}
${colors.green}// 用户注册${colors.reset}
await userAPI.register({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
})

${colors.green}// 用户登录${colors.reset}
await userAPI.loginByName({
  username: 'testuser',
  password: 'password123'
})

${colors.green}// 更新用户信息${colors.reset}
await userAPI.updateUserInfo({
  nickname: '新昵称',
  avatar: 'https://example.com/avatar.jpg',
  profile: '个人简介'
})

${colors.bold}2. 文章相关 API${colors.reset}
${colors.green}// 获取所有文章${colors.reset}
await articleAPI.getAllArticles(1, 10)

${colors.green}// 搜索文章${colors.reset}
await articleAPI.simpleSearch('Vue.js', 1, 10)

${colors.green}// 创建文章${colors.reset}
await articleAPI.createArticle({
  title: '标题',
  summary: '摘要',
  content: '内容',
  categoryId: 1,
  isShared: true
})

${colors.green}// 获取文章详情${colors.reset}
await articleAPI.getArticle(123)

${colors.green}// 获取共享文章${colors.reset}
await articleAPI.getSharedArticles(1, 10)

${colors.bold}3. 分类相关 API${colors.reset}
${colors.green}// 获取分类列表${colors.reset}
await categoryAPI.getCategories()

${colors.green}// 创建分类${colors.reset}
await categoryAPI.createCategory({
  name: '技术',
  description: '技术相关文章',
  color: '#667eea'
})

${colors.bold}4. 认证相关 API (向后兼容)${colors.reset}
${colors.green}// 登录${colors.reset}
await authAPI.login({
  username: 'testuser',
  password: 'password123'
})

${colors.green}// 获取用户信息${colors.reset}
await authAPI.getUserInfo()
`)
}

/**
 * 主验证函数
 */
async function main() {
  try {
    log.header('开始 API 导出验证')
    
    // 验证所有API导出
    const isValid = validateAllAPIExports()
    
    if (isValid) {
      // 生成使用示例
      generateAPIUsageExamples()
    }
    
    return isValid
  } catch (error) {
    log.error(`验证过程中出错: ${error.message}`)
    return false
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(result => {
    process.exit(result ? 0 : 1)
  })
}

export default main
