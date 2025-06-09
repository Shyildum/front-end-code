import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/LoginSimple.vue'
import Register from '@/views/RegisterSimple.vue'
import Dashboard from '@/views/Dashboard.vue'
import ArticleManager from '@/views/ArticleManager.vue'
import CategoryManagerView from '@/views/CategoryManagerView.vue'

const router = createRouter({
  history: createWebHistory(),  routes: [
    {
      path: '/',
      redirect: '/articles'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/register',
      name: 'Register',
      component: Register
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },    {
      path: '/articles',
      name: 'ArticleManager',
      component: ArticleManager
    },    {
      path: '/categories',
      name: 'CategoryManager',
      component: CategoryManagerView
    },
    {
      path: '/articles-preview',
      name: 'ArticleManagerPreview',
      component: ArticleManager
    },
    {
      path: '/preview',
      name: 'ArticlePreview',
      component: ArticleManager
      // 注意：这是临时预览路由，不需要认证
    }
  ]
})

// 路由守卫 - 检查认证状态 (临时禁用用于预览)
router.beforeEach((to, from, next) => {
  // 临时注释掉认证检查，方便预览文章管理器
  /*
  const userId = localStorage.getItem('userId')
  
  if (to.meta.requiresAuth && !userId) {
    // 需要认证但没有用户ID，跳转到登录页
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && userId) {
    // 已登录用户访问登录或注册页，跳转到仪表板
    next('/dashboard')
  } else {
    next()
  }
  */
  
  // 临时直接允许所有路由访问
  next()
})

export default router
