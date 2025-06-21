import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api/v1',
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
    
    if (!isPublicAPI) {      // 从 localStorage 获取 token 或 userId
      const token = localStorage.getItem('accessToken')
      const userId = localStorage.getItem('userId')
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`      } else if (userId) {
        // 向后兼容，使用 userId header
        // 确保 userId 是纯ASCII字符，避免编码问题
        try {
          const cleanUserId = String(userId).trim()
          // 检查是否包含非ASCII字符
          if (/^[\x00-\x7F]*$/.test(cleanUserId) && cleanUserId.length > 0) {
            config.headers['X-User-Id'] = cleanUserId
            console.log('✅ 设置 X-User-Id 头部:', cleanUserId)
          } else {
            console.warn('⚠️ userId 包含非ASCII字符或为空，跳过设置头部:', userId)
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
export const userAPI = {  // 处理登录响应的通用方法
  _handleLoginResponse: (response) => {
    // 后端返回 code: 200 表示成功，不是 code: 0    if (response.code === 200 && response.data) {
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
      }      if (refreshToken) {
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
  
  // 修改密码
  changePassword: (passwordData) => {
    return api.put('/users/password', {
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword
    })
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
    
    return api.put('/users/info', {
      nickname: userInfo.nickname,
      avatar: userInfo.avatar,
      profile: userInfo.profile
    }, {
      headers: {
        'X-User-Id': userId
      }
    })
  }
}

// 文章管理相关 API
export const articleAPI = {
  // 分页获取文章列表
  getAllArticles: (pageNum = 1, pageSize = 10, categoryId = null) => {
    const url = `/articles/all/${pageNum}/${pageSize}`
    const params = {}
    if (categoryId) {
      params.categoryId = categoryId
    }
    return api.get(url, { params })
  },  // 简单搜索文章
  simpleSearch: (keyword, pageNum = 1, pageSize = 10) => {
    // 根据您的API设计：/articles/simple-search/{keyword}/
    // 关键词作为路径参数
    if (!keyword || !keyword.trim()) {
      return Promise.reject(new Error('搜索关键词不能为空'))
    }
    
    const encodedKeyword = encodeURIComponent(keyword.trim())
    const params = {}
    
    // 如果需要分页，添加到查询参数中
    if (pageNum && pageNum > 1) {
      params.page = pageNum
    }
    if (pageSize && pageSize !== 10) {
      params.size = pageSize
    }

    return api.get(`/articles/simple-search/${encodedKeyword}/`, { params })
  },

  // 复杂搜索文章
  complexSearch: (searchParams, pageNum = 1, pageSize = 10) => {
    return api.post(`/articles/search/complex/${pageNum}/${pageSize}`, searchParams)
  },

  // 获取用户文章列表
  getUserArticles: (pageNum = 1, pageSize = 10) => {
    return api.get(`/articles/user/${pageNum}/${pageSize}`)
  },

  // 获取共享文章列表
  getSharedArticles: (pageNum = 1, pageSize = 10) => {
    return api.get(`/articles/shared/${pageNum}/${pageSize}`)
  },
  // 获取单篇文章详情
  getArticle: (id) => {
    if (!id) {
      return Promise.reject(new Error('文章ID不能为空'))
    }
    return api.get(`/articles/${id}`)
  },
  // 创建新文章
  createArticle: (articleData) => {
    // 构建请求数据，支持多种字段名格式
    const requestData = {
      title: articleData.title,
      summary: articleData.summary,
      content: articleData.content,
      categoryId: articleData.categoryId || articleData.category_id,
      isShared: articleData.isShared !== undefined ? articleData.isShared : (articleData.is_shared || false)
    }

    // 如果有状态字段，添加到请求中
    if (articleData.status !== undefined) {
      requestData.status = articleData.status
    }

    return api.post('/articles', requestData)
  },
  // 更新文章
  updateArticle: (id, articleData) => {
    // 确保有文章ID
    if (!id) {
      return Promise.reject(new Error('文章ID不能为空'))
    }

    // 构建请求数据，支持多种字段名格式
    const requestData = {
      title: articleData.title,
      summary: articleData.summary,
      content: articleData.content,
      categoryId: articleData.categoryId || articleData.category_id,
      isShared: articleData.isShared !== undefined ? articleData.isShared : (articleData.is_shared || false)
    }

    // 如果有状态字段，添加到请求中
    if (articleData.status !== undefined) {
      requestData.status = articleData.status
    }

    return api.put(`/articles/${id}`, requestData)
  },

  // 删除文章
  deleteArticle: (id) => {
    return api.delete(`/articles/${id}`)
  },

  // 发布文章
  publishArticle: (id) => {
    return api.patch(`/articles/${id}/publish`)
  },

  // 取消发布文章
  unpublishArticle: (id) => {
    return api.patch(`/articles/${id}/unpublish`)
  },

  // 分享文章
  shareArticle: (id) => {
    return api.patch(`/articles/${id}/share`)
  },

  // 取消分享文章
  unshareArticle: (id) => {
    return api.patch(`/articles/${id}/unshare`)
  },

  // 获取文章统计信息
  getStatistics: () => {
    return api.get('/articles/statistics')
  },

  // 批量删除文章
  batchDelete: (articleIds) => {
    return api.delete('/articles/batch', {
      data: { ids: articleIds }
    })
  },

  // 获取最近文章
  getRecentArticles: (limit = 10) => {
    return api.get(`/articles/recent/${limit}`)
  },

  // 导出文章
  exportArticle: (id, format = 'markdown') => {
    return api.get(`/articles/${id}/export`, {
      params: { format },
      responseType: 'blob'
    })
  },

  // 获取文章版本历史
  getVersionHistory: (id) => {
    return api.get(`/articles/${id}/versions`)
  },

  // 恢复文章版本
  restoreVersion: (id, versionId) => {
    return api.post(`/articles/${id}/versions/${versionId}/restore`)
  },

  // 向后兼容的方法
  getArticles: (params = {}) => {
    const { page = 1, pageSize = 10, categoryId } = params
    return articleAPI.getAllArticles(page, pageSize, categoryId)
  },

  // 搜索文章的简化接口
  searchArticles: (keyword, options = {}) => {
    const { page = 1, pageSize = 10 } = options
    if (!keyword) {
      return articleAPI.getAllArticles(page, pageSize)
    }
    return articleAPI.simpleSearch(keyword, page, pageSize)
  },

  // 获取用户的文章列表（简化版）
  getMyArticles: (options = {}) => {
    const { page = 1, pageSize = 10 } = options
    return articleAPI.getUserArticles(page, pageSize)
  }
}

// 分类管理相关 API
export const categoryAPI = {
  // 获取分类树
  getCategoryTree: () => {
    // 根据后端规范：GET /categories/tree/ (需要尾部斜杠)
    return api.get('/categories/tree/')
  },

  // 获取分类到根节点的路径
  getCategoryPath: (categoryId = null) => {
    // 根据后端规范：GET /categories/path/{id}/ 或 GET /categories/path/
    if (categoryId) {
      return api.get(`/categories/path/${categoryId}/`)
    }
    return api.get('/categories/path/')
  },

  // 获取扁平分类列表
  getCategories: (id = null) => {
    // 根据后端规范：GET /categories/{id}/ 或 GET /categories/
    if (id) {
      return api.get(`/categories/${id}/`)
    }
    return api.get('/categories/')
  },

  // 获取分类详情
  getCategory: (id) => {
    return api.get(`/categories/${id}/`)
  },

  // 创建分类
  createCategory: (categoryData) => {
    // 根据后端规范：POST /categories (不带斜杠)
    return api.post('/categories', {
      name: categoryData.name,
      description: categoryData.description || '',
      parentId: categoryData.parentId || null,
      parent_id: categoryData.parentId || null, // 支持两种格式
      color: categoryData.color || '#667eea',
      icon: categoryData.icon || 'folder'
    })
  },

  // 更新分类
  updateCategory: (id, categoryData) => {
    // 根据后端规范：PUT /categories/{id}/
    return api.put(`/categories/${id}/`, {
      name: categoryData.name,
      description: categoryData.description || '',
      parentId: categoryData.parentId || null,
      parent_id: categoryData.parentId || null, // 支持两种格式
      color: categoryData.color || '#667eea',
      icon: categoryData.icon || 'folder'
    })
  },

  // 删除分类
  deleteCategory: (id) => {
    // 根据后端规范：DELETE /categories/{id}/
    return api.delete(`/categories/${id}/`)
  },

  // 移动分类
  moveCategory: (id, targetParentId) => {
    return api.patch(`/categories/${id}/move`, {
      parentId: targetParentId
    })
  },

  // 获取分类下的文章数量
  getCategoryArticleCount: (id) => {
    return api.get(`/categories/${id}/count`)
  },

  // 获取分类下的文章列表
  getCategoryArticles: (id, pageNum = 1, pageSize = 10) => {
    return api.get(`/categories/${id}/articles/${pageNum}/${pageSize}`)
  },

  // 批量删除分类
  batchDelete: (categoryIds) => {
    return api.delete('/categories/batch', {
      data: { ids: categoryIds }
    })
  },

  // 获取分类使用统计
  getCategoryStatistics: () => {
    return api.get('/categories/statistics')
  },

  // 搜索分类
  searchCategories: (keyword) => {
    return api.get('/categories/search', {
      params: { keyword }
    })
  },

  // 获取用户收藏的分类
  getFavoriteCategories: () => {
    return api.get('/categories/favorites')
  },

  // 收藏分类
  favoriteCategory: (id) => {
    return api.post(`/categories/${id}/favorite`)
  },

  // 取消收藏分类
  unfavoriteCategory: (id) => {
    return api.delete(`/categories/${id}/favorite`)
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

  // 使用用户名登录（映射到 userAPI.loginByName）
  login: (credentials) => {
    if (credentials.email) {
      return userAPI.loginByEmail(credentials)
    } else {
      return userAPI.loginByName(credentials)
    }
  },
  
  // 注册（映射到 userAPI.register）
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

// 所有 API 方法的统一导出
export const {
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
  unpublishArticle,
  shareArticle,
  unshareArticle,
  getStatistics,
  batchDelete,
  getRecentArticles,
  exportArticle,
  getVersionHistory,
  restoreVersion,
  getArticles,
  searchArticles,
  getMyArticles,
  
  // 分类管理相关
  getCategoryTree,
  getCategoryPath,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  moveCategory,
  getCategoryArticleCount,
  getCategoryArticles,
  searchCategories,
  getFavoriteCategories,
  favoriteCategory,
  unfavoriteCategory
} = {
  ...userAPI,
  ...articleAPI,
  ...categoryAPI
}

// 向后兼容的简化导出
export const {
  login,
  getCurrentUser,
  updateUserProfile,
  getArticleDetails,
  getMyDrafts,
  getMyPublishedArticles,
  refreshToken
} = {
  login: authAPI.login,
  getCurrentUser: authAPI.getUserInfo,
  updateUserProfile: authAPI.updateUserInfo,
  getArticleDetails: articleAPI.getArticle,
  getMyDrafts: articleAPI.getMyArticles,
  getMyPublishedArticles: articleAPI.getMyArticles,
  refreshToken: () => Promise.resolve() // 占位符，需要实际实现
}

export default api