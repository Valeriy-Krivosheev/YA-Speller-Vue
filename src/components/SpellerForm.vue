<template>
  <form @submit.prevent="sendRequest" ref="form">
    <div
      class="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
    >
      <div class="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
        <textarea
          ref="textarea"
          v-if="isShowTextArea"
          v-model="model"
          rows="4"
          class="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400 text-xm leading-4 min-h-24"
          placeholder="Введите текст для проверки"
          required
        ></textarea>
        <div
          v-else
          class="py-[3px] w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400 relative outline-none"
          id="fake-textarea"
          ref="fakeTextarea"
          contenteditable="true"
          @input="showTextArea($event)"
          v-click-outside="closeHelper"
        >
          <pre ref="fakeTextareaContent" class="min-h-24" v-html="highlightedText"></pre>
          <div
            v-if="isShowHelper"
            class="absolute bg-gray-200 rounded z-10"
            :style="helperPosition"
          >
            <span
              class="cursor-pointer block p-2 rounded hover:bg-gray-300"
              v-for="(word, i) in spellerWords"
              :key="i"
              @click="replaceWord(word)"
            >
              {{ word.value }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between px-3 py-2 border-t dark:border-gray-600">
        <button
          type="submit"
          :disabled="isDisabled || isLoading"
          class="disabled:bg-blue-300 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-white bg-blue-500 rounded-lg focus:ring-4 focus:ring-blue-200 hover:enabled:bg-blue-600"
        >
          Проверить текст
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, type CSSProperties, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { initFlowbite } from 'flowbite'
import axios from 'axios'
import { formProps, spellerResponse, AxiosResponse, newSpellerWord } from '@/components/types'

onMounted(() => {
  initFlowbite()
})

const props = defineProps<formProps>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
const model = defineModel<string>()

const isDisabled = computed<boolean>(() => !props.modelValue.trim())
const isLoading = ref<boolean>(false)
const isShowTextArea = ref<boolean>(true)
const textarea = ref<HTMLTextAreaElement | null>(null)
const form = ref<HTMLFormElement | null>(null)
const fakeTextarea = ref<HTMLElement | null>(null)
const fakeTextareaContent = ref<HTMLElement | null>(null)

const errorList = ref<spellerResponse[]>([])
const spellerWords = ref<newSpellerWord[]>([])
const highlightedText = ref('')
const isShowHelper = ref(false)
const helperPosition = ref<CSSProperties>({
  top: '',
  left: ''
})
const sendRequest = async (): Promise<void> => {
  try {
    isLoading.value = true
    const response: AxiosResponse<spellerResponse[]> = await axios.get(
      'https://speller.yandex.net/services/spellservice.json/checkText',
      {
        params: {
          text: props.modelValue
        }
      }
    )
    errorList.value = response.data
    isShowTextArea.value = false
    insertSpellerText()
  } catch (e) {
    alert(e)
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 200)
  }
}

const insertSpellerText = (): void => {
  let updatedText = model.value as string
  let htmlOffset: number = 0
  errorList.value.forEach((error: spellerResponse, index: number) => {
    const { pos, len } = error
    error.index = `error-${index}`
    const word: string = (model.value as string).substring(pos, pos + len)
    const wrappedWord: string = `<span id="error-${index}"  class="bg-red-300 cursor-pointer p-0.5 rounded hover:bg-red-200 transition-colors" data-error='${JSON.stringify(
      error
    )}'>${word}</span>`
    updatedText =
      updatedText.substring(0, pos + htmlOffset) +
      wrappedWord +
      updatedText.substring(pos + htmlOffset + len)
    htmlOffset += wrappedWord.length - word.length
  })
  highlightedText.value = updatedText
}
const replaceWord = (word: newSpellerWord) => {
  const targetSpan = document.getElementById(word.index)
  if (targetSpan) {
    targetSpan.innerText = word.value
    targetSpan.className = 'pointer-events-none'
  }
}

const closeHelper = () => {
  isShowHelper.value = false
}

const cursorPosition = ref<number>(0)
const showTextArea = (e: Event) => {
  getCursorPosition()
  const newText = (fakeTextareaContent.value as HTMLElement).innerText
  emit('update:modelValue', newText)
  isShowTextArea.value = true
  nextTick(() => {
    ;(textarea.value as HTMLTextAreaElement).focus()
    if ((e as InputEvent).data === ' ') {
      ;(textarea.value as HTMLTextAreaElement).setSelectionRange(
        ++cursorPosition.value,
        cursorPosition.value
      )
    } else {
      ;(textarea.value as HTMLTextAreaElement).setSelectionRange(
        cursorPosition.value,
        cursorPosition.value
      )
    }
  })
}

const getCursorPosition = (): void => {
  const selection: Selection | null = window.getSelection()
  if (selection?.rangeCount) {
    const range: Range = selection.getRangeAt(0)
    const preCaretRange: Range = range.cloneRange()
    preCaretRange.selectNodeContents(fakeTextarea.value as HTMLElement)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    cursorPosition.value = preCaretRange.toString().trim().length
  }
}

const handleSpanClick = (e: Event) => {
  const errorString: string | null = (e.target as HTMLElement).getAttribute('data-error')
  if (errorString) {
    const error: spellerResponse = JSON.parse(errorString)
    spellerWords.value = error.s.map((item): newSpellerWord => {
      return {
        value: item,
        index: error.index as string
      }
    })
    setSpellerBlockPosition(error.index as string)
    isShowHelper.value = true
  }
}

const setSpellerBlockPosition = (id: string) => {
  const fakeTextareaRect: DOMRect = (fakeTextarea.value as HTMLElement).getBoundingClientRect()
  const spellerSpanRect: DOMRect = (
    document.getElementById(String(id)) as HTMLElement
  ).getBoundingClientRect()
  helperPosition.value.top =
    spellerSpanRect.top - fakeTextareaRect.top + spellerSpanRect.height + 5 + 'px'
  helperPosition.value.left = spellerSpanRect.left - fakeTextareaRect.left + 'px'
}

onMounted(() => {
  ;(form.value as HTMLFormElement).addEventListener('click', handleSpanClick)
})
onBeforeUnmount(() => {
  ;(form.value as HTMLFormElement).removeEventListener('click', handleSpanClick)
})
</script>
<style scoped lang="scss">
pre {
  line-height: 1.7rem;
  font-family: inherit;
  font-size: inherit;
  margin: 0;
  white-space: pre-wrap;
}
</style>
