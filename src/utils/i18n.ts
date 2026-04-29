export const DEFAULT_LANG = 'en';
export const LANGUAGES = ['en', 'zh'] as const;
export type Lang = (typeof LANGUAGES)[number];

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.blog': 'Recipes',
    'nav.categories': 'Categories',
    'nav.about': 'About',
    'home.latest': 'Latest Recipes',
    'home.popular': 'Popular Categories',
    'home.viewAll': 'View All',
    'blog.readMore': 'Read More',
    'blog.category': 'Cuisine',
    'blog.tags': 'Tags',
    'blog.published': 'Published on',
    'blog.difficulty': 'Difficulty',
    'blog.prepTime': 'Prep',
    'blog.cookTime': 'Cook',
    'blog.servings': 'Servings',
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'footer.links': 'Links',
  },
  zh: {
    'nav.home': '首页',
    'nav.blog': '菜谱',
    'nav.categories': '分类',
    'nav.about': '关于',
    'home.latest': '最新菜谱',
    'home.popular': '热门分类',
    'home.viewAll': '查看全部',
    'blog.readMore': '阅读更多',
    'blog.category': '菜系',
    'blog.tags': '标签',
    'blog.published': '发布于',
    'blog.difficulty': '难度',
    'blog.prepTime': '准备',
    'blog.cookTime': '烹饪',
    'blog.servings': '份量',
    'footer.about': '关于我们',
    'footer.contact': '联系方式',
    'footer.links': '链接',
  },
} as const;

export function t(lang: Lang, key: keyof (typeof ui)['en']): string {
  return ui[lang][key] || ui[DEFAULT_LANG][key] || key;
}
