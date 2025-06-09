/**
 * localStorage 模拟器 - 用于Node.js环境测试
 * 解决测试文件中的 "localStorage is not defined" 错误
 */

// 检查是否在Node.js环境中运行
if (typeof localStorage === 'undefined') {
  const localStorageMock = {
    store: {},
    getItem: function(key) {
      return this.store[key] || null;
    },
    setItem: function(key, value) {
      this.store[key] = String(value);
    },
    removeItem: function(key) {
      delete this.store[key];
    },
    clear: function() {
      this.store = {};
    },
    get length() {
      return Object.keys(this.store).length;
    },
    key: function(index) {
      const keys = Object.keys(this.store);
      return keys[index] || null;
    }
  };
  
  // 设置全局localStorage
  global.localStorage = localStorageMock;
  console.log('🔧 已在Node.js环境中设置localStorage模拟器');
}

// 检查是否在浏览器环境但没有localStorage
if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
  const localStorageMock = {
    store: {},
    getItem: function(key) {
      return this.store[key] || null;
    },
    setItem: function(key, value) {
      this.store[key] = String(value);
    },
    removeItem: function(key) {
      delete this.store[key];
    },
    clear: function() {
      this.store = {};
    },
    get length() {
      return Object.keys(this.store).length;
    },
    key: function(index) {
      const keys = Object.keys(this.store);
      return keys[index] || null;
    }
  };
  
  window.localStorage = localStorageMock;
  console.log('🔧 已在浏览器环境中设置localStorage模拟器');
}

export default global.localStorage || window.localStorage;
