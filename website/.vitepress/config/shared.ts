import type { DefaultTheme, UserConfig } from 'vitepress';

export const sharedConfig: UserConfig<DefaultTheme.Config> = {
  title: 'Tuvix.js',
  titleTemplate: ':title — Tuvix.js',
  description:
    'A lightweight, framework-agnostic microfrontend orchestrator. Build scalable, independently deployable frontend applications.',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#00e5a0' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Tuvix.js' }],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://tuvixjs.dev/og-image.png',
      },
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    ],
    [
      'link',
      {
        href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap',
        rel: 'stylesheet',
      },
    ],
  ],

  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: [/localhost/],

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'one-dark-pro',
    },
    lineNumbers: true,
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Tuvix.js',

    search: {
      provider: 'local',
      options: {
        locales: {
          tr: {
            translations: {
              button: { buttonText: 'Ara', buttonAriaLabel: 'Ara' },
              modal: {
                noResultsText: 'Sonuç bulunamadı',
                resetButtonTitle: 'Aramayı Temizle',
                footer: {
                  selectText: 'seç',
                  navigateText: 'gezin',
                  closeText: 'kapat',
                },
              },
            },
          },
          es: {
            translations: {
              button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar' },
              modal: {
                noResultsText: 'Sin resultados para',
                resetButtonTitle: 'Limpiar búsqueda',
                footer: {
                  selectText: 'seleccionar',
                  navigateText: 'navegar',
                  closeText: 'cerrar',
                },
              },
            },
          },
          de: {
            translations: {
              button: { buttonText: 'Suchen', buttonAriaLabel: 'Suchen' },
              modal: {
                noResultsText: 'Keine Ergebnisse für',
                resetButtonTitle: 'Suche zurücksetzen',
                footer: {
                  selectText: 'auswählen',
                  navigateText: 'navigieren',
                  closeText: 'schließen',
                },
              },
            },
          },
          fr: {
            translations: {
              button: { buttonText: 'Rechercher', buttonAriaLabel: 'Rechercher' },
              modal: {
                noResultsText: 'Aucun résultat pour',
                resetButtonTitle: 'Réinitialiser la recherche',
                footer: {
                  selectText: 'sélectionner',
                  navigateText: 'naviguer',
                  closeText: 'fermer',
                },
              },
            },
          },
          ja: {
            translations: {
              button: { buttonText: '検索', buttonAriaLabel: '検索' },
              modal: {
                noResultsText: '検索結果なし',
                resetButtonTitle: '検索をリセット',
                footer: {
                  selectText: '選択',
                  navigateText: 'ナビゲート',
                  closeText: '閉じる',
                },
              },
            },
          },
          zh: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
              modal: {
                noResultsText: '没有相关结果',
                resetButtonTitle: '清除搜索',
                footer: {
                  selectText: '选择',
                  navigateText: '导航',
                  closeText: '关闭',
                },
              },
            },
          },
          it: {
            translations: {
              button: { buttonText: 'Cerca', buttonAriaLabel: 'Cerca' },
              modal: {
                noResultsText: 'Nessun risultato per',
                resetButtonTitle: 'Reimposta ricerca',
                footer: {
                  selectText: 'seleziona',
                  navigateText: 'naviga',
                  closeText: 'chiudi',
                },
              },
            },
          },
          pt: {
            translations: {
              button: { buttonText: 'Pesquisar', buttonAriaLabel: 'Pesquisar' },
              modal: {
                noResultsText: 'Sem resultados para',
                resetButtonTitle: 'Limpar pesquisa',
                footer: {
                  selectText: 'selecionar',
                  navigateText: 'navegar',
                  closeText: 'fechar',
                },
              },
            },
          },
          hi: {
            translations: {
              button: { buttonText: 'खोजें', buttonAriaLabel: 'खोजें' },
              modal: {
                noResultsText: 'कोई परिणाम नहीं',
                resetButtonTitle: 'खोज साफ़ करें',
                footer: {
                  selectText: 'चुनें',
                  navigateText: 'नेविगेट करें',
                  closeText: 'बंद करें',
                },
              },
            },
          },
        },
      },
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/yasinatesim/tuvix.js',
      },
      {
        icon: 'npm',
        link: 'https://www.npmjs.com/org/tuvix.js',
      },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Tuvix.js Contributors',
    },
  },
};
