<template>
  <div class="article-comments">
    <!-- 评论统计 -->
    <div class="comments-header">
      <h3 class="comments-title">
        <i class="icon-comment"></i>
        评论 ({{ totalComments }})
      </h3>      <div class="comments-sort">
        <label>排序:</label>
        <select v-model="sortType" @change="onSortChange">
          <option value="newest">最新</option>
          <option value="oldest">最早</option>
          <option value="popular">最热</option>
        </select>
        <!-- 调试按钮 -->
        <button @click="debugCommentData" style="margin-left: 10px; padding: 4px 8px; font-size: 12px;">
          调试
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
    </div>    <!-- 评论列表 -->
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
              <span class="comment-author">{{ comment.userNickname || comment.userName }}</span>
              <span v-if="comment.isAuthor" class="author-badge">作者</span>
              <span v-if="comment.isPinned" class="pinned-badge">置顶</span>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            </div>
            
            <div class="comment-text">
              {{ comment.content }}
              <!-- 调试信息 -->
              <div v-if="!comment.content" style="color: red; font-size: 12px;">
                [调试] 评论内容为空: {{ JSON.stringify(comment) }}
              </div>
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
                回复              </button>
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
          </div>
        </div>

        <!-- 回复列表 -->
        <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
          <div 
            v-for="reply in comment.replies" 
            :key="reply.id"
            class="reply-item"
          >
            <div class="reply-avatar">
              <img :src="reply.userAvatar" :alt="reply.userName" />
            </div>
            <div class="reply-content">
              <div class="reply-header">
                <span class="reply-author">{{ reply.userNickname || reply.userName }}</span>
                <span v-if="reply.replyTo" class="reply-to">
                  回复 @{{ reply.replyToUser }}
                </span>
                <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
              </div>
              <div class="reply-text">{{ reply.content }}</div>              <div class="reply-actions">
                <button 
                  class="action-btn disabled" 
                  title="点赞功能即将上线"
                >
                  <i class="icon-like"></i>
                  赞
                </button>
                <button 
                  class="action-btn"
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

// 方法
const loadComments = async () => {
  isLoading.value = true
  
  try {
    console.log('🔍 加载评论:', {
      articleId: props.articleId,
      articleAuthorId: props.articleAuthorId
    })
    
    const response = await commentAPI.getComments(props.articleId)
    console.log('📥 评论API完整响应:', response)
    
    const data = response.data || response
    console.log('📊 评论数据提取结果:', data)
    
    let commentList = []
    
    // 更详细的数据提取逻辑
    if (Array.isArray(data)) {
      commentList = data
      console.log('✅ 直接使用数组数据')
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.list)) {
        commentList = data.list
        console.log('✅ 使用 data.list')
      } else if (Array.isArray(data.comments)) {
        commentList = data.comments
        console.log('✅ 使用 data.comments')
      } else if (Array.isArray(data.data)) {
        commentList = data.data
        console.log('✅ 使用 data.data')
      } else {
        console.log('⚠️ 无法从响应中提取评论数组，使用空数组')
        commentList = []
      }
    } else {
      console.log('⚠️ 响应数据格式异常，使用空数组')
      commentList = []
    }
    
    console.log('📝 提取的评论列表:', commentList)
    console.log('📊 评论数量:', commentList.length)
    
    // 处理作者标识
    if (Array.isArray(commentList) && commentList.length > 0) {
      commentList.forEach((comment, index) => {
        console.log(`处理评论 ${index + 1}:`, {
          id: comment.id,
          userId: comment.userId,
          articleAuthorId: props.articleAuthorId,
          content: comment.content?.substring(0, 50) + '...'
        })
        
        comment.isAuthor = comment.userId === props.articleAuthorId
        
        // 处理回复
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.forEach(reply => {
            reply.isAuthor = reply.userId === props.articleAuthorId
          })
        }
      })
    }
    
    comments.value = commentList
    totalComments.value = data.total || commentList.length

    // 计算包括回复在内的总评论数
    const totalWithReplies = commentList.reduce((total, comment) => {
      return total + 1 + (comment.replies ? comment.replies.length : 0)
    }, 0)
    
    // 通知父组件评论数量变化
    emit('comment-count-change', totalWithReplies)

    console.log('✅ 评论加载完成:', {
      total: totalComments.value,
      commentsCount: comments.value.length,
      totalWithReplies: totalWithReplies,
      firstComment: comments.value[0] ? {
        id: comments.value[0].id,
        content: comments.value[0].content?.substring(0, 30) + '...',
        isAuthor: comments.value[0].isAuthor
      } : null
    })

  } catch (error) {
    console.error('❌ 加载评论失败:', error)
    comments.value = []
    totalComments.value = 0
  } finally {
    isLoading.value = false
  }
}

const onSortChange = () => {
  // 重新排序评论
  loadComments()
}

const formatTime = (dateString) => {
  if (!dateString) return '未知时间'
  
  const date = new Date(dateString)
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
}

// 调试工具函数
const debugCommentData = () => {
  console.log('🐛 评论组件调试信息:', {
    props: {
      articleId: props.articleId,
      articleAuthorId: props.articleAuthorId,
      allowComment: props.allowComment
    },
    state: {
      commentsCount: comments.value.length,
      totalComments: totalComments.value,
      isLoading: isLoading.value,
      isSubmitting: isSubmitting.value
    },
    comments: comments.value.map(c => ({
      id: c.id,
      content: c.content?.substring(0, 30) + '...',
      userId: c.userId,
      isAuthor: c.isAuthor,
      createdAt: c.createdAt
    }))
  })    // 如果没有评论，添加一些测试数据
  if (comments.value.length === 0) {
    console.log('🧪 添加大量测试评论数据以测试滚动功能和二级评论')
    const testComments = []
    
    // 生成15条测试评论
    for (let i = 1; i <= 15; i++) {
      testComments.push({
        id: `test-${i}`,
        content: `这是第 ${i} 条测试评论。Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        userId: `test-user-${i}`,
        userName: `测试用户${i}`,
        userNickname: `用户${i}`,
        userAvatar: '/default-avatar.png',
        isAuthor: i === 1,
        isPinned: i <= 2,
        replies: i <= 5 ? [
          {
            id: `reply-${i}-1`,
            content: `这是对第 ${i} 条评论的第一个回复。Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.`,
            createdAt: new Date(Date.now() - i * 3600000 + 1800000).toISOString(),
            userId: `reply-user-${i}-1`,
            userName: `回复用户${i}A`,
            userNickname: `回复者${i}A`,
            userAvatar: '/default-avatar.png',
            parentId: `test-${i}`,
            replyTo: `test-user-${i}`,
            replyToUser: `用户${i}`
          },
          {
            id: `reply-${i}-2`,
            content: `这是对第 ${i} 条评论的第二个回复。Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
            createdAt: new Date(Date.now() - i * 3600000 + 3600000).toISOString(),
            userId: `reply-user-${i}-2`,
            userName: `回复用户${i}B`,
            userNickname: `回复者${i}B`,
            userAvatar: '/default-avatar.png',
            parentId: `test-${i}`,
            replyTo: `reply-user-${i}-1`,
            replyToUser: `回复者${i}A`
          }        ] : []
      })
    }
    
    comments.value = testComments
    totalComments.value = testComments.length
    
    console.log(`✅ 已生成 ${testComments.length} 条测试评论`)
      // 添加滚动测试提示
    setTimeout(() => {
      const commentsList = document.querySelector('.comments-list')
      if (commentsList) {
        console.log('📏 评论列表容器信息 (无内部滚动):', {
          scrollHeight: commentsList.scrollHeight,
          clientHeight: commentsList.clientHeight,
          offsetHeight: commentsList.offsetHeight,
          hasMaxHeight: getComputedStyle(commentsList).maxHeight !== 'none',
          overflowY: getComputedStyle(commentsList).overflowY
        })
        
        console.log('✅ 评论列表已移除内部滚动限制，评论将自然流动在父容器中')
      }
    }, 500)
  }
}

// 在全局暴露调试函数
window.debugComments = debugCommentData

// 评论相关方法
const submitComment = async () => {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  
  try {
    console.log('📝 开始提交评论:', {
      articleId: props.articleId,
      content: newCommentContent.value,
      contentLength: newCommentContent.value.trim().length
    })
    
    // 调用评论API
    const response = await commentAPI.createComment(props.articleId, {
      content: newCommentContent.value.trim()
    })
    
    console.log('✅ 评论提交成功:', response)
    
    // 清空输入框
    newCommentContent.value = ''
    
    console.log('🔄 评论提交成功，开始重新加载评论列表...')
    
    // 重新加载评论列表
    await loadComments()
    
    console.log('💬 评论发表成功并已刷新列表!')
    
  } catch (error) {
    console.error('❌ 评论提交失败:', error)
    console.error('❌ 错误详情:', {
      message: error.message,
      response: error.response,
      status: error.response?.status
    })
      // 改进错误提示，提供更友好的用户体验
    let errorMessage = '评论发表失败，请重试'
    if (error.response?.status === 401) {
      errorMessage = '请先登录再发表评论'
    } else if (error.response?.status === 403) {
      errorMessage = '您没有权限发表评论'
    } else if (error.response?.status === 429) {
      errorMessage = '发表评论过于频繁，请稍后再试'
    } else if (error.message?.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络后重试'
    }
    
    // 这里可以添加Toast通知组件显示错误
    alert(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const cancelComment = () => {
  newCommentContent.value = ''
}

const startReply = (comment) => {
  console.log('💬 开始回复评论:', comment)
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
  console.log('💬 开始回复回复:', { reply, parentComment })
  // 回复的回复实际上是回复到原始评论，但要@原回复用户
  replyingTo.value = parentComment.id
  replyContent.value = `@${reply.userNickname || reply.userName} `
  
  // 自动聚焦到回复输入框
  setTimeout(() => {
    const replyTextarea = document.querySelector('.reply-input-section textarea')
    if (replyTextarea) {
      replyTextarea.focus()
      // 将光标定位到内容末尾
      const length = replyTextarea.value.length
      replyTextarea.setSelectionRange(length, length)
    }
  }, 100)
}

const cancelReply = () => {
  console.log('❌ 取消回复')
  replyingTo.value = null
  replyContent.value = ''
}

const submitReply = async (parentComment) => {
  if (!canSubmitReply.value) return
  
  isSubmittingReply.value = true
  
  try {
    console.log('💬 开始提交回复:', {
      articleId: props.articleId,
      parentCommentId: parentComment.id,
      content: replyContent.value,
      contentLength: replyContent.value.trim().length
    })
    
    // 调用回复API
    const response = await commentAPI.createReply(props.articleId, parentComment.id, {
      content: replyContent.value.trim()
    })
    
    console.log('✅ 回复提交成功:', response)
    
    // 清空回复状态
    replyingTo.value = null
    replyContent.value = ''
    
    console.log('🔄 回复提交成功，开始重新加载评论列表...')
    
    // 重新加载评论列表
    await loadComments()
    
      } catch (error) {
    console.error('❌ 回复提交失败:', error)
    console.error('❌ 错误详情:', {
      message: error.message,
      response: error.response,
      status: error.response?.status
    })
    
    // 改进错误提示，提供更友好的用户体验
    let errorMessage = '回复发表失败，请重试'
    if (error.response?.status === 401) {
      errorMessage = '请先登录再发表回复'
    } else if (error.response?.status === 403) {
      errorMessage = '您没有权限发表回复'
    } else if (error.response?.status === 429) {
      errorMessage = '发表回复过于频繁，请稍后再试'
    } else if (error.message?.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络后重试'
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
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-content textarea:disabled {
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

/* 回复输入区域 */
.reply-input-section {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-left: 3rem;
}

.reply-input-box {
  display: flex;
  gap: 0.75rem;
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
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s;
  font-family: inherit;
}

.reply-input-section .input-content textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reply-input-section .input-content textarea:disabled {
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
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
  border-radius: 0.375rem;
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

.reply-input-section .btn-submit {
  background: #3b82f6;
  color: white;
}

/* 评论列表 */
.comments-list {
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  position: relative;
  /* 移除内部滚动，让评论自然流动 */
} border-left: 3px solid transparent;
  padding-left: 1rem;
  transition: border-color 0.2s;
  background: white;
}

.comment-item.is-author {
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-left: -1rem;
}

.comment-item.is-pinned {
  border-left-color: #f59e0b;
}

.comment-main {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
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
}

.comment-author {
  font-weight: 600;
  color: #1f2937;
}

.author-badge, .pinned-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.author-badge {
  background: #dcfce7;
  color: #166534;
}

.pinned-badge {
  background: #fef3c7;
  color: #92400e;
}

.comment-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.comment-text {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  color: #374151;
  font-size: 0.95rem;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.comment-actions, .reply-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: none;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
  color: #6b7280;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
  border-color: #e5e7eb;
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  color: #9ca3af;
}

.action-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  color: #9ca3af;
}

/* 回复相关 */
.comment-replies {
  margin-left: 2rem;
  margin-top: 1rem;
  padding-left: 1rem;
  border-left: 3px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 0 0.5rem 0.5rem 0;
  padding: 1rem;
}

.reply-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  position: relative;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-item::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: 1.5rem;
  width: 0.75rem;
  height: 2px;
  background: #e5e7eb;
}

.reply-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.reply-author {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.reply-to {
  color: #3b82f6;
  font-size: 0.75rem;
}

.reply-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.reply-text {
  margin-bottom: 0.5rem;
  line-height: 1.5;
  color: #374151;
  font-size: 0.875rem;
  word-wrap: break-word;
  white-space: pre-wrap;
}

/* 状态 */
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
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1rem;
}

/* 图标样式 */
.icon-comment::before { content: '💬'; }
.icon-like::before { content: '👍'; }
.icon-reply::before { content: '💭'; }

/* 响应式 */
@media (max-width: 640px) {
  .article-comments {
    margin: 1rem 0;
    padding: 0.75rem;
  }

  .comments-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .comment-notice {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
/* 响应式 */
@media (max-width: 640px) {
  .article-comments {
    margin: 0.5rem 0;
    padding: 0.75rem;
    border-radius: 0.5rem;
  }

  .comments-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
  }
  
  .comments-title {
    font-size: 1.25rem;
    text-align: center;
  }
  
  .comments-sort {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .comment-notice {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
    padding: 1rem;
  }
  
  .comment-input-section {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .comment-input-box,
  .reply-input-box {
    flex-direction: column;
    gap: 0.75rem;
  }

  .input-avatar {
    align-self: flex-start;
  }
  
  .input-avatar img {
    width: 32px;
    height: 32px;
  }
  
  .comment-replies {
    margin-left: 1rem;
    padding: 0.75rem;
  }
  
  .reply-input-section {
    margin-left: 0.5rem;
    padding: 0.75rem;
  }
  
  .comment-actions,
  .reply-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  
  .action-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
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