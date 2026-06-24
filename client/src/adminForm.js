export function createEmptyExerciseForm() {
  return {
    id: null,
    name: '',
    bodyPart: '胸部',
    targetMuscles: '',
    equipment: '',
    difficulty: '新手',
    imageUrl: '',
    setup: '',
    steps: '',
    breathing: '',
    commonMistakes: '',
    safetyNotes: '',
    enabled: true,
  }
}

export function linesToList(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function listToLines(value) {
  return Array.isArray(value) ? value.join('\n') : ''
}

export function exerciseToForm(exercise) {
  return {
    id: exercise.id ?? null,
    name: exercise.name || '',
    bodyPart: exercise.bodyPart || '胸部',
    targetMuscles: listToLines(exercise.targetMuscles),
    equipment: exercise.equipment || '',
    difficulty: exercise.difficulty || '新手',
    imageUrl: exercise.imageUrl || '',
    setup: exercise.setup || '',
    steps: listToLines(exercise.steps),
    breathing: exercise.breathing || '',
    commonMistakes: listToLines(exercise.commonMistakes),
    safetyNotes: listToLines(exercise.safetyNotes),
    enabled: exercise.enabled !== false,
  }
}

export function formToExercisePayload(form) {
  return {
    name: form.name.trim(),
    bodyPart: form.bodyPart,
    targetMuscles: linesToList(form.targetMuscles),
    equipment: form.equipment.trim(),
    difficulty: form.difficulty,
    imageUrl: form.imageUrl.trim(),
    setup: form.setup.trim(),
    steps: linesToList(form.steps),
    breathing: form.breathing.trim(),
    commonMistakes: linesToList(form.commonMistakes),
    safetyNotes: linesToList(form.safetyNotes),
    enabled: Boolean(form.enabled),
  }
}
