// 调试左侧分类树显示问题
console.log('🔍 开始调试分类树显示问题...')

// 1. 检查当前用户ID
const userId = localStorage.getItem('userId')
console.log('👤 当前用户ID:', userId)

if (!userId) {
    console.log('❌ 没有用户ID，设置测试用户...')
    const testUserId = 'test-user-' + Date.now()
    localStorage.setItem('userId', testUserId)
    console.log('✅ 已设置测试用户ID:', testUserId)
}

// 2. 测试分类API
const testCategoryAPI = async () => {
    try {
        console.log('🌳 测试分类树API...')
        
        const response = await fetch('/api/v1/categories/tree/0', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': localStorage.getItem('userId')
            }
        })
        
        console.log('📡 分类API响应状态:', response.status, response.statusText)
        
        if (response.ok) {
            const data = await response.json()
            console.log('✅ 分类API响应数据:', data)
            console.log('📊 分类数量:', Array.isArray(data) ? data.length : '不是数组')
        } else {
            const errorText = await response.text()
            console.error('❌ 分类API错误:', errorText)
        }
        
    } catch (error) {
        console.error('❌ 分类API异常:', error)
    }
}

// 3. 测试文章API
const testArticleAPI = async () => {
    try {
        console.log('📝 测试文章API...')
        
        const response = await fetch('/api/v1/articles/1/10', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': localStorage.getItem('userId')
            }
        })
        
        console.log('📡 文章API响应状态:', response.status, response.statusText)
        
        if (response.ok) {
            const data = await response.json()
            console.log('✅ 文章API响应数据:', data)
        } else {
            const errorText = await response.text()
            console.error('❌ 文章API错误:', errorText)
        }
        
    } catch (error) {
        console.error('❌ 文章API异常:', error)
    }
}

// 4. 检查Vue组件状态
const checkVueComponentState = () => {
    console.log('🎯 检查Vue组件状态...')
    
    // 尝试获取Vue实例
    const app = document.querySelector('#app').__vue_app__ || window.__VUE_APP__
    if (app) {
        console.log('✅ 找到Vue应用实例')
        
        // 查找ArticleManager组件
        const articleManager = document.querySelector('.article-manager')
        if (articleManager) {
            console.log('✅ 找到ArticleManager组件DOM')
            
            // 检查分类树元素
            const categorySection = document.querySelector('.tree-section')
            const categoryList = document.querySelector('.tree-list')
            
            console.log('🌳 分类树DOM状态:', {
                hasCategorySection: !!categorySection,
                hasCategoryList: !!categoryList,
                categoryItems: categoryList ? categoryList.children.length : 0
            })
        } else {
            console.log('❌ 未找到ArticleManager组件DOM')
        }
    } else {
        console.log('❌ 未找到Vue应用实例')
    }
}

// 5. 强制重新加载分类
const forceReloadCategories = () => {
    console.log('🔄 尝试强制重新加载分类...')
    
    // 触发Vue组件的重新加载方法
    const event = new CustomEvent('force-reload-categories')
    window.dispatchEvent(event)
}

// 执行测试
const runDebug = async () => {
    console.log('🚀 开始调试流程...')
    
    await testCategoryAPI()
    await testArticleAPI()
    checkVueComponentState()
    
    console.log('✅ 调试完成，请检查上面的输出结果')
}

// 添加全局方法
window.debugCategorySidebar = runDebug
window.testCategoryAPI = testCategoryAPI
window.testArticleAPI = testArticleAPI
window.checkVueComponentState = checkVueComponentState
window.forceReloadCategories = forceReloadCategories

console.log('🎯 调试工具已加载，运行 window.debugCategorySidebar() 开始调试')
