const fs = require('fs');
const path = require('path');

const RECIPES_FILE = path.join(__dirname, 'recipes.json');

// 스타일 매핑
const styleMap = {
  'recipe-kimchi-jjim': ["찜/조림", "고기요리"],
  'recipe-kimchi-jjigae': ["국물요리", "찌개"],
  'recipe-doenjang-jjigae': ["국물요리", "찌개"],
  'recipe-sundubu-jjigae': ["국물요리", "찌개"],
  'recipe-budae-jjigae': ["국물요리", "찌개"],
  'recipe-yukgaejang': ["국물요리", "보양식"],
  'recipe-soegogi-muguk': ["국물요리"],
  'recipe-miyeok-guk': ["국물요리", "보양식"],
  'recipe-kongnamul-guk': ["국물요리"],
  'recipe-gamjatang': ["국물요리"],
  'recipe-samgyetang': ["국물요리", "보양식"],
  'recipe-galbitang': ["국물요리", "보양식"],
  'recipe-bulgogi': ["고기요리", "볶음"],
  'recipe-jeyuk-bokkeum': ["고기요리", "볶음"],
  'recipe-dakgalbi': ["고기요리", "볶음"],
  'recipe-ojingeo-bokkeum': ["반찬", "해산물"],
  'recipe-sundae-bokkeum': ["고기요리", "볶음"],
  'recipe-dakbokkeumtang': ["찜/조림", "국물요리"],
  'recipe-galbijjim': ["찜/조림", "고기요리"],
  'recipe-japchae': ["반찬"],
  'recipe-gyeran-mari': ["반찬"],
  'recipe-haemul-pajeon': ["반찬", "해산물"],
  'recipe-tteokbokki': ["분식"],
  'recipe-gimbap': ["한그릇"],
  'recipe-bibimbap': ["한그릇"],
  'recipe-kimchi-bokkeumbap': ["한그릇"],
  'recipe-curry-rice': ["한그릇"],
  'recipe-bibim-guksu': ["분식"],
  'recipe-janchi-guksu': ["분식", "국물요리"],
  'recipe-tteokguk': ["한그릇", "국물요리"]
};

try {
  const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8'));
  
  recipes.forEach(recipe => {
    if (styleMap[recipe.id]) {
      recipe.styles = styleMap[recipe.id];
    } else {
      recipe.styles = ["기타"];
    }
  });
  
  fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');
  console.log('✅ 스타일 정제 완료!');
} catch (error) {
  console.error('❌ 오류:', error.message);
  process.exit(1);
}
