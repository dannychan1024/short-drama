<template>
  <div class="signin-manage">
    <!-- Stats Cards -->
    <div class="grid grid-cols-3 gap-6 mb-6">
      <div class="card p-6">
        <div class="text-gray-500 text-sm">今日签到人数</div>
        <div class="text-3xl font-bold text-blue-600 mt-2">{{ stats.todaySigninCount }}</div>
      </div>
      <div class="card p-6">
        <div class="text-gray-500 text-sm">连续签到人数</div>
        <div class="text-3xl font-bold text-green-600 mt-2">{{ stats.continuousSigninCount }}</div>
      </div>
      <div class="card p-6">
        <div class="text-gray-500 text-sm">每日奖励金币</div>
        <div class="text-3xl font-bold text-orange-600 mt-2">{{ stats.rule?.daily_reward || 10 }}</div>
      </div>
    </div>

    <!-- Rules Config -->
    <div class="card p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4">签到规则配置</h3>
      <el-form :inline="true" :model="ruleForm" class="flex gap-4">
        <el-form-item label="每日奖励金币">
          <el-input-number v-model="ruleForm.dailyReward" :min="1" :precision="0" />
        </el-form-item>
        <el-form-item label="连续签到奖励">
          <el-input-number v-model="ruleForm.continuousDayBonus" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveRule" :loading="savingRule">保存规则</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Signin Records -->
    <div class="card p-6">
      <div class="flex-between mb-4">
        <h3 class="text-lg font-semibold">签到记录</h3>
        <div class="flex gap-4">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadRecords"
            style="width: 260px"
          />
        </div>
      </div>

      <el-table :data="records" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="160">
          <template #default="{ row }">
            <div>{{ row.userNickname || '匿名' }}</div>
            <div class="text-xs text-gray-400">{{ row.userPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="signin_date" label="签到日期" width="120">
          <template #default="{ row }">
            {{ row.signin_date }}
          </template>
        </el-table-column>
        <el-table-column prop="reward_amount" label="获得金币" width="100">
          <template #default="{ row }">
            <span class="text-orange-500">+{{ row.reward_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="continuous_days" label="连续天数" width="100" />
        <el-table-column prop="created_at" label="签到时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="loadRecords"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSigninRecords, getSigninStats, updateSigninRule } from '../api/signin'

const loading = ref(false)
const records = ref<any[]>([])
const dateRange = ref<string[]>([])
const savingRule = ref(false)

const stats = ref({
  todaySigninCount: 0,
  continuousSigninCount: 0,
  rule: {
    id: 1,
    daily_reward: 10,
    continuous_day_bonus: 5,
    bonus_per_days: '[]'
  }
})

const ruleForm = reactive({
  dailyReward: 10,
  continuousDayBonus: 5
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadStats = async () => {
  try {
    const res = await getSigninStats()
    stats.value = res.data
    ruleForm.dailyReward = res.data.rule?.daily_reward || 10
    ruleForm.continuousDayBonus = res.data.rule?.continuous_day_bonus || 5
  } catch (e) {
    console.error(e)
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    const res = await getSigninRecords({
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    records.value = res.data.list
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const saveRule = async () => {
  savingRule.value = true
  try {
    await updateSigninRule({
      daily_reward: ruleForm.dailyReward,
      continuous_day_bonus: ruleForm.continuousDayBonus
    })
    ElMessage.success('规则保存成功')
    loadStats()
  } catch (e) {
    console.error(e)
  } finally {
    savingRule.value = false
  }
}

onMounted(() => {
  loadStats()
  loadRecords()
})
</script>

<style scoped>
.signin-manage {
  @apply text-sm;
}
</style>