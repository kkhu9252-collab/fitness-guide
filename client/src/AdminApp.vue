<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  adminLogin,
  createAdminExercise,
  deleteAdminExercise,
  fetchAdminExercises,
  updateAdminExercise,
} from './api.js'
import { createEmptyExerciseForm, exerciseToForm, formToExercisePayload } from './adminForm.js'

const bodyParts = ['胸部', '背部', '腿部', '肩部', '手臂', '核心']
const difficulties = ['新手', '进阶', '高阶']

const publicHomePath = import.meta.env.BASE_URL || '/'
const token = ref(localStorage.getItem('fitness-admin-token') || '')
const username = ref('admin')
const password = ref('')
const exercises = ref([])
const form = ref(createEmptyExerciseForm())
const selectedId = ref(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const message = ref('')

const isLoggedIn = computed(() => Boolean(token.value))
const visibleCount = computed(() => exercises.value.filter((exercise) => exercise.enabled).length)
const hiddenCount = computed(() => exercises.value.length - visibleCount.value)
const isEditing = computed(() => Boolean(form.value.id))

async function loadAdminExercises() {
  if (!token.value) return
  loading.value = true
  error.value = ''
  try {
    exercises.value = await fetchAdminExercises(token.value)
    if (!selectedId.value && exercises.value.length > 0) {
      selectExercise(exercises.value[0])
    }
  } catch (err) {
    if (err.message === 'Unauthorized') {
      logout()
      return
    }
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function login() {
  loading.value = true
  error.value = ''
  try {
    token.value = await adminLogin(username.value, password.value)
    localStorage.setItem('fitness-admin-token', token.value)
    password.value = ''
    await loadAdminExercises()
  } catch (err) {
    error.value = '登录失败，请检查账号和密码。'
  } finally {
    loading.value = false
  }
}

function logout() {
  token.value = ''
  localStorage.removeItem('fitness-admin-token')
  exercises.value = []
  selectedId.value = null
  form.value = createEmptyExerciseForm()
}

function selectExercise(exercise) {
  selectedId.value = exercise.id
  form.value = exerciseToForm(exercise)
  message.value = ''
}

function newExercise() {
  selectedId.value = null
  form.value = createEmptyExerciseForm()
  message.value = ''
}

async function saveExercise() {
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    const payload = formToExercisePayload(form.value)
    const saved = form.value.id
      ? await updateAdminExercise(token.value, form.value.id, payload)
      : await createAdminExercise(token.value, payload)
    message.value = form.value.id ? '动作已更新。' : '动作已新增。'
    await loadAdminExercises()
    selectExercise(saved)
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function removeExercise() {
  if (!form.value.id) return
  const name = form.value.name || '当前动作'
  if (!window.confirm(`确认删除「${name}」吗？`)) return

  saving.value = true
  error.value = ''
  message.value = ''
  try {
    await deleteAdminExercise(token.value, form.value.id)
    message.value = '动作已删除。'
    selectedId.value = null
    form.value = createEmptyExerciseForm()
    await loadAdminExercises()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

onMounted(loadAdminExercises)
</script>

<template>
  <main class="admin-shell">
    <section v-if="!isLoggedIn" class="admin-login">
      <p class="eyebrow">Admin</p>
      <h1>动作库后台</h1>
      <p class="admin-subtitle">登录后可以新增、编辑、删除、启用或隐藏动作。</p>

      <form class="admin-form compact-form" @submit.prevent="login">
        <label>
          <span>账号</span>
          <input v-model="username" autocomplete="username" />
        </label>
        <label>
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="current-password" />
        </label>
        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录后台' }}
        </button>
      </form>

      <p v-if="error" class="admin-error">{{ error }}</p>
    </section>

    <template v-else>
      <header class="admin-header">
        <div>
          <p class="eyebrow">Exercise Admin</p>
          <h1>动作管理</h1>
          <p>{{ exercises.length }} 个动作，{{ visibleCount }} 个显示，{{ hiddenCount }} 个隐藏</p>
        </div>
        <div class="admin-actions">
          <a class="ghost-button" :href="publicHomePath">看前台</a>
          <button class="ghost-button" type="button" @click="logout">退出</button>
        </div>
      </header>

      <p v-if="error" class="admin-error">{{ error }}</p>
      <p v-if="message" class="admin-message">{{ message }}</p>

      <section class="admin-layout">
        <aside class="admin-list">
          <div class="admin-list-header">
            <h2>动作列表</h2>
            <button class="primary-button small" type="button" @click="newExercise">新增</button>
          </div>

          <p v-if="loading" class="admin-muted">正在加载...</p>
          <button
            v-for="exercise in exercises"
            :key="exercise.id"
            :class="['admin-row', { active: exercise.id === selectedId }]"
            type="button"
            @click="selectExercise(exercise)"
          >
            <img v-if="exercise.imageUrl" :src="exercise.imageUrl" alt="" />
            <span>
              <strong>{{ exercise.name }}</strong>
              <small>{{ exercise.bodyPart }} · {{ exercise.equipment }}</small>
            </span>
            <em :class="{ hidden: !exercise.enabled }">{{ exercise.enabled ? '显示' : '隐藏' }}</em>
          </button>
        </aside>

        <form class="admin-form editor-form" @submit.prevent="saveExercise">
          <div class="editor-title">
            <h2>{{ isEditing ? '编辑动作' : '新增动作' }}</h2>
            <label class="switch-row">
              <input v-model="form.enabled" type="checkbox" />
              <span>前台显示</span>
            </label>
          </div>

          <div class="form-grid">
            <label>
              <span>动作名称</span>
              <input v-model="form.name" required />
            </label>
            <label>
              <span>训练部位</span>
              <select v-model="form.bodyPart">
                <option v-for="part in bodyParts" :key="part" :value="part">{{ part }}</option>
              </select>
            </label>
            <label>
              <span>器械名称</span>
              <input v-model="form.equipment" required />
            </label>
            <label>
              <span>难度</span>
              <select v-model="form.difficulty">
                <option v-for="difficulty in difficulties" :key="difficulty" :value="difficulty">
                  {{ difficulty }}
                </option>
              </select>
            </label>
          </div>

          <label>
            <span>图片地址</span>
            <input v-model="form.imageUrl" placeholder="/exercise-images/seated-chest-press.svg" />
          </label>

          <label>
            <span>目标肌群（每行一个）</span>
            <textarea v-model="form.targetMuscles" required rows="3"></textarea>
          </label>
          <label>
            <span>器械设置</span>
            <textarea v-model="form.setup" required rows="3"></textarea>
          </label>
          <label>
            <span>动作步骤（每行一步）</span>
            <textarea v-model="form.steps" required rows="5"></textarea>
          </label>
          <label>
            <span>呼吸提示</span>
            <input v-model="form.breathing" required />
          </label>
          <label>
            <span>常见错误（每行一个）</span>
            <textarea v-model="form.commonMistakes" required rows="4"></textarea>
          </label>
          <label>
            <span>安全提醒（每行一个）</span>
            <textarea v-model="form.safetyNotes" required rows="4"></textarea>
          </label>

          <div class="editor-actions">
            <button class="primary-button" type="submit" :disabled="saving">
              {{ saving ? '保存中...' : '保存动作' }}
            </button>
            <button v-if="isEditing" class="danger-button" type="button" :disabled="saving" @click="removeExercise">
              删除动作
            </button>
          </div>
        </form>
      </section>
    </template>
  </main>
</template>
