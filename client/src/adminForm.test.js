import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createEmptyExerciseForm, exerciseToForm, formToExercisePayload, linesToList } from './adminForm.js'

describe('admin exercise form helpers', () => {
  test('creates an empty form with safe defaults', () => {
    assert.deepEqual(createEmptyExerciseForm(), {
      id: null,
      name: '',
      bodyPart: '胸部',
      targetMuscles: '',
      equipment: '',
      difficulty: '新手',
      imageUrl: '',
      videoUrl: '',
      videoTips: '',
      setup: '',
      steps: '',
      breathing: '',
      commonMistakes: '',
      safetyNotes: '',
      enabled: true,
    })
  })

  test('converts line text into trimmed lists', () => {
    assert.deepEqual(linesToList('第一步\n\n 第二步 \n'), ['第一步', '第二步'])
  })

  test('converts an API exercise into editable text fields and back to payload', () => {
    const form = exerciseToForm({
      id: 8,
      name: '腿屈伸',
      bodyPart: '腿部',
      targetMuscles: ['股四头肌'],
      equipment: '腿屈伸机',
      difficulty: '新手',
      imageUrl: '/exercise-images/leg-extension.svg',
      videoUrl: '/exercise-videos/leg-extension.mp4',
      videoTips: ['膝盖对准转轴', '顶部短暂停顿'],
      setup: '调整滚垫。',
      steps: ['坐稳', '伸膝'],
      breathing: '抬起呼气。',
      commonMistakes: ['速度过快'],
      safetyNotes: ['膝盖不适停止'],
      enabled: false,
    })

    assert.equal(form.steps, '坐稳\n伸膝')
    assert.deepEqual(formToExercisePayload(form), {
      name: '腿屈伸',
      bodyPart: '腿部',
      targetMuscles: ['股四头肌'],
      equipment: '腿屈伸机',
      difficulty: '新手',
      imageUrl: '/exercise-images/leg-extension.svg',
      videoUrl: '/exercise-videos/leg-extension.mp4',
      videoTips: ['膝盖对准转轴', '顶部短暂停顿'],
      setup: '调整滚垫。',
      steps: ['坐稳', '伸膝'],
      breathing: '抬起呼气。',
      commonMistakes: ['速度过快'],
      safetyNotes: ['膝盖不适停止'],
      enabled: false,
    })
  })
})
