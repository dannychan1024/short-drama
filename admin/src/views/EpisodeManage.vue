<template>
  <div class="episode-manage">
    <!-- Header -->
    <div class="flex-between mb-6">
      <div class="flex gap-4">
        <el-select v-model="selectedDramaId" placeholder="选择短剧" style="width: 240px" @change="loadEpisodes">
          <el-option
            v-for="drama in dramas"
            :key="drama.id"
            :label="drama.title"
            :value="drama.id"
          />
        </el-select>
      </div>
      <div class="flex gap-2">
        <el-button @click="showBatchDialog = true" :disabled="!selectedDramaId">批量导入</el-button>
        <el-button type="primary" @click="showDialog('add')" :disabled="!selectedDramaId">
          <el-icon class="mr-1"><Plus /></el-icon>添加剧集
        </el-button>
      </div>
    </div>

    <!-- Table -->
    <div class="card p-4">
      <el-table :data="episodes" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="episode_number" label="集数" width="100" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column prop="is_free" label="是否免费" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_free ? 'success' : 'info'">
              {{ row.is_free ? '免费' : '付费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            <span class="text-orange-500">{{ row.price }}金币</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="showDialog('edit', row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
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
          @change="loadEpisodes"
        />
      </div>
    </div>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="集数标题" prop="title">
          <el-input v-model="form.title" placeholder="如：第1集" />
        </el-form-item>
        <el-form-item label="集数编号" prop="episodeNumber">
          <el-input-number v-model="form.episodeNumber" :min="1" :precision="0" />
        </el-form-item>
        <el-form-item label="视频URL" prop="videoUrl">
          <el-input v-model="form.videoUrl" placeholder="请输入视频URL" />
        </el-form-item>
        <el-form-item label="时长(秒)" prop="duration">
          <el-input-number v-model="form.duration" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="是否免费" prop="isFree">
          <el-switch v-model="form.isFree" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- Batch Import Dialog -->
    <el-dialog v-model="showBatchDialog" title="批量导入剧集" width="600px">
      <div class="mb-4 text-gray-600">
        <p>每行一条剧集信息，格式：集数标题,集数编号,视频URL,时长(秒),是否免费(0/1),价格</p>
        <p class="text-xs mt-1">例如：第1集,1,https://xxx.com/video.m3u8,300,1,0</p>
      </div>
      <el-input
        v-model="batchText"
        type="textarea"
        :rows="10"
        placeholder="第1集,1,https://xxx.com/video.m3u8,300,1,0
第2集,2,https://xxx.com/video.m3u8,320,0,10"
      />
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBatchImport" :loading="batchLoading">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getDramaList } from '../api/drama'
import { getEpisodeList, createEpisode, updateEpisode, deleteEpisode, batchCreateEpisodes } from '../api/episode'

const loading = ref(false)
const dramas = ref<any[]>([])
const episodes = ref<any[]>([])
const selectedDramaId = ref<number | null>(null)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const showBatchDialog = ref(false)
const batchText = ref('')
const submitting = ref(false)
const batchLoading = ref(false)
const formRef = ref<FormInstance>()

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  id: 0,
  title: '',
  videoUrl: '',
  duration: 0,
  episodeNumber: 1,
  isFree: false,
  price: 0
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  episodeNumber: [{ required: true, message: '请输入集数编号', trigger: 'blur' }]
}

const dialogTitle = computed(() => dialogType.value === 'add' ? '添加剧集' : '编辑剧集')

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const loadDramas = async () => {
  try {
    const res = await getDramaList({ pageSize: 100 })
    dramas.value = res.data.list
    if (dramas.value.length > 0 && !selectedDramaId.value) {
      selectedDramaId.value = dramas.value[0].id
      loadEpisodes()
    }
  } catch (e) {
    console.error(e)
  }
}

const loadEpisodes = async () => {
  if (!selectedDramaId.value) return
  loading.value = true
  try {
    const res = await getEpisodeList({
      dramaId: selectedDramaId.value,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    episodes.value = res.data.list
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const showDialog = (type: 'add' | 'edit', row?: any) => {
  dialogType.value = type
  if (type === 'edit' && row) {
    Object.assign(form, {
      id: row.id,
      title: row.title,
      videoUrl: row.video_url,
      duration: row.duration,
      episodeNumber: row.episode_number,
      isFree: row.is_free === 1,
      price: row.price
    })
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    id: 0,
    title: '',
    videoUrl: '',
    duration: 0,
    episodeNumber: 1,
    isFree: false,
    price: 0
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const data = {
        dramaId: selectedDramaId.value!,
        title: form.title,
        videoUrl: form.videoUrl,
        duration: form.duration,
        episodeNumber: form.episodeNumber,
        isFree: form.isFree ? 1 : 0,
        price: form.price
      }
      if (dialogType.value === 'add') {
        await createEpisode(data)
        ElMessage.success('添加成功')
      } else {
        await updateEpisode(form.id, data)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      loadEpisodes()
    } catch (e) {
      console.error(e)
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该剧集吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteEpisode(row.id)
      ElMessage.success('删除成功')
      loadEpisodes()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

const handleBatchImport = async () => {
  if (!batchText.value.trim()) {
    ElMessage.warning('请输入导入内容')
    return
  }
  
  const lines = batchText.value.trim().split('\n').filter(l => l.trim())
  const episodes: any[] = []
  
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim())
    if (parts.length < 2) continue
    episodes.push({
      title: parts[0],
      episodeNumber: parseInt(parts[1]) || 1,
      videoUrl: parts[2] || '',
      duration: parseInt(parts[3]) || 0,
      isFree: parts[4] === '1',
      price: parseInt(parts[5]) || 0
    })
  }
  
  if (episodes.length === 0) {
    ElMessage.warning('没有有效的剧集数据')
    return
  }
  
  batchLoading.value = true
  try {
    await batchCreateEpisodes(selectedDramaId.value!, episodes)
    ElMessage.success(`成功导入 ${episodes.length} 条剧集`)
    showBatchDialog.value = false
    batchText.value = ''
    loadEpisodes()
  } catch (e) {
    console.error(e)
  } finally {
    batchLoading.value = false
  }
}

onMounted(() => {
  loadDramas()
})
</script>

<style scoped>
.episode-manage {
  @apply text-sm;
}
</style>