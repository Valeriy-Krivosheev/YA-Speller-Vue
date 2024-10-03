import type { AxiosRequestConfig } from 'axios'

export interface formProps {
  modelValue: string
}
export interface spellerResponse {
  code: number
  col: number
  len: number
  pos: number
  row: number
  s: string[]
  word: string
  index?: string
}
export interface AxiosResponse<T = never> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: AxiosRequestConfig<T>
  request?: any
}
export interface newSpellerWord {
  index: string
  value: string
}
