<template>
  <div class="login-page">
    <div class="back" @click="goBack">← 返回</div>

    <div class="login-header">
      <h1>欢迎回来</h1>
      <p>登录后享受更多权益</p>
    </div>

    <div class="login-form">
      <div class="form-item">
        <input
          v-model="phone"
          type="tel"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </div>

      <div class="form-item captcha-row">
        <input
          v-model="code"
          type="text"
          placeholder="请输入验证码"
          maxlength="6"
        />
        <button
          class="send-btn"
          :disabled="countdown > 0"
          @click="sendCode"
        >
          {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
        </button>
      </div>

      <button class="login-btn" :disabled="loading" @click="handleLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <p class="tips">演示模式：任意6位数字验证码均可登录</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Toast from '@/utils/toast'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const loading = ref(false)
const countdown = ref(0)

const goBack = () => {
  router.back()
}

let timer: ReturnType<typeof setInterval> | null = null

const sendCode = async () => {
  if (!phone.value || phone.value.length !== 11) {
    Toast.warning('请输入正确的手机号')
    return
  }

  try {
    await userApi.sendCode(phone.value)
    Toast.warning('验证码已发送：123456')
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  } catch (e: any) {
    Toast.warning(e.message || '发送失败')
  }
}

const handleLogin = async () => {
  if (!phone.value || !code.value) {
    Toast.warning('请填写手机号和验证码')
    return
  }

  loading.value = true
  try {
    await userStore.login(phone.value, code.value)
    router.push('/')
  } catch (e: any) {
    Toast.warning(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  padding: 20px;
}

.back {
  color: #fff;
  font-size: 16px;
  padding: 10px 0;
  cursor: pointer;
}

.login-header {
  text-align: center;
  color: #fff;
  padding: 60px 0 40px;
}

.login-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  opacity: 0.9;
}

.login-form {
  background: #fff;
  border-radius: 16px;
  padding: 30px 20px;
  margin-top: 20px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #eee;
  border-radius: 10px;
  font-size: 15px;
  box-sizing: border-box;
}

.form-item input:focus {
  outline: none;
  border-color: #ff6b6b;
}

.captcha-row {
  display: flex;
  gap: 10px;
}

.captcha-row input {
  flex: 1;
}

.send-btn {
  padding: 0 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  color: #ff6b6b;
  white-space: nowrap;
}

.send-btn:disabled {
  color: #999;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  margin-top: 10px;
}

.login-btn:disabled {
  opacity: 0.7;
}

.tips {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 16px;
}
</style>
