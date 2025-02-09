import Vue from 'vue'
import VTooltip from 'v-tooltip'
import VueMixpanel from 'vue-mixpanel'
import PortalVue from 'portal-vue'
import { formatNumber } from '@/plugins/formatNumber'

/**
 * Global bootstrapping for the frontend app
 */

// Filter to turn any number into a nice string like '10k', '5.5m'
// Accepts 'max' parameter to set it's formatting while being animated
Vue.filter('prettynum', formatNumber)

// process.env.NODE_ENV is injected by Webpack
Vue.config.productionTip = process.env.NODE_ENV === 'development'

Vue.use(VTooltip, {
  defaultDelay: 300,
  defaultBoundariesElement: document.body,
  defaultHtml: false
})

// RANDOM CHANGE! (testing out gitguardian)

// In highly restrictive sandboxed environments mixpanel init might fail due to document.cookie access
Vue.use(VueMixpanel, {
  token: 'acd87c5a50b56df91a795e999812a3a4',
  config: {
    // eslint-disable-next-line camelcase
    api_host: 'https://analytics.speckle.systems'
  }
})

Vue.use(PortalVue)

// Event hub
Vue.prototype.$eventHub = new Vue()
