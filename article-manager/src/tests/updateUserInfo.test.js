/**
 * 用户信息更新API测试用例
 * 
 * 测试更新用户信息接口的各种场景
 */

import { authAPI } from '../src/services/api'

// 模拟测试数据
const testUserInfo = {
  nickname: "奶龙",
  avatar: "https://example.com/avatar.jpg", 
  profile: "这是我的个人简介"
}

// 测试用例函数
export const testUpdateUserInfo = async () => {
  console.log('=== 用户信息更新API测试 ===')
  
  try {
    // 确保有用户ID（模拟登录状态）
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', '12345')
      console.log('设置测试用户ID: 12345')
    }
    
    console.log('测试数据:', testUserInfo)
    console.log('发送更新用户信息请求...')
    
    const response = await authAPI.updateUserInfo(testUserInfo)
      console.log('API响应:', response)
    
    // 验证响应格式
    if (response && typeof response.code !== 'undefined') {
      // 后端返回 code: 200 表示成功，不是 code: 0
      if (response.code === 200) {
        console.log('✅ 更新成功!')
        console.log('消息:', response.message)
        console.log('详情:', response.detail)
        console.log('数据:', response.data)
      } else {
        console.log('❌ 更新失败!')
        console.log('错误码:', response.code)
        console.log('错误消息:', response.message)
        console.log('错误详情:', response.detail)
      }
    } else {
      console.log('⚠️ 响应格式异常:', response)
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error)
    
    if (error.response) {
      console.log('HTTP状态码:', error.response.status)
      console.log('响应数据:', error.response.data)
    } else if (error.request) {
      console.log('网络错误:', error.request)
    } else {
      console.log('其他错误:', error.message)
    }
  }
}

// 测试无用户ID的情况
export const testUpdateWithoutUserId = async () => {
  console.log('\n=== 测试无用户ID场景 ===')
  
  // 清除用户ID
  localStorage.removeItem('userId')
  
  try {
    await authAPI.updateUserInfo(testUserInfo)
    console.log('❌ 应该抛出错误但没有')
  } catch (error) {
    console.log('✅ 正确捕获错误:', error.message)
  }
}

// 测试空昵称的情况
export const testUpdateWithEmptyNickname = async () => {
  console.log('\n=== 测试空昵称场景 ===')
  
  // 确保有用户ID
  localStorage.setItem('userId', '12345')
  
  const emptyNicknameData = {
    nickname: "",
    avatar: "https://example.com/avatar.jpg",
    profile: "测试简介"
  }
  
  try {
    const response = await authAPI.updateUserInfo(emptyNicknameData)
    console.log('服务器响应:', response)
  } catch (error) {
    console.log('预期的验证错误:', error)
  }
}

// 运行所有测试
export const runAllTests = async () => {
  await testUpdateUserInfo()
  await testUpdateWithoutUserId()
  await testUpdateWithEmptyNickname()
  
  console.log('\n=== 测试完成 ===')
}

// 在浏览器控制台中可以直接调用
if (typeof window !== 'undefined') {
  window.testUpdateUserInfo = testUpdateUserInfo
  window.testUpdateWithoutUserId = testUpdateWithoutUserId
  window.testUpdateWithEmptyNickname = testUpdateWithEmptyNickname
  window.runAllTests = runAllTests
  
  console.log('测试函数已注册到window对象:')
  console.log('- window.testUpdateUserInfo()')
  console.log('- window.testUpdateWithoutUserId()')
  console.log('- window.testUpdateWithEmptyNickname()')
  console.log('- window.runAllTests()')
}
