// Auto-classify recipes by cuisine type

export const CATEGORIES_EN: Record<string, string[]> = {
  'Sichuan': ['sichuan', 'szechuan', 'mapo', 'kung pao', 'gong bao', 'dan dan', 'hot pot', 'mala', 'spicy', 'chili', 'peppercorn', 'twice-cooked', 'yu xiang', 'fish-fragrant', 'saliva', 'mouth-watering'],
  'Cantonese': ['cantonese', 'guangdong', 'char siu', 'siu mai', 'har gow', 'dim sum', 'roast duck', 'wonton', 'congee', 'chow mein', 'oyster sauce', 'white cut', 'steamed', 'bbq', 'bao'],
  'Hunan': ['hunan', 'xiang', 'chairman mao', 'duo jiao', 'chopped chili', 'smoky', 'preserved', 'stinky tofu', 'dry pot'],
  'Shandong': ['shandong', 'lu', 'sweet and sour', 'tang cu', 'scallion', 'braised', 'seafood', 'dezhou', 'chicken'],
  'Jiangsu': ['jiangsu', 'su', 'squirrel fish', 'lion head', 'braised pork', 'nanjing', 'salted duck', 'osmanthus'],
  'Zhejiang': ['zhejiang', 'dongpo', 'west lake', 'vinegar fish', 'longjing', 'drunken', 'hangzhou'],
  'Fujian': ['fujian', 'min', 'oyster', 'buddha jumps', 'fo tiao qiang', 'fish ball', 'lard', 'sweet potato', 'red vinasse'],
  'Anhui': ['anhui', 'hui', 'stewed', 'ham', 'bamboo', 'stone pot', 'li hongzhang'],
  'Noodles & Dumplings': ['noodle', 'dumpling', 'jiaozi', 'baozi', 'mantou', 'lamian', 'lo mein', 'chow mein', 'pho', 'mi', 'fen', 'nian gao'],
  'Rice & Stir-Fry': ['fried rice', 'yangzhou', 'egg fried', 'stir-fry', 'wok', 'chow fan', 'claypot', 'paella'],
  'Soups & Broths': ['soup', 'broth', 'hot and sour', 'egg drop', 'wonton soup', 'bone', 'medicinal', 'herbal', 'tonic'],
  'Street Food & Snacks': ['street food', 'jianbing', 'baozi', 'youtiao', 'skewer', 'malatang', 'tanghulu', 'bing', 'crepe'],
};

export const CATEGORIES_ZH: Record<string, string[]> = {
  '川菜': ['sichuan', '四川', '麻辣', '宫保', '麻婆', '担担', '鱼香', '口水', '回锅', '火锅', '水煮', '干煸', '辣子', '泡椒', '怪味'],
  '粤菜': ['cantonese', '广东', '广式', '叉烧', '烧鹅', '虾饺', '烧卖', '云吞', '煲仔', '白切', '肠粉', '粥', '点心'],
  '湘菜': ['hunan', '湖南', '剁椒', '口味', '干锅', '腊味', '臭豆腐', '剁椒鱼头', '毛氏'],
  '鲁菜': ['shandong', '山东', '糖醋', '葱爆', '九转', '德州', '扒', '糟熘'],
  '苏菜': ['jiangsu', '江苏', '松鼠', '狮子头', '盐水鸭', '叫花', '桂花', '大煮'],
  '浙菜': ['zhejiang', '浙江', '东坡', '西湖', '龙井', '醉', '叫花', '荷叶'],
  '闽菜': ['fujian', '福建', '佛跳墙', '鱼丸', '蛎饼', '红糟', '沙茶', '荔枝'],
  '徽菜': ['anhui', '安徽', '火腿', '黄山', '臭鳜鱼', '问政', '李鸿章'],
  '面食点心': ['面', '饺子', '包子', '馒头', '拉面', '米粉', '年糕', '馄饨', '抄手', '锅贴', '生煎'],
  '米饭炒菜': ['炒饭', '扬州', '盖浇', '煲仔饭', '炒面', '炒粉', '干炒'],
  '汤羹': ['汤', '羹', '酸辣', '蛋花', '排骨汤', '鸡汤', '药膳', '补汤'],
  '小吃': ['小吃', '煎饼', '油条', '串串', '麻辣烫', '糖葫芦', '肉夹馍', '凉皮'],
};

export function autoClassify(title: string, description: string, content: string = '', lang: 'en' | 'zh' = 'en'): string {
  const text = `${title} ${description} ${content}`.toLowerCase();
  const categories = lang === 'zh' ? CATEGORIES_ZH : CATEGORIES_EN;
  const categoryNames = Object.keys(categories);

  let bestMatch = lang === 'zh' ? '其他' : 'Other';
  let maxScore = 0;

  for (const cat of categoryNames) {
    const keywords = categories[cat];
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw.toLowerCase(), 'g');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = cat;
    }
  }

  return bestMatch;
}

export function getAllCategories(lang: 'en' | 'zh' = 'en'): string[] {
  return Object.keys(lang === 'zh' ? CATEGORIES_ZH : CATEGORIES_EN);
}
