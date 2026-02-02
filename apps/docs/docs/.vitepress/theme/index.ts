import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // Customize layout slots if needed
    })
  },
  enhanceApp({ app }) {
    // Load mermaid script
    if (typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
      script.async = true
      script.onload = () => {
        if (window.mermaid) {
          window.mermaid.initialize({ startOnLoad: true, theme: 'dark' })
          window.mermaid.contentLoaded()
        }
      }
      document.head.appendChild(script)
    }
  }
} satisfies Theme
