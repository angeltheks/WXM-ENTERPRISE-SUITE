/**
 * WXM ONE RADIO - CMS/CMC local contract.
 *
 * Este archivo simula el futuro panel CMC/CMS. La regla de producto es clara:
 * si la radio aun no tiene podcasts, noticias, videos o emisoras secundarias
 * reales, esas secciones permanecen apagadas y la UI no inventa contenido.
 */

const CMS_CONFIG = {
    revision: '2026-05-20-nextgen-media-modules-v2',
    source: 'local-cmc',
    remote: {
        enabled: false,
        endpoint: '',
        timeoutMs: 4500,
        cacheTtlMs: 6 * 60 * 60 * 1000,
        cacheKey: 'wxm_remote_cms_cache_v1',
        endpointStorageKey: 'wxm_cms_remote_endpoint',
        maxItemsPerRail: 40
    },
    localization: {
        defaultLanguage: 'system',
        supportedLanguages: ['es', 'en']
    },
    features: {
        miniPlayer: true,
        languageSelector: true,
        editorialHighlights: true,
        programs: true,
        requests: true,
        banners: true,
        secondaryStations: true,
        podcasts: true,
        mixes: false,
        news: true,
        videos: false,
        songQuiz: false,
        replays: false,
        presenters: true,
        polls: true,
        sponsors: true,
        audioExperience: true,
        emergencyMode: false
    },
    visual: {
        themeDefault: 'dark',
        allowLightTheme: true,
        heroImage: 'assets/img/brand/hero-world-wide.png',
        logoImage: 'assets/img/brand/logo-wxm-3d.png'
    },
    audioExperience: {
        defaultProfile: 'standard',
        allowUserProfiles: true,
        showAdvancedProfiles: true
    },
    homeRails: [
        'banners',
        'secondaryStations',
        'podcasts',
        'news',
        'presenters',
        'sponsors'
    ],
    exploreRails: [
        'banners',
        'secondaryStations',
        'podcasts',
        'mixes',
        'news',
        'presenters',
        'polls',
        'songQuiz',
        'videos',
        'replays',
        'sponsors'
    ],
    emptyStates: {
        explore: {
            icon: 'fa-tower-broadcast',
            titleKey: 'cms.empty.musicOnlyTitle',
            bodyKey: 'cms.empty.musicOnlyBody'
        }
    },
    rails: {
        banners: {
            feature: 'banners',
            titleKey: 'cms.rails.banners',
            actionKey: 'common.viewMore',
            layout: 'hero-banner',
            items: [
                {
                    title: 'Especial urbano global',
                    subtitle: 'Eventos, entrevistas y estrenos WXM desde el Caribe para el mundo.',
                    image: 'assets/img/brand/hero-world-wide.png',
                    badge: 'WXM 24/7',
                    meta: 'Hoy 18:00',
                    body: 'Una franja editorial para destacar eventos, estrenos, invitados y especiales de la emisora. Cuando el CMS real este activo, este espacio podra publicar imagen, descripcion, fecha, enlace y llamada a la accion sin actualizar la app.'
                },
                {
                    title: 'La radio que conecta al mundo',
                    subtitle: 'Musica, cultura, entrevistas y tendencias activables desde el CMS.',
                    image: 'assets/img/official-banner.png',
                    badge: 'Broadcasting worldwide',
                    body: 'WXM puede activar banners editoriales para campanas, entrevistas, especiales o anuncios internos. La app ya esta lista para recibir ese contenido desde hosting por HTTPS.'
                }
            ]
        },
        secondaryStations: {
            feature: 'secondaryStations',
            titleKey: 'cms.rails.radios',
            actionKey: 'common.viewMore',
            layout: 'station-grid',
            items: [
                {
                    title: 'WXM Main',
                    subtitle: 'Live 24/7',
                    image: 'assets/img/brand/wxm-emblem-square.png',
                    badge: 'Live',
                    body: 'Canal principal de WXM ONE RADIO con transmision continua. Esta ficha puede crecer con descripcion, generos, horarios destacados y enlaces oficiales.'
                },
                {
                    title: 'WXM Urban',
                    subtitle: 'Coming soon',
                    image: 'assets/img/brand/hero-world-mobile.png',
                    badge: 'Soon',
                    body: 'Canal secundario preparado para una futura programacion urbana, con portada, descripcion y estado controlados desde el CMS.'
                },
                {
                    title: 'WXM Culture',
                    subtitle: 'Entrevistas y especiales',
                    image: 'assets/img/logo-premium.png',
                    badge: 'CMS ready',
                    body: 'Espacio pensado para entrevistas, cultura, conversaciones y especiales editoriales de WXM.'
                }
            ]
        },
        podcasts: {
            feature: 'podcasts',
            titleKey: 'cms.rails.podcasts',
            actionKey: 'common.viewMore',
            layout: 'media-row',
            items: [
                {
                    title: 'WXM Interviews',
                    subtitle: 'Conversaciones con artistas, productores y voces culturales.',
                    image: 'assets/img/logo-premium.png',
                    badge: 'Podcast',
                    meta: 'Temporada 1',
                    body: 'Podcast de ejemplo para validar como se vera una serie dentro de la app. A futuro puede incluir episodios, duracion, fecha, audio on demand y descarga si los derechos lo permiten.'
                },
                {
                    title: 'Global Music Story',
                    subtitle: 'Historias cortas detras de canciones y movimientos urbanos.',
                    image: 'assets/img/brand/hero-world-mobile.png',
                    badge: 'Serie',
                    body: 'Formato editorial para contar la historia de canciones, artistas y movimientos musicales que conectan con la identidad global de WXM.'
                }
            ]
        },
        mixes: {
            feature: 'mixes',
            titleKey: 'cms.rails.mixes',
            actionKey: 'common.viewMore',
            layout: 'media-row',
            items: []
        },
        news: {
            feature: 'news',
            titleKey: 'cms.rails.news',
            actionKey: 'common.viewMore',
            layout: 'article-row',
            items: [
                {
                    title: 'WXM prepara nuevos especiales en vivo',
                    subtitle: 'La app queda lista para publicar noticias musicales desde CMS remoto.',
                    image: 'assets/img/brand/hero-world-wide.png',
                    badge: 'Noticias',
                    meta: 'WXM News',
                    body: 'Esta es una noticia de ejemplo para probar la vista completa. El equipo de WXM podra publicar titulares, portada, resumen, cuerpo de la noticia y enlaces desde el CMS remoto cuando este disponible.'
                },
                {
                    title: 'Lanzamientos que estan moviendo la semana',
                    subtitle: 'Curaduria editorial para que la app tenga vida aun sin tocar play.',
                    image: 'assets/img/official-banner.png',
                    badge: 'Tendencias',
                    body: 'La seccion de tendencias permite mostrar recomendaciones musicales, nuevos lanzamientos y contenido cultural seleccionado por el equipo WXM.'
                }
            ]
        },
        presenters: {
            feature: 'presenters',
            titleKey: 'cms.rails.presenters',
            actionKey: 'common.viewMore',
            layout: 'presenter-row',
            items: [
                {
                    title: 'WXM Selectors',
                    subtitle: 'Curadores de musica, cultura y tendencias.',
                    image: 'assets/img/brand/wxm-emblem-square.png',
                    badge: 'Cabina',
                    body: 'Ficha de locutor o selector preparada para foto, biografia, redes, horarios y playlist del programa.'
                },
                {
                    title: 'Invitados especiales',
                    subtitle: 'Ficha de locutores y colaboradores administrable desde CMS.',
                    image: 'assets/img/logo-premium.png',
                    badge: 'Pronto',
                    body: 'Cuando WXM active colaboradores o invitados, esta ficha podra presentar su perfil, especialidad y participaciones dentro de la radio.'
                }
            ]
        },
        polls: {
            feature: 'polls',
            titleKey: 'cms.rails.polls',
            actionKey: 'common.viewMore',
            layout: 'poll-row',
            items: [
                {
                    title: 'Que bloque quieres escuchar hoy?',
                    subtitle: 'Urbano global, Top 40, entrevistas o cultura.',
                    image: 'assets/img/brand/wxm-emblem-square.png',
                    badge: 'Encuesta',
                    meta: 'Interaccion',
                    body: 'Encuesta de ejemplo. En una fase con backend de comunidad, el usuario podra votar y la cabina recibira resultados moderados en tiempo real.'
                }
            ]
        },
        sponsors: {
            feature: 'sponsors',
            titleKey: 'cms.rails.sponsors',
            actionKey: 'common.viewMore',
            layout: 'sponsor-row',
            items: [
                {
                    title: 'Aliados WXM',
                    subtitle: 'Espacio preparado para patrocinadores, eventos y promociones.',
                    image: 'assets/img/official-banner.png',
                    badge: 'Sponsor',
                    body: 'Modulo comercial preparado para aliados, marcas, eventos y promociones. Debe mantenerse controlado desde CMS para activar o retirar campanas sin recompilar.'
                }
            ]
        },
        songQuiz: {
            feature: 'songQuiz',
            titleKey: 'cms.rails.songQuiz',
            actionKey: 'common.viewMore',
            layout: 'media-row',
            items: []
        },
        videos: {
            feature: 'videos',
            titleKey: 'cms.rails.videos',
            actionKey: 'common.viewMore',
            layout: 'video-row',
            items: []
        },
        replays: {
            feature: 'replays',
            titleKey: 'cms.rails.replays',
            actionKey: 'common.viewMore',
            layout: 'media-row',
            items: []
        }
    }
};

export default CMS_CONFIG;
