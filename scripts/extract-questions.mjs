import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const documentName = readdirSync(projectRoot).find((name) => name.normalize('NFC') === 'Revisao para AV1 - Exercícios TECH.docx')
if (!documentName) throw new Error('Documento de estudo não encontrado. Execute prepare:data localmente com o Word na raiz do projeto; o build usa src/data/questions.ts.')
const documentPath = fileURLToPath(new URL(documentName, new URL('../', import.meta.url)))
const xml = execFileSync('unzip', ['-p', documentPath, 'word/document.xml'], { encoding: 'utf8' })
const decode = (value) => value
  .replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex ?? decimal, hex ? 16 : 10)))
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"').replaceAll('&apos;', "'").replaceAll('&amp;', '&')
const paragraphs = (xml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) ?? [])
  // A fronteira após w:t impede capturar w:tab, w:tabs e w:tbl como texto.
  .map((paragraph) => [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:(tab|br|cr)\b[^>]*\/\s*>/g)]
    .map((match) => match[2] ? match[2] === 'tab' ? '\t' : '\n' : decode(match[1])).join('').trim())
  .filter(Boolean)
const [body, key = ''] = paragraphs.join('\n').split(/\nGabarito\s*\n/)
const answers = [...key.matchAll(/\b([a-e])\)/gi)].map((match) => match[1].toLowerCase())
const starts = [...body.matchAll(/(?:^|\n)(\d{1,3})\s*[–-]\s*/g)]

const questions = starts.map((start, index) => {
  const raw = body.slice(start.index + start[0].length, starts[index + 1]?.index ?? body.length).trim()
  // Respeitar letras minúsculas e a sequência a–e: o A) de (PSA)
  // e parênteses no enunciado não são alternativas.
  const firstOption = /a\)\s+/.exec(raw)
  const marked = firstOption ? [...raw.slice(firstOption.index).matchAll(/([a-e])\)\s+/g)]
    .map((mark) => ({ letter: mark[1], index: mark.index + firstOption.index, length: mark[0].length })) : []
  let prompt = raw
  let options = []

  if (firstOption) {
    if (marked.map((mark) => mark.letter).join('') !== 'abcde') throw new Error(`Questão ${start[1]}: marcadores de alternativas fora da sequência a–e.`)
    prompt = raw.slice(0, marked[0].index).trim()
    options = marked.map((mark, optionIndex) => raw
      .slice(mark.index + mark.length, marked[optionIndex + 1]?.index ?? raw.length)
      .replace(/\s+/g, ' ').trim())
  } else {
    const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean)
    options = lines.slice(-5)
    prompt = lines.slice(0, -5).join('\n')
  }

  // Cada afirmação fica em sua própria linha; listas de associação ganham
  // os números usados nas sequências de resposta.
  prompt = prompt.replace(/\s*\(\s*\)\s*/g, '\n( ) ').trim()
  if (/\bassocie\b/i.test(prompt)) {
    let number = 0
    prompt = prompt.split('\n').map((line, lineIndex) => lineIndex > 0 && !line.startsWith('( )') && line.trim()
      ? `${++number}. ${line.trim()}` : line).join('\n')
  }
  if (!prompt || options.length !== 5 || options.some((option) => !option.trim()) || /<\/?w:/.test([prompt, ...options].join(' '))) {
    throw new Error(`Questão ${start[1]}: enunciado/alternativas vazios ou resíduos de XML.`)
  }
  return { id: Number(start[1]), prompt, options, answer: answers[index] }
})

if (questions.length !== 100 || answers.length !== 100 || questions.some((question, index) => question.id !== index + 1 || !/^[a-e]$/.test(question.answer))) {
  throw new Error(`Não foi possível ler o questionário corretamente: ${questions.length} questões, ${answers.length} respostas.`)
}

// Correções editoriais verificadas contra as próprias afirmações/listas.
// Manter aqui para que uma nova preparação local não restaure os erros do Word.
const association = questions.find((question) => question.id === 44)
if (association.options[0] !== '1, 4, 2, 3' || association.options[1] !== '1, 3, 4, 2' || association.answer !== 'a') {
  throw new Error('Questão 44 mudou no Word. Revise a correção editorial antes de gerar o banco.')
}
association.answer = 'b'
const trueFalse = questions.find((question) => question.id === 55)
if (trueFalse.options[1] !== 'F, V, F, V, F' || !trueFalse.prompt.includes('relações governamentais')) {
  throw new Error('Questão 55 mudou no Word. Revise a correção editorial antes de gerar o banco.')
}
trueFalse.options[1] = 'F, V, F, F, V'

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true })
writeFileSync(new URL('../src/data/questions.ts', import.meta.url), `export type Question = { id: number; prompt: string; options: string[]; answer: string }\n\nexport const questions: Question[] = ${JSON.stringify(questions, null, 2)} as const\n`)
console.log(`Banco de questões atualizado: ${questions.length} questões.`)
