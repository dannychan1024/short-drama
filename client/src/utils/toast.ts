const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'warning', duration = 2000) => {
  const id = 'toast-' + Date.now()
  const colors: Record<string, string> = {
    success: '#52c41a',
    warning: '#ff6b6b',
    error: '#ff4d4f'
  }

  const style = `
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type]};
    color: #fff;
    padding: 12px 24px;
    border-radius: 24px;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: toastIn 0.3s ease;
    max-width: 80vw;
    text-align: center;
    pointer-events: none;
  `

  const container = document.createElement('div')
  container.innerHTML = `<div id="${id}" style="${style}">${message}</div>`
  document.body.appendChild(container)

  if (!document.getElementById('toast-keyframes')) {
    const styleEl = document.createElement('style')
    styleEl.id = 'toast-keyframes'
    styleEl.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `
    document.head.appendChild(styleEl)
  }

  setTimeout(() => {
    const el = document.getElementById(id)
    if (el) {
      el.style.animation = 'toastOut 0.3s ease forwards'
      setTimeout(() => el.remove(), 300)
    }
  }, duration)
}

export default {
  success: (msg: string) => showToast(msg, 'success'),
  warning: (msg: string) => showToast(msg, 'warning'),
  error: (msg: string) => showToast(msg, 'error')
}
