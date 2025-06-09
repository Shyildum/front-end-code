/**
 * 文章更新 API 测试用例
 * 测试 articleAPI.updateArticle 方法的各种使用场景
 */

import { articleAPI } from '../services/api.js'

// 模拟数据
const mockArticleData = {
  title: "如何使用Spring Boot",
  summary: "本文将介绍如何使用Spring Boot进行开发",
  content: "Spring Boot是一个开源的Java框架...",
  categoryId: 5,
  isShared: true,
  status: "draft"
}

const mockArticleDataLegacyFormat = {
  title: "Vue.js 入门指南",
  summary: "学习Vue.js的基础知识",
  content: "Vue.js是一个渐进式的JavaScript框架...",
  category_id: 3,
  is_shared: false,
  status: "published"
}

/**
 * 测试用例1: 标准格式的文章更新
 */
async function testUpdateArticleStandard() {
  console.log('🧪 测试用例1: 标准格式的文章更新')
  
  try {
    const articleId = 123
    const response = await articleAPI.updateArticle(articleId, mockArticleData)
    
    console.log('✅ 请求成功发送')
    console.log('📤 请求数据:', {
      url: `/articles/${articleId}`,
      method: 'PUT',
      data: mockArticleData
    })
    console.log('📥 响应数据:', response)
    
    return true
  } catch (error) {
    console.log('❌ 测试失败:', error.message)
    if (error.response) {
      console.log('📥 错误响应:', error.response.data)
    }
    return false
  }
}

/**
 * 测试用例2: 传统字段名格式的文章更新
 */
async function testUpdateArticleLegacyFormat() {
  console.log('\n🧪 测试用例2: 传统字段名格式的文章更新')
  
  try {
    const articleId = 456
    const response = await articleAPI.updateArticle(articleId, mockArticleDataLegacyFormat)
    
    console.log('✅ 请求成功发送')
    console.log('📤 请求数据:', {
      url: `/articles/${articleId}`,
      method: 'PUT',
      data: mockArticleDataLegacyFormat
    })
    console.log('📥 响应数据:', response)
    
    return true
  } catch (error) {
    console.log('❌ 测试失败:', error.message)
    if (error.response) {
      console.log('📥 错误响应:', error.response.data)
    }
    return false
  }
}

/**
 * 测试用例3: 缺少文章ID的错误处理
 */
async function testUpdateArticleWithoutId() {
  console.log('\n🧪 测试用例3: 缺少文章ID的错误处理')
  
  try {
    const response = await articleAPI.updateArticle(null, mockArticleData)
    console.log('❌ 应该抛出错误但没有:', response)
    return false
  } catch (error) {
    console.log('✅ 正确抛出错误:', error.message)
    return true
  }
}

/**
 * 测试用例4: 最小数据集的文章更新
 */
async function testUpdateArticleMinimal() {
  console.log('\n🧪 测试用例4: 最小数据集的文章更新')
  
  const minimalData = {
    title: "简单标题",
    content: "简单内容"
  }
  
  try {
    const articleId = 789
    const response = await articleAPI.updateArticle(articleId, minimalData)
    
    console.log('✅ 请求成功发送')
    console.log('📤 请求数据:', {
      url: `/articles/${articleId}`,
      method: 'PUT',
      data: minimalData
    })
    console.log('📥 响应数据:', response)
    
    return true
  } catch (error) {
    console.log('❌ 测试失败:', error.message)
    if (error.response) {
      console.log('📥 错误响应:', error.response.data)
    }
    return false
  }
}

/**
 * 运行所有测试
 */
export async function runUpdateArticleTests() {
  console.log('🚀 开始运行文章更新 API 测试\n')
  
  const tests = [
    testUpdateArticleStandard,
    testUpdateArticleLegacyFormat,
    testUpdateArticleWithoutId,
    testUpdateArticleMinimal
  ]
  
  let passedCount = 0
  let totalCount = tests.length
  
  for (const test of tests) {
    const passed = await test()
    if (passed) passedCount++
    
    // 等待一下避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\n📊 测试结果: ${passedCount}/${totalCount} 通过`)
  
  if (passedCount === totalCount) {
    console.log('🎉 所有测试通过！')
  } else {
    console.log('⚠️ 部分测试失败，请检查实现')
  }
  
  return passedCount === totalCount
}

// 如果直接运行此文件
if (import.meta.url === new URL(import.meta.url).href) {
  runUpdateArticleTests()
}
