export function listStaticBodyParts(catalog) {
  return catalog.bodyParts || []
}

export function listStaticExercises(catalog, { bodyPart = '', q = '' } = {}) {
  const query = q.trim().toLowerCase()
  return (catalog.exercises || []).filter((exercise) => {
    if (exercise.enabled === false) return false
    if (bodyPart && exercise.bodyPart !== bodyPart) return false
    if (!query) return true

    const searchable = [
      exercise.name,
      exercise.equipment,
      ...(exercise.targetMuscles || []),
    ]
      .join(' ')
      .toLowerCase()

    return searchable.includes(query)
  })
}

export function findStaticExercise(catalog, id) {
  return (
    (catalog.exercises || []).find(
      (exercise) => exercise.enabled !== false && Number(exercise.id) === Number(id),
    ) || null
  )
}
