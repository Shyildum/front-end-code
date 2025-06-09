<template>
  <div class="article-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="header-left">
        <button class="btn-back" @click="$emit('close')">
          <i class="icon-arrow-left"></i>
          返回
        </button>
        <div class="editor-title">
          <h2 v-if="isEditing">编辑文章</h2>
          <h2 v-else>创建新文章</h2>
        </div>
      </div>
      <div class="header-right">
        <select v-model="article.status" class="status-select">
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
        <button class="btn-save" @click="saveDraft" :disabled="isSaving">
          <i class="icon-save"></i>
          {{ isSaving ? '保存中...' : '保存草稿' }}
        </button>
        <button class="btn-publish" @click="publishArticle" :disabled="isSaving || !canPublish">
          <i class="icon-publish"></i>
          {{ article.status === 'published' ? '更新发布' : '发布文章' }}
        </button>
      </div>
    </div>

    <!-- 文章基本信息 -->
    <div class="article-meta-form">
      <div class="form-row">
        <div class="form-group title-group">
          <input 
            v-model="article.title" 
            type="text" 
            placeholder="请输入文章标题..." 
            class="title-input"
            @blur="validateTitle"
            :class="{ error: titleError }"
          >
          <div v-if="titleError" class="error-message">{{ titleError }}</div>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>文章摘要</label>
          <textarea 
            v-model="article.summary" 
            placeholder="请输入文章摘要..."
            class="summary-input"
            rows="3"
            maxlength="200"
          ></textarea>
          <div class="char-count">{{ article.summary.length }}/200</div>
        </div>
          <div class="form-group">
          <label>分类</label>
          <select v-model="article.categoryId" class="category-select">
            <option value="0">无分类</option>
            <option v-for="category in categories" :key="category.categoryId" :value="category.categoryId">
              {{ category.name }}
            </option>
          </select>
        </div>
          <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="article.isShared">
            <span class="checkmark"></span>
            公开分享
          </label>
          <div class="form-hint">勾选后其他用户可以查看此文章</div>
        </div>
      </div>
    </div>

    <!-- Vditor 编辑器容器 -->
    <div class="editor-container">
      <div id="vditor" ref="vditorElement"></div>
    </div>

    <!-- 保存提示 -->
    <div v-if="saveMessage" class="save-message" :class="saveMessageType">
      {{ saveMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { articleAPI, categoryAPI } from '@/services/api'

// Props 和 Emits
const props = defineProps({
  articleId: {
    type: [String, Number],
    default: null
  },
  originalArticle: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

// 响应式数据
const vditor = ref(null)
const vditorElement = ref(null)
const isSaving = ref(false)
const isEditing = computed(() => !!props.articleId)
const categories = ref([])
const titleError = ref('')
const saveMessage = ref('')
const saveMessageType = ref('success')

// 文章数据
const article = reactive({
  title: '',
  summary: '',
  content: '',
  categoryId: 0, // 使用API规范的字段名，0表示无分类
  isShared: false, // 使用API规范的字段名
  status: 'draft'
})

// 验证
const canPublish = computed(() => {
  return article.title.trim() && 
         article.summary.trim() && 
         article.content.trim() && 
         article.categoryId > 0  // 确保选择了有效分类
})

// 方法
const validateTitle = () => {
  titleError.value = ''
  if (!article.title.trim()) {
    titleError.value = '文章标题不能为空'
  } else if (article.title.length > 100) {
    titleError.value = '标题长度不能超过100个字符'
  }
}

const showSaveMessage = (message, type = 'success') => {
  saveMessage.value = message
  saveMessageType.value = type
  setTimeout(() => {
    saveMessage.value = ''
  }, 3000)
}

const initVditor = () => {
  console.log('🔧 初始化Vditor编辑器...')
  
  vditor.value = new Vditor(vditorElement.value, {
    height: 'calc(100vh - 280px)',
    mode: 'wysiwyg',
    placeholder: '开始书写你的文章...',
    theme: 'classic',
    icon: 'material',
    preview: {
      theme: {
        current: 'light'
      }
    },
    counter: {
      enable: true,
      type: 'markdown'
    },
    cache: {
      enable: false
    },
    after: () => {
      console.log('✅ Vditor编辑器初始化完成')
      
      // 编辑器初始化完成后，立即设置内容
      if (article.content) {
        console.log('📝 在after回调中设置编辑器内容:', article.content.substring(0, 100) + '...')
        vditor.value.setValue(article.content)
      }
      
      // 如果是编辑模式且还没有内容，尝试加载文章
      if (isEditing.value && !article.content) {
        console.log('🔄 编辑器初始化完成，开始加载文章内容')
        loadArticle()
      }
    },
    input: (value) => {
      article.content = value
      // 自动保存草稿
      autoSaveDraft()
    },
    toolbar: [
      'emoji',
      'headings',
      'bold',
      'italic',
      'strike',
      'link',
      '|',
      'list',
      'ordered-list',
      'check',
      'outdent',
      'indent',
      '|',
      'quote',
      'line',
      'code',
      'inline-code',
      'insert-before',
      'insert-after',
      '|',
      'table',
      'undo',
      'redo',
      '|',
      'edit-mode',
      'content-theme',
      'code-theme',
      '|',
      'outline',
      'preview',
      'fullscreen'
    ]
  })
}

// 自动保存草稿 (防抖)
let autoSaveTimer = null
const autoSaveDraft = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  autoSaveTimer = setTimeout(() => {
    if (article.title.trim() && article.content.trim()) {
      saveDraft(true) // 静默保存
    }
  }, 10000) // 10秒后自动保存
}

const saveDraft = async (silent = false) => {
  if (isSaving.value) return
  
  validateTitle()
  if (titleError.value) {
    showSaveMessage('请修正错误后再保存', 'error')
    return
  }

  if (!article.title.trim()) {
    showSaveMessage('请输入文章标题', 'error')
    return
  }

  isSaving.value = true
  
  try {    const articleData = {
      title: article.title,
      summary: article.summary,
      content: article.content, // 直接传markdown内容
      categoryId: article.categoryId || 0, // 使用API规范的字段名
      isShared: article.isShared, // 使用API规范的字段名
      status: 'draft'
    }

    let result
    if (isEditing.value) {
      result = await articleAPI.updateArticle(props.articleId, articleData)
    } else {
      result = await articleAPI.createArticle(articleData)
    }

    if (!silent) {
      showSaveMessage('草稿保存成功', 'success')
    }
    
    emit('saved', result)
  } catch (error) {
    console.error('保存文章失败:', error)
    showSaveMessage('保存失败，请重试', 'error')
  } finally {
    isSaving.value = false
  }
}

const publishArticle = async () => {
  if (isSaving.value || !canPublish.value) return
  
  validateTitle()
  if (titleError.value) {
    showSaveMessage('请修正错误后再发布', 'error')
    return
  }

  if (!canPublish.value) {
    showSaveMessage('请完善文章信息后再发布', 'error')
    return
  }

  isSaving.value = true
    try {
    const articleData = {
      title: article.title,
      summary: article.summary,
      content: article.content,
      categoryId: article.categoryId, // 使用API规范的字段名
      isShared: article.isShared, // 使用API规范的字段名
      status: 'published'
    }

    let result
    if (isEditing.value) {
      result = await articleAPI.updateArticle(props.articleId, articleData)
    } else {
      result = await articleAPI.createArticle(articleData)
    }

    article.status = 'published'
    showSaveMessage('文章发布成功', 'success')
    emit('saved', result)
  } catch (error) {
    console.error('发布文章失败:', error)
    showSaveMessage('发布失败，请重试', 'error')
  } finally {
    isSaving.value = false
  }
}

const handleSave = async (silent = false) => {
  if (isSaving.value) return
  
  validateTitle()
  if (titleError.value) {
    showSaveMessage('请先修正错误', 'error') 
    return
  }

  if (!article.title.trim()) {
    showSaveMessage('请输入文章标题', 'error')
    return
  }

  isSaving.value = true
  
  try {    
    const articleData = {
      title: article.title,
      summary: article.summary,
      content: article.content,
      categoryId: article.categoryId || 0,
      isShared: article.isShared,
      status: article.status
    }

    // 检查 isShared 的修改
    if (isEditing.value && props.originalArticle) {
      if (props.originalArticle.isShared && !articleData.isShared) {
        showSaveMessage('已分享的文章不能取消分享', 'error')
        return
      }
    }

    // 检查 status 的修改 
    if (isEditing.value && props.originalArticle) {
      if (props.originalArticle.status === 'published' && 
          articleData.status === 'draft') {
        showSaveMessage('已发布的文章不能改为草稿', 'error')
        return
      }
    }

    let result
    if (isEditing.value) {
      result = await articleAPI.updateArticle(props.articleId, articleData)
    } else {
      result = await articleAPI.createArticle(articleData)
    }

    if (!silent) {
      showSaveMessage('保存成功', 'success')
    }
    
    emit('saved', result)
  } catch (error) {
    console.error('保存文章失败:', error)
    showSaveMessage('保存失败，请重试', 'error') 
  } finally {
    isSaving.value = false
  }
}

const loadCategories = async () => {
  try {
    // 使用分类树API获取用户的分类
    const response = await categoryAPI.getCategoryTree(0)
    
    // 将树状结构扁平化为选择列表
    const flattenCategories = (categories) => {
      let result = []
      const traverse = (cats, prefix = '') => {
        for (const cat of cats) {
          result.push({
            categoryId: cat.categoryId,
            id: cat.categoryId, // 兼容旧的id字段
            name: prefix + cat.name
          })
          if (cat.children && cat.children.length > 0) {
            traverse(cat.children, prefix + '　├ ')
          }
        }
      }
      traverse(categories)
      return result
    }
    
    // 处理响应格式
    let categoryData = []
    if (Array.isArray(response)) {
      categoryData = response
    } else if (response && response.data && Array.isArray(response.data)) {
      categoryData = response.data
    } else {
      console.warn('未知的分类响应格式:', response)
      categoryData = []
    }
    
    categories.value = flattenCategories(categoryData)
    console.log('加载的用户分类:', categories.value)
  } catch (error) {
    console.error('加载分类失败:', error)
    // 如果加载失败，显示空列表
    categories.value = []
  }
}

const loadArticle = async () => {
  if (!isEditing.value) return
  
  try {
    console.log('🔍 正在加载文章，ID:', props.articleId)
    
    // 优先使用传递的originalArticle数据
    if (props.originalArticle) {
      console.log('📄 使用传递的文章数据:', props.originalArticle.title)
      const articleData = props.originalArticle
      
      // 设置文章数据
      article.title = articleData.title || ''
      article.summary = articleData.summary || ''
      
      // 处理content和contentUrl
      if (articleData.content) {
        article.content = articleData.content
        console.log('✅ 使用已有内容，长度:', article.content.length)
      } else if (articleData.contentUrl) {
        console.log('📥 从contentUrl加载内容:', articleData.contentUrl)
        try {
          // 确保方法存在
          if (typeof articleAPI.loadArticleContent !== 'function') {
            console.error('❌ articleAPI.loadArticleContent 方法未定义')
            throw new Error('文章内容加载方法未定义')
          }
          
          article.content = await articleAPI.loadArticleContent(articleData)
          console.log('✅ 从contentUrl加载内容成功，长度:', article.content.length)
        } catch (error) {
          console.error('❌ 从contentUrl加载内容失败:', error)
          article.content = '# 文章内容加载失败\n\n' + error.message
        }
      } else {
        article.content = ''
      }
      
      // 兼容不同的字段名格式
      if (articleData.categoryId !== undefined) {
        article.categoryId = Number(articleData.categoryId)
      } else if (articleData.category_id !== undefined) {
        article.categoryId = Number(articleData.category_id)
      } else {
        article.categoryId = 0
      }
      
      // 兼容不同的分享状态字段名
      article.isShared = articleData.isShared !== undefined ? 
        Boolean(articleData.isShared) : 
        (articleData.is_shared !== undefined ? 
          Boolean(articleData.is_shared) : false)
      
      article.status = articleData.status || 'draft'
      
      console.log('✅ 使用传递数据设置完成:', {
        title: article.title,
        contentLength: article.content.length,
        categoryId: article.categoryId,
        isShared: article.isShared,
        status: article.status
      })
      
      // 确保编辑器已初始化再设置内容
      if (vditor.value && article.content) {
        console.log('📝 设置编辑器内容，长度:', article.content.length)
        await new Promise(resolve => setTimeout(resolve, 100))
        vditor.value.setValue(article.content)
        console.log('✅ 编辑器内容已设置')
      }
      
      return
    }
    
    // 如果没有传递数据，从API加载
    console.log('🌐 从API加载文章数据...')
    const response = await articleAPI.getArticle(props.articleId)
    const articleData = response.data || response
    
    // 规范化字段名
    article.title = articleData.title || ''
    article.summary = articleData.summary || ''
    article.content = articleData.content || '' // API已经处理了contentUrl
    
    if (articleData.categoryId !== undefined) {
      article.categoryId = Number(articleData.categoryId)
    } else if (articleData.category_id !== undefined) {
      article.categoryId = Number(articleData.category_id)
    } else {
      article.categoryId = 0
    }
    
    article.isShared = articleData.isShared !== undefined ? 
      Boolean(articleData.isShared) : 
      (articleData.is_shared !== undefined ? 
        Boolean(articleData.is_shared) : false)
    
    article.status = articleData.status || 'draft'
    
    console.log('✅ API数据设置完成:', {
      title: article.title,
      contentLength: article.content.length,
      categoryId: article.categoryId,
      isShared: article.isShared,
      status: article.status
    })
    
    // 确保编辑器已初始化再设置内容
    if (vditor.value && article.content) {
      console.log('📝 设置编辑器内容，长度:', article.content.length)
      console.log('📝 内容预览:', article.content.substring(0, 200) + '...')
      
      // 使用延迟确保编辑器完全准备好
      await new Promise(resolve => setTimeout(resolve, 100))
      vditor.value.setValue(article.content)
      console.log('✅ 编辑器内容已设置')
    } else {
      console.warn('⚠️ 编辑器未初始化或内容为空', {
        hasVditor: !!vditor.value,
        contentLength: article.content.length
      })
    }
    
  } catch (error) {
    console.error('❌ 加载文章失败:', error)
    showSaveMessage('加载文章失败', 'error')
  }
}

// 新增：确保编辑器内容设置的辅助方法
const setEditorContent = async (content) => {
  if (!vditor.value) {
    console.warn('⚠️ 编辑器未初始化，无法设置内容')
    return false
  }
  
  if (!content) {
    console.warn('⚠️ 内容为空，跳过设置')
    return false
  }
  
  try {
    console.log('📝 设置编辑器内容:', content.substring(0, 100) + '...')
    vditor.value.setValue(content)
    
    // 验证内容是否设置成功
    setTimeout(() => {
      const currentValue = vditor.value.getValue()
      if (currentValue === content) {
        console.log('✅ 编辑器内容设置成功验证')
      } else {
        console.warn('⚠️ 编辑器内容设置可能失败', {
          expected: content.length,
          actual: currentValue.length
        })
      }
    }, 200)
    
    return true
  } catch (error) {
    console.error('❌ 设置编辑器内容失败:', error)
    return false
  }
}

// 生命周期
onMounted(async () => {
  console.log('🚀 ArticleEditor mounted, props:', {
    articleId: props.articleId,
    hasOriginalArticle: !!props.originalArticle
  })
  
  await loadCategories()
  
  // 如果是编辑模式，先加载文章数据
  if (isEditing.value) {
    await loadArticle()
  }
  
  // 然后初始化编辑器
  initVditor()
})

onBeforeUnmount(() => {
  if (vditor.value) {
    vditor.value.destroy()
  }
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})

// 监听props变化
watch(() => props.originalArticle, async (newArticle) => {
  if (newArticle && isEditing.value) {
    console.log('📄 originalArticle props 变化:', newArticle.title)
    await loadArticle()
  }
}, { deep: true, immediate: true })

// 监听文章ID变化
watch(() => props.articleId, async (newId, oldId) => {
  console.log('🔄 articleId 变化:', { from: oldId, to: newId })
  if (newId) {
    await loadArticle()
  } else {
    // 重置表单
    Object.assign(article, {
      title: '',
      summary: '',
      content: '',
      categoryId: 0,
      isShared: false,
      status: 'draft'
    })
    if (vditor.value) {
      vditor.value.setValue('')
    }
  }
})

// 新增：监听文章内容变化，确保编辑器同步
watch(() => article.content, async (newContent) => {
  if (vditor.value && newContent && vditor.value.getValue() !== newContent) {
    console.log('🔄 文章内容变化，同步到编辑器')
    await setEditorContent(newContent)
  }
})
</script>

<style scoped>
.article-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
}

/* 编辑器头部 */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  min-height: 70px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.editor-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
}

.btn-save, .btn-publish {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-save:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-publish {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-publish:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-save:disabled, .btn-publish:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 文章元信息表单 */
.article-meta-form {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title-group {
  flex: 1;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.title-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.title-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.title-input.error {
  border-color: #ef4444;
}

.summary-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  resize: vertical;
  transition: border-color 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.summary-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.category-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  box-sizing: border-box;
}

.char-count {
  font-size: 12px;
  color: #64748b;
  text-align: right;
  margin-top: 0.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  font-size: 12px;
  font-weight: bold;
}

.form-hint {
  font-size: 12px;
  color: #64748b;
  margin-top: 0.25rem;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 0.25rem;
}

/* 编辑器容器 */
.editor-container {
  flex: 1;
  min-height: 0;
  padding: 0 1.5rem;
  background: white;
}

#vditor {
  height: 100%;
}

/* 保存提示 */
.save-message {
  position: fixed;
  top: 100px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}

.save-message.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.save-message.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 图标 */
.icon-arrow-left::before { content: '←'; }
.icon-save::before { content: '💾'; }
.icon-publish::before { content: '🚀'; }

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 1rem;
    min-height: auto;
    padding: 1rem;
  }
  
  .header-left, .header-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .article-meta-form {
    padding: 1rem;
  }
  
  .editor-container {
    padding: 0 1rem;
  }
}
</style>
