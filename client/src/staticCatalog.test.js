import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { findStaticExercise, listStaticBodyParts, listStaticExercises } from './staticCatalog.js'

const catalog = {
  bodyParts: ['胸部', '背部'],
  exercises: [
    {
      id: 1,
      name: '坐姿推胸',
      bodyPart: '胸部',
      equipment: '坐姿推胸机',
      targetMuscles: ['胸大肌'],
      imageUrl: '/exercise-images/seated-chest-press.svg',
      enabled: true,
    },
    {
      id: 2,
      name: '隐藏动作',
      bodyPart: '背部',
      equipment: '测试器械',
      targetMuscles: ['背阔肌'],
      imageUrl: '/exercise-images/lat-pulldown.svg',
      enabled: false,
    },
  ],
}

describe('static catalog helpers', () => {
  test('lists body parts from static catalog', () => {
    assert.deepEqual(listStaticBodyParts(catalog), ['胸部', '背部'])
  })

  test('lists enabled exercises with body part and query filters', () => {
    assert.deepEqual(listStaticExercises(catalog, { bodyPart: '胸部', q: '推胸' }), [catalog.exercises[0]])
    assert.deepEqual(listStaticExercises(catalog, { bodyPart: '背部' }), [])
  })

  test('finds only enabled exercise details', () => {
    assert.equal(findStaticExercise(catalog, 1).name, '坐姿推胸')
    assert.equal(findStaticExercise(catalog, 2), null)
  })
})
