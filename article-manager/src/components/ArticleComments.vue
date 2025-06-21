<template>
  <div class="article-comments">
    <!-- 评论统计 -->
    <div class="comments-header">
      <h3 class="comments-title">
        <i class="icon-comment"></i>
        评论 ({{ totalComments }})
      </h3>
      <div class="comments-sort">
        <label>排序:</label>
        <select v-model="sortType" @change="onSortChange">
          <option value="newest">最新</option>
          <option value="oldest">最早</option>
          <option value="popular">最热</option>
        </select>        <!-- 调试按钮 -->
        <button @click="debugCommentData" style="margin-left: 10px; padding: 4px 8px; font-size: 12px;">
          调试
        </button>
        <!-- API测试按钮 -->
        <button @click="testCreateComment" style="margin-left: 5px; padding: 4px 8px; font-size: 12px; background-color: #007bff; color: white; border: none; border-radius: 3px;">
          测试API
        </button>
      </div>
    </div>

    <!-- 评论输入框 -->
    <div v-if="allowComment" class="comment-input-section">
      <div class="comment-input-header">
        <h4>发表评论</h4>
      </div>
      <div class="comment-input-box">
        <div class="input-avatar">
          <img :src="currentUserAvatar" :alt="currentUserName" />
        </div>
        <div class="input-content">
          <textarea 
            v-model="newCommentContent"
            placeholder="写下你的评论..."
            rows="3"
            maxlength="1000"
            :disabled="isSubmitting"
            @keydown.ctrl.enter="submitComment"
            @keydown.meta.enter="submitComment"
          ></textarea>
          <div class="input-actions">
            <div class="char-count">
              {{ newCommentContent.length }}/1000
            </div>
            <div class="action-buttons">
              <button 
                type="button" 
                class="btn-cancel"
                @click="cancelComment"
                :disabled="isSubmitting"
              >
                取消
              </button>
              <button 
                type="button" 
                class="btn-submit"
                @click="submitComment"
                :disabled="!canSubmit || isSubmitting"
              >
                <span v-if="isSubmitting">发表中...</span>
                <span v-else>发表评论</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能提示 (只在不允许评论时显示) -->
    <div v-else class="comment-notice">
      <div class="notice-icon">🔒</div>
      <div class="notice-text">
        <p><strong>评论已关闭</strong></p>
        <p>此文章暂不允许评论</p>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="comments-list">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载评论中...</span>
      </div>

      <!-- 评论项 -->
      <div 
        v-for="comment in comments" 
        :key="comment.id"
        class="comment-item"
        :class="{ 'is-author': comment.isAuthor, 'is-pinned': comment.isPinned }"
      >
        <!-- 评论主体 -->
        <div class="comment-main">
          <div class="comment-avatar">
            <img :src="comment.userAvatar" :alt="comment.userName" />
          </div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.userName || comment.userNickname }}</span>
              <span v-if="comment.isAuthor" class="author-badge">作者</span>
              <span v-if="comment.isPinned" class="pinned-badge">置顶</span>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            </div>              <div class="comment-text">
              {{ comment.content }}
            </div>
            
            <div class="comment-actions">
              <button 
                class="action-btn disabled" 
                title="点赞功能即将上线"
              >
                <i class="icon-like"></i>
                赞
              </button>
              
              <button 
                class="action-btn"
                @click="startReply(comment)"
                :disabled="!props.allowComment"
                :title="props.allowComment ? '回复评论' : '评论已关闭'"
              >
                <i class="icon-reply"></i>
                回复
              </button>
            </div>
          </div>
        </div>

        <!-- 回复输入框 -->
        <div v-if="replyingTo === comment.id" class="reply-input-section">
          <div class="reply-input-box">
            <div class="input-avatar">
              <img :src="currentUserAvatar" :alt="currentUserName" />
            </div>
            <div class="input-content">
              <textarea 
                v-model="replyContent"
                :placeholder="`回复 @${comment.userNickname || comment.userName}...`"
                rows="2"
                maxlength="1000"
                :disabled="isSubmittingReply"
                @keydown.ctrl.enter="submitReply(comment)"
                @keydown.meta.enter="submitReply(comment)"
              ></textarea>
              <div class="input-actions">
                <div class="char-count">
                  {{ replyContent.length }}/1000
                </div>
                <div class="action-buttons">
                  <button 
                    type="button" 
                    class="btn-cancel"
                    @click="cancelReply"
                    :disabled="isSubmittingReply"
                  >
                    取消
                  </button>
                  <button 
                    type="button" 
                    class="btn-submit"
                    @click="submitReply(comment)"
                    :disabled="!canSubmitReply || isSubmittingReply"
                  >
                    <span v-if="isSubmittingReply">回复中...</span>
                    <span v-else>发表回复</span>
                  </button>
                </div>
              </div>
            </div>
          </div>        </div>        <!-- 嵌入式回复列表 - 使用后端原生的 subComments 字段 -->
        <div v-if="comment.subComments && comment.subComments.length > 0" class="embedded-replies-container">
          <div class="embedded-replies-header">
            <span class="replies-count">{{ comment.subComments.length }} 条回复</span>
          </div>
          
          <div class="embedded-replies-content">
            <div 
              v-for="reply in comment.subComments" 
              :key="reply.id"
              class="embedded-reply-item"
            >
              <div class="embedded-reply-main">
                <div class="embedded-reply-avatar">
                  <img :src="reply.userAvatar" :alt="reply.userName" />
                </div>
                
                <div class="embedded-reply-content">
                  <div class="embedded-reply-header">
                    <span class="embedded-reply-author">{{ reply.userNickname || reply.userName }}</span>
                    <span v-if="reply.replyTo" class="embedded-reply-mention">
                      回复 @{{ reply.replyToUser }}
                    </span>
                    <span class="embedded-reply-time">{{ formatTime(reply.createdAt) }}</span>
                  </div>                  <div class="embedded-reply-text">
                    {{ reply.content }}
                  </div>
                  <div class="embedded-reply-actions">
                    <button 
                      class="embedded-action-btn disabled" 
                      title="点赞功能即将上线"
                    >
                      <i class="icon-like"></i>
                      赞
                    </button>
                    <button 
                      class="embedded-action-btn"
                      @click="startReplyToReply(reply, comment)"
                      :disabled="!props.allowComment"
                      :title="props.allowComment ? '回复' : '评论已关闭'"
                    >
                      <i class="icon-reply"></i>
                      回复
                    </button>
                  </div>
                </div>
              </div>
  
            </div>
          </div>
        </div>
      </div>

      <!-- 无评论状态 -->
      <div v-if="!isLoading && comments.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <div class="empty-text">暂无评论</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import commentAPI from '@/services/commentAPI.js'

// Props
const props = defineProps({
  articleId: {
    type: [String, Number],
    required: true
  },
  articleAuthorId: {
    type: [String, Number],
    default: null
  },
  allowComment: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['comment-count-change'])

// 响应式数据
const comments = ref([])
const totalComments = ref(0)
const isLoading = ref(false)
const sortType = ref('newest')

// 评论输入相关
const newCommentContent = ref('')
const isSubmitting = ref(false)

// 回复相关状态
const replyingTo = ref(null) // 当前正在回复的评论ID
const replyContent = ref('') // 回复内容
const isSubmittingReply = ref(false) // 是否正在提交回复

// 当前用户信息
const currentUserName = ref('当前用户')
const currentUserAvatar = ref('/default-avatar.png')
const currentUserId = ref(null)

// 计算属性
const canSubmit = computed(() => {
  return newCommentContent.value.trim().length > 0 && 
         newCommentContent.value.length <= 1000 && 
         !isSubmitting.value
})

// 回复内容验证
const canSubmitReply = computed(() => {
  return replyContent.value.trim().length > 0 && 
         replyContent.value.length <= 1000 && 
         !isSubmittingReply.value
})

// 辅助函数：从API响应中提取评论数组
const extractCommentsFromResponse = (data) => {
  if (Array.isArray(data)) {
    return data
  }
  
  if (data && typeof data === 'object') {
    // 按优先级尝试不同的字段名
    const possibleArrays = ['list', 'comments', 'data', 'items']
    
    for (const fieldName of possibleArrays) {
      if (Array.isArray(data[fieldName])) {
        return data[fieldName]
      }
    }
  }
  
  return []
}

// 辅助函数：标准化单个评论数据
const normalizeComment = (comment, isSubComment = false, parentComment = null) => {
  const normalized = {
    // 基础字段标准化
    id: comment.commentId || comment.id,
    commentId: comment.commentId || comment.id,
    content: comment.content || '',
    createdAt: comment.createTime || comment.createdAt,
    
    // 用户信息字段
    userId: comment.userId,
    userName: comment.username || comment.userName || '',
    userNickname: comment.nickname || comment.userNickname || '',
    userAvatar: comment.avatar || comment.userAvatar || '/default-avatar.png',
    
    // 状态字段
    isAuthor: comment.userId === props.articleAuthorId,
    isPinned: comment.isPinned || false
  }
  
  // 如果是子评论，添加回复相关字段
  if (isSubComment && parentComment) {
    normalized.parentId = parentComment.commentId || parentComment.id
    normalized.replyTo = comment.replyUserId
    normalized.replyToUser = comment.replyNickname || comment.replyUsername
  } else {
    // 如果是主评论，处理子评论
    normalized.subComments = []
  }
  
  return normalized
}

// 辅助函数：处理评论数据
const processCommentsData = (rawComments) => {
  if (!Array.isArray(rawComments) || rawComments.length === 0) {
    return []
  }
  
  const processedComments = rawComments.map((comment) => {
    // 标准化主评论
    const normalizedComment = normalizeComment(comment, false)
    
    // 处理子评论
    if (comment.subComments && Array.isArray(comment.subComments)) {
      normalizedComment.subComments = comment.subComments.map((subComment) => {
        return normalizeComment(subComment, true, comment)
      })
    }
    
    return normalizedComment
  })
  
  return processedComments
}

// 辅助函数：更新组件状态
const updateComponentState = (processedComments, total) => {
  // 设置评论列表
  comments.value = processedComments
  
  // 设置总数
  totalComments.value = total || processedComments.length
  
  // 计算包括回复在内的总评论数
  const totalWithReplies = processedComments.reduce((sum, comment) => {
    return sum + 1 + (comment.subComments?.length || 0)
  }, 0)
  
  // 通知父组件评论数量变化
  emit('comment-count-change', totalWithReplies)
}

// 方法
const loadComments = async () => {
  isLoading.value = true
  
  try {
    const response = await commentAPI.getComments(props.articleId)
    
    const data = response.data || response
    
        // 步骤1：标准化提取评论数组
    const rawComments = extractCommentsFromResponse(data)
    
    // 步骤2：处理和标准化评论数据
    const processedComments = processCommentsData(rawComments)
    
    // 步骤3：设置组件状态
    updateComponentState(processedComments, data.total || rawComments.length)

  } catch (error) {
    console.error('❌ 加载评论失败:', error)
    updateComponentState([], 0)
  } finally {
    isLoading.value = false
  }
}


const onSortChange = () => {
  // 重新排序评论
  loadComments()
}

const formatTime = (dateString) => {
  if (!dateString) {
    console.warn('formatTime: 接收到空的日期字符串')
    return '未知时间'
  }
  
  try {
    const date = new Date(dateString)
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('formatTime: 无效的日期格式:', dateString)
      return '时间格式错误'
    }
    
    const now = new Date()
    const diff = now - date

    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) { // 1天内
      return `${Math.floor(diff / 3600000)}小时前`
    } else if (diff < 2592000000) { // 30天内
      return `${Math.floor(diff / 86400000)}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  } catch (error) {
    console.error('formatTime: 时间格式化错误:', error, '原始值:', dateString)
    return '时间解析失败'
  }
}

// 调试工具函数
const debugCommentData = () => {
  // 基本组件状态信息
  if (comments.value.length === 0) {
    updateComponentState([], 0)
  }
}

// 在全局暴露调试函数（如果需要）
if (process.env.NODE_ENV === 'development') {
  window.debugComments = debugCommentData
}

// 评论相关方法
const submitComment = async () => {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  
  try {
    // 根据API文档构建请求数据
    const requestData = {
      content: newCommentContent.value.trim(),
      replyId: null,  // 主评论不回复任何评论，设为null
      rootId: null    // 主评论就是根评论，设为null
    }
    
    // 调用评论API
    const response = await commentAPI.createComment(props.articleId, requestData)
    
    // 清空输入框
    newCommentContent.value = ''
    
    // 重新加载评论列表
    await loadComments()
    
  } catch (error) {
    console.error('❌ 主评论提交失败:', error)
    
    // 改进错误提示，提供更友好的用户体验
    let errorMessage = '评论发表失败，请重试'
    if (error.response?.status === 401) {
      errorMessage = '请先登录再发表评论'
    } else if (error.response?.status === 403) {
      errorMessage = '您没有权限发表评论'
    } else if (error.response?.status === 404) {
      errorMessage = '文章不存在'
    } else if (error.response?.status === 400) {
      errorMessage = `请求参数错误: ${error.response?.data?.message || '请检查评论内容'}`
    } else if (error.response?.status === 429) {
      errorMessage = '发表评论过于频繁，请稍后再试'
    } else if (error.message?.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络后重试'
    }
    
    alert(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const cancelComment = () => {
  newCommentContent.value = ''
}

const startReply = (comment) => {
  replyingTo.value = comment.id
  replyContent.value = ''
  
  // 自动聚焦到回复输入框
  setTimeout(() => {
    const replyTextarea = document.querySelector('.reply-input-section textarea')
    if (replyTextarea) {
      replyTextarea.focus()
    }
  }, 100)
}

const startReplyToReply = (reply, parentComment) => {
  // 使用特殊标记来区分回复二级评论
  // 格式: "reply_to_second:根评论ID:被回复的二级评论ID"
  replyingTo.value = `reply_to_second:${parentComment.id}:${reply.id}`
  replyContent.value = `@${reply.userNickname || reply.userName} `
}

const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

const submitReply = async (parentComment) => {
  if (!canSubmitReply.value) return
  
  isSubmittingReply.value = true
  
  /* 
   * API参数说明：
   * - content: 评论内容
   * - replyId: 所回复的评论ID，只有回复二级评论时才设置，否则为null
   * - rootId: 所在的一级评论ID，只有二级评论才设置，一级评论为null
   * 
   * 场景1: 创建一级评论（主评论）
   *   replyId = null (不回复任何评论)
   *   rootId = null (这就是一级评论)
   * 
   * 场景2: 回复一级评论（创建二级评论）
   *   replyId = null (不是回复二级评论)
   *   rootId = 一级评论ID (归属于该一级评论)
   * 
   * 场景3: 回复二级评论（创建新的二级评论）
   *   replyId = 二级评论ID (回复的具体二级评论)
   *   rootId = 一级评论ID (归属于该一级评论)
   */
  
  try {
    let requestData
    
    // 检查是否是回复二级评论
    const replyingToStr = String(replyingTo.value)
    if (replyingToStr.startsWith('reply_to_second:')) {
      // 回复二级评论的情况
      // 格式: "reply_to_second:根评论ID:被回复的二级评论ID"
      const parts = replyingToStr.split(':')
      if (parts.length === 3) {
        const rootId = parts[1]     // 根评论ID（一级评论）
        const replyId = parts[2]    // 被回复的二级评论ID
        
        console.log('💬 提交回复二级评论:', {
          articleId: props.articleId,
          被回复的二级评论ID: parseInt(replyId),
          所在的一级评论ID: parseInt(rootId),
          content: replyContent.value,
          说明: 'replyId=被回复的二级评论ID，rootId=所在的一级评论ID'
        })
        
        requestData = {
          content: replyContent.value.trim(),
          replyId: parseInt(replyId),    // 被回复的二级评论ID
          rootId: parseInt(rootId)       // 所在的一级评论ID
        }
      } else {
        console.error('❌ 回复二级评论格式错误:', replyingToStr)
        throw new Error('回复格式错误')
      }
    } else {
      // 回复一级评论的情况（创建二级评论）
      console.log('💬 提交回复一级评论（创建二级评论）:', {
        articleId: props.articleId,
        不回复具体评论: 'replyId为null',
        所在的一级评论ID: parseInt(parentComment.id),
        content: replyContent.value,
        说明: 'replyId=null（不是回复二级评论），rootId=所在的一级评论ID'
      })
      
      requestData = {
        content: replyContent.value.trim(),
        replyId: null,                           // 不是回复二级评论，所以为null
        rootId: parseInt(parentComment.id)       // 所在的一级评论ID
      }
    }
    
    console.log('📤 发送回复请求数据:', {
      url: `/articles/${props.articleId}/comments`,
      method: 'POST',
      headers: { 'X-User-Id': localStorage.getItem('userId') },
      body: requestData
    })
    
    // 调用评论API
    const response = await commentAPI.createComment(props.articleId, requestData)
    
    console.log('✅ 回复提交成功:', response)
    
    // 清空回复状态
    replyingTo.value = null
    replyContent.value = ''
    
    console.log('🔄 回复提交成功，开始重新加载评论列表...')
    
    // 重新加载评论列表
    await loadComments()
    
    console.log('💬 回复发表成功并已刷新列表!')
    
  } catch (error) {
    console.error('❌ 回复提交失败:', error)
    console.error('❌ 错误详情:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    })
    
    // 详细调试信息
    console.error('🔍 回复失败调试信息:', {
      请求URL: error.config?.url,
      请求方法: error.config?.method,
      请求数据: error.config?.data,
      请求头: error.config?.headers,
      响应状态: error.response?.status,
      响应数据: error.response?.data,
      网络错误: error.code,
      用户认证信息: {
        userId: localStorage.getItem('userId'),
        userExists: !!localStorage.getItem('user')
      }
    })
    
    // 改进错误提示，提供更友好的用户体验
    let errorMessage = '回复发表失败，请重试'
    if (error.response?.status === 401) {
      errorMessage = '请先登录再发表回复'
    } else if (error.response?.status === 403) {
      errorMessage = '您没有权限发表回复'
    } else if (error.response?.status === 404) {
      errorMessage = '文章或评论不存在'
    } else if (error.response?.status === 400) {
      errorMessage = `请求参数错误: ${error.response?.data?.message || '请检查回复内容'}`
    } else if (error.response?.status === 429) {
      errorMessage = '发表回复过于频繁，请稍后再试'
    } else if (error.message?.includes('网络') || error.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接失败，请检查网络后重试'
    } else if (error.response?.data?.message) {
      errorMessage = `发表失败: ${error.response.data.message}`
    }
    
    // 这里可以添加Toast通知组件显示错误
    alert(errorMessage)
  } finally {
    isSubmittingReply.value = false
  }
}

// 生命周期
onMounted(() => {
  // 加载当前用户信息
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      currentUserName.value = user.username || user.name || '当前用户'
      currentUserAvatar.value = user.avatar || '/default-avatar.png'
      currentUserId.value = user.userId || localStorage.getItem('userId')
    } catch (error) {
      console.warn('解析用户信息失败:', error)
    }
  }

  // 加载评论
  loadComments()
})

onUnmounted(() => {
  // 清理工作
})
</script>

<style scoped>
.article-comments {
  max-width: 100%;
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

/* 评论头部 */
.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.comments-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comments-sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.comments-sort select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
}

/* 功能提示 */
.comment-notice {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.notice-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.notice-text p {
  margin: 0;
  line-height: 1.5;
}

.notice-text p:first-child {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* 评论输入区域 */
.comment-input-section {
  margin-bottom: 2rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.comment-input-header {
  margin-bottom: 1rem;
}

.comment-input-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.comment-input-box {
  display: flex;
  gap: 0.75rem;
}

.input-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.input-content {
  flex: 1;
}

.input-content textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s;
  font-family: inherit;
}

.input-content textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

.char-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-cancel,
.btn-submit {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-cancel {
  background: white;
  color: #6b7280;
  border-color: #d1d5db;
}

.btn-cancel:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-submit {
  background: #3b82f6;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #2563eb;
}

.btn-submit:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-cancel:disabled {
  background: #f3f4f6;
  color: #d1d5db;
  cursor: not-allowed;
}

/* 评论列表 - 移除内部滚动 */
.comments-list {
  /* 移除内部滚动，让评论自然流动 */
  background: white;
  position: relative;
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #6b7280;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 评论项样式 */
.comment-item {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.comment-item::before {
  content: '📝';
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.6;
}

.comment-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.comment-item.is-author {
  border-left: 4px solid #3b82f6;
  background: linear-gradient(145deg, #f8faff 0%, #f0f9ff 100%);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

.comment-item.is-author::before {
  content: '👤';
  color: #3b82f6;
  opacity: 0.8;
}

.comment-item.is-pinned {
  border-left: 4px solid #f59e0b;
  background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%);
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.15);
}

.comment-item.is-pinned::before {
  content: '📌';
  color: #f59e0b;
  opacity: 0.8;
}

.comment-main {
  display: flex;
  gap: 0.75rem;
}

.comment-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  color: #1f2937;
}

.author-badge {
  background: #3b82f6;
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.pinned-badge {
  background: #f59e0b;
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.comment-time {
  color: #6b7280;
  font-size: 0.75rem;
}

.comment-text {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.comment-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 回复输入区域样式 */
.reply-input-section {
  margin: 1rem 0 1rem 2rem;
  background: #f0f9ff;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #bfdbfe;
  border-left: 3px solid #3b82f6;
}

.reply-input-box {
  display: flex;
  gap: 0.5rem;
}

.reply-input-section .input-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.reply-input-section .input-content {
  flex: 1;
}

.reply-input-section .input-content textarea {
  width: 100%;
  min-height: 60px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.4;
  resize: vertical;
  transition: border-color 0.2s;
  font-family: inherit;
}

.reply-input-section .input-content textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.reply-input-section .input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.reply-input-section .char-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.reply-input-section .action-buttons {
  display: flex;
  gap: 0.5rem;
}

.reply-input-section .btn-cancel,
.reply-input-section .btn-submit {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.reply-input-section .btn-cancel {
  background: white;
  color: #6b7280;
  border-color: #d1d5db;
}

.reply-input-section .btn-cancel:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.reply-input-section .btn-submit {
  background: #3b82f6;
  color: white;
}

.reply-input-section .btn-submit:hover:not(:disabled) {
  background: #2563eb;
}

.reply-input-section .btn-submit:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.reply-input-section .btn-cancel:disabled {
  background: #f3f4f6;
  color: #d1d5db;
  cursor: not-allowed;
}

/* 嵌入式回复容器样式 */
.embedded-replies-container {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #3b82f6;
  position: relative;
}

.embedded-replies-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.replies-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.replies-count::before {
  content: '💬';
  font-size: 1rem;
}

.embedded-replies-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* 嵌入式回复项样式 */
.embedded-reply-item {
  background: #ffffff;
  border-radius: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.embedded-reply-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.embedded-reply-main {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.embedded-reply-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.embedded-reply-content {
  flex: 1;
}

.embedded-reply-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
  flex-wrap: wrap;
}

.embedded-reply-author {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.embedded-reply-mention {
  color: #3b82f6;
  font-size: 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.embedded-reply-time {
  color: #6b7280;
  font-size: 0.75rem;
  margin-left: auto;
}

.embedded-reply-text {
  color: #374151;
  line-height: 1.5;
  margin-bottom: 0.5rem;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 0.875rem;
}

.embedded-reply-actions {
  display: flex;
  gap: 0.75rem;
}

.embedded-action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.embedded-action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.embedded-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.embedded-action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}



/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.125rem;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .article-comments {
    margin: 0.5rem 0;
    padding: 0.75rem;
  }
  
  .comments-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .comment-input-box {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .input-avatar {
    align-self: flex-start;
  }

  .comment-main {
    gap: 0.5rem;
  }
  
  .comment-avatar img {
    width: 32px;
    height: 32px;
  }
  
  .reply-avatar img {
    width: 28px;
    height: 28px;
  }
  
  .comment-text,
  .reply-text {
    font-size: 0.875rem;
    line-height: 1.5;
  }
  
  .input-actions {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }  /* 移动端嵌入式回复样式调整 */
  .embedded-replies-container {
    margin: 0.75rem 0 0 0;
    padding: 0.75rem;
    border-left-width: 3px;
  }
  
  .embedded-reply-item {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border-left-width: 2px;
  }
  
  .embedded-reply-avatar img {
    width: 24px;
    height: 24px;
  }
  
  .embedded-reply-text,
  .deeply-nested-reply-text {
    font-size: 0.75rem;
  }
  
  .embedded-reply-author,
  .deeply-nested-reply-author {
    font-size: 0.75rem;
  }
  
  .embedded-reply-mention,
  .embedded-reply-time,
  .deeply-nested-reply-mention,
  .deeply-nested-reply-time {
    font-size: 0.625rem;
  }
  
  .action-buttons {
    justify-content: space-between;
  }
  
  .btn-cancel,
  .btn-submit {
    flex: 1;
    text-align: center;
  }
}
</style>