/**
 * 评论API服务
 * 集成用户提供的评论API接口
 */

import api from './api.js'

/**
 * 数据转换工具 - 将后端数据格式转换为前端需要的格式
 * 根据后端响应结构: commentId, userId, username, nickname, avatar, content, createTime, subComments
 */
const transformComment = (commentData) => {
  if (!commentData) {
    return null
  }
  
  const transformed = {
    id: commentData.commentId || commentData.comment_id || commentData.id,
    content: commentData.content,
    createdAt: commentData.createTime || commentData.create_time || commentData.createdAt,
    userId: commentData.userId || commentData.user_id,
    userName: commentData.username || commentData.userName || `用户${commentData.userId || '未知'}`,
    userNickname: commentData.nickname || commentData.userNickname || `用户${commentData.userId || '未知'}`,
    userAvatar: commentData.avatar || '/default-avatar.png',
    isAuthor: false,
    isPinned: false,
    isLiked: false,
    likeCount: 0,
    subComments: []
  }
  
  // 处理回复/子评论
  const subComments = commentData.subComments || commentData.sub_comments || commentData.replies || []
  if (subComments && Array.isArray(subComments)) {
    transformed.subComments = subComments.map((subComment) => {
      return {
        id: subComment.commentId || subComment.comment_id || subComment.id,
        content: subComment.content,
        createdAt: subComment.createTime || subComment.create_time || subComment.createdAt,
        userId: subComment.userId || subComment.user_id,
        userName: subComment.username || subComment.userName || `用户${subComment.userId || '未知'}`,
        userNickname: subComment.nickname || subComment.userNickname || `用户${subComment.userId || '未知'}`,
        userAvatar: subComment.avatar || '/default-avatar.png',
        parentId: transformed.id,
        replyTo: subComment.replyUserId || subComment.reply_user_id,
        replyToUser: subComment.replyNickname || subComment.replyUsername || subComment.reply_nickname || subComment.reply_username,
        isLiked: false,
        likeCount: 0
      }
    }).filter(reply => reply.id && reply.content)
  }
  
  if (!transformed.id || !transformed.content) {
    return null
  }
  
  return transformed
}

export const commentAPI = {
  // 获取文章评论列表
  getComments: async (articleId, options = {}) => {
    try {
      const response = await api.get(`/articles/${articleId}/comments`)
      
      let rawData = response.data || response
      let commentsList = []
      
      if (Array.isArray(rawData)) {
        commentsList = rawData
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.data)) {
          commentsList = rawData.data
        } else {
          commentsList = []
        }
      }
      
      const transformedComments = commentsList.map(transformComment).filter(Boolean)
      
      const result = {
        code: 200,
        data: {
          list: transformedComments,
          total: transformedComments.length,
          pageNum: 1,
          pageSize: transformedComments.length
        }
      }
      
      return result
      
    } catch (error) {
      console.error('❌ 获取评论失败:', error)
      throw error
    }
  },

  // 发表评论
  createComment: async (articleId, commentData) => {
    try {
      // 构建请求数据，符合后端API结构
      const requestData = {
        content: commentData.content,
        replyId: commentData.replyId || null,  // 回复的评论ID，null表示不是回复
        rootId: commentData.rootId || null     // 一级评论ID，null表示这是一级评论
      }
      
      // 调用后端API - POST /articles/{articleId}/comments
      const response = await api.post(`/articles/${articleId}/comments`, requestData)
      
      // 处理响应数据
      let responseData = response.data || response
      if (responseData.data) {
        responseData = responseData.data
      }
      
      // 转换返回的评论数据格式
      const newComment = transformComment(responseData)
      
      return {
        code: 200,
        data: newComment,
        message: '评论发表成功'
      }
      
    } catch (error) {
      console.error('❌ 发表评论失败:', error)
      throw error
    }
  },

  // 回复评论 (已废弃，现在统一使用 createComment)
  // 保留此方法以向后兼容，但建议直接使用 createComment
  createReply: async (articleId, parentCommentId, replyData) => {
    try {
      // 自动确定这是二级回复还是三级回复
      // 如果 replyData 中有 rootId，说明这是三级回复；否则是二级回复
      const isNestedReply = replyData.rootId && replyData.rootId !== parentCommentId
      
      const commentData = {
        content: replyData.content,
        replyId: isNestedReply ? parentCommentId : null,  // 三级回复时回复具体评论，二级回复时为null
        rootId: isNestedReply ? replyData.rootId : parentCommentId  // 根评论ID
      }
      
      // 复用createComment方法
      return await commentAPI.createComment(articleId, commentData)
      
    } catch (error) {
      console.error('❌ 回复评论失败:', error)
      throw error
    }
  },

  // 点赞评论 (暂不支持，后续可扩展)
  likeComment: async (commentId) => {
    throw new Error('点赞功能暂不支持，敬请期待')
  },

  // 取消点赞评论 (暂不支持，后续可扩展)
  unlikeComment: async (commentId) => {
    throw new Error('取消点赞功能暂不支持，敬请期待')
  },

  // 删除评论 (暂不支持，后续可扩展)
  deleteComment: async (commentId) => {
    throw new Error('删除评论功能暂不支持，敬请期待')
  },

  // 置顶评论 (暂不支持，后续可扩展)
  pinComment: async (commentId) => {
    throw new Error('置顶评论功能暂不支持，敬请期待')
  },

  // 取消置顶评论 (暂不支持，后续可扩展)
  unpinComment: async (commentId) => {
    throw new Error('取消置顶评论功能暂不支持，敬请期待')
  }
}

export default commentAPI
