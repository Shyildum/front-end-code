// 文章API调试脚本
console.log('=== 文章API调试开始 ===');

// 1. 检查认证状态
function checkAuth() {
  const userId = localStorage.getItem('userId');
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  console.log('🔍 认证状态检查:', {
    userId,
    hasUser: !!user,
    userInfo: user ? JSON.parse(user) : null,
    hasToken: !!token
  });
  
  return !!userId;
}

// 2. 手动调用文章API
async function testArticleAPI() {
  const userId = localStorage.getItem('userId');
  
  if (!userId) {
    console.error('❌ 没有找到userId，请先登录');
    return;
  }
  
  try {
    console.log('📡 开始调用文章API...');
    
    const response = await fetch('/api/v1/articles/all/1/10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      }
    });
    
    console.log('📥 API响应状态:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    const responseText = await response.text();
    console.log('📄 原始响应文本:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ 解析后的数据:', data);
        
        if (data.list && Array.isArray(data.list)) {
          console.log(`📚 找到 ${data.list.length} 篇文章:`, 
            data.list.map(article => ({
              articleId: article.articleId,
              title: article.title,
              summary: article.summary,
              status: article.status
            }))
          );
        } else {
          console.warn('⚠️ 响应格式不正确，缺少list字段');
        }
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError);
      }
    } else {
      console.error('❌ API调用失败:', response.status, responseText);
    }
    
  } catch (error) {
    console.error('❌ 网络请求失败:', error);
  }
}

// 3. 设置测试用户ID（如果需要）
function setTestUserId(userId = '5') {
  localStorage.setItem('userId', userId);
  localStorage.setItem('user', JSON.stringify({
    userId: parseInt(userId),
    username: 'test_user',
    email: 'test@example.com'
  }));
  console.log(`✅ 测试用户ID已设置为: ${userId}`);
}

// 4. 运行测试
async function runTest() {
  console.log('🚀 开始文章API测试...');
  
  // 检查认证
  if (!checkAuth()) {
    console.log('🔧 设置测试用户ID...');
    setTestUserId('5'); // 使用默认测试用户ID
  }
  
  // 测试API
  await testArticleAPI();
  
  console.log('✅ 测试完成');
}

// 导出函数供手动调用
window.articleDebug = {
  checkAuth,
  testArticleAPI,
  setTestUserId,
  runTest
};

// 自动运行测试
runTest();

console.log('💡 可以在控制台中使用以下命令:');
console.log('- articleDebug.checkAuth() - 检查认证状态');
console.log('- articleDebug.testArticleAPI() - 测试文章API');
console.log('- articleDebug.setTestUserId("5") - 设置测试用户ID');
console.log('- articleDebug.runTest() - 运行完整测试');
