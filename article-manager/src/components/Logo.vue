<template>
  <div class="logo-icon">
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 主圆形背景 -->
      <circle cx="32" cy="32" r="28" fill="url(#logoGradient)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      
      <!-- 艺术画笔 -->
      <path d="M20 44 L28 36 L30 38 L22 46 Z" fill="url(#brushGradient)"/>
      <path d="M28 36 L44 20 L46 22 L30 38 Z" fill="url(#handleGradient)"/>
      
      <!-- 调色板 -->
      <ellipse cx="38" cy="26" rx="8" ry="6" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
      
      <!-- 颜料点 -->
      <circle cx="35" cy="24" r="2" fill="#ff6b6b"/>
      <circle cx="39" cy="23" r="2" fill="#4ecdc4"/>
      <circle cx="41" cy="26" r="2" fill="#45b7d1"/>
      <circle cx="37" cy="28" r="2" fill="#f9ca24"/>
      
      <!-- 创意火花/星星 -->
      <g transform="translate(48,16)">
        <path d="M0,-4 L1,0 L4,0 L1.5,2 L2.5,6 L0,3.5 L-2.5,6 L-1.5,2 L-4,0 L-1,0 Z" fill="rgba(255,255,255,0.8)"/>
      </g>
      <g transform="translate(16,48) scale(0.7)">
        <path d="M0,-4 L1,0 L4,0 L1.5,2 L2.5,6 L0,3.5 L-2.5,6 L-1.5,2 L-4,0 L-1,0 Z" fill="rgba(255,255,255,0.6)"/>
      </g>
      
      <!-- 艺术线条装饰 -->
      <path d="M12 32 Q 20 28 28 32 Q 36 36 44 32" stroke="rgba(255,255,255,0.4)" stroke-width="2" fill="none"/>
      
      <!-- 渐变定义 -->
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.8" />
        </linearGradient>
        <linearGradient id="brushGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8b4513;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#a0522d;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="handleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#b8860b;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<style scoped>
.logo-icon {
  display: block;
  width: 100%;
  height: 100%;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
