// src/utils/mathParser.ts

/**
 * Avalia com segurança uma expressão matemática simples.
 * Suporta os operadores +, -, *, / e parênteses.
 * @param expression A expressão a ser avaliada.
 * @returns O resultado do cálculo.
 * @throws {Error} Se a expressão for inválida ou contiver caracteres não permitidos.
 */
export function evaluateMathExpression(expression: string): number {
  // Remove espaços da expressão
  expression = expression.replace(/\s/g, '');

  // Validação de segurança: permite apenas números, operadores, parênteses e ponto decimal.
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    throw new Error('A expressão contém caracteres inválidos.');
  }

  // Função para encontrar o último operador de menor precedência
  const findOperator = (expr: string): { index: number; op: string } | null => {
    let parenCount = 0;
    let additionIndex = -1;
    let subtractionIndex = -1;

    for (let i = expr.length - 1; i >= 0; i--) {
      const char = expr[i];
      if (char === ')') parenCount++;
      else if (char === '(') parenCount--;
      else if (parenCount === 0) {
        if (char === '+') {
          additionIndex = i;
          break; // Encontrou adição, que tem a menor precedência
        }
        if (char === '-') {
          if (subtractionIndex === -1) subtractionIndex = i;
        }
      }
    }

    if (additionIndex !== -1) return { index: additionIndex, op: '+' };
    if (subtractionIndex !== -1) return { index: subtractionIndex, op: '-' };

    parenCount = 0;
    let multiplicationIndex = -1;
    let divisionIndex = -1;

    for (let i = expr.length - 1; i >= 0; i--) {
      const char = expr[i];
      if (char === ')') parenCount++;
      else if (char === '(') parenCount--;
      else if (parenCount === 0) {
        if (char === '*') {
          multiplicationIndex = i;
          break; // Encontrou multiplicação
        }
        if (char === '/') {
          if (divisionIndex === -1) divisionIndex = i;
        }
      }
    }

    if (multiplicationIndex !== -1) return { index: multiplicationIndex, op: '*' };
    if (divisionIndex !== -1) return { index: divisionIndex, op: '/' };

    return null;
  };

  const evaluate = (expr: string): number => {
    // Se for um número, retorna o próprio número
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }

    // Se estiver entre parênteses, avalia a expressão interna
    if (expr.startsWith('(') && expr.endsWith(')')) {
      return evaluate(expr.slice(1, -1));
    }

    const operator = findOperator(expr);

    if (operator) {
      const left = evaluate(expr.slice(0, operator.index));
      const right = evaluate(expr.slice(operator.index + 1));

      switch (operator.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/':
          if (right === 0) throw new Error('Divisão por zero.');
          return left / right;
      }
    }

    // Se nenhum operador for encontrado e não for um número, a expressão é inválida
    throw new Error('Expressão inválida.');
  };

  const result = evaluate(expression);
  // Arredonda para um número inteiro, pois as rolagens de RPG geralmente são inteiras.
  return Math.round(result);
}
