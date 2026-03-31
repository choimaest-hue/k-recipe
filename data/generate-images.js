const fs = require('fs');
const path = require('path');

// SVG 이미지 생성 함수
const generateRecipeSVG = (recipeName, color) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" fill="#f8f8f8" rx="12"/>
    <circle cx="100" cy="80" r="40" fill="${color}" opacity="0.3"/>
    <circle cx="100" cy="80" r="35" fill="${color}"/>
    <text x="100" y="130" font-size="16" font-weight="bold" text-anchor="middle" fill="#333" font-family="Arial, sans-serif">
      ${recipeName}
    </text>
  </svg>`;
};

// 레시피별 색상 할당
const colorMap = {
  '국물요리': '#3B82F6',
  '볶음': '#F97316',
  '반찬': '#10B981',
  '분식': '#F59E0B',
  '밥': '#EC4899'
};

// recipes.json 읽기
const recipesPath = path.join(__dirname, 'recipes.json');
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));

// images 디렉토리 생성
const imagesDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 각 레시피별 SVG 생성
recipes.forEach((recipe) => {
  const style = recipe.styles?.[0] || '기타';
  const color = colorMap[style] || '#9333EA';
  
  // 레시피 이름에서 숫자 제거하고 간단히 축약
  const shortName = recipe.title
    .replace(/\s+/g, '')
    .substring(0, 10);
  
  const svg = generateRecipeSVG(shortName, color);
  const svgPath = path.join(imagesDir, `${recipe.id}.svg`);
  
  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log(`✓ 생성됨: ${recipe.id}.svg`);
});

console.log(`\n✅ 총 ${recipes.length}개의 이미지가 생성되었습니다!`);
