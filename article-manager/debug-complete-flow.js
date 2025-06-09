// 完整的ArticleManager组件API调用调试脚本

console.log('🔧 ArticleManager API调试开始');

// 1. 检查认证状态
const userId = localStorage.getItem('userId');
const user = localStorage.getItem('user');

console.log('🔐 认证状态检查:', {
    userId: userId,
    userType: typeof userId,
    hasUser: !!user,
    userInfo: user ? (() => {
        try {
            return JSON.parse(user);
        } catch (e) {
            return '无效JSON';
        }
    })() : null
});

if (!userId) {
    console.error('❌ 认证失败：没有找到userId');
    alert('❌ 认证失败：没有找到userId\n请先登录');
    // 可选：跳转到登录页
    // window.location.href = '/login.html';
} else {
    console.log('✅ 认证检查通过，开始API测试');
    
    // 2. 模拟ArticleManager的loadArticles方法
    async function simulateLoadArticles(page = 1, pageSize = 10) {
        console.log('📡 模拟loadArticles调用:', { page, pageSize, userId });
        
        try {
            // 构建请求
            const url = `/api/v1/articles/all/${page}/${pageSize}`;
            console.log('🌐 请求URL:', url);
            
            const headers = {
                'Content-Type': 'application/json',
                'X-User-Id': userId
            };
            console.log('📋 请求头:', headers);
            
            // 发送请求
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });
            
            console.log('📥 响应状态:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 原始响应数据:', data);
                
                // 3. 模拟数据处理逻辑（与ArticleManager.vue中的逻辑一致）
                let articlesList = [];
                let totalCount = 0;
                
                if (data && typeof data === 'object') {
                    if (data.list && Array.isArray(data.list)) {
                        // PageInfo格式
                        articlesList = data.list;
                        totalCount = data.total || 0;
                        console.log('✅ 检测到PageInfo格式');
                    } else if (Array.isArray(data)) {
                        // 直接数组格式
                        articlesList = data;
                        totalCount = data.length;
                        console.log('✅ 检测到直接数组格式');
                    } else {
                        console.warn('⚠️ 未知的响应格式');
                        articlesList = [];
                        totalCount = 0;
                    }
                } else if (Array.isArray(data)) {
                    articlesList = data;
                    totalCount = data.length;
                    console.log('✅ 检测到直接数组格式');
                } else {
                    console.warn('⚠️ API返回了非预期的数据格式');
                    articlesList = [];
                    totalCount = 0;
                }
                
                console.log('📝 提取的文章列表:', {
                    count: articlesList.length,
                    total: totalCount
                });
                
                if (articlesList.length > 0) {
                    console.log('📄 文章样例数据:');
                    articlesList.slice(0, 3).forEach((article, index) => {
                        console.log(`  文章 ${index + 1}:`, {
                            articleId: article.articleId,
                            id: article.id,
                            title: article.title,
                            status: article.status,
                            categoryId: article.categoryId,
                            hasContent: !!article.content,
                            hasContentUrl: !!article.contentUrl,
                            createTime: article.createTime,
                            updateTime: article.updateTime
                        });
                    });
                    
                    // 4. 模拟字段映射处理
                    const processedArticles = articlesList.map((article, index) => {
                        const processed = {
                            ...article,
                            id: article.articleId || article.id || `temp_${Date.now()}_${index}`,
                            title: article.title || '无标题',
                            content: article.content || '',
                            summary: article.summary || article.description || '',
                            categoryId: article.categoryId || article.category_id || 0,
                            createdAt: article.createTime || article.createdAt || new Date().toISOString(),
                            updatedAt: article.updateTime || article.updatedAt || new Date().toISOString(),
                            status: article.status || 'draft',
                            contentUrl: article.contentUrl || article.content_url,
                            needsContentLoad: !!(article.contentUrl || article.content_url) && !article.content,
                            isShared: article.isShared || article.is_shared || false,
                            category: article.categoryName || article.category_name || '未分类'
                        };
                        return processed;
                    });
                    
                    console.log('🔄 处理后的文章数据样例:');
                    processedArticles.slice(0, 3).forEach((article, index) => {
                        console.log(`  处理后文章 ${index + 1}:`, {
                            id: article.id,
                            title: article.title,
                            status: article.status,
                            categoryId: article.categoryId,
                            needsContentLoad: article.needsContentLoad
                        });
                    });
                    
                    // 显示成功结果
                    alert(`✅ API调用和数据处理成功！\n\n原始文章数量: ${articlesList.length}\n处理后文章数量: ${processedArticles.length}\n总数: ${totalCount}\n\n详细信息请查看控制台日志`);
                    
                } else {
                    console.warn('⚠️ 没有找到文章数据');
                    alert('⚠️ API调用成功但没有找到文章数据\n\n可能原因:\n1. 该用户还没有创建任何文章\n2. 数据库中没有该用户的文章\n3. 分页参数导致没有数据');
                }
                
            } else {
                // 处理错误响应
                const errorText = await response.text();
                console.error('❌ API调用失败:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText: errorText
                });
                
                let errorMessage = `❌ API调用失败\n状态码: ${response.status}\n错误信息: ${errorText}`;
                
                if (response.status === 401) {
                    errorMessage += '\n\n可能原因: 用户认证失败，请检查userId是否正确';
                } else if (response.status === 404) {
                    errorMessage += '\n\n可能原因: API端点不存在，请检查后端服务';
                } else if (response.status === 500) {
                    errorMessage += '\n\n可能原因: 后端服务内部错误';
                }
                
                alert(errorMessage);
            }
            
        } catch (error) {
            console.error('❌ 网络错误:', error);
            alert(`❌ 网络错误: ${error.message}\n\n可能原因:\n1. 后端服务未启动\n2. 网络连接问题\n3. 代理配置错误`);
        }
    }
    
    // 执行测试
    simulateLoadArticles(1, 10);
}
