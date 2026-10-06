import { useMemo, useState } from 'react'
import { questions } from './data/questions'

type Mode = 'study' | 'exam'
type AnswerMap = Record<number, string>
const letters = ['A', 'B', 'C', 'D', 'E']

export default function App() {
  const [mode, setMode] = useState<Mode>('study')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [finished, setFinished] = useState(false)
  const [started, setStarted] = useState(false)
  const [count, setCount] = useState(20)
  const [randomized, setRandomized] = useState(true)
  const [sessionQuestions, setSessionQuestions] = useState(questions)
  const [reviewing, setReviewing] = useState(false)
  const question = sessionQuestions[currentIndex]
  const answered = Object.keys(answers).length
  const score = useMemo(() => sessionQuestions.filter((item) => answers[item.id] === item.answer).length, [answers, sessionQuestions])

  function select(optionIndex: number) {
    if (finished || reviewing) return
    setAnswers((previous) => ({ ...previous, [question.id]: letters[optionIndex].toLowerCase() }))
  }

  function restart() {
    const pool = [...questions]
    if (randomized) {
      for (let index = pool.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1))
        ;[pool[index], pool[other]] = [pool[other], pool[index]]
      }
    }
    setSessionQuestions(pool.slice(0, count))
    setAnswers({}); setCurrentIndex(0); setFinished(false); setReviewing(false); setStarted(true)
  }

  if (!started) return <main className="shell setup-shell"><section className="result-card setup-card">
    <span className="eyebrow">ESG e Green IT</span>
    <h1>Revisão para AV1</h1>
    <p>Escolha o tamanho da sua sessão. Você tem {questions.length} questões disponíveis para praticar no seu ritmo.</p>
    <form onSubmit={(event) => { event.preventDefault(); restart() }}>
      <fieldset><legend>Quantidade de questões</legend><div className="count-options">{[10, 20, 30, 50, questions.length].filter((value, index, values) => value <= questions.length && values.indexOf(value) === index).map((value) => <button type="button" key={value} aria-pressed={count === value} className={count === value ? 'active' : ''} onClick={() => setCount(value)}>{value === questions.length ? `Todas (${value})` : value}</button>)}</div></fieldset>
      <fieldset><legend>Modo de prática</legend><div className="mode-switch"><button type="button" aria-pressed={mode === 'study'} className={mode === 'study' ? 'active' : ''} onClick={() => setMode('study')}>Estudar</button><button type="button" aria-pressed={mode === 'exam'} className={mode === 'exam' ? 'active' : ''} onClick={() => setMode('exam')}>Simulado</button></div><p className="setup-help">{mode === 'study' ? 'Veja a resposta correta após cada escolha.' : 'Confira as respostas depois de finalizar.'}</p></fieldset>
      <label className="random-toggle"><input type="checkbox" checked={randomized} onChange={(event) => setRandomized(event.target.checked)} />Sortear questões a cada nova sessão</label>
      <button className="button primary start-button" type="submit">Começar · {count} questões</button>
    </form>
  </section></main>

  if (finished) {
    const percentage = Math.round((score / sessionQuestions.length) * 100)
    return <main className="shell"><section className="result-card">
      <span className="eyebrow">Resultado final</span>
      <h1>{score} de {sessionQuestions.length}</h1>
      <p className="score">{percentage}% de acertos</p>
      <p>{percentage >= 70 ? 'Excelente base para a AV1. Revise os itens incorretos para consolidar os conceitos.' : 'Use a revisão abaixo para identificar os temas que precisam de mais atenção.'}</p>
      <p>{answered} respondidas · {sessionQuestions.length - answered} em branco</p>
      <div className="result-actions"><button className="button primary" onClick={restart}>Nova sessão</button><button className="button secondary" onClick={() => { setFinished(false); setReviewing(true); setCurrentIndex(0) }}>Revisar respostas</button><button className="button secondary" onClick={() => setStarted(false)}>Alterar configuração</button></div>
    </section></main>
  }

  const selected = answers[question.id]
  const showFeedback = reviewing || (mode === 'study' && Boolean(selected))
  const feedbackClass = selected === question.answer ? 'correct' : 'wrong'
  return <main className="shell">
    <header className="hero">
      <div><span className="eyebrow">ESG e Green IT</span><h1>Revisão para AV1</h1><p>{sessionQuestions.length} questões · {reviewing ? 'Revisão das respostas' : mode === 'study' ? 'Modo estudo' : 'Simulado'} · {randomized ? 'Seleção aleatória' : 'Ordem do material'}</p></div>
      <button className="button secondary" onClick={() => { if (reviewing || answered === 0 || window.confirm('Sair da sessão? As respostas atuais serão descartadas ao começar outra.')) setStarted(false) }}>Configurar sessão</button>
    </header>
    <section className="dashboard"><div><span>Progresso</span><strong>{answered}/{sessionQuestions.length}</strong></div><div className="progress" role="progressbar" aria-label="Questões respondidas" aria-valuemin={0} aria-valuemax={sessionQuestions.length} aria-valuenow={answered}><i style={{ width: `${(answered / sessionQuestions.length) * 100}%` }} /></div><div><span>{mode === 'exam' && !reviewing ? 'Modo' : 'Acertos'}</span><strong>{mode === 'exam' && !reviewing ? 'Simulado' : score}</strong></div></section>
    <section className="quiz-layout">
      <aside className="navigator"><details><summary>Questões · {answered}/{sessionQuestions.length}</summary><div>{sessionQuestions.map((item, index) => <button key={item.id} aria-current={index === currentIndex ? 'step' : undefined} className={`${index === currentIndex ? 'current' : ''} ${answers[item.id] ? 'answered' : ''}`} onClick={() => setCurrentIndex(index)} aria-label={`Ir para questão ${index + 1}${answers[item.id] ? ', respondida' : ''}`}>{index + 1}</button>)}</div></details></aside>
      <article className="question-card">
        <div className="question-meta"><span>Item {question.id} do material</span><span>{currentIndex + 1} de {sessionQuestions.length}</span></div>
        <h2>{question.prompt}</h2>
        <div className="options">{question.options.map((option, index) => {
          const value = letters[index].toLowerCase(); const isSelected = selected === value
          const state = showFeedback && isSelected ? feedbackClass : showFeedback && value === question.answer ? 'correct hint' : ''
          return <button key={value} aria-pressed={isSelected} disabled={reviewing} className={`option ${isSelected ? 'selected' : ''} ${state}`} onClick={() => select(index)}><b>{letters[index]}</b><span>{option}</span></button>
        })}</div>
        {showFeedback && <p aria-live="polite" className={`feedback ${feedbackClass}`}>{selected === question.answer ? 'Resposta correta. Muito bem!' : `${!selected ? 'Questão não respondida. ' : ''}A resposta correta é a alternativa ${question.answer.toUpperCase()}.`}</p>}
        <footer className="quiz-actions"><button className="button secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((item) => item - 1)}>← Anterior</button><button className="button primary" onClick={() => currentIndex === sessionQuestions.length - 1 ? setFinished(true) : setCurrentIndex((item) => item + 1)}>{currentIndex === sessionQuestions.length - 1 ? reviewing ? 'Ver resultado' : 'Finalizar' : 'Próxima →'}</button></footer>
      </article>
    </section>
  </main>
}
