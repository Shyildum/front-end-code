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
              <span class="comment-author">{{ comment.userNickname || comment.userName }}</span>
              <span v-if="comment.isAuthor" class="author-badge">作者</span>
              <span v-if="comment.isPinned" class="pinned-badge">置顶</span>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            </div>
            
            <div class="comment-text">
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
                    <span v-else">发表回复</span>
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
              <div class="reply-text">{{ reply.content }}</div>
              <div class="reply-actions">
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
    const response = await commentAPI.getComments(props.articleId)
    const data = response.data || response
    
    let commentList = []
    if (Array.isArray(data)) {
      commentList = data
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.list)) {
        commentList = data.list
      } else if (Array.isArray(data.comments)) {
        commentList = data.comments
      } else if (Array.isArray(data.data)) {
        commentList = data.data
      }
    }
    
    // 标记文章作者的评论
    if (props.articleAuthorId) {
      commentList.forEach(comment => {
        if (comment.userId === props.articleAuthorId) {
          comment.isAuthor = true
        }
        if (comment.replies) {
          comment.replies.forEach(reply => {
            if (reply.userId === props.articleAuthorId) {
              reply.isAuthor = true
            }
          })
        }
      })
    }
    
    comments.value = commentList
    totalComments.value = commentList.length
    
    // 触发评论数量变化事件
    emit('comment-count-change', totalComments.value)
    
  } catch (error) {
    console.error('❌ 获取评论失败:', error)
  } finally {
    isLoading.value = false
  }
}

const onSortChange = () => {
  // 根据排序类型重新排列评论
  const sortedComments = [...comments.value]
  
  switch (sortType.value) {
    case 'newest':
      sortedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      break
    case 'oldest':
      sortedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      break
    case 'popular':
      // 暂时按赞数排序，如果没有赞数就按时间
      sortedComments.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      break
  }
  
  comments.value = sortedComments
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return date.toLocaleDateString('zh-CN')
  } catch (error) {
    console.warn('时间格式化失败:', error)
    return date.toLocaleDateString('zh-CN')
  }
}

// 调试工具函数
const debugCommentData = () => {
  // 如果没有评论，添加一些测试数据
  if (comments.value.length === 0) {
    console.log('🧪 添加测试评论数据')
    const testComments = []
    
    // 生成5条测试评论，其中前3条有回复
    for (let i = 1; i <= 5; i++) {
      testComments.push({
        id: `test-${i}`,
        content: `这是第 ${i} 条测试评论。这里有一些长内容来测试评论显示效果和换行功能。Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        userId: `test-user-${i}`,
        userName: `测试用户${i}`,
        userNickname: `用户${i}`,
        userAvatar: '/default-avatar.png',
        isAuthor: i === 1,
        isPinned: i <= 2,
        replies: i <= 3 ? [
          {
            id: `reply-${i}-1`,
            content: `这是对第 ${i} 条评论的第一个回复。`,
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
            content: `这是对第 ${i} 条评论的第二个回复。`,
            createdAt: new Date(Date.now() - i * 3600000 + 3600000).toISOString(),
            userId: `reply-user-${i}-2`,
            userName: `回复用户${i}B`,
            userNickname: `回复者${i}B`,
            userAvatar: '/default-avatar.png',
            parentId: `test-${i}`,
            replyTo: `reply-user-${i}-1`,
            replyToUser: `回复者${i}A`
          }
        ] : []
      })
    }
    
    comments.value = testComments
    totalComments.value = testComments.length
    console.log(`✅ 已生成 ${testComments.length} 条测试评论`)
  }
}

// 评论相关方法
const submitComment = async () => {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  
  try {
    const response = await commentAPI.createComment(props.articleId, {
      content: newCommentContent.value.trim()
    })
    
    // 清空输入框
    newCommentContent.value = ''
    
    // 重新加载评论列表
    await loadComments()
    
  } catch (error) {
    console.error('❌ 评论提交失败:', error)
    alert(`评论发表失败: ${error.message || '请重试'}`)
  } finally {
    isSubmitting.value = false
  }
}

const cancelComment = () => {
  newCommentContent.value = ''
}

// 回复相关方法
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
  replyingTo.value = parentComment.id
  replyContent.value = `@${reply.userNickname || reply.userName} `
  
  // 自动聚焦到回复输入框
  setTimeout(() => {
    const replyTextarea = document.querySelector('.reply-input-section textarea')
    if (replyTextarea) {
      replyTextarea.focus()
      replyTextarea.setSelectionRange(replyTextarea.value.length, replyTextarea.value.length)
    }
  }, 100)
}

const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

const submitReply = async (parentComment) => {
  if (!canSubmitReply.value) return
  
  isSubmittingReply.value = true
  
  try {
    await commentAPI.createReply(props.articleId, parentComment.id, {
      content: replyContent.value.trim()
    })
    
    // 清空回复状态
    replyingTo.value = null
    replyContent.value = ''
    
    // 重新加载评论列表
    await loadComments()
    
  } catch (error) {
    console.error('❌ 回复提交失败:', error)
    alert(`回复发表失败: ${error.message || '请重试'}`)
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

// 在全局暴露调试函数
window.debugComments = debugCommentData
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
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  position: relative;
}

.comments-list::-webkit-scrollbar {
  width: 8px;
}

.comments-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
  margin: 4px 0;
}

.comments-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  border: 1px solid #f1f5f9;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.comments-list::-webkit-scrollbar-corner {
  background: #f1f5f9;
}

.comment-item {
  margin-bottom: 1.5rem;
  border-left: 3px solid transparent;
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
  font-size: 0.875rem;
}

.author-badge {
  background: #10b981;
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.pinned-badge {
  background: #f59e0b;
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.comment-time {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: auto;
}

.comment-text {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  color: #374151;
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
  
  .comment-replies {
    margin-left: 1rem;
  }
  
  .comment-actions,
  .reply-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .comment-input-box {
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-avatar {
    align-self: flex-start;
  }
}
</style>
