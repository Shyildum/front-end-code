import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:8888/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 定义不需要认证的API路径
    const publicPaths = [
      '/users/register',
      '/users/login-by-name',
      '/users/login-by-email'
    ]
    
    // 检查当前请求是否为公开API
    const isPublicAPI = publicPaths.some(path => config.url.includes(path))
    
    if (!isPublicAPI) {
      // 从 localStorage 获取 token 或 userId
      const token = localStorage.getItem('accessToken')
      const userId = localStorage.getItem('userId')
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      } else if (userId) {
        // 向后兼容，使用 userId header
        // 确保 userId 是安全的ASCII字符串，避免编码问题
        try {
          const safeUserId = String(userId).trim()
          // 检查是否包含非ASCII字符
          if (/^[\x00-\x7F]*$/.test(safeUserId)) {
            config.headers['X-User-Id'] = safeUserId
          } else {
            console.warn('userId 包含非ASCII字符，跳过设置X-User-Id头部:', safeUserId)
          }
        } catch (error) {
          console.warn('设置X-User-Id头部时出错:', error)
        }
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 处理标准响应格式 {code, message, detail, data}
    const responseData = response.data
    
    // 如果是标准格式，返回整个响应以便组件处理code和message
    if (responseData && typeof responseData.code !== 'undefined') {
      return responseData
    }
    
    // 否则返回原始数据（向后兼容）
    return responseData
  },
  (error) => {
    // 处理常见错误
    if (error.response?.status === 401) {
      // 未授权，清除本地存储并跳转到登录页
      localStorage.removeItem('userId')
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 用户管理相关 API
export const userAPI = {
  // 处理登录响应的通用方法
  _handleLoginResponse: (response) => {
    // 后端返回 code: 200 表示成功，不是 code: 0
    if (response.code === 200 && response.data) {
      const { userId, username, email, nickname, avatar, accessToken, refreshToken } = response.data
      
      console.log('🔍 登录响应数据调试:', {
        userId,
        userIdType: typeof userId,
        accessToken: accessToken ? 'exists' : 'missing',
        refreshToken: refreshToken ? 'exists' : 'missing'
      })
      
      // 存储用户信息 - 确保 userId 是安全的字符串
      if (userId !== undefined && userId !== null) {
        const safeUserId = String(userId).trim()
        console.log('💾 存储 userId:', safeUserId)
        localStorage.setItem('userId', safeUserId)
      }
      
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken)
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      
      localStorage.setItem('user', JSON.stringify({
        userId,
        username,
        email,
        nickname,
        avatar
      }))
    }
    return response
  },

  // 用户注册
  register: (userData) => {
    return api.post('/users/register', {
      username: userData.username,
      email: userData.email,
      password: userData.password
    })
  },

  // 用户名登录
  loginByName: (credentials) => {
    const request = api.post('/users/login-by-name', {
      username: credentials.username,
      password: credentials.password
    })
    return request.then(userAPI._handleLoginResponse)
  },
  
  // 邮箱登录
  loginByEmail: (credentials) => {
    const request = api.post('/users/login-by-email', {
      email: credentials.email,
      password: credentials.password
    })
    return request.then(userAPI._handleLoginResponse)
  },
  
  // 用户登出
  logout: () => {
    return api.post('/users/logout')
  },
  
  // 获取用户个人信息
  getUserInfo: (userId) => {
    return api.get(`/users/info/${userId}`)
  },

  // 更新用户个人信息
  updateUserInfo: (userInfo) => {
    // 用户ID必须存在，通过请求头X-User-Id传递
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return Promise.reject(new Error('用户ID不存在，请先登录'))
    }
    
    // 确保 userId 是安全的ASCII字符串
    const safeUserId = String(userId).trim()
    if (!/^[\x00-\x7F]*$/.test(safeUserId)) {
      return Promise.reject(new Error('用户ID包含非法字符'))
    }
    
    return api.put('/users/info', {
      nickname: userInfo.nickname,
      avatar: userInfo.avatar,
      profile: userInfo.profile
    }, {
      headers: {
        'X-User-Id': safeUserId
      }
    })
  }
}

// 向后兼容的认证API
export const authAPI = {
  // 用户名登录
  loginByUsername: (username, password) => {
    return userAPI.loginByName({ username, password })
  },

  // 邮箱登录
  loginByEmail: (email, password) => {
    return userAPI.loginByEmail({ email, password })
  },

  // 注册
  register: (userData) => {
    return userAPI.register(userData)
  },

  // 获取用户信息（需要 userId）
  getUserInfo: () => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      return userAPI.getUserInfo(userId)
    }
    return Promise.reject(new Error('未找到用户ID'))
  },
  
  // 更新用户信息
  updateUserInfo: (userInfo) => {
    return userAPI.updateUserInfo(userInfo)
  },
  
  // 登出
  logout: () => {
    return userAPI.logout()
  }
}

export default api
