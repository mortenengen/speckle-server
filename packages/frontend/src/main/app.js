import '@/bootstrapper'
import Vue from 'vue'

import App from '@/main/App.vue'
import { LocalStorageKeys } from '@/helpers/mainConstants'
import * as MixpanelManager from '@/mixpanelManager'

import { provide } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { createProvider, installVueApollo } from '@/config/apolloConfig'
import {
  checkAccessCodeAndGetTokens,
  prefetchUserAndSetID
} from '@/plugins/authHelpers'

import router from '@/main/router/index'
import vuetify from '@/plugins/vuetify'
import VueTimeago from 'vue-timeago'

Vue.use(VueTimeago, { locale: 'en' })

import VueFilterDateParse from '@vuejs-community/vue-filter-date-parse'
Vue.use(VueFilterDateParse)

import VueFilterDateFormat from '@vuejs-community/vue-filter-date-format'
Vue.use(VueFilterDateFormat)

import PerfectScrollbar from 'vue2-perfect-scrollbar'
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css'
// adds various helper methods
import '@/plugins/helpers'
import { AppLocalStorage } from '@/utils/localStorage'

Vue.use(PerfectScrollbar)

// Async ApexChart load
Vue.component('ApexChart', async () => {
  const VueApexCharts = await import(
    /* webpackChunkName: "vue-apexcharts" */ 'vue-apexcharts'
  )
  Vue.use(VueApexCharts)

  return VueApexCharts
})

// Filter to capitalize words
Vue.filter('capitalize', (value) => {
  if (!value) return ''
  value = value.toString()
  return value.charAt(0).toUpperCase() + value.slice(1)
})

const AuthToken = AppLocalStorage.get(LocalStorageKeys.AuthToken)
const RefreshToken = AppLocalStorage.get(LocalStorageKeys.RefreshToken)

const apolloProvider = createProvider()
installVueApollo(apolloProvider)

// TODO: Sort out error handling here, if something goes wrong it just goes into an infinite loop
if (AuthToken) {
  prefetchUserAndSetID(apolloProvider.defaultClient)
    .then(() => {
      postAuthInit()
    })
    .catch(() => {
      if (RefreshToken) {
        // TODO: try to rotate token & prefetch user, etc.
      }

      window.location = `${window.location.origin}/authn/login`
    })
} else {
  checkAccessCodeAndGetTokens()
    .then(() => {
      return prefetchUserAndSetID(apolloProvider.defaultClient)
    })
    .then(() => {
      postAuthInit()
    })
    .catch(() => {
      postAuthInit()
    })
}

function postAuthInit() {
  // Init mixpanel
  MixpanelManager.initialize({
    hostApp: 'web',
    hostAppDisplayName: 'Web App'
  })

  new Vue({
    router,
    vuetify,
    setup() {
      provide(DefaultApolloClient, apolloProvider.defaultClient)
    },
    render: (h) => h(App)
  }).$mount('#app')
}

export { apolloProvider }
