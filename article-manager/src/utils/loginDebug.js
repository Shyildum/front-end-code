/**
 * 登录跳转调试工具
 * 用于排查登录后不跳转到文章管理页面的问题
 */

import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '@/services/api'

export const useLoginDebug = () => {
  const router = useRouter()
  const debugInfo = reactive({
    loginAttempts: [],
    routerInfo: {},
    storageInfo: {},
    errors: []
  })

  // 添加调试日志
  const addDebugLog = (type, message, data = null) => {
    const timestamp = new Date().toISOString()
    debugInfo.loginAttempts.unshift({
      timestamp,
      type,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    })
  }

  // 调试登录过程
  const debugLogin = async (credentials, loginType = 'username') => {
    addDebugLog('INFO', '开始登录流程', { credentials: { ...credentials, password: '***' }, loginType })

    try {
      // 1. 检查登录前的状态
      checkCurrentState()

      // 2. 执行登录
      let response
      if (loginType === 'username') {
        addDebugLog('INFO', '使用用户名登录')
        response = await authAPI.loginByUsername(credentials.username, credentials.password)
      } else {
        addDebugLog('INFO', '使用邮箱登录')
        response = await authAPI.loginByEmail(credentials.email, credentials.password)
      }

      addDebugLog('SUCCESS', '登录API调用成功', response)

      // 3. 检查登录后的状态
      checkCurrentState()

      // 4. 尝试跳转
      addDebugLog('INFO', '准备跳转到文章管理页面')
      
      // 获取当前路由信息
      const currentRoute = router.currentRoute.value
      addDebugLog('INFO', '当前路由', {
        path: currentRoute.path,
        name: currentRoute.name,
        params: currentRoute.params,
        query: currentRoute.query
      })

      // 执行跳转
      const pushPromise = router.push('/articles')
      addDebugLog('INFO', '路由跳转命令已发送')

      await pushPromise
      
      // 检查跳转后的状态
      setTimeout(() => {
        const newRoute = router.currentRoute.value
        addDebugLog('SUCCESS', '路由跳转完成', {
          path: newRoute.path,
          name: newRoute.name,
          params: newRoute.params,
          query: newRoute.query
        })
      }, 100)

      return { success: true, response }

    } catch (error) {
      addDebugLog('ERROR', '登录失败', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      })
      return { success: false, error }
    }
  }

  // 检查当前状态
  const checkCurrentState = () => {
    // 检查localStorage
    const storage = {
      userId: localStorage.getItem('userId'),
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      user: localStorage.getItem('user')
    }

    debugInfo.storageInfo = storage
    addDebugLog('INFO', 'localStorage状态', storage)

    // 检查路由状态
    const route = router.currentRoute.value
    debugInfo.routerInfo = {
      path: route.path,
      name: route.name,
      params: route.params,
      query: route.query
    }
    addDebugLog('INFO', '当前路由状态', debugInfo.routerInfo)
  }

  // 手动测试路由跳转
  const testRouterNavigation = async () => {
    addDebugLog('INFO', '测试手动路由跳转')
    
    try {
      await router.push('/articles')
      addDebugLog('SUCCESS', '手动路由跳转成功')
    } catch (error) {
      addDebugLog('ERROR', '手动路由跳转失败', error)
    }
  }

  // 检查ArticleManager组件是否可以正常加载
  const testComponentLoad = () => {
    addDebugLog('INFO', '测试组件加载')
    
    // 检查组件是否存在
    try {
      import('@/views/ArticleManager.vue').then(() => {
        addDebugLog('SUCCESS', 'ArticleManager组件加载成功')
      }).catch(error => {
        addDebugLog('ERROR', 'ArticleManager组件加载失败', error)
      })
    } catch (error) {
      addDebugLog('ERROR', '组件导入失败', error)
    }
  }

  // 清除调试日志
  const clearDebugLog = () => {
    debugInfo.loginAttempts = []
    debugInfo.routerInfo = {}
    debugInfo.storageInfo = {}
    debugInfo.errors = []
  }

  // 导出调试信息
  const exportDebugInfo = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      debugInfo: { ...debugInfo },
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `login-debug-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    debugInfo,
    debugLogin,
    testRouterNavigation,
    testComponentLoad,
    checkCurrentState,
    clearDebugLog,
    exportDebugInfo,
    addDebugLog
  }
}

export default useLoginDebug
