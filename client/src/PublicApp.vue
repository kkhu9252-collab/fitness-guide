<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchBodyParts, fetchExercise, fetchExercises } from './api.js'
import { filterExercises, getExerciseSummary } from './exerciseFilters.js'

const bodyPartIcons = {
  胸部: 'CH',
  背部: 'BK',
  腿部: 'LG',
  肩部: 'SH',
  手臂: 'AR',
  核心: 'CR',
}

const bodyParts = ref([])
const exercises = ref([])
const selectedBodyPart = ref('')
const selectedExercise = ref(null)
const query = ref('')
const loading = ref(true)
const detailLoading = ref(false)
const error = ref('')

const filteredExercises = computed(() =>
  filterExercises(exercises.value, {
    bodyPart: selectedBodyPart.value,
    query: query.value,
  }),
)

const viewTitle = computed(() => {
  if (selectedExercise.value) return selectedExercise.value.name
  if (selectedBodyPart.value) return `${selectedBodyPart.value}动作`
  return '健身动作库'
})

async function loadHome() {
  loading.value = true
  error.value = ''
  try {
    const [parts, allExercises] = await Promise.all([fetchBodyParts(), fetchExercises()])
    bodyParts.value = parts
    exercises.value = allExercises
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function selectBodyPart(bodyPart) {
  selectedBodyPart.value = bodyPart
  selectedExercise.value = null
  query.value = ''
  error.value = ''
  try {
    exercises.value = await fetchExercises({ bodyPart })
  } catch (err) {
    error.value = err.message
  }
}

async function searchExercises() {
  selectedExercise.value = null
  error.value = ''
  try {
    exercises.value = await fetchExercises({
      bodyPart: selectedBodyPart.value,
      q: query.value,
    })
  } catch (err) {
    error.value = err.message
  }
}

async function openExercise(exercise) {
  detailLoading.value = true
  error.value = ''
  try {
    selectedExercise.value = await fetchExercise(exercise.id)
  } catch (err) {
    error.value = err.message
  } finally {
    detailLoading.value = false
  }
}

function goHome() {
  selectedBodyPart.value = ''
  selectedExercise.value = null
  query.value = ''
  loadHome()
}

function goBackToList() {
  selectedExercise.value = null
}

onMounted(loadHome)
</script>

<template>
  <main class="phone-shell">
    <header class="top-bar">
      <button v-if="selectedExercise" class="icon-button" type="button" aria-label="返回动作列表" @click="goBackToList">
        ←
      </button>
      <button v-else-if="selectedBodyPart" class="icon-button" type="button" aria-label="返回首页" @click="goHome">
        ←
      </button>
      <div>
        <p class="eyebrow">Gym Machine Guide</p>
        <h1>{{ viewTitle }}</h1>
      </div>
    </header>

    <section v-if="error" class="notice">
      <strong>加载失败</strong>
      <p>{{ error }}</p>
    </section>

    <section v-if="loading" class="loading-state">
      <div class="loading-mark"></div>
      <p>正在加载动作数据...</p>
    </section>

    <template v-else>
      <section v-if="!selectedBodyPart && !selectedExercise" class="home-view">
        <div class="hero-panel">
          <div>
            <p class="kicker">新手器械动作指导</p>
            <h2>先选训练部位，再看器械怎么调、动作怎么做。</h2>
          </div>
          <div class="hero-visual" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div class="section-heading">
          <h2>选择训练部位</h2>
          <span>{{ bodyParts.length }} 类</span>
        </div>

        <div class="body-grid">
          <button
            v-for="bodyPart in bodyParts"
            :key="bodyPart"
            class="body-card"
            type="button"
            @click="selectBodyPart(bodyPart)"
          >
            <span class="body-icon">{{ bodyPartIcons[bodyPart] || 'EX' }}</span>
            <span>{{ bodyPart }}</span>
          </button>
        </div>

        <div class="quick-list">
          <div class="section-heading">
            <h2>推荐先看</h2>
            <span>{{ exercises.length }} 个动作</span>
          </div>
          <button
            v-for="exercise in exercises.slice(0, 4)"
            :key="exercise.id"
            class="exercise-row"
            type="button"
            @click="openExercise(exercise)"
          >
            <span class="machine-thumb">
              <img v-if="exercise.imageUrl" :src="exercise.imageUrl" :alt="`${exercise.name}示意图`" />
              <span v-else>{{ exercise.bodyPart.slice(0, 1) }}</span>
            </span>
            <span>
              <strong>{{ exercise.name }}</strong>
              <small>{{ getExerciseSummary(exercise) }}</small>
            </span>
          </button>
        </div>
      </section>

      <section v-else-if="!selectedExercise" class="list-view">
        <form class="search-box" @submit.prevent="searchExercises">
          <input v-model="query" type="search" placeholder="搜索动作、器械或肌群" />
          <button type="submit">搜索</button>
        </form>

        <div class="part-tabs" aria-label="训练部位">
          <button
            v-for="bodyPart in bodyParts"
            :key="bodyPart"
            :class="{ active: bodyPart === selectedBodyPart }"
            type="button"
            @click="selectBodyPart(bodyPart)"
          >
            {{ bodyPart }}
          </button>
        </div>

        <div class="exercise-list">
          <button
            v-for="exercise in filteredExercises"
            :key="exercise.id"
            class="exercise-card"
            type="button"
            @click="openExercise(exercise)"
          >
            <span class="machine-illustration" aria-hidden="true">
              <img v-if="exercise.imageUrl" :src="exercise.imageUrl" alt="" />
              <span v-else></span>
            </span>
            <span class="exercise-copy">
              <strong>{{ exercise.name }}</strong>
              <small>{{ getExerciseSummary(exercise) }}</small>
            </span>
            <span class="arrow">›</span>
          </button>
        </div>

        <p v-if="filteredExercises.length === 0" class="empty-state">没有找到匹配动作，换个关键词试试。</p>
      </section>

      <section v-else class="detail-view">
        <div v-if="detailLoading" class="loading-state compact">
          <div class="loading-mark"></div>
          <p>正在打开动作详情...</p>
        </div>

        <template v-else>
          <div class="detail-visual">
            <video
              v-if="selectedExercise.videoUrl"
              class="exercise-video"
              :src="selectedExercise.videoUrl"
              :poster="selectedExercise.imageUrl"
              controls
              muted
              loop
              playsinline
              preload="metadata"
            ></video>
            <img
              v-else-if="selectedExercise.imageUrl"
              class="exercise-photo"
              :src="selectedExercise.imageUrl"
              :alt="`${selectedExercise.name}动作示意图`"
            />
            <div v-else class="machine-frame">
              <span class="seat"></span>
              <span class="handle"></span>
              <span class="weight-stack"></span>
            </div>
            <div>
              <span class="pill">{{ selectedExercise.bodyPart }}</span>
              <span class="pill muted">{{ selectedExercise.difficulty }}</span>
            </div>
          </div>

          <div class="detail-card">
            <h2>目标肌群</h2>
            <div class="tag-list">
              <span v-for="muscle in selectedExercise.targetMuscles" :key="muscle">{{ muscle }}</span>
            </div>
          </div>

          <div class="detail-card">
            <h2>器械设置</h2>
            <p>{{ selectedExercise.setup }}</p>
          </div>

          <div class="detail-card">
            <h2>动作步骤</h2>
            <ol>
              <li v-for="step in selectedExercise.steps" :key="step">{{ step }}</li>
            </ol>
            <p class="breathing">{{ selectedExercise.breathing }}</p>
          </div>

          <div v-if="selectedExercise.videoTips?.length" class="detail-card video-tips">
            <h2>视频动作要点</h2>
            <ul>
              <li v-for="tip in selectedExercise.videoTips" :key="tip">{{ tip }}</li>
            </ul>
          </div>

          <div class="detail-card">
            <h2>常见错误</h2>
            <ul>
              <li v-for="mistake in selectedExercise.commonMistakes" :key="mistake">{{ mistake }}</li>
            </ul>
          </div>

          <div class="detail-card warning">
            <h2>安全提醒</h2>
            <ul>
              <li v-for="note in selectedExercise.safetyNotes" :key="note">{{ note }}</li>
            </ul>
          </div>
        </template>
      </section>
    </template>
  </main>
</template>
