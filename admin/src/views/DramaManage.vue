<template>
  <div class="drama-manage">
    <!-- Header -->
    <div class="flex-between mb-6">
      <div class="flex gap-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索短剧名称"
          style="width: 240px"
          clearable
          @change="loadDramas"
        />
        <el-select v-model="searchCategory" placeholder="分类" style="width: 140px" clearable @change="loadDramas">
          <el-option label="都市" value="urban" />
          <el-option label="古言" value="ancient" />
          <el-option label="甜宠" value="sweet" />
          <el-option label="悬疑" value="suspense" />
          <el-option label="其他" value="other" />
        </el-select>
      </div>
      <el-button type="primary" @click="showDialog('add')">
        <el-icon class="mr-1"><Plus /></el-icon>添加短剧
      </el-button>
    </div>

    <!-- Table -->
    <div class="card p-4">
      <el-table :data="dramas" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="封面" width="100">
          <template #default="{ row }">
            <el-image :src="row.cover" fit="cover" class="w-16 h-20 rounded" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag>{{ categoryMap[row.category] || row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            <span class="text-orange-500 font-medium">{{ row.price }}金币</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_episodes" label="剧集数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="toggleStatus(row)"
              active-text="上架"
              inactive-text="下架"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="showDialog('edit', row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadDramas"
        />
      </div>
    </div>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入短剧标题" />
        </el-form-item>
        <el-form-item label="封面图" prop="cover">
          <el-input v-model="form.cover" placeholder="请输入封面图片URL" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入短剧描述" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="都市" value="urban" />
            <el-option label="古言" value="ancient" />
            <el-option label="甜宠" value="sweet" />
            <el-option label="悬疑" value="suspense" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="总集数" prop="totalEpisodes">
          <el-input-number v-model="form.totalEpisodes" :min="0" :precision="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getDramaList, createDrama, updateDrama, deleteDrama } from '../api/drama'

const loading = ref(false)
const dramas = ref<any[]>([])
const searchKeyword = ref('')
const searchCategory = ref('')
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const categoryMap: Record<string, string> = {
  urban: '都市',
  ancient: '古言',
  sweet: '甜宠',
  suspense: '悬疑',
  other: '其他'
}

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: 0,
  title: '',
  cover: '',
  description: '',
  category: 'other',
  price: 0,
  totalEpisodes: 0
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

const dialogTitle = computed(() => dialogType.value === 'add' ? '添加短剧' : '编辑短剧')

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadDramas = async () => {
  loading.value = true
  try {
    const res = await getDramaList({
      keyword: searchKeyword.value,
      category: searchCategory.value,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    dramas.value = res.data.list
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
      cover: row.cover,
      description: row.description,
      category: row.category,
      price: row.price,
      totalEpisodes: row.total_episodes
    })
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    id: 0,
    title: '',
    cover: '',
    description: '',
    category: 'other',
    price: 0,
    totalEpisodes: 0
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (dialogType.value === 'add') {
        await createDrama(form)
        ElMessage.success('添加成功')
      } else {
        await updateDrama(form.id, form)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      loadDramas()
    } catch (e) {
      console.error(e)
    } finally {
      submitting.value = false
    }
  })
}

const toggleStatus = async (row: any) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await updateDrama(row.id, { status: newStatus })
    ElMessage.success(newStatus === 1 ? '上架成功' : '下架成功')
    loadDramas()
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该短剧吗？删除后无法恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDrama(row.id)
      ElMessage.success('删除成功')
      loadDramas()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadDramas()
})
</script>

<style scoped>
.drama-manage {
  @apply text-sm;
}
</style>