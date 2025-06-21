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
      </div>
    </div>

    <!-- 功能提示 -->
    <div class="comment-notice">
      <div class="notice-icon">💬</div>
      <div class="notice-text">
        <p><strong>评论功能即将上线</strong></p>
        <p>目前可以查看已有评论，发表评论功能正在开发中，敬请期待！</p>
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
            
            <div class="comment-text">{{ comment.content }}</div>
            
            <div class="comment-actions">
              <button 
                class="action-btn disabled" 
                title="点赞功能即将上线"
              >
                <i class="icon-like"></i>
                赞
              </button>
              
              <button 
                class="action-btn disabled"
                title="回复功能即将上线"
              >
                <i class="icon-reply"></i>
                回复
              </button>
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
                  class="action-btn disabled"
                  title="回复功能即将上线"
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

// 当前用户信息
const currentUserName = ref('当前用户')
const currentUserAvatar = ref('/default-avatar.png')
const currentUserId = ref(null)

// 方法
const loadComments = async () => {
  isLoading.value = true

  try {
    console.log('🔍 加载评论:', {
      articleId: props.articleId,
      sortType: sortType.value
    })
    
    // 调用评论API
    const response = await commentAPI.getComments(props.articleId, {
      sort: sortType.value
    })

    // 处理响应数据
    const data = response.data || response
    const commentList = data.list || data || []
    
    // 设置作者标识
    if (commentList && commentList.length > 0) {
      commentList.forEach(comment => {
        // 判断是否为文章作者
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
    emit('comment-count-change', totalComments.value)

    console.log('✅ 评论加载完成:', {
      total: totalComments.value,
      comments: comments.value.length
    })

  } catch (error) {
    console.error('❌ 加载评论失败:', error)
  } finally {
    isLoading.value = false
  }
}

const onSortChange = () => {
  console.log('🔄 排序方式变更:', sortType.value)
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
  margin: 2rem 0;
}

/* 评论头部 */
.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.comments-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
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
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

/* 功能提示 */
.comment-notice {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
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
  margin-bottom: 0.5rem;
}

/* 评论列表 */
.comment-item {
  margin-bottom: 1.5rem;
  border-left: 3px solid transparent;
  padding-left: 1rem;
  transition: border-color 0.2s;
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
  cursor: not-allowed;
  font-size: 0.75rem;
  color: #9ca3af;
  transition: all 0.2s;
}

.action-btn.disabled {
  opacity: 0.6;
}

/* 回复相关 */
.comment-replies {
  margin-left: 3rem;
  padding-left: 1rem;
  border-left: 2px solid #e5e7eb;
}

.reply-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.reply-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
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

/* 响应式 */
@media (max-width: 640px) {
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
}
</style>
