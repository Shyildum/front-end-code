import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api/v1', // 使用相对路径，通过Vite代理转发到后端
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 确保包含认证信息
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取userId（新的认证方式）
    const userId = localStorage.getItem('userId')
    if (userId) {
      config.headers['X-User-Id'] = userId
    }
    
    console.log('📤 API请求详情:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      fullUrl: `${config.baseURL}${config.url}`,
      params: config.params,
      hasAuth: !!config.headers['X-User-Id'],
      userId: userId ? `${userId}` : 'none'
    })
    
    return config
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证失败
api.interceptors.response.use(
  (response) => {
    console.log('📥 API响应成功:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      dataType: typeof response.data,
      hasData: !!response.data,
      dataSize: response.data ? JSON.stringify(response.data).length : 0
    })
    return response
  },
  (error) => {
    console.error('❌ API响应错误详情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      headers: error.response?.headers
    })
      // 处理认证失败
    if (error.response?.status === 401) {
      console.warn('🔐 认证失败，清除用户信息')
      localStorage.removeItem('userId')
      localStorage.removeItem('user')
      // 注意：不要在这里直接跳转，让组件处理
    }
    
    return Promise.reject(error)
  }
)


// 用户管理相关 API
export const userAPI = {  // 处理登录响应的通用方法
  _handleLoginResponse: (response) => {
    // HTTP状态码200表示成功，响应体格式：{code: 200, message, detail, data}
    if (response && response.code === 200 && response.data) {
      const { userId, username, email, nickname, avatar } = response.data
      
      console.log('🔍 登录响应数据调试:', {
        userId,
        userIdType: typeof userId,
        authMethod: 'X-User-Id header only'
      })
      
      // 存储用户信息 - 确保 userId 是安全的字符串
      if (userId !== undefined && userId !== null) {
        const safeUserId = String(userId).trim()
        console.log('💾 存储 userId:', safeUserId)
        localStorage.setItem('userId', safeUserId)
      }
      
      // 存储用户基本信息（不包含 accessToken 和 refreshToken）
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
  // 获取用户个人信息 - 需要在URL路径中传递userId
  getUserInfo: (userId) => {
    // 如果没有传递userId参数，从localStorage获取
    if (!userId) {
      userId = localStorage.getItem('userId')
    }
    
    if (!userId) {
      return Promise.reject(new Error('用户ID不存在，请先登录'))
    }
    
    // 根据APIfox示例：GET /users/info/{userId}
    return api.get(`/users/info/${userId}`)
  },
  // 更新用户个人信息
  updateUserInfo: (userInfo) => {
    // 用户ID会通过请求拦截器自动添加到头部
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return Promise.reject(new Error('用户ID不存在，请先登录'))
    }
    
    // 不再手动设置 X-User-Id 头部，让拦截器处理
    return api.put('/users/info', {
      nickname: userInfo.nickname,
      avatar: userInfo.avatar,
      profile: userInfo.profile
    })
  }
}

// 文章管理相关 API
export const articleAPI = {  // 分页获取用户所有文章 - 使用你实现的API
  getAllArticles: (pageNum = 1, pageSize = 10, categoryId = null) => {
    const userId = localStorage.getItem('userId')
    console.log(`📡 调用获取用户文章API: /articles/all/${pageNum}/${pageSize}`, {
      pageNum,
      pageSize,
      categoryId,
      userId: userId,
      hasUserId: !!userId
    })
    
    if (!userId) {
      return Promise.reject(new Error('用户ID不存在，请先登录'))
    }
    
    const url = `/articles/all/${pageNum}/${pageSize}`
    const params = {}
    if (categoryId) {
      params.categoryId = categoryId
    }
    
    console.log('📤 发送请求:', { url, params, headers: { 'X-User-Id': userId } })
    
    return api.get(url, { params }).then(response => {
      console.log('📥 getAllArticles API原始响应:', response)
      
      // 处理标准的后端响应格式 {code: 200, message: string, detail: string, data: {...}}
      if (response && response.code >= 200 && response.code < 300 && response.data) {
        console.log('✅ 检测到标准响应格式，code:', response.code, '数据类型:', typeof response.data)
        return response.data
      }
      // 处理axios已解包的响应格式
      else if (response && response.data && response.data.code >= 200 && response.data.code < 300 && response.data.data) {
        console.log('✅ 检测到axios解包的标准响应格式，code:', response.data.code, '数据类型:', typeof response.data.data)
        return response.data.data
      }
      // 处理直接返回数据的情况（向后兼容）
      else if (response && response.data && (response.data.list || Array.isArray(response.data))) {
        console.log('✅ 检测到直接数据格式，类型:', typeof response.data)
        return response.data
      }
      else {
        console.warn('⚠️ 未知的文章API响应格式:', {
          responseType: typeof response,
          hasCode: response?.code !== undefined,
          code: response?.code,
          hasData: !!response?.data,
          dataType: typeof response?.data,
          fullResponse: response
        })
        return response
      }
    }).catch(error => {
      console.error('❌ getAllArticles API调用失败:', {
        url,
        params,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      })
      throw error
    })
  },

  // 加载文章内容的辅助方法
  loadArticleContent: async (article) => {
    if (!article.contentUrl) {
      return article.content || ''
    }
    
    try {
      console.log('📥 加载文章内容:', article.contentUrl)
      const response = await fetch(article.contentUrl)
      
      if (response.ok) {
        const content = await response.text()
        console.log('✅ 内容加载成功，长度:', content.length)
        return content
      } else {
        console.warn('⚠️ 内容加载失败:', response.status)
        return '# 文章内容加载失败\n\n无法从服务器获取文章内容。'
      }
    } catch (error) {
      console.error('❌ 内容加载失败:', error)
      return '# 文章内容加载失败\n\n' + error.message
    }
  },
  // 简单搜索文章
  simpleSearch: (keyword, pageNum = 1, pageSize = 10) => {
    if (!keyword || !keyword.trim()) {
      throw new Error('搜索关键词不能为空')
    }
    
    const encodedKeyword = encodeURIComponent(keyword.trim())
    const url = `/articles/simple-search/${encodedKeyword}/`
    const params = {
      pageNum: pageNum,
      pageSize: pageSize
    }
    
    console.log('🔍 调用搜索API:', { keyword, url, params })
    
    return api.get(url, { params }).then(response => {
      console.log('📥 搜索API原始响应:', response)
      
      // 处理标准的后端响应格式 {code: 200, message: string, detail: string, data: {...}}
      if (response && response.code >= 200 && response.code < 300 && response.data) {
        console.log('✅ 搜索API检测到标准响应格式，code:', response.code)
        return response.data
      }
      // 处理axios已解包的响应格式
      else if (response && response.data && response.data.code >= 200 && response.data.code < 300 && response.data.data) {
        console.log('✅ 搜索API检测到axios解包格式，code:', response.data.code)
        return response.data.data
      }
      // 处理直接返回数据的情况（向后兼容）
      else if (response && response.data && (response.data.list || Array.isArray(response.data))) {
        console.log('✅ 搜索API检测到直接数据格式')
        return response.data
      }
      else {
        console.warn('⚠️ 未知的搜索API响应格式:', response)
        return response
      }    }).catch(error => {
      console.error('❌ 搜索API调用失败:', error)
      throw error
    })
  },

  // 复杂搜索文章 - 支持多条件搜索
  complexSearch: (searchOptions, pageNum = 1, pageSize = 10) => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return Promise.reject(new Error('用户ID不存在，请先登录'))
    }

    // 构建查询参数，根据API文档的参数列表
    const params = {}
    
    // 添加各种搜索条件（如果有值的话）
    if (searchOptions.keyword && searchOptions.keyword.trim()) {
      params.keyword = searchOptions.keyword.trim()
    }
    
    if (searchOptions.isShared !== undefined && searchOptions.isShared !== null && searchOptions.isShared !== '') {
      params.isShared = searchOptions.isShared
    }
    
    if (searchOptions.status) {
      params.status = searchOptions.status
    }
    
    if (searchOptions.categoryId) {
      params.categoryId = searchOptions.categoryId
    }
    
    if (searchOptions.startDate) {
      params.startDate = searchOptions.startDate
    }
    
    if (searchOptions.endDate) {
      params.endDate = searchOptions.endDate
    }

    const url = `/articles/complex-search/${pageNum}/${pageSize}`
    
    console.log('🔍 调用复杂搜索API:', {
      url,
      params,
      userId,
      searchConditions: Object.keys(params).length
    })

    // 使用GET方法，参数通过query string传递
    return api.get(url, { 
      params,
      headers: {
        'X-User-Id': userId
      }
    }).then(response => {
      console.log('📥 复杂搜索API原始响应:', response)
      
      let responseData = null
      
      // 处理标准的后端响应格式: {code: 200, message: "OK", detail: "获取用户文章列表成功", data: {...}}
      if (response && response.code >= 200 && response.code < 300 && response.data) {
        console.log('✅ 复杂搜索API检测到标准响应格式，code:', response.code)
        responseData = response.data
      }
      // 处理axios已解包的响应格式
      else if (response && response.data && response.data.code >= 200 && response.data.code < 300 && response.data.data) {
        console.log('✅ 复杂搜索API检测到axios解包格式，code:', response.data.code)
        responseData = response.data.data
      }
      // 处理直接返回数据的情况
      else if (response && response.data) {
        console.log('✅ 复杂搜索API检测到直接数据格式')
        responseData = response.data
      }
      else {
        console.warn('⚠️ 未知的复杂搜索API响应格式:', response)
        responseData = response
      }
      
      // 根据您提供的响应结构进行详细解析
      if (responseData) {
        console.log('📊 解析复杂搜索响应数据:', {
          total: responseData.total,
          listLength: responseData.list ? responseData.list.length : 0,
          pageNum: responseData.pageNum,
          pageSize: responseData.pageSize,
          isFirstPage: responseData.isFirstPage,
          isLastPage: responseData.isLastPage,
          hasNextPage: responseData.hasNextPage,
          hasPreviousPage: responseData.hasPreviousPage
        })
        
        // 返回标准化的数据格式，保持与其他API一致
        return {
          list: responseData.list || [],
          total: responseData.total || 0,
          pageNum: responseData.pageNum || pageNum,
          pageSize: responseData.pageSize || pageSize,
          pages: responseData.pages || 0,
          // 分页状态信息
          isFirstPage: responseData.isFirstPage || false,
          isLastPage: responseData.isLastPage || false,
          hasNextPage: responseData.hasNextPage || false,
          hasPreviousPage: responseData.hasPreviousPage || false,
          // 导航信息
          navigateFirstPage: responseData.navigateFirstPage || 0,
          navigateLastPage: responseData.navigateLastPage || 0,
          navigatePages: responseData.navigatePages || 0,
          navigatepageNums: responseData.navigatepageNums || [],
          // 其他分页字段
          nextPage: responseData.nextPage || 0,
          prePage: responseData.prePage || 0,
          startRow: responseData.startRow || 0,
          endRow: responseData.endRow || 0,
          size: responseData.size || 0
        }
      }
      
      return {
        list: [],
        total: 0,
        pageNum: pageNum,
        pageSize: pageSize,
        pages: 0
      }
    }).catch(error => {
      console.error('❌ 复杂搜索API调用失败:', error)
      
      // 提供更详细的错误信息
      if (error.response?.status === 400) {
        console.error('❌ 搜索参数错误:', params)
      } else if (error.response?.status === 401) {
        console.error('❌ 认证失败，请重新登录')
      } else if (error.response?.status === 404) {
        console.error('❌ 搜索API端点不存在')
      }
      
      throw error
    })
  },
  // 获取单篇文章详情
  getArticle: async (articleId) => {
    try {
      console.log('🔍 获取文章详情，ID:', articleId)
      
      const response = await api.get(`/articles/${articleId}`)
      
      console.log('📄 文章API原始响应:', response)
      
      // 处理标准的后端响应格式 {code: 200, message: string, detail: string, data: {...}}
      let articleData
      if (response && response.code >= 200 && response.code < 300 && response.data) {
        console.log('✅ 文章API检测到标准响应格式，code:', response.code)
        articleData = response.data
      }
      // 处理axios已解包的响应格式
      else if (response && response.data && response.data.code >= 200 && response.data.code < 300 && response.data.data) {
        console.log('✅ 文章API检测到axios解包格式，code:', response.data.code)
        articleData = response.data.data
      }
      // 处理直接返回数据的情况（向后兼容）
      else if (response && response.data) {
        console.log('✅ 文章API检测到直接数据格式')
        articleData = response.data
      }
      else {
        console.warn('⚠️ 未知的文章API响应格式:', response)
        articleData = response.data || response
      }
      
      console.log('📄 文章基本信息:', articleData)
      
      // 如果有contentUrl，需要额外获取内容
      if (articleData.contentUrl) {
        console.log('📥 获取文章内容，URL:', articleData.contentUrl)
        
        try {
          const content = await articleAPI.loadArticleContent(articleData)
          articleData.content = content
          console.log('✅ 文章内容获取成功，长度:', content.length)
        } catch (contentError) {
          console.error('❌ 获取文章内容失败:', contentError)
          articleData.content = '# 文章内容加载失败\n\n' + contentError.message
        }
      } else {
        articleData.content = articleData.content || ''
      }
      
      return { data: articleData }
    } catch (error) {
      console.error('❌ 获取文章失败:', error)
      throw error
    }
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

    console.log('📝 创建文章请求:', requestData)
    
    return api.post('/articles', requestData).then(response => {
      console.log('📝 创建文章API原始响应:', response)
      
      // 处理标准的后端响应格式 {code: 200, message: string, detail: string, data: {...}}
      if (response && response.code >= 200 && response.code < 300 && response.data) {
        console.log('✅ 创建文章API检测到标准响应格式，code:', response.code)
        return { data: response.data }
      }
      // 处理axios已解包的响应格式
      else if (response && response.data && response.data.code >= 200 && response.data.code < 300 && response.data.data) {
        console.log('✅ 创建文章API检测到axios解包格式，code:', response.data.code)
        return { data: response.data.data }
      }
      // 处理直接返回数据的情况（向后兼容）
      else if (response && response.data) {
        console.log('✅ 创建文章API检测到直接数据格式')
        return response
      }
      else {
        console.warn('⚠️ 未知的创建文章API响应格式:', response)
        return response
      }
    }).catch(error => {
      console.error('❌ 创建文章API调用失败:', error)
      throw error
    })
  },  // 更新文章
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

    console.log('📝 更新文章请求:', { id, requestData })
    
    return api.put(`/articles/${id}`, requestData).then(response => {
      console.log('📝 更新文章API原始响应:', response)
      
      // 处理标准的后端响应格式 {code: 200, message: string, detail: string, data: {...}}
      if (response && response.code >= 200 && response.code < 300 && response.data) {
        console.log('✅ 更新文章API检测到标准响应格式，code:', response.code)
        return { data: response.data }
      }
      // 处理axios已解包的响应格式
      else if (response && response.data && response.data.code >= 200 && response.data.code < 300 && response.data.data) {
        console.log('✅ 更新文章API检测到axios解包格式，code:', response.data.code)
        return { data: response.data.data }
      }
      // 处理直接返回数据的情况（向后兼容）
      else if (response && response.data) {
        console.log('✅ 更新文章API检测到直接数据格式')
        return response
      }
      else {
        console.warn('⚠️ 未知的更新文章API响应格式:', response)
        return response
      }
    }).catch(error => {
      console.error('❌ 更新文章API调用失败:', error)
      throw error
    })
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
  }
}

// 分类管理相关 API
export const categoryAPI = {
  // 获取分类树
  getCategoryTree: (categoryId = 0) => {
    console.log('🌳 调用分类树API，categoryId:', categoryId)
    // 根据后端规范，先尝试带参数的API
    return api.get(`/categories/tree/${categoryId}`).then(response => {
      console.log('🌳 分类树API原始响应:', response)
      
      // 处理标准的后端响应格式 {code: 200, message: string, detail: string, data: [...]}
      if (response && response.code >= 200 && response.code < 300 && response.data && Array.isArray(response.data)) {
        console.log('✅ 检测到标准响应格式，code:', response.code, '分类数量:', response.data.length)
        return response.data
      }
      // 处理axios已解包的响应格式
      else if (response && response.data && response.data.code >= 200 && response.data.code < 300 && Array.isArray(response.data.data)) {
        console.log('✅ 检测到axios解包的标准响应格式，code:', response.data.code, '分类数量:', response.data.data.length)
        return response.data.data
      }
      // 处理直接返回数组的情况（向后兼容）
      else if (Array.isArray(response)) {
        console.log('✅ 检测到直接数组格式，分类数量:', response.length)
        return response
      }
      else if (response && response.data && Array.isArray(response.data)) {
        console.log('✅ 检测到data字段数组格式，分类数量:', response.data.length)
        return response.data
      }
      else {
        console.warn('⚠️ 未知的分类树响应格式:', {
          responseType: typeof response,
          hasCode: response?.code !== undefined,
          code: response?.code,
          hasData: !!response?.data,
          dataType: typeof response?.data,
          isDataArray: Array.isArray(response?.data),
          fullResponse: response
        })
        return []
      }
    }).catch(error => {
      console.error('❌ 分类树API调用失败，尝试备用路径:', error)
      // 如果带参数的API失败，尝试不带参数的API
      return api.get('/categories/tree/').then(response => {
        console.log('🌳 备用分类树API响应:', response)
        
        // 同样处理备用API的响应格式
        if (response && response.code >= 200 && response.code < 300 && response.data && Array.isArray(response.data)) {
          console.log('✅ 备用API标准响应格式，code:', response.code, '分类数量:', response.data.length)
          return response.data
        }
        else if (response && response.data && response.data.code >= 200 && response.data.code < 300 && Array.isArray(response.data.data)) {
          console.log('✅ 备用API axios解包格式，code:', response.data.code, '分类数量:', response.data.data.length)
          return response.data.data
        }
        else if (Array.isArray(response)) {
          console.log('✅ 备用API直接数组格式，分类数量:', response.length)
          return response
        }
        else if (response && response.data && Array.isArray(response.data)) {
          console.log('✅ 备用API data字段格式，分类数量:', response.data.length)
          return response.data
        }
        else {
          console.warn('⚠️ 备用API也返回未知格式:', response)
          return []
        }
      }).catch(backupError => {
        console.error('❌ 备用分类树API也失败:', backupError)
        throw backupError
      })
    })
  },
  
  // 获取分类信息
  getCategory: (categoryId) => {
    if (!categoryId) {
      return Promise.reject(new Error('分类ID不能为空'))
    }
    return api.get(`/categories/${categoryId}`)
  },
  
  // 获取分类到根节点的路径
  getCategoryPath: (categoryId) => {
    if (!categoryId) {
      return Promise.reject(new Error('分类ID不能为空'))
    }
    // API直接返回路径数组，格式如你提供的示例
    return api.get(`/categories/path/${categoryId}`).then(response => {
      // 直接返回数组数据
      return response.data || response
    })
  },

  // 获取扁平分类列表
  getCategories: (id = null) => {
    if (id) {
      return api.get(`/categories/${id}`)
    }
    return api.get('/categories').then(response => {
      return response.data || response
    })
  },
  
  // 创建分类
  createCategory: (categoryData) => {
    return api.post('/categories', {
      name: categoryData.name,
      parentId: categoryData.parentId  // 根节点使用null
    })
  },
  
  // 更新分类
  updateCategory: (categoryId, categoryData) => {
    return api.put(`/categories/${categoryId}`, {
      name: categoryData.name,
      parentId: categoryData.parentId || null  // 根节点使用null
    })
  },

  // 删除分类
  deleteCategory: (categoryId) => {
    return api.delete(`/categories/${categoryId}`)
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
  },  // 获取用户信息 - 需要传递userId参数
  getUserInfo: (userId) => {
    return userAPI.getUserInfo(userId)
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