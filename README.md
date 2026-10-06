# Revisão para AV1

Aplicação de estudo de ESG e Green IT, com 100 questões e sessões configuráveis.

## Desenvolvimento

```sh
npm install
npm run dev
```

## Preparar as questões localmente

Coloque `Revisao para AV1 - Exercícios TECH.docx` na raiz e execute:

```sh
npm run prepare:data
npm run validate:data
```

A preparação local requer `unzip`. O documento Word é ignorado pelo Git.
Versione o banco gerado em `src/data/questions.ts` após atualizar o material.
O build valida esse banco e não lê o Word nem executa `unzip`:

```sh
npm run build
```

## Revisão do material

As 100 questões foram conferidas quanto ao texto extraído, à ordem das
alternativas e ao gabarito do documento. O extrator preserva quebras entre
afirmações e numera os quatro itens de cada associação.

Duas correções editoriais são aplicadas pelo extrator:

- Questão 44: o Word indica A, mas a associação resulta em `1, 3, 4, 2`, alternativa B.
- Questão 55: a alternativa B foi ajustada de `F, V, F, V, F` para `F, V, F, F, V`.
  Governança não significa relações governamentais, e a economia verde considera justiça social.

As correções possuem verificações para exigir nova revisão se esses itens
forem alterados no documento. As demais respostas seguem o material fornecido;
a revisão não atualiza afirmações históricas ou compromissos de empresas para a data atual.
