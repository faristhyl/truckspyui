import * as $ from 'jquery' // required for voice command windo scroll animation

export const TOKEN_INTERCEPTOR_HEADER: string = "tokenInterceptor";
export const TIMEZONE_DEFAULT: string = "America/New_York";
export const TABLE_LENGTH_ATTRIBUTE: string = "tableLength";
export const TABLE_LENGTH_DEFAULT: number = 25;
export const ENTRY_POINT_ATTRIBUTE: string = "entryPoint";
export const ENTRY_POINT_DEFAULT: string = "/dashboard";
export const ENTRY_POINT_ADMIN_DEFAULT: string = "/admin/dashboard";
export const ENTRY_POINT_THIRD_PARTY_DEFAULT: string = "/third-party/vehicles";
export const DATETIME_DISPLAY_ATTRIBUTE: string = "datetime";
export const LOCAL_STORAGE_VIS_KEY_NAME: string = 'visApiKey';

export const MAPBOX_API_URL: string = "https://api.mapbox.com/";
export const MAPBOX_ACCESS_TOKEN: string = "pk.eyJ1IjoidHJ1Y2tzcHkiLCJhIjoiY2ttd2F0MDFkMGJtMDJ1cGVseDk0eW1jbCJ9.kn1lDzAM8URsLdsXzXBb2w";

export const MESSAGES_PAGESIZE: number = 25;
export const APP_DATE_FORAT = "YYYY-MM-DDTHH:mm:ss";
export const REFRESH_TABLE_INTERVAL = 1000 * 60 * 5; // 5 minutes

export const mapConfig: any = {
  SATELLITE: "mapbox://styles/truckspy/ckmwdbf3z1e6117o6voxiqb89",
  STREETS: "mapbox://styles/truckspy/ckmwd8o561dvw17s78js8htgj"
}

export const COUNTRIES: any[] = [
  { key: "US", value: "USA" },
  { key: "CA", value: "Canada" },
  { key: "MX", value: "Mexico" }
];

export const config: any = {

  defaultLocale: "us",

  API_URL: "assets/api",

  menu_speed: 200,

  smartSkin: "smart-style-0",


  skins: [
    {
      name: "smart-style-0",
      logo: "assets/img/logo.png",
      skinBtnClass: "btn btn-block btn-xs txt-color-white margin-right-5",
      style: {
        backgroundColor: '#4E463F'
      },
      label: "Smart Default"
    },

    {
      name: "smart-style-1",
      logo: "assets/img/logo-white.png",
      skinBtnClass: "btn btn-block btn-xs txt-color-white",
      style: {
        background: '#3A4558'
      },
      label: "Dark Elegance"
    },

    {
      name: "smart-style-2",
      logo: "assets/img/logo-blue.png",
      skinBtnClass: "btn btn-xs btn-block txt-color-darken margin-top-5",
      style: {
        background: '#fff'
      },
      label: "Ultra Light"
    },

    {
      name: "smart-style-3",
      logo: "assets/img/logo-pale.png",
      skinBtnClass: "btn btn-xs btn-block txt-color-white margin-top-5",
      style: {
        background: '#f78c40'
      },
      label: "Google Skin"
    },

    // {
    //   name: "smart-style-4",
    //   logo: "assets/img/logo-pale.png",
    //   skinBtnClass: "btn btn-xs btn-block txt-color-white margin-top-5",
    //   style: {
    //     background: '#bbc0cf',
    //     border: '1px solid #59779E',
    //     color: '#17273D !important'
    //   },
    //   label: "PixelSmash"
    // },

    {
      name: "smart-style-5",
      logo: "assets/img/logo-pale.png",
      skinBtnClass: "btn btn-xs btn-block txt-color-white margin-top-5",
      style: {
        background: 'rgba(153, 179, 204, 0.2)',
        border: '1px solid rgba(121, 161, 221, 0.8)',
        color: '#17273D !important'
      },
      label: "Glass"
    },


  ],

  GOOGLE_API_KEY: 'AIzaSyDd8YW8k_J-Jkti-W4QNk5dL8O_5_2QUWY',

  sound_path: "assets/sound/",
  sound_on: true,


  /**
   * DEBUGGING MODE
   * debugState = true; will spit all debuging message inside browser console.
   * The colors are best displayed in chrome browser.
   */

  debugState: false,
  debugStyle: 'font-weight: bold; color: #00f;',
  debugStyle_green: 'font-weight: bold; font-style:italic; color: #46C246;',
  debugStyle_red: 'font-weight: bold; color: #ed1c24;',
  debugStyle_warning: 'background-color:yellow',
  debugStyle_success: 'background-color:green; font-weight:bold; color:#fff;',
  debugStyle_error: 'background-color:#ed1c24; font-weight:bold; color:#fff;',


  /**
   *  VOICE CONTROL
   */
  voice_command: true,
  voice_command_auto: false,


  /**
   *  Sets the language to the default 'en-US'. (supports over 50 languages
   *  by google)
   *
   *  Afrikaans         ['af-ZA']
   *  Bahasa Indonesia  ['id-ID']
   *  Bahasa Melayu     ['ms-MY']
   *  CatalГ            ['ca-ES']
   *  ДЊeЕЎtina         ['cs-CZ']
   *  Deutsch           ['de-DE']
   *  English           ['en-AU', 'Australia']
   *                    ['en-CA', 'Canada']
   *                    ['en-IN', 'India']
   *                    ['en-NZ', 'New Zealand']
   *                    ['en-ZA', 'South Africa']
   *                    ['en-GB', 'United Kingdom']
   *                    ['en-US', 'United States']
   *  EspaГ±ol          ['es-AR', 'Argentina']
   *                    ['es-BO', 'Bolivia']
   *                    ['es-CL', 'Chile']
   *                    ['es-CO', 'Colombia']
   *                    ['es-CR', 'Costa Rica']
   *                    ['es-EC', 'Ecuador']
   *                    ['es-SV', 'El Salvador']
   *                    ['es-ES', 'EspaГ±a']
   *                    ['es-US', 'Estados Unidos']
   *                    ['es-GT', 'Guatemala']
   *                    ['es-HN', 'Honduras']
   *                    ['es-MX', 'MГ©xico']
   *                    ['es-NI', 'Nicaragua']
   *                    ['es-PA', 'PanamГЎ']
   *                    ['es-PY', 'Paraguay']
   *                    ['es-PE', 'PerГє']
   *                    ['es-PR', 'Puerto Rico']
   *                    ['es-DO', 'RepГєblica Dominicana']
   *                    ['es-UY', 'Uruguay']
   *                    ['es-VE', 'Venezuela']
   *  Euskara           ['eu-ES']
   *  FranГ§ais         ['fr-FR']
   *  Galego            ['gl-ES']
   *  Hrvatski          ['hr_HR']
   *  IsiZulu           ['zu-ZA']
   *  ГЌslenska         ['is-IS']
   *  Italiano          ['it-IT', 'Italia']
   *                    ['it-CH', 'Svizzera']
   *  Magyar            ['hu-HU']
   *  Nederlands        ['nl-NL']
   *  Norsk bokmГҐl     ['nb-NO']
   *  Polski            ['pl-PL']
   *  PortuguГЄs        ['pt-BR', 'Brasil']
   *                    ['pt-PT', 'Portugal']
   *  RomГўnДѓ          ['ro-RO']
   *  SlovenДЌina       ['sk-SK']
   *  Suomi             ['fi-FI']
   *  Svenska           ['sv-SE']
   *  TГјrkГ§e          ['tr-TR']
   *  Р±СЉР»РіР°СЂСЃРєРё['bg-BG']
   *  PСѓСЃСЃРєРёР№     ['ru-RU']
   *  РЎСЂРїСЃРєРё      ['sr-RS']
   *  н•њкµ­м–ґ         ['ko-KR']
   *  дё­ж–‡            ['cmn-Hans-CN', 'ж™®йЂљиЇќ (дё­е›Ѕе¤§й™†)']
   *                    ['cmn-Hans-HK', 'ж™®йЂљиЇќ (й¦™жёЇ)']
   *                    ['cmn-Hant-TW', 'дё­ж–‡ (еЏ°зЃЈ)']
   *                    ['yue-Hant-HK', 'зІµиЄћ (й¦™жёЇ)']
   *  ж—Ґжњ¬иЄћ         ['ja-JP']
   *  Lingua latД«na    ['la']
   */
  voice_command_lang: 'en-US',
  /**
   *  Use localstorage to remember on/off (best used with HTML Version)
   */
  voice_localStorage: false,
  /**
   * Voice Commands
   * Defines all voice command variables and functions
   */

  voice_commands: {

    'show dashboard': {
      // will be redirected to /admin/dashboard for admins
      type: 'navigate', payload: ['/dashboard']
    },
    'show companies': {
      type: 'navigate', payload: ['/admin/companies']
    },
    'show users': {
      type: 'navigate', payload: ['/admin/users']
    },
    'show system': {
      type: 'navigate', payload: ['/admin/system']
    },
    'show invoices': {
      type: 'navigate', payload: ['/admin/invoices']
    },
    'show connections': {
      type: 'navigate', payload: ['/admin/connections']
    },
    'show admin devices': {
      type: 'navigate', payload: ['/admin/devices']
    },
    'show admin location groups': {
      type: 'navigate', payload: ['/admin/location/groups']
    },

    'show vehicles': {
      type: 'navigate', payload: ['/vehicles']
    },
    'show inspection configuration': {
      type: 'navigate', payload: ['/inspection/configuration']
    },
    'show inspection list': {
      type: 'navigate', payload: ['/inspection/list']
    },
    'show drivers': {
      type: 'navigate', payload: ['/drivers']
    },
    'show messages': {
      type: 'navigate', payload: ['/messages']
    },
    'show video alerts': {
      type: 'navigate', payload: ['/alerts']
    },
    'show safety dashboard': {
      type: 'navigate', payload: ['/alerts/dashboard']
    },
    'show location groups': {
      type: 'navigate', payload: ['/location/groups']
    },
    'show locations map': {
      type: 'navigate', payload: ['/location/locations']
    },
    'show locations list': {
      type: 'navigate', payload: ['/location/list']
    },
    'show devices': {
      type: 'navigate', payload: ['/devices']
    },
    'show fuel': {
      type: 'navigate', payload: ['/fuel']
    },
    'show fuel dashboard': {
      type: 'navigate', payload: ['/fuel/dashboard']
    },
    'show linehaul trips': {
      type: 'navigate', payload: ['/linehaul-trips']
    },
    'show reporting profiles': {
      type: 'navigate', payload: ['/reporting']
    },
    'show reports': {
      type: 'navigate', payload: ['/reports']
    },
    'show dispatch': {
      type: 'navigate', payload: ['/dispatch']
    },
    'show bookings': {
      type: 'navigate', payload: ['/bookings']
    },
    'show customers': {
      type: 'navigate', payload: ['/customers']
    },
    'show company': {
      type: 'navigate', payload: ['/company']
    },
    'show maintenance scheduled dashboard': {
      type: 'navigate', payload: ['/maintenance/scheduled-dashboard']
    },
    'show maintenance issues': {
      type: 'navigate', payload: ['/maintenance/issues']
    },
    'show maintenance work orders': {
      type: 'navigate', payload: ['/maintenance/workorders']
    },
    'show maintenance configuration': {
      type: 'navigate', payload: ['/maintenance/configuration']
    },
    'show hours of service': {
      type: 'navigate', payload: ['/hours/drivers']
    },
    'go back': (): any => {
      history.back();
    },
    'scroll up': (): any => {
      $('html, body').animate({ scrollTop: 0 }, 100);
    },
    'scroll down': (): any => {
      $('html, body').animate({ scrollTop: $(document).height() }, 100);
    },
    'hide navigation': {
      type: 'layout',
      payload: 'hide navigation'
    },
    'show navigation': {
      type: 'layout',
      payload: 'show navigation'
    },
    'mute': {
      type: 'sound',
      payload: 'mute',
    },
    'sound on': {
      type: 'sound',
      payload: 'sound on',
    },
    'stop': {
      type: 'voice',
      payload: 'stop'
    },
    'help': {
      type: 'voice',
      payload: 'help on'
    },
    'got it': {
      type: 'voice',
      payload: 'help off'
    },
    'logout': {
      type: 'navigate',
      payload: ['/auth/login'],
    },
  }
};


// required for SmartNotification
$.sound_on = config.sound_on;
$.sound_path = config.sound_path;
