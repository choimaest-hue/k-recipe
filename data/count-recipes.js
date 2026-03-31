const recipes = require('./recipes.json');
console.log('총 레시피 개수:', recipes.length);
console.log('첫 번째 레시피:', recipes[0].title);
console.log('마지막 레시피:', recipes[recipes.length - 1].title);
