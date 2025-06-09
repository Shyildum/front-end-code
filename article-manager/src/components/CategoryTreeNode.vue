<template>
  <div class="category-tree-node">
    <!-- 分类头部 -->
    <div class="category-header" @click="toggleExpanded">
      <i :class="['icon-chevron', { expanded: isExpanded }]"></i>
      <i class="icon-folder"></i>
      <span class="category-name">{{ category.name }}</span>
      <span class="article-count">({{ categoryArticles.length }})</span>
    </div>
    
    <!-- 分类下的文章 -->
    <ul v-show="isExpanded" class="category-articles">
      <li 
        v-for="article in categoryArticles" 
        :key="article.id"
        :class="['tree-item', { active: selectedArticle?.id === article.id }]"
      >
        <div class="tree-item-content" @click="$emit('select-article', article)">
          <i class="icon-document"></i>
          <span class="article-title">{{ article.title }}</span>
          <span class="article-date">{{ formatDate(article.updatedAt) }}</span>
        </div>
        <div class="tree-item-actions">
          <button class="tree-action-btn" @click.stop="$emit('edit-article', article)" title="编辑">
            <i class="icon-edit"></i>
          </button>
          <button class="tree-action-btn delete" @click.stop="$emit('delete-article', article)" title="删除">
            <i class="icon-delete"></i>
          </button>
        </div>
      </li>
    </ul>
    
    <!-- 子分类 -->
    <div v-show="isExpanded" class="subcategories">
      <CategoryTreeNode 
        v-for="child in category.children" 
        :key="child.categoryId"
        :category="child"
        :all-articles="allArticles"
        :selected-article="selectedArticle"
        @select-article="$emit('select-article', $event)"
        @toggle-category="$emit('toggle-category', $event)"
        @edit-article="$emit('edit-article', $event)"
        @delete-article="$emit('delete-article', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  allArticles: {
    type: Array,
    default: () => []
  },
  selectedArticle: {
    type: Object,
    default: null
  }
})

defineEmits(['select-article', 'toggle-category', 'edit-article', 'delete-article'])

const isExpanded = ref(props.category.expanded || false)

const categoryArticles = computed(() => {
  return props.allArticles.filter(article => 
    article.categoryId === props.category.categoryId ||
    article.category_id === props.category.categoryId
  )
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  // 通知父组件
  // $emit('toggle-category', props.category.categoryId)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.category-tree-node {
  margin-left: 1rem;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.category-header:hover {
  background: #f1f5f9;
}

.icon-chevron {
  width: 12px;
  height: 12px;
  margin-right: 0.5rem;
  transition: transform 0.2s ease;
}

.icon-chevron.expanded {
  transform: rotate(90deg);
}

.category-name {
  flex: 1;
  margin-left: 0.5rem;
}

.article-count {
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
}

.category-articles {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0 0 1.5rem;
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 2px;
  transition: all 0.2s ease;
  font-size: 14px;
  min-height: 40px;
  justify-content: space-between;
}

.tree-item:hover {
  background: #f1f5f9;
}

.tree-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tree-item-content {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.tree-item-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tree-item:hover .tree-item-actions {
  opacity: 1;
}

.tree-action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
}

.tree-action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.tree-action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.tree-item.active .tree-action-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.tree-item.active .tree-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tree-item i {
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.article-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.article-date {
  font-size: 12px;
  opacity: 0.7;
  margin-left: 0.5rem;
}

.subcategories {
  margin-left: 1rem;
}

/* 图标 */
.icon-chevron::before { content: '▶'; }
.icon-folder::before { content: '📁'; }
.icon-document::before { content: '📄'; }
.icon-edit::before { content: '✏️'; }
.icon-delete::before { content: '🗑️'; }
</style>
