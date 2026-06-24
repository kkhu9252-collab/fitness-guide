export function filterExercises(exercises, { bodyPart = '', query = '' } = {}) {
  const normalizedQuery = query.trim().toLowerCase()

  return exercises.filter((exercise) => {
    const matchesPart = !bodyPart || exercise.bodyPart === bodyPart
    const searchable = [
      exercise.name,
      exercise.equipment,
      ...(exercise.targetMuscles || []),
    ]
      .join(' ')
      .toLowerCase()
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)

    return matchesPart && matchesQuery
  })
}

export function getExerciseSummary(exercise) {
  return [exercise.equipment, exercise.difficulty, (exercise.targetMuscles || []).join('、')]
    .filter(Boolean)
    .join(' · ')
}
