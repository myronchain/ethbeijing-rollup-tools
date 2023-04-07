import React, { useState, useEffect, useCallback } from 'react'

export type Settings = {
  deadlineMinutes: number
  setDeadlineMinutes: (number) => void
}

const defaultDeadlineMinutes = 60 * 24 * 7
const defaultSlippage = 0.5

const useSettings = (): Settings => {
  const storedDeadlineMinutes = localStorage.getItem('transactionDeadlineMinutes')

  const [deadlineMinutes, setDeadlineMinutes] = useState<number>(
    storedDeadlineMinutes ? Number(storedDeadlineMinutes) : defaultDeadlineMinutes
  )

  useEffect(() => {
    localStorage.setItem('transactionDeadline', deadlineMinutes.toString())
  }, [deadlineMinutes])

  return {
    deadlineMinutes,
    setDeadlineMinutes,
  }
}

export default useSettings
