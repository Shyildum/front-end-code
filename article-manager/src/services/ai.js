// AI服务 - 对接DeepSeek API
import axios from 'axios'

// DeepSeek API配置
const DEEPSEEK_CONFIG = {
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-d2e4dfbeb5254dc5ac074b48ae430c9f',
  model: 'deepseek-chat'
}

// 创建专用的AI axios实例
const aiApi = axios.create({
  baseURL: DEEPSEEK_CONFIG.baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
  }
})

// AI响应拦截器
aiApi.interceptors.response.use(
  (response) => {
    console.log('🤖 AI API响应成功:', {
      status: response.status,
      model: response.data?.model,
      usage: response.data?.usage
    })
    return response
  },
  (error) => {
    console.error('❌ AI API调用失败:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    })
    
    // 处理常见错误
    if (error.response?.status === 401) {
      throw new Error('AI API密钥无效，请检查配置')
    } else if (error.response?.status === 429) {
      throw new Error('AI API调用频率过高，请稍后重试')
    } else if (error.response?.status === 400) {
      throw new Error('AI API请求参数错误')
    }
    
    throw error
  }
)

// AI服务对象
export const aiService = {
  // 检查API Key是否已配置
  isConfigured() {
    return DEEPSEEK_CONFIG.apiKey && DEEPSEEK_CONFIG.apiKey.trim() !== ''
  },

  // 设置API Key
  setApiKey(apiKey) {
    DEEPSEEK_CONFIG.apiKey = apiKey
    // 更新请求头
    aiApi.defaults.headers['Authorization'] = `Bearer ${apiKey}`
    console.log('🔑 AI API Key已更新')
  },

  // 生成文章摘要
  async generateSummary(articleTitle, articleContent) {
    // 检查API Key配置
    if (!this.isConfigured()) {
      throw new Error('DeepSeek API Key未配置，请先配置API密钥')
    }

    // 检查输入参数
    if (!articleTitle || !articleContent) {
      throw new Error('文章标题和内容不能为空')
    }

    // 限制内容长度（避免token过多）
    const maxContentLength = 3000
    const truncatedContent = articleContent.length > maxContentLength 
      ? articleContent.substring(0, maxContentLength) + '...'
      : articleContent

    console.log('🤖 调用DeepSeek API生成摘要:', {
      title: articleTitle,
      contentLength: articleContent.length,
      truncatedLength: truncatedContent.length
    })

    try {
      const response = await aiApi.post('/chat/completions', {
        model: DEEPSEEK_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文章摘要生成助手。请为用户提供的文章生成简洁、准确的摘要。摘要应该：1）突出文章的核心观点和主要内容；2）保持客观中性的语调；3）长度控制在100-200字之间；4）使用简洁明了的语言。'
          },
          {
            role: 'user',
            content: `请为以下文章生成摘要：

标题：${articleTitle}

内容：
${truncatedContent}

请生成一个简洁的文章摘要。`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
        stream: false
      })

      // 提取AI生成的摘要
      const summary = response.data?.choices?.[0]?.message?.content
      if (!summary) {
        throw new Error('AI响应格式异常，未能获取摘要内容')
      }

      console.log('✅ AI摘要生成成功:', {
        length: summary.length,
        usage: response.data?.usage
      })

      return summary.trim()

    } catch (error) {
      console.error('❌ AI摘要生成失败:', error)
      
      // 提供更友好的错误信息
      if (error.message.includes('API Key')) {
        throw new Error('API密钥验证失败，请检查DeepSeek API Key是否正确')
      } else if (error.message.includes('rate limit')) {
        throw new Error('AI服务调用频率过高，请稍后重试')
      } else if (error.message.includes('timeout')) {
        throw new Error('AI服务响应超时，请稍后重试')
      }
      
      throw new Error(`AI摘要生成失败: ${error.message}`)
    }
  },

  // 批量生成摘要（未来扩展）
  async batchGenerateSummary(articles) {
    const results = []
    for (const article of articles) {
      try {
        const summary = await this.generateSummary(article.title, article.content)
        results.push({ articleId: article.id, summary, success: true })
      } catch (error) {
        results.push({ 
          articleId: article.id, 
          error: error.message, 
          success: false 
        })
      }
      // 添加延迟避免API限流
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    return results
  }
}

// 默认导出
export default aiService 