import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const documentPath = 'Revisao para AV1 - Exercícios TECH.docx'
const xml = execFileSync('unzip', ['-p', documentPath, 'word/document.xml'], { encoding: 'utf8' })
const decode = (value) => value
  .replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"').replaceAll('&#39;', "'")
const paragraphs = (xml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) ?? [])
  .map((paragraph) => decode([...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((match) => match[1]).join('')).trim())
  .filter(Boolean)
const [body, key = ''] = paragraphs.join('\n').split(/\nGabarito\s*\n/)
const answers = [...key.matchAll(/\b([a-e])\)/gi)].map((match) => match[1].toLowerCase())
const starts = [...body.matchAll(/(?:^|\n)(\d{1,3})\s*[–-]\s*/g)]

const questions = starts.map((start, index) => {
  const raw = body.slice(start.index + start[0].length, starts[index + 1]?.index ?? body.length).trim()
  // Alguns itens foram digitados no Word sem espaço antes de "a)".
  // A marca da alternativa é suficientemente específica para separar os cinco blocos.
  const marked = [...raw.matchAll(/([a-e])\)\s*/gi)]
  let prompt = raw
  let options = []

  if (marked.length >= 5) {
    prompt = raw.slice(0, marked[0].index).trim()
    options = marked.slice(0, 5).map((mark, optionIndex) => raw
      .slice(mark.index + mark[0].length, marked[optionIndex + 1]?.index ?? raw.length)
      .replace(/\s+/g, ' ').trim())
  } else {
    const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean)
    options = lines.slice(-5)
    prompt = lines.slice(0, -5).join('\n')
  }

  return { id: Number(start[1]), prompt, options, answer: answers[index] }
})

if (questions.length !== 100 || answers.length !== 100 || questions.some((question) => question.options.length !== 5)) {
  throw new Error(`Não foi possível ler o questionário corretamente: ${questions.length} questões, ${answers.length} respostas.`)
}

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/questions.ts', `export type Question = { id: number; prompt: string; options: string[]; answer: string }\n\nexport const questions: Question[] = ${JSON.stringify(questions, null, 2)} as const\n`)
console.log(`Banco de questões atualizado: ${questions.length} questões.`)
