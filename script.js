class ArticleManager {
    constructor() {
        this.articles = JSON.parse(localStorage.getItem('articles')) || [];
        this.editingId = null;
        this.initEventListeners();
        this.renderArticles();
    }

    initEventListeners() {
        const form = document.getElementById('articleForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const content = document.getElementById('content').value.trim();
        const author = document.getElementById('author').value.trim();

        if (!title || !content || !author) {
            alert('请填写所有字段');
            return;
        }

        if (this.editingId !== null) {
            this.updateArticle(this.editingId, { title, content, author });
        } else {
            this.addArticle({ title, content, author });
        }

        this.clearForm();
    }

    addArticle(articleData) {
        const article = {
            id: Date.now(),
            ...articleData,
            createdAt: new Date().toLocaleString('zh-CN')
        };

        this.articles.unshift(article);
        this.saveToStorage();
        this.renderArticles();
    }

    updateArticle(id, articleData) {
        const index = this.articles.findIndex(article => article.id === id);
        if (index !== -1) {
            this.articles[index] = {
                ...this.articles[index],
                ...articleData,
                updatedAt: new Date().toLocaleString('zh-CN')
            };
            this.saveToStorage();
            this.renderArticles();
            this.editingId = null;
            
            const submitBtn = document.querySelector('#articleForm button[type="submit"]');
            submitBtn.textContent = '添加文章';
        }
    }

    deleteArticle(id) {
        if (confirm('确定要删除这篇文章吗？')) {
            this.articles = this.articles.filter(article => article.id !== id);
            this.saveToStorage();
            this.renderArticles();
        }
    }

    editArticle(id) {
        const article = this.articles.find(article => article.id === id);
        if (article) {
            document.getElementById('title').value = article.title;
            document.getElementById('content').value = article.content;
            document.getElementById('author').value = article.author;
            
            this.editingId = id;
            const submitBtn = document.querySelector('#articleForm button[type="submit"]');
            submitBtn.textContent = '更新文章';
            
            // 滚动到表单
            document.querySelector('.add-article').scrollIntoView({ behavior: 'smooth' });
        }
    }

    renderArticles() {
        const articleList = document.getElementById('articleList');
        
        if (this.articles.length === 0) {
            articleList.innerHTML = '<div class="no-articles">暂无文章</div>';
            return;
        }

        articleList.innerHTML = this.articles.map(article => `
            <div class="article-item">
                <div class="article-title">${this.escapeHtml(article.title)}</div>
                <div class="article-author">作者: ${this.escapeHtml(article.author)} | 创建时间: ${article.createdAt}</div>
                <div class="article-content">${this.escapeHtml(article.content)}</div>
                <div class="article-actions">
                    <button class="edit-btn" onclick="articleManager.editArticle(${article.id})">编辑</button>
                    <button class="delete-btn" onclick="articleManager.deleteArticle(${article.id})">删除</button>
                </div>
            </div>
        `).join('');
    }

    clearForm() {
        document.getElementById('title').value = '';
        document.getElementById('content').value = '';
        document.getElementById('author').value = '';
        this.editingId = null;
        
        const submitBtn = document.querySelector('#articleForm button[type="submit"]');
        submitBtn.textContent = '添加文章';
    }

    saveToStorage() {
        localStorage.setItem('articles', JSON.stringify(this.articles));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化文章管理器
const articleManager = new ArticleManager();
console.log('文章管理器已初始化');
let year = "二零二五";
let date = `现在是${year}年`;
console.log(date);