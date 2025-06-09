/**
 * API使用示例 - 展示修正后的分类API和其他增强功能
 */

import {
  getCategoryTree,
  getCategoryPath,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  simpleSearch,
  createArticle,
  updateArticle
} from '../services/api.js'

/**
 * 分类操作示例
 */
export class CategoryExamples {
  // 获取完整的分类树结构
  static async loadCategoryTree() {
    try {
      const response = await getCategoryTree()
      console.log('分类树:', response.data)
      return response.data
    } catch (error) {
      console.error('获取分类树失败:', error)
      throw error
    }
  }

  // 获取指定分类到根节点的路径
  static async getCategoryBreadcrumb(categoryId) {
    try {
      const response = await getCategoryPath(categoryId)
      console.log('分类路径:', response.data)
      return response.data
    } catch (error) {
      console.error('获取分类路径失败:', error)
      throw error
    }
  }

  // 获取所有分类路径信息
  static async getAllCategoryPaths() {
    try {
      const response = await getCategoryPath()
      console.log('所有分类路径:', response.data)
      return response.data
    } catch (error) {
      console.error('获取所有分类路径失败:', error)
      throw error
    }
  }

  // 创建新分类
  static async createNewCategory(name, description, parentId = null) {
    try {
      const categoryData = {
        name,
        description,
        parentId,
        color: '#667eea',
        icon: 'folder'
      }
      const response = await createCategory(categoryData)
      console.log('分类创建成功:', response.data)
      return response.data
    } catch (error) {
      console.error('创建分类失败:', error)
      throw error
    }
  }

  // 更新分类信息
  static async updateCategoryInfo(categoryId, updates) {
    try {
      const response = await updateCategory(categoryId, updates)
      console.log('分类更新成功:', response.data)
      return response.data
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  }

  // 删除分类
  static async removeCategory(categoryId) {
    try {
      const response = await deleteCategory(categoryId)
      console.log('分类删除成功')
      return response
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }
}

/**
 * 文章操作示例
 */
export class ArticleExamples {
  // 搜索文章
  static async searchArticles(keyword, page = 1, pageSize = 10) {
    try {
      const response = await simpleSearch(keyword, page, pageSize)
      console.log('搜索结果:', response.data)
      return response.data
    } catch (error) {
      console.error('文章搜索失败:', error)
      throw error
    }
  }

  // 创建新文章（支持多种字段格式）
  static async createNewArticle(articleInfo) {
    try {
      const articleData = {
        title: articleInfo.title,
        summary: articleInfo.summary || '',
        content: articleInfo.content,
        categoryId: articleInfo.categoryId, // 支持 categoryId
        category_id: articleInfo.category_id, // 也支持 category_id
        isShared: articleInfo.isShared || false, // 支持 isShared
        is_shared: articleInfo.is_shared || false, // 也支持 is_shared
        status: articleInfo.status || 'draft' // 支持状态字段
      }
      
      const response = await createArticle(articleData)
      console.log('文章创建成功:', response.data)
      return response.data
    } catch (error) {
      console.error('创建文章失败:', error)
      throw error
    }
  }

  // 更新文章
  static async updateExistingArticle(articleId, updates) {
    try {
      const response = await updateArticle(articleId, updates)
      console.log('文章更新成功:', response.data)
      return response.data
    } catch (error) {
      console.error('更新文章失败:', error)
      throw error
    }
  }
}

/**
 * 完整的工作流程示例
 */
export class WorkflowExamples {
  // 创建文章的完整流程
  static async createArticleWorkflow() {
    try {
      console.log('开始创建文章流程...')

      // 1. 加载分类树
      const categories = await CategoryExamples.loadCategoryTree()
      console.log('已加载分类树')

      // 2. 选择一个分类（这里使用第一个分类作为示例）
      const selectedCategory = categories[0]
      console.log('选择的分类:', selectedCategory.name)

      // 3. 获取选择分类的路径（用于面包屑导航）
      const categoryPath = await CategoryExamples.getCategoryBreadcrumb(selectedCategory.id)
      console.log('分类路径:', categoryPath)

      // 4. 创建文章
      const newArticle = await ArticleExamples.createNewArticle({
        title: '示例文章标题',
        summary: '这是一个示例文章的摘要',
        content: '这是示例文章的完整内容...',
        categoryId: selectedCategory.id,
        isShared: false,
        status: 'draft'
      })

      console.log('文章创建流程完成:', newArticle)
      return newArticle

    } catch (error) {
      console.error('创建文章流程失败:', error)
      throw error
    }
  }

  // 分类管理的完整流程
  static async categoryManagementWorkflow() {
    try {
      console.log('开始分类管理流程...')

      // 1. 获取所有分类路径信息
      const allPaths = await CategoryExamples.getAllCategoryPaths()
      console.log('所有分类路径:', allPaths)

      // 2. 创建新的顶级分类
      const newCategory = await CategoryExamples.createNewCategory(
        '新技术分类',
        '关于新技术的文章分类'
      )

      // 3. 创建子分类
      const subCategory = await CategoryExamples.createNewCategory(
        'AI技术',
        '人工智能相关技术',
        newCategory.id
      )

      // 4. 更新分类信息
      const updatedCategory = await CategoryExamples.updateCategoryInfo(subCategory.id, {
        name: 'AI与机器学习',
        description: '人工智能与机器学习相关技术',
        color: '#f093fb',
        icon: 'brain'
      })

      // 5. 获取更新后的分类路径
      const updatedPath = await CategoryExamples.getCategoryBreadcrumb(updatedCategory.id)

      console.log('分类管理流程完成')
      return {
        newCategory,
        subCategory: updatedCategory,
        categoryPath: updatedPath
      }

    } catch (error) {
      console.error('分类管理流程失败:', error)
      throw error
    }
  }

  // 文章搜索和管理流程
  static async articleSearchWorkflow(searchKeyword) {
    try {
      console.log('开始文章搜索流程...')

      // 1. 执行搜索
      const searchResults = await ArticleExamples.searchArticles(searchKeyword)
      console.log('搜索到', searchResults.length, '篇文章')

      // 2. 处理搜索结果
      const processedResults = []
      
      for (const article of searchResults) {
        // 获取文章分类的路径信息
        let categoryPath = null
        if (article.categoryId) {
          try {
            categoryPath = await CategoryExamples.getCategoryBreadcrumb(article.categoryId)
          } catch (error) {
            console.warn('获取文章分类路径失败:', error)
          }
        }

        processedResults.push({
          ...article,
          categoryPath
        })
      }

      console.log('文章搜索流程完成')
      return processedResults

    } catch (error) {
      console.error('文章搜索流程失败:', error)
      throw error
    }
  }
}

// 使用示例
export const runExamples = async () => {
  try {
    console.log('🚀 开始API使用示例演示...')

    // 示例1: 创建文章流程
    console.log('\n📝 示例1: 创建文章流程')
    await WorkflowExamples.createArticleWorkflow()

    // 示例2: 分类管理流程
    console.log('\n📁 示例2: 分类管理流程')
    await WorkflowExamples.categoryManagementWorkflow()

    // 示例3: 文章搜索流程
    console.log('\n🔍 示例3: 文章搜索流程')
    await WorkflowExamples.articleSearchWorkflow('技术')

    console.log('\n✅ 所有示例执行完成！')

  } catch (error) {
    console.error('❌ 示例执行失败:', error)
  }
}

export default {
  CategoryExamples,
  ArticleExamples,
  WorkflowExamples,
  runExamples
}

// 在控制台中运行示例:
// import examples from './api-usage-examples.js'
// examples.runExamples()
