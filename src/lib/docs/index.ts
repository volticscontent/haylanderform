import { intro } from './intro'
import { forms } from './forms'
import { adminPanel } from './dashboard-panel'
import { serproApi } from './serpro-api'
import { listApi } from './list-api'
import { botArchitecture } from './bot-architecture'
import { diagramaDados } from './diagrama-dados'
import { cicloVidaLead } from './ciclo-vida-lead'

export const docsContent = {
  intro,
  forms,
  'bot-architecture': botArchitecture,
  'diagrama-dados': diagramaDados,
  'ciclo-vida-lead': cicloVidaLead,
  'dashboard-panel': adminPanel,
  'serpro-api': serproApi,
  'list-api': listApi,
}
