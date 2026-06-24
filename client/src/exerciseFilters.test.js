import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { filterExercises, getExerciseSummary } from './exerciseFilters.js'

const exercises = [
  { id: 1, name: '坐姿推胸', bodyPart: '胸部', equipment: '坐姿推胸机', targetMuscles: ['胸大肌'] },
  { id: 2, name: '高位下拉', bodyPart: '背部', equipment: '高位下拉器', targetMuscles: ['背阔肌'] },
  { id: 3, name: '绳索下压', bodyPart: '手臂', equipment: '龙门架绳索', targetMuscles: ['肱三头肌'] },
]

describe('filterExercises', () => {
  test('filters by selected body part', () => {
    assert.deepEqual(filterExercises(exercises, { bodyPart: '胸部', query: '' }), [exercises[0]])
  })

  test('searches by exercise name, equipment, or target muscle', () => {
    assert.deepEqual(filterExercises(exercises, { bodyPart: '', query: '龙门架' }), [exercises[2]])
    assert.deepEqual(filterExercises(exercises, { bodyPart: '', query: '背阔' }), [exercises[1]])
  })
})

describe('getExerciseSummary', () => {
  test('combines equipment, difficulty, and target muscles for card display', () => {
    assert.equal(
      getExerciseSummary({ equipment: '坐姿推胸机', difficulty: '新手', targetMuscles: ['胸大肌', '肱三头肌'] }),
      '坐姿推胸机 · 新手 · 胸大肌、肱三头肌',
    )
  })
})
