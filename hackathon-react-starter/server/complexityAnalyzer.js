/**
 * CodeLens Deterministic Structural Time & Auxiliary-Space Complexity Analyzer
 * Analyzes concrete source structure using Acorn ES2022 AST parser with resilient fallback
 * to token-scanning. Accurately determines loop nesting depths, sequential loops,
 * logarithmic halving, sorting dominance, recursion, and fixed constant bounds.
 */

let acorn = null;
try {
  acorn = require('acorn');
} catch (e) {
  // Acorn optional fallback
}

// Helper to sanitize code: remove strings and comments to analyze control flow
function stripCommentsAndStrings(code) {
  let cleaned = '';
  let inLineComment = false;
  let inBlockComment = false;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (c === '\n') {
        inLineComment = false;
        cleaned += '\n';
      }
    } else if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      } else if (c === '\n') {
        cleaned += '\n';
      }
    } else if (inString) {
      if (c === '\\') {
        i++; // skip escaped character
      } else if (c === stringChar) {
        inString = false;
        cleaned += '""';
      }
    } else {
      if (c === '/' && next === '/') {
        inLineComment = true;
        i++;
      } else if (c === '/' && next === '*') {
        inBlockComment = true;
        i++;
      } else if (c === '"' || c === "'" || c === '`') {
        inString = true;
        stringChar = c;
      } else {
        cleaned += c;
      }
    }
  }

  return cleaned;
}

/**
 * Extracts loops using Acorn AST parsing (Primary Engine)
 */
function extractLoopsAST(code) {
  if (!acorn) return null;

  let ast;
  try {
    ast = acorn.parse(code, { ecmaVersion: 2022, locations: true, sourceType: 'module' });
  } catch (e) {
    try {
      ast = acorn.parse(code, { ecmaVersion: 2022, locations: true, sourceType: 'script' });
    } catch (e2) {
      return null;
    }
  }

  const loops = [];
  function walk(node, loopAncestors = []) {
    if (!node || typeof node !== 'object') return;
    const isLoop = ['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForOfStatement', 'ForInStatement'].includes(node.type);
    let currentAncestors = loopAncestors;

    if (isLoop) {
      let isConstant = false;
      let constantValue = null;
      let boundVar = 'n';
      let isLog = false;
      let indexVar = null;

      if (node.type === 'ForStatement') {
        if (node.init && node.init.type === 'VariableDeclaration' && node.init.declarations[0]) {
          indexVar = node.init.declarations[0].id ? node.init.declarations[0].id.name : null;
        }
        if (node.test && node.test.type === 'BinaryExpression') {
          const right = node.test.right;
          const left = node.test.left;
          if (right.type === 'Literal' && typeof right.value === 'number') {
            isConstant = true;
            constantValue = right.value;
          } else if (right.type === 'MemberExpression' && right.property && right.property.name === 'length') {
            boundVar = right.object.name || 'arr';
          } else if (right.type === 'Identifier') {
            boundVar = right.name;
          } else if (left.type === 'Literal' && typeof left.value === 'number') {
            isConstant = true;
            constantValue = left.value;
          }
        }
        if (node.update) {
          if (node.update.type === 'AssignmentExpression') {
            if (['/=', '>>='].includes(node.update.operator)) isLog = true;
          }
        }
      } else if (node.type === 'ForOfStatement' || node.type === 'ForInStatement') {
        if (node.right && node.right.name) boundVar = node.right.name;
      } else if (node.type === 'WhileStatement') {
        if (node.test && node.test.type === 'BinaryExpression') {
          if (node.test.right && node.test.right.type === 'Literal' && typeof node.test.right.value === 'number') {
            isConstant = true;
            constantValue = node.test.right.value;
          }
        }
      }

      // Check inner linear calls inside body
      let hasInnerLinearCall = false;
      function checkLinear(n) {
        if (!n || typeof n !== 'object' || hasInnerLinearCall) return;
        if (n.type === 'CallExpression' && n.callee && n.callee.type === 'MemberExpression' && n.callee.property) {
          const prop = n.callee.property.name;
          if (['slice', 'reverse', 'map', 'filter', 'reduce', 'indexOf', 'includes', 'sort'].includes(prop)) {
            hasInnerLinearCall = true;
            return;
          }
        }
        if (n.type === 'SpreadElement') {
          hasInnerLinearCall = true;
          return;
        }
        for (const k of Object.keys(n)) {
          const child = n[k];
          if (Array.isArray(child)) {
            for (const c of child) checkLinear(c);
          } else if (child && typeof child === 'object' && child.type) {
            checkLinear(child);
          }
        }
      }
      if (node.body) checkLinear(node.body);

      const loopObj = {
        id: loops.length,
        type: node.type,
        startLine: node.loc ? node.loc.start.line : 1,
        endLine: node.loc ? node.loc.end.line : 1,
        depth: loopAncestors.length + 1,
        parents: loopAncestors,
        boundInfo: { isConstant, constantValue, boundVar, isLog, indexVar },
        hasInnerLinearCall,
      };
      loops.push(loopObj);
      currentAncestors = [...loopAncestors, loopObj];
    }

    for (const key of Object.keys(node)) {
      if (key === 'parents' || key === 'bodyNode') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) walk(c, currentAncestors);
      } else if (child && typeof child === 'object' && child.type) {
        walk(child, currentAncestors);
      }
    }
  }

  walk(ast);
  return loops;
}

/**
 * Extracts loop iteration variables, boundary expressions, and step dynamics (Fallback Scanner)
 */
function extractBound(header, isFor) {
  if (!header) return { isConstant: false, boundVar: 'n' };

  let indexVar = null;

  if (isFor) {
    const ofMatch = header.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s+(?:of|in)\s+([a-zA-Z0-9_$.]+)/);
    if (ofMatch) {
      indexVar = ofMatch[1];
      const v = ofMatch[2].replace(/\.length$/, '');
      return { indexVar, isConstant: false, boundVar: v || 'n' };
    }

    const parts = header.split(';');
    if (parts.length >= 1) {
      const initMatch = parts[0].match(/(?:const|let|var)?\s*([a-zA-Z0-9_$]+)\s*=/);
      if (initMatch) indexVar = initMatch[1];
    }

    if (parts.length >= 2) {
      const cond = parts[1].trim();
      const update = parts.length > 2 ? parts[2].trim() : '';
      const isLog = /(?:\/=|>>=|\*=|=(?:Math\.floor\([^)]+\/2\)|\([^)]+\/2\)))/.test(update);

      const compMatch = cond.match(/(?:[a-zA-Z0-9_$]+)\s*(?:<|<=|!=)\s*([a-zA-Z0-9_$.]+)/) ||
                        cond.match(/([a-zA-Z0-9_$.]+)\s*(?:>|>=)\s*(?:[a-zA-Z0-9_$]+)/);
      if (compMatch) {
        const rhs = compMatch[1].trim();
        if (/^\d+$/.test(rhs)) {
          return { indexVar, isConstant: true, constantValue: parseInt(rhs, 10), isLog };
        }
        const v = rhs.replace(/\.length$/, '');
        return { indexVar, isConstant: false, boundVar: v || 'n', isLog };
      }
    }
  } else {
    const cond = header.trim();
    const compMatch = cond.match(/(?:[a-zA-Z0-9_$]+)\s*(?:<|<=|!=)\s*([a-zA-Z0-9_$.]+)/) ||
                      cond.match(/([a-zA-Z0-9_$.]+)\s*(?:>|>=)\s*(?:[a-zA-Z0-9_$]+)/);
    if (compMatch) {
      const rhs = compMatch[1].trim();
      if (/^\d+$/.test(rhs)) {
        return { indexVar: null, isConstant: true, constantValue: parseInt(rhs, 10) };
      }
      const v = rhs.replace(/\.length$/, '');
      return { indexVar: null, isConstant: false, boundVar: v || 'n' };
    }
  }

  return { indexVar, isConstant: false, boundVar: 'n' };
}

/**
 * Structural Token Scanner for Loops (Fallback if AST unavailable)
 */
function extractLoops(cleanCode) {
  const loops = [];
  let i = 0;

  while (i < cleanCode.length) {
    const isFor = cleanCode.startsWith('for', i) && (i === 0 || !/[a-zA-Z0-9_$]/.test(cleanCode[i - 1]));
    const isWhile = cleanCode.startsWith('while', i) && (i === 0 || !/[a-zA-Z0-9_$]/.test(cleanCode[i - 1]));

    if (!isFor && !isWhile) {
      i++;
      continue;
    }

    const keyword = isFor ? 'for' : 'while';
    const kwLen = keyword.length;
    const afterKw = cleanCode[i + kwLen];

    if (afterKw !== '(' && afterKw !== ' ' && afterKw !== '\t' && afterKw !== '\n' && afterKw !== '\r') {
      i++;
      continue;
    }

    const openParenIdx = cleanCode.indexOf('(', i + kwLen);
    if (openParenIdx === -1) {
      i += kwLen;
      continue;
    }

    let parenDepth = 1;
    let closeParenIdx = -1;
    for (let p = openParenIdx + 1; p < cleanCode.length; p++) {
      if (cleanCode[p] === '(') parenDepth++;
      else if (cleanCode[p] === ')') {
        parenDepth--;
        if (parenDepth === 0) {
          closeParenIdx = p;
          break;
        }
      }
    }

    if (closeParenIdx === -1) {
      i += kwLen;
      continue;
    }

    const header = cleanCode.substring(openParenIdx + 1, closeParenIdx).trim();

    let bodyStart = -1;
    let bodyEnd = -1;
    let hasBraces = false;

    let s = closeParenIdx + 1;
    while (s < cleanCode.length && /\s/.test(cleanCode[s])) {
      s++;
    }

    if (s < cleanCode.length) {
      if (cleanCode[s] === '{') {
        hasBraces = true;
        bodyStart = s;
        let braceDepth = 1;
        for (let b = s + 1; b < cleanCode.length; b++) {
          if (cleanCode[b] === '{') braceDepth++;
          else if (cleanCode[b] === '}') {
            braceDepth--;
            if (braceDepth === 0) {
              bodyEnd = b;
              break;
            }
          }
        }
        if (bodyEnd === -1) bodyEnd = cleanCode.length - 1;
      } else {
        hasBraces = false;
        bodyStart = s;
        let parenD = 0;
        let braceD = 0;
        for (let b = s; b < cleanCode.length; b++) {
          const ch = cleanCode[b];
          if (ch === '(') parenD++;
          else if (ch === ')') parenD--;
          else if (ch === '{') braceD++;
          else if (ch === '}') {
            braceD--;
            if (braceD === 0) {
              bodyEnd = b;
              break;
            }
          } else if (ch === ';' && parenD === 0 && braceD === 0) {
            bodyEnd = b;
            break;
          }
        }
        if (bodyEnd === -1) bodyEnd = cleanCode.length - 1;
      }
    }

    const boundInfo = extractBound(header, isFor);

    loops.push({
      id: loops.length,
      keyword,
      header,
      start: i,
      end: bodyEnd,
      bodyStart,
      bodyEnd,
      hasBraces,
      boundInfo,
    });

    i = closeParenIdx + 1;
  }

  for (const loop of loops) {
    const parents = loops.filter(
      p => p !== loop && p.bodyStart <= loop.start && loop.end <= p.bodyEnd
    );
    loop.parents = parents;
    loop.depth = parents.length + 1;
  }

  return loops;
}

/**
 * Analyzes time and auxiliary space complexity deterministically
 */
function analyzeComplexity(code, fnName, params) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return {
      time: 'Complexity estimate uncertain',
      space: 'Complexity estimate uncertain',
      explanation: 'No executable code provided.',
    };
  }

  const clean = stripCommentsAndStrings(code);

  // 1. Binary search logarithmic halving check
  const isBinarySearchHalving =
    /while\s*\(\s*([a-zA-Z0-9_$]+)\s*<=\s*([a-zA-Z0-9_$]+)\s*\)/.test(clean) ||
    /while\s*\(\s*([a-zA-Z0-9_$]+)\s*<\s*([a-zA-Z0-9_$]+)\s*\)/.test(clean);

  const hasMidCalculation =
    /Math\.floor\s*\(\s*\([^)]+\)\s*\/\s*2\s*\)/.test(clean) ||
    /\([^)]+\)\s*>>\s*1/.test(clean) ||
    /\([^)]+\)\s*\/\s*2\s*\|\s*0/.test(clean) ||
    /Math\.trunc\s*\(\s*\([^)]+\)\s*\/\s*2\s*\)/.test(clean);

  const hasPointerHalvingUpdate =
    /[a-zA-Z0-9_$]+\s*=\s*[a-zA-Z0-9_$]+\s*[+-]\s*1/.test(clean);

  if (isBinarySearchHalving && hasMidCalculation && hasPointerHalvingUpdate) {
    return {
      time: 'O(log n)',
      space: 'O(1)',
      explanation: 'Search interval is repeatedly halved at each iteration using binary mid-point convergence (O(log n)).',
      timeDetail: 'Logarithmic time: each iteration discards half the remaining search space.',
      spaceDetail: 'Uses constant auxiliary scalar variables; no dynamic collections allocated proportional to input size.',
    };
  }

  // 2. Auxiliary Space Allocations
  const allocatesArray =
    /\[\s*\]|\.slice\s*\(|\.concat\s*\(|Array\s*\(|\.map\s*\(|\.filter\s*\(|\[\s*\.\.\./.test(clean);
  const allocatesMapOrSet = /new\s+(?:Map|Set)\b/.test(clean);

  // 3. Sorting
  const hasSort = /\.sort\s*\(/.test(clean);

  // 4. Recursion
  const hasRecursion =
    fnName &&
    fnName !== 'solution' &&
    new RegExp(`\\b${fnName}\\s*\\(`).test(clean) &&
    !clean.startsWith(`function ${fnName}`) &&
    (clean.match(new RegExp(`\\b${fnName}\\s*\\(`, 'g')) || []).length > 1;

  let recursiveCallCount = 0;
  if (hasRecursion) {
    const matches = clean.match(new RegExp(`\\b${fnName}\\s*\\(`, 'g')) || [];
    recursiveCallCount = Math.max(0, matches.length - 1);
  }

  let spaceComplexity = 'O(1)';
  let spaceExplanation = 'Uses constant auxiliary scalar variables; no dynamic collections allocated proportional to input size.';

  if (allocatesArray || allocatesMapOrSet) {
    spaceComplexity = 'O(n)';
    spaceExplanation = 'Allocates auxiliary data structure (array, Map, or Set) scaling linearly with input size n.';
  } else if (hasRecursion) {
    spaceComplexity = 'O(n)';
    spaceExplanation = 'Consumes auxiliary call stack frames proportional to the recursive depth.';
  }

  // Handle Sorting Dominance
  if (hasSort) {
    return {
      time: 'O(n log n)',
      space: allocatesArray ? 'O(n)' : 'O(log n)',
      explanation: 'Utilizes JavaScript array sorting (Timsort/Dual-Pivot Quicksort) which operates in O(n log n) time.',
      timeDetail: 'Array sorting dominates the running time at O(n log n).',
      spaceDetail: allocatesArray ? 'Auxiliary memory allocated for sorted collection.' : 'In-place sorting auxiliary call stack.',
    };
  }

  // Handle Recursion
  if (hasRecursion) {
    if (recursiveCallCount >= 2) {
      return {
        time: 'O(2^n)',
        space: 'O(n)',
        explanation: 'Multiple recursive branches per call frame create an exponential call tree (O(2^n)).',
        timeDetail: 'Binary tree recursion branching on each level.',
        spaceDetail: 'Call stack depth reaches O(n) before base-case returns.',
      };
    } else {
      return {
        time: 'O(n)',
        space: 'O(n)',
        explanation: 'Linear recursive function traversing input with single decrementing recursive step.',
        timeDetail: 'Linear recursion executing n recursive steps.',
        spaceDetail: 'Auxiliary stack depth proportional to n.',
      };
    }
  }

  // 5. Structural Loop Analysis (Acorn AST with fallback)
  let loops = extractLoopsAST(code);
  if (!loops || loops.length === 0) {
    loops = extractLoops(clean);
  }

  if (loops.length > 0) {
    const maxDepth = Math.max(...loops.map(l => l.depth));
    const deepestLoop = loops.find(l => l.depth === maxDepth);
    const chain = [...(deepestLoop.parents || []), deepestLoop];
    const topLevelLoops = loops.filter(l => l.depth === 1).length;

    // Check if all loops in deepest chain have fixed numerical constant bounds
    const allChainConstant = chain.every(l => l.boundInfo.isConstant);
    if (allChainConstant) {
      return {
        time: 'O(1)',
        space: spaceComplexity,
        explanation: 'Loop iteration bounds are fixed numerical constants independent of input size n.',
        timeDetail: 'Constant loop bound executes in fixed number of iterations.',
        spaceDetail: spaceExplanation,
      };
    }

    // Three or more nested loops
    if (maxDepth >= 3) {
      const vars = chain.map(l => l.boundInfo.isConstant ? 'c' : (l.boundInfo.boundVar || 'n'));
      const dynamicVars = vars.filter(v => v !== 'c');
      const uniqueDynamicVars = Array.from(new Set(dynamicVars));

      if (uniqueDynamicVars.length === 1) {
        return {
          time: 'O(n³)',
          space: spaceComplexity,
          explanation: 'Three nested loops traversing input of size n: O(n * n * n) = O(n³).',
          timeDetail: 'Cubic time complexity from three levels of nested iteration.',
          spaceDetail: spaceExplanation,
        };
      } else if (uniqueDynamicVars.length > 1) {
        const formula = uniqueDynamicVars.join(' * ');
        return {
          time: `O(${formula})`,
          space: spaceComplexity,
          explanation: `Three nested loops traversing distinct input bounds (${uniqueDynamicVars.join(', ')}): O(${formula}).`,
          timeDetail: `Multi-dimensional cubic iteration across distinct bounds: O(${formula}).`,
          spaceDetail: spaceExplanation,
        };
      } else {
        return {
          time: 'Complexity estimate uncertain',
          space: spaceComplexity,
          explanation: 'Nested loops possess dynamic or indeterminate loop boundaries.',
          timeDetail: 'Static analysis cannot determine loop bounds.',
          spaceDetail: spaceExplanation,
        };
      }
    }

    // Two nested loops
    if (maxDepth === 2) {
      const l1 = chain[0];
      const l2 = chain[1];

      // Constant + Linear combinations
      if (l1.boundInfo.isConstant && !l2.boundInfo.isConstant) {
        return {
          time: 'O(n)',
          space: spaceComplexity,
          explanation: `The outer loop executes a fixed constant number of times (${l1.boundInfo.constantValue}), while the inner loop iterates linearly over the input (O(n)).`,
          timeDetail: 'Constant outer iterations scaling with linear inner loop: O(c * n) = O(n).',
          spaceDetail: spaceExplanation,
        };
      }
      if (!l1.boundInfo.isConstant && l2.boundInfo.isConstant) {
        return {
          time: 'O(n)',
          space: spaceComplexity,
          explanation: `The outer loop iterates linearly over the input, while the inner loop executes a fixed constant number of iterations (${l2.boundInfo.constantValue}): O(n * c) = O(n).`,
          timeDetail: 'Linear outer traversal with constant inner operations: O(n * c) = O(n).',
          spaceDetail: spaceExplanation,
        };
      }

      const v1 = l1.boundInfo.boundVar || 'n';
      const v2 = l2.boundInfo.boundVar || 'n';

      // Both iterate over same collection/bound or dependent triangular iteration (j < i)
      const isTriangle = l2.boundInfo.boundVar === l1.boundInfo.indexVar;
      if (isTriangle || v1 === v2 || (v1 === 'n' && v2 === 'arr') || (v1 === 'arr' && v2 === 'n')) {
        return {
          time: 'O(n²)',
          space: spaceComplexity,
          explanation: "Nested loop structure: the inner loop executes up to n times for each of the outer loop's n iterations (O(n²)).",
          timeDetail: 'Quadratic time complexity from nested iteration over input elements.',
          spaceDetail: spaceExplanation,
        };
      }

      // Distinct, resolvable bounds (e.g. n and m, or rows and cols)
      if (v1 && v2 && v1 !== v2) {
        return {
          time: `O(${v1} * ${v2})`,
          space: spaceComplexity,
          explanation: `Nested loop structure with distinct bounds: the outer loop runs up to ${v1} times and the inner loop runs up to ${v2} times (O(${v1} * ${v2})).`,
          timeDetail: `Quadratic iteration across two different dimensions (${v1} and ${v2}).`,
          spaceDetail: spaceExplanation,
        };
      }

      return {
        time: 'Complexity estimate uncertain',
        space: spaceComplexity,
        explanation: 'Nested loops possess distinct or dynamic bounds that cannot be verified statically without runtime execution.',
        timeDetail: 'Loop bounds are indeterminate statically.',
        spaceDetail: spaceExplanation,
      };
    }

    // Sequential loops (maxDepth = 1, topLevelLoops >= 2)
    if (maxDepth === 1 && topLevelLoops >= 2) {
      return {
        time: 'O(n)',
        space: spaceComplexity,
        explanation: `Contains ${topLevelLoops} sequential (non-nested) loops over input of size n: ${Array(topLevelLoops).fill('O(n)').join(' + ')} = O(n).`,
        timeDetail: 'Sequential loops execute consecutively, maintaining linear O(n) overall time rather than quadratic nesting.',
        spaceDetail: spaceExplanation,
      };
    }

    // Single loop (maxDepth = 1)
    if (maxDepth === 1) {
      const loop = deepestLoop;
      if (loop.boundInfo.isConstant) {
        return {
          time: 'O(1)',
          space: spaceComplexity,
          explanation: `Single loop with fixed constant bound (${loop.boundInfo.constantValue}) independent of input size n.`,
          timeDetail: 'Fixed numerical loop boundary executes in O(1) time.',
          spaceDetail: spaceExplanation,
        };
      }
      if (loop.boundInfo.isLog) {
        return {
          time: 'O(log n)',
          space: spaceComplexity,
          explanation: 'Loop iteration variable is repeatedly divided/multiplied by a constant factor (O(log n)).',
          timeDetail: 'Logarithmic convergence via iterative stepping.',
          spaceDetail: spaceExplanation,
        };
      }

      // Check if loop body contains an inner O(n) linear collection operation
      const hasInnerLinearMethod = loop.hasInnerLinearCall || (clean.substring(loop.bodyStart, loop.bodyEnd + 1) &&
        (/\.reverse\s*\(|\.map\s*\(|\.filter\s*\(|\.reduce\s*\(|\.slice\s*\(|Math\.(?:max|min)\s*\(\s*\.\.\./.test(clean.substring(loop.bodyStart, loop.bodyEnd + 1)) ||
        /\[\s*\.\.\.[a-zA-Z0-9_$]+/.test(clean.substring(loop.bodyStart, loop.bodyEnd + 1))));

      if (hasInnerLinearMethod) {
        return {
          time: 'O(n²)',
          space: spaceComplexity,
          explanation: 'Nested iteration: the outer loop runs n times and invokes a linear collection operation (such as slice/reverse/filter) inside each iteration (O(n²)).',
          timeDetail: 'Quadratic complexity caused by invoking an O(n) operation inside an O(n) loop.',
          spaceDetail: spaceComplexity,
        };
      }

      return {
        time: 'O(n)',
        space: spaceComplexity,
        explanation: 'Single linear loop visiting each element of the input of size n exactly once.',
        timeDetail: 'Single traversal through input elements operates in O(n) time.',
        spaceDetail: spaceExplanation,
      };
    }
  }

  // 6. Built-in linear operations without loops
  const hasLinearMethod =
    /\.reverse\s*\(|\.map\s*\(|\.filter\s*\(|\.reduce\s*\(|Math\.(?:max|min)\s*\(\s*\.\.\./.test(clean) ||
    /\[\s*\.\.\.[a-zA-Z0-9_$]+/.test(clean);

  if (hasLinearMethod) {
    return {
      time: 'O(n)',
      space: spaceComplexity,
      explanation: 'Iterates through input elements using a built-in linear collection operation (e.g. reverse, spread copy, or filter) operating in O(n) time.',
      timeDetail: 'Linear single-pass traversal over n elements.',
      spaceDetail: spaceExplanation,
    };
  }

  // 7. Unbounded while loops
  if (/while\s*\(\s*true\s*\)/.test(clean) || /while\s*\(\s*1\s*\)/.test(clean)) {
    return {
      time: 'Complexity estimate uncertain',
      space: spaceComplexity,
      explanation: 'Contains unbounded while(true) loop with dynamic break condition that cannot be deterministically verified statically.',
      timeDetail: 'Dynamic termination condition without provable bound.',
      spaceDetail: spaceExplanation,
    };
  }

  return {
    time: 'O(1)',
    space: 'O(1)',
    explanation: 'Straight-line sequential instructions with constant-time arithmetic or property lookups.',
    timeDetail: 'Executes in a fixed number of operations independent of input size.',
    spaceDetail: 'Constant auxiliary space.',
  };
}

module.exports = {
  analyzeComplexity,
  stripCommentsAndStrings,
  extractLoopsAST,
  extractLoops,
};
