<template>
  <div class="category-manager">
    <div class="manager-header">
      <h2>分类管理</h2>
      <p>管理您的文章分类</p>
    </div>

    <!-- 创建/编辑分类表单 -->
    <div class="create-category-section">
      <h3>{{ isEditMode ? '编辑分类' : '创建新分类' }}</h3>
      
      <form @submit.prevent="handleSubmitCategory" class="create-form">
        <!-- 错误和成功信息显示 -->
        <div v-if="errorMessage" class="error-message">
          <i class="error-icon">⚠️</i>
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="success-message">
          <i class="success-icon">✅</i>
          {{ successMessage }}
        </div>

        <div class="form-group">
          <label>
            <i class="icon">📁</i>
            分类名称
          </label>
          <input
            v-model="categoryForm.name"
            type="text"
            placeholder="请输入分类名称"
            required
          >
        </div>

        <div class="form-group">
          <label>
            <i class="icon">🌳</i>
            父分类
          </label>
          <select v-model="categoryForm.parentId">
            <option value="0">根分类（无父分类）</option>
            <option 
              v-for="category in flatCategories" 
              :key="category.categoryId" 
              :value="category.categoryId"
            >
              {{ category.displayName }}
            </option>
          </select>
        </div>

        <div class="form-actions">
          <button type="submit" class="create-btn" :disabled="isCreating || isUpdating">
            <span v-if="isEditMode && isUpdating">更新中...</span>
            <span v-else-if="!isEditMode && isCreating">创建中...</span>
            <span v-else-if="isEditMode">更新分类</span>
            <span v-else>创建分类</span>
          </button>
          <button type="button" @click="resetForm" class="reset-btn">
            {{ isEditMode ? '取消编辑' : '重置' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 分类列表 -->
    <div class="categories-section">
      <h3>现有分类</h3>
      
      <div v-if="isLoadingCategories" class="loading">
        加载分类中...
      </div>
      
      <div v-else-if="categories.length === 0" class="no-categories">
        暂无分类，请创建第一个分类
      </div>

      <div v-else class="categories-list">
        <div 
          v-for="category in categories"
          :key="category.categoryId"
          class="category-item"
        >
          <div class="category-info">
            <h4>
              <span v-if="category.children && category.children.length > 0">📁</span>
              <span v-else>📄</span>
              {{ category.name }}
            </h4>
            <p v-if="category.parentId && category.parentId !== 0" class="parent-info">
              父分类ID: {{ category.parentId }}
            </p>
            <small>
              创建时间: {{ formatDate(category.createTime) }}
            </small>
          </div>
          
          <div class="category-actions">
            <button 
              @click="editCategory(category)" 
              class="edit-btn"
              title="编辑分类"
            >
              ✏️
            </button>
            <button 
              @click="deleteCategory(category.categoryId)" 
              class="delete-btn"
              title="删除分类"
            >
              🗑️
            </button>
          </div>
          
          <!-- 递归显示子分类 -->
          <div v-if="category.children && category.children.length > 0" class="children">
            <div 
              v-for="child in category.children"
              :key="child.categoryId"
              class="category-item"
            >
              <div class="category-info">
                <h4>
                  <span v-if="child.children && child.children.length > 0">📁</span>
                  <span v-else>📄</span>
                  {{ child.name }}
                </h4>
                <p v-if="child.parentId && child.parentId !== 0" class="parent-info">
                  父分类ID: {{ child.parentId }}
                </p>
                <small>
                  创建时间: {{ formatDate(child.createTime) }}
                </small>
              </div>
              
              <div class="category-actions">
                <button 
                  @click="editCategory(child)" 
                  class="edit-btn"
                  title="编辑分类"
                >
                  ✏️
                </button>
                <button 
                  @click="deleteCategory(child.categoryId)" 
                  class="delete-btn"
                  title="删除分类"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 刷新按钮 -->
      <div class="refresh-section">
        <button @click="loadCategories" class="refresh-btn" :disabled="isLoadingCategories">
          <span v-if="isLoadingCategories">刷新中...</span>
          <span v-else>刷新分类列表</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { categoryAPI } from '@/services/api'

const categoryForm = reactive({
  name: '',
  parentId: 0
})

const categories = ref([])
const isCreating = ref(false)
const isLoadingCategories = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 编辑模式相关状态
const isEditMode = ref(false)
const editingCategoryId = ref(null)
const isUpdating = ref(false)

// 扁平化分类树，用于父分类选择下拉框
const flatCategories = computed(() => {
  const flatten = (categories, prefix = '') => {
    let result = []
    for (const category of categories) {
      result.push({
        ...category,
        displayName: prefix + category.name
      })
      if (category.children && category.children.length > 0) {
        result = result.concat(flatten(category.children, prefix + '　├ '))
      }
    }
    return result
  }
  return flatten(categories.value)
})

// 统一的表单提交处理
const handleSubmitCategory = async () => {
  if (!categoryForm.name.trim()) {
    errorMessage.value = '分类名称不能为空'
    return
  }

  const isEdit = isEditMode.value
  const actionRef = isEdit ? isUpdating : isCreating
  actionRef.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const categoryData = {
      name: categoryForm.name.trim(),
      parentId: categoryForm.parentId
    }

    console.log(`${isEdit ? '更新' : '创建'}分类请求数据:`, categoryData)

    let response
    if (isEdit) {
      response = await categoryAPI.updateCategory(editingCategoryId.value, categoryData)
    } else {
      response = await categoryAPI.createCategory(categoryData)
    }
    
    console.log(`${isEdit ? '更新' : '创建'}分类响应:`, response)

    // 检查响应格式
    if (response && response.code === 0) {
      successMessage.value = response.detail || response.message || `分类${isEdit ? '更新' : '创建'}成功`
      
      // 重置表单和状态
      resetForm()
      
      // 重新加载分类列表
      await loadCategories()
      
      console.log(`分类${isEdit ? '更新' : '创建'}成功:`, response.data)
    } else {
      errorMessage.value = response?.detail || response?.message || `${isEdit ? '更新' : '创建'}失败`
    }
  } catch (error) {
    console.error(`${isEdit ? '更新' : '创建'}分类失败:`, error)
    errorMessage.value = error.message || `${isEdit ? '更新' : '创建'}失败，请重试`
  } finally {
    actionRef.value = false
  }
}

// 加载分类列表
const loadCategories = async () => {
  isLoadingCategories.value = true
  
  try {
    console.log('正在加载分类树...')
    
    // 使用新的分类树API，获取用户的所有分类（树状结构）
    const response = await categoryAPI.getCategoryTree(0)
    console.log('分类树响应:', response)
    
    // 新的API直接返回分类数组（树状结构），不需要额外的包装
    if (Array.isArray(response)) {
      // 直接返回数组
      categories.value = response
    } else if (response && response.data && Array.isArray(response.data)) {
      // 如果有包装，提取data字段
      categories.value = response.data
    } else {
      console.warn('未知的响应格式:', response)
      categories.value = []
    }
    
    console.log('加载的分类数据:', categories.value)
  } catch (error) {
    console.error('加载分类列表失败:', error)
    categories.value = []
    errorMessage.value = '加载分类失败: ' + error.message
  } finally {
    isLoadingCategories.value = false
  }
}

// 删除分类
const deleteCategory = async (categoryId) => {
  if (!confirm('确定要删除这个分类吗？')) {
    return
  }

  try {
    const response = await categoryAPI.deleteCategory(categoryId)
    console.log('删除分类响应:', response)
    
    successMessage.value = '分类删除成功'
    await loadCategories()
  } catch (error) {
    console.error('删除分类失败:', error)
    errorMessage.value = '删除失败，请重试'
  }
}

// 编辑分类
const editCategory = (category) => {
  // 设置编辑模式
  isEditMode.value = true
  editingCategoryId.value = category.categoryId
  
  // 填入表单数据
  categoryForm.name = category.name
  categoryForm.parentId = category.parentId || 0
  
  // 清除之前的消息
  errorMessage.value = ''
  successMessage.value = ''
  
  // 滚动到表单
  document.querySelector('.create-category-section').scrollIntoView({ 
    behavior: 'smooth' 
  })
}

// 重置表单
const resetForm = () => {
  categoryForm.name = ''
  categoryForm.parentId = 0
  errorMessage.value = ''
  successMessage.value = ''
  
  // 重置编辑模式
  isEditMode.value = false
  editingCategoryId.value = null
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  try {
    return new Date(dateString).toLocaleString('zh-CN')
  } catch {
    return '格式错误'
  }
}

// 组件挂载时加载分类列表
onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.manager-header {
  text-align: center;
  margin-bottom: 32px;
}

.manager-header h2 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
}

.manager-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.create-category-section {
  margin-bottom: 40px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.create-category-section h3 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-message,
.success-message {
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.icon {
  font-size: 16px;
}

.form-group input,
.form-group select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.create-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-btn {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.categories-section h3 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.loading,
.no-categories {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-size: 14px;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.category-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.category-info h4 {
  margin: 0 0 4px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 500;
}

.category-info p {
  margin: 0 0 4px 0;
  color: #6b7280;
  font-size: 14px;
}

.category-info small {
  color: #9ca3af;
  font-size: 12px;
}

.category-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: #dbeafe;
}

.delete-btn:hover {
  background: #fef2f2;
}

.refresh-section {
  margin-top: 24px;
  text-align: center;
}

.refresh-btn {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 树状结构样式 */
.children {
  margin-left: 24px;
  padding-left: 16px;
  border-left: 2px solid #e5e7eb;
  margin-top: 8px;
}

.children .category-item {
  position: relative;
}

.children .category-item::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 20px;
  width: 12px;
  height: 1px;
  background: #e5e7eb;
}

.parent-info {
  color: #6b7280;
  font-size: 12px;
  margin: 4px 0;
}
</style>
