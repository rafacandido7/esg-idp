import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/data/questions.ts', import.meta.url), 'utf8')
const questions = JSON.parse(source.slice(source.indexOf('[\n'), source.lastIndexOf(' as const')))
assert.equal(questions.length, 100, 'O banco deve conter 100 questões')
for (const [index, question] of questions.entries()) {
  const label = `Questão ${question.id}`
  assert.equal(question.id, index + 1, `${label}: numeração incorreta`)
  assert.ok(question.prompt.trim(), `${label}: enunciado vazio`)
  assert.equal(question.options.length, 5, `${label}: precisa de cinco alternativas`)
  assert.match(question.answer, /^[a-e]$/, `${label}: gabarito inválido`)
  assert.equal(new Set(question.options).size, 5, `${label}: alternativas duplicadas`)
  for (const text of [question.prompt, ...question.options]) {
    assert.ok(text.trim(), `${label}: texto vazio`)
    assert.doesNotMatch(text, /<\/?[\w]+:|&(?:amp|lt|gt|quot|apos);|\ufffd/, `${label}: XML ou caracteres corrompidos`)
  }
  const statements = question.prompt.split('\n').filter((line) => line.startsWith('( )'))
  if (question.options.every((option) => /^[VF](?:, [VF]){4}$/.test(option))) {
    assert.equal(statements.length, 5, `${label}: precisa de cinco afirmações em linhas separadas`)
  }
  if (/\bassocie\b/i.test(question.prompt)) {
    const list = question.prompt.split('\n').filter((line) => /^\d+\. /.test(line))
    assert.equal(list.length, 4, `${label}: associação sem quatro itens numerados`)
    assert.equal(statements.length, 4, `${label}: associação sem quatro descrições`)
    for (const option of question.options) {
      assert.match(option, /^[1-4](?:, [1-4]){3}$/, `${label}: sequência de associação inválida`)
      assert.equal(new Set(option.split(', ')).size, 4, `${label}: sequência com itens repetidos`)
    }
  }
}

assert.deepEqual(questions[0].options, [
  'Pagamento por Serviços Ambientais (PSA)', 'Certificação ISO 14001',
  'Mecanismo de Desenvolvimento Limpo (MDL)', 'Taxa de Carbono Canadense', 'RenovaBio',
], 'Regressão: as alternativas da questão 1 foram deslocadas')
assert.equal(questions[0].answer, 'c')
assert.equal(questions[43].answer, 'b', 'Questão 44: associação correta é 1, 3, 4, 2')
assert.equal(questions[54].options[1], 'F, V, F, F, V', 'Questão 55: sequência corrigida ausente')
assert.equal(questions[54].answer, 'b')
assert.equal(questions[69].options[0], 'V, F, V, V, F', 'Regressão na questão 70')
console.log('100 questões validadas: 500 alternativas preenchidas, gabaritos válidos, sem XML, listas numeradas e afirmações separadas.')
