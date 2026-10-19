/**
 * CodeLens Interactive Syntax Tree (AST) Generator
 * Powered by Acorn ES2022 parser with source location mapping and educational metadata.
 */

let acorn = null;
try {
  acorn = require("acorn");
} catch (e) {
  console.warn("Acorn module not found in server, AST generation will require Acorn.");
}

// Beginner-friendly explanations for AST node types
const NODE_DESCRIPTIONS = {
  Program: "Top-level root node representing the complete JavaScript script.",
  FunctionDeclaration: "Declares a named function with its own parameter list and local execution scope.",
  FunctionExpression: "A function expression assigned to a variable or passed as an argument.",
  ArrowFunctionExpression: "A compact ES6 arrow function with lexical 'this' binding.",
  ForStatement: "A classic counted loop with initializer, condition check, and increment/update step.",
  ForOfStatement: "Iterates over iterable values (e.g., array elements, strings, sets).",
  ForInStatement: "Iterates over the enumerable property keys of an object.",
  WhileStatement: "Executes a statement block repeatedly as long as the test condition remains true.",
  DoWhileStatement: "Executes the body at least once, then repeats while the test condition evaluates to true.",
  IfStatement: "Evaluates a boolean conditional branch, executing the consequent or optional alternate block.",
  SwitchStatement: "Multi-way branch selecting an execution case based on an expression value.",
  VariableDeclaration: "Declares one or more variables using let, const, or var.",
  VariableDeclarator: "Binds a variable identifier to an initial value expression.",
  BinaryExpression: "Compares or operates on two expressions (e.g., +, -, *, <, ===).",
  LogicalExpression: "Performs boolean short-circuit evaluation (&&, ||, ??).",
  UnaryExpression: "Applies an operation to a single operand (e.g., !, typeof, -).",
  UpdateExpression: "Increments (++) or decrements (--) a variable.",
  AssignmentExpression: "Assigns a computed value to a variable or object property.",
  CallExpression: "Invokes a function or method, passing evaluated argument expressions.",
  ReturnStatement: "Terminates function execution and passes the resulting value back to the caller.",
  BlockStatement: "A group of zero or more statements enclosed within curly braces { } establishing a block scope.",
  ExpressionStatement: "An expression evaluated for its side effect (e.g., function call or assignment).",
  Identifier: "A named reference representing a variable, parameter, or property.",
  Literal: "A fixed constant value (number, string, boolean, or null).",
  ArrayExpression: "Constructs an array literal [ ... ].",
  ObjectExpression: "Constructs an object literal { ... }.",
  MemberExpression: "Accesses a property or method of an object or array (e.g., arr.length, obj.key).",
};

// Categorize nodes for visual styling and iconography
function categorizeNode(type) {
  if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(type)) return 'function';
  if (['ForStatement', 'ForOfStatement', 'ForInStatement', 'WhileStatement', 'DoWhileStatement'].includes(type)) return 'loop';
  if (['IfStatement', 'SwitchStatement', 'ConditionalExpression'].includes(type)) return 'condition';
  if (['VariableDeclaration', 'VariableDeclarator'].includes(type)) return 'declaration';
  if (['CallExpression', 'NewExpression'].includes(type)) return 'call';
  if (['ReturnStatement'].includes(type)) return 'return';
  if (['BinaryExpression', 'LogicalExpression', 'UnaryExpression', 'AssignmentExpression', 'UpdateExpression'].includes(type)) return 'operator';
  if (['Identifier'].includes(type)) return 'identifier';
  if (['Literal'].includes(type)) return 'literal';
  if (['Program'].includes(type)) return 'root';
  return 'structure';
}

// Generate a descriptive, human-readable label for a node
function getNodeLabel(node, source) {
  if (!node) return 'Unknown';
  const snippet = source.slice(node.start, node.end);
  const oneLine = snippet.replace(/\s+/g, ' ').trim();

  switch (node.type) {
    case 'Program':
      return 'Program (Root Script)';
    case 'FunctionDeclaration':
      return `FunctionDeclaration: ${node.id ? node.id.name : 'anonymous'}(${(node.params || []).map(p => p.name || 'arg').join(', ')})`;
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return `ArrowFunction: (${(node.params || []).map(p => p.name || 'arg').join(', ')}) => ...`;
    case 'ForStatement': {
      const headerSnippet = source.slice(node.start, node.body ? node.body.start : node.end).trim();
      return `ForStatement: ${headerSnippet.length > 35 ? headerSnippet.slice(0, 32) + '...' : headerSnippet}`;
    }
    case 'WhileStatement': {
      const header = source.slice(node.start, node.body ? node.body.start : node.end).trim();
      return `WhileStatement: ${header.length > 30 ? header.slice(0, 27) + '...' : header}`;
    }
    case 'IfStatement': {
      const testSnippet = node.test ? source.slice(node.test.start, node.test.end) : '';
      return `IfStatement: if (${testSnippet})`;
    }
    case 'VariableDeclaration':
      return `VariableDeclaration (${node.kind})`;
    case 'VariableDeclarator':
      return `Variable: ${node.id ? node.id.name : 'var'} = ...`;
    case 'BinaryExpression':
    case 'LogicalExpression':
      return `${node.type}: ${node.operator} (${oneLine.length > 25 ? oneLine.slice(0, 22) + '...' : oneLine})`;
    case 'CallExpression': {
      const calleeName = node.callee ? (node.callee.name || (node.callee.property ? node.callee.property.name : 'fn')) : 'fn';
      return `Call: ${calleeName}(...)`;
    }
    case 'ReturnStatement':
      return `Return: ${node.argument ? oneLine : 'void'}`;
    case 'Identifier':
      return `Identifier: ${node.name}`;
    case 'Literal':
      return `Literal: ${node.raw || JSON.stringify(node.value)}`;
    case 'BlockStatement':
      return `BlockStatement (${node.body ? node.body.length : 0} statements)`;
    case 'ExpressionStatement':
      return `ExpressionStatement`;
    default:
      return `${node.type}: ${oneLine.length > 25 ? oneLine.slice(0, 22) + '...' : oneLine}`;
  }
}

/**
 * Recursively converts an Acorn ESTree node into our hierarchical educational format
 */
function formatAstNode(node, source, counter = { val: 0 }, stats = { total: 0, maxDepth: 0, functions: 0, loops: 0, conditions: 0 }, depth = 1) {
  if (!node || typeof node !== 'object') return null;
  stats.total++;
  if (depth > stats.maxDepth) stats.maxDepth = depth;

  const category = categorizeNode(node.type);
  if (category === 'function') stats.functions++;
  if (category === 'loop') stats.loops++;
  if (category === 'condition') stats.conditions++;

  const id = `node-${++counter.val}`;
  const startLine = node.loc ? node.loc.start.line : 1;
  const endLine = node.loc ? node.loc.end.line : 1;
  const startCol = node.loc ? node.loc.start.column + 1 : 1;
  const endCol = node.loc ? node.loc.end.column + 1 : 1;
  const snippet = source.slice(node.start, node.end);
  const name = getNodeLabel(node, source);
  const description = NODE_DESCRIPTIONS[node.type] || `AST node representing a ${node.type} expression or statement.`;

  // Collect children in source order
  const children = [];
  const childKeys = [
    'body', 'declarations', 'init', 'test', 'update',
    'consequent', 'alternate', 'expression', 'callee',
    'arguments', 'argument', 'params', 'left', 'right',
    'elements', 'properties', 'cases'
  ];

  for (const key of childKeys) {
    if (!node[key]) continue;
    if (Array.isArray(node[key])) {
      for (const item of node[key]) {
        if (item && typeof item === 'object' && item.type) {
          const childNode = formatAstNode(item, source, counter, stats, depth + 1);
          if (childNode) children.push(childNode);
        }
      }
    } else if (typeof node[key] === 'object' && node[key].type) {
      const childNode = formatAstNode(node[key], source, counter, stats, depth + 1);
      if (childNode) children.push(childNode);
    }
  }

  // Sort children by source start position
  children.sort((a, b) => a.startLine === b.startLine ? a.startCol - b.startCol : a.startLine - b.startLine);

  return {
    id,
    name,
    type: node.type,
    category,
    startLine,
    endLine,
    startCol,
    endCol,
    snippet,
    description,
    childCount: children.length,
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Main AST generator function
 */
function generateAst(code) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return {
      success: false,
      isSupported: true,
      hasSyntaxError: false,
      message: 'Please write or paste JavaScript code to generate an AST.',
      nodes: [],
    };
  }

  if (!acorn) {
    return {
      success: false,
      isSupported: false,
      message: 'Acorn parser is not installed or available on backend server.',
      nodes: [],
    };
  }

  let ast;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: 2022,
      locations: true,
      sourceType: 'module',
    });
  } catch (err) {
    // If module parse fails, try script parse
    try {
      ast = acorn.parse(code, {
        ecmaVersion: 2022,
        locations: true,
        sourceType: 'script',
      });
    } catch (parseErr) {
      const line = parseErr.loc ? parseErr.loc.line : 1;
      const column = parseErr.loc ? parseErr.loc.column + 1 : 1;
      const cleanMsg = parseErr.message.replace(/\s*\(\d+:\d+\)$/, '');
      return {
        success: false,
        isSupported: true,
        hasSyntaxError: true,
        line,
        column,
        error: cleanMsg,
        message: `Syntax Error at Line ${line}, Col ${column}: ${cleanMsg}. Please fix syntax to inspect the AST.`,
        nodes: [],
      };
    }
  }

  const stats = { total: 0, maxDepth: 0, functions: 0, loops: 0, conditions: 0 };
  const rootNode = formatAstNode(ast, code, { val: 0 }, stats, 1);

  return {
    success: true,
    isSupported: true,
    hasSyntaxError: false,
    generatedAt: new Date().toISOString(),
    stats,
    nodes: rootNode ? [rootNode] : [],
    rawSnippet: code.slice(0, 100),
  };
}

module.exports = {
  generateAst,
  NODE_DESCRIPTIONS,
};
