// 直接调试文章API调用
console.log('🚀 开始调试文章API');

// 检查认证状态
const userId = localStorage.getItem('userId');
const user = localStorage.getItem('user');

console.log('🔐 认证状态:', {
    userId: userId,
    hasUser: !!user,
    userInfo: user ? JSON.parse(user) : null
});

if (!userId) {
    console.error('❌ 没有找到userId，无法调用API');
    alert('没有找到用户ID，请先登录');
} else {
    // 直接调用API测试
    async function testAPI() {
        try {
            console.log('📡 正在调用API: GET /api/v1/articles/all/1/10');
            
            const response = await fetch('/api/v1/articles/all/1/10', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': userId
                }
            });
            
            console.log('📥 API响应状态:', response.status, response.statusText);
            console.log('📥 响应头:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API调用成功，返回数据:', data);
                
                // 分析数据结构
                if (data && typeof data === 'object') {
                    console.log('📊 数据分析:', {
                        dataType: typeof data,
                        isArray: Array.isArray(data),
                        hasListProperty: 'list' in data,
                        hasTotalProperty: 'total' in data,
                        keys: Object.keys(data)
                    });
                    
                    if (data.list && Array.isArray(data.list)) {
                        console.log('📝 文章列表:', {
                            count: data.list.length,
                            total: data.total,
                            articles: data.list.map(article => ({
                                articleId: article.articleId,
                                title: article.title,
                                status: article.status,
                                hasContentUrl: !!article.contentUrl
                            }))
                        });
                        
                        // 显示成功信息
                        alert(`✅ API调用成功！\n找到 ${data.list.length} 篇文章\n总数: ${data.total}`);
                    } else if (Array.isArray(data)) {
                        console.log('📝 直接数组格式，文章数量:', data.length);
                        alert(`✅ API调用成功！\n找到 ${data.length} 篇文章`);
                    } else {
                        console.warn('⚠️ 意外的数据格式');
                        alert('⚠️ API返回了意外的数据格式');
                    }
                }
            } else {
                const errorText = await response.text();
                console.error('❌ API调用失败:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText: errorText
                });
                alert(`❌ API调用失败\n状态: ${response.status}\n错误: ${errorText}`);
            }
        } catch (error) {
            console.error('❌ 网络错误:', error);
            alert(`❌ 网络错误: ${error.message}`);
        }
    }
    
    // 执行测试
    testAPI();
}
