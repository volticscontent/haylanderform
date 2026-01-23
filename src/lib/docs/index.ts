import { intro } from './intro'
import { forms } from './forms'
import { adminPanel } from './admin-panel'
import { serproApi } from './serpro-api'
import { disparoApi } from './disparo-api'
import { listApi } from './list-api'
import { meeting } from './meeting'
import { botArchitecture } from './bot-architecture'
import { diagramaDados } from './diagrama-dados'
import { cicloVidaLead } from './ciclo-vida-lead'

export const docsContent = {
  intro,
  forms,
  meeting,
  'bot-architecture': botArchitecture,
  'diagrama-dados': diagramaDados,
  'ciclo-vida-lead': cicloVidaLead,
  'admin-panel': adminPanel,
  'serpro-api': serproApi,
  'disparo-api': disparoApi,
  'list-api': listApi
}
