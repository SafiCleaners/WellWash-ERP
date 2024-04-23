const langchain = require('langchain');

const text = "LangChain makes NLP easy!";
const tokens = langchain.tokenize(text);

console.log(tokens);