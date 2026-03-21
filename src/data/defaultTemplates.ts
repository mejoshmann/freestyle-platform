import type { Skill } from '../types'

export interface TemplateDefinition {
  name: string
  description: string
  skills: Skill[]
}

export const defaultTemplates: TemplateDefinition[] = [
  {
    name: 'Moguls',
    description: 'Mogul skiing evaluation',
    skills: [
      { id: 'moguls-stance', name: 'Stance', description: 'Body position and balance' },
      { id: 'moguls-shape', name: 'Shape', description: 'Quality of turns through moguls' },
      { id: 'moguls-absorption', name: 'Absorption', description: 'Absorption and extension technique' },
    ],
  },
  {
    name: 'Big Air',
    description: 'Big Air skiing evaluation',
    skills: [
      { id: 'bigair-takeoff', name: 'Take Off', description: 'Quality of jump takeoff' },
      { id: 'bigair-extension', name: 'Extension', description: 'Body extension in the air' },
      { id: 'bigair-amplitude', name: 'Amplitude', description: 'Height and distance achieved' },
      { id: 'bigair-landing', name: 'Landing', description: 'Landing stability and control' },
    ],
  },
  {
    name: 'Freeskiing',
    description: 'Freeskiing evaluation',
    skills: [
      { id: 'freeski-balance', name: 'Balance', description: 'Overall balance on skis' },
      { id: 'freeski-switch', name: 'Switch Skiing', description: 'Ability to ski switch (backwards)' },
      { id: 'freeski-switch-stops', name: 'Controlled Stops', description: 'Controlled stops while skiing switch' },
      { id: 'freeski-turn-shape', name: 'Turn Shape / Carving', description: 'Linked turns while skiing switch' },
      { id: 'freeski-spinning', name: 'Spinning on Snow', description: '360s and spins on flat snow' },
      { id: 'freeski-control', name: 'Skiing with Control', description: 'Overall control and style' },
    ],
  },
  {
    name: 'Jumping',
    description: 'Jumping evaluation',
    skills: [
      { id: 'jump-spinning', name: 'Spinning', description: 'Spin control and rotation' },
    ],
  },
  {
    name: 'Terrain Park',
    description: 'Terrain Park evaluation',
    skills: [
      { id: 'park-safety', name: 'Safety', description: 'Safety awareness and etiquette' },
      { id: 'park-boxes', name: 'Boxes', description: 'Box slide skills' },
      { id: 'park-rails', name: 'Rails', description: 'Rail slide skills' },
      { id: 'park-wall', name: 'Wall Features', description: 'Wall ride and quarter pipe skills' },
    ],
  },
  {
    name: 'Suggested Training',
    description: 'Recommended training programs and activities',
    skills: [
      { id: 'training-whistler-spring', name: 'Whistler Spring Camp', description: 'Spring training camp at Whistler' },
      { id: 'training-spring-trampoline', name: 'Trampoline', description: 'Trampoline training' },
      { id: 'training-spring-dryland', name: 'Dryland', description: 'Dryland training' },
      { id: 'training-spring-water', name: 'Water Ramps', description: 'Water ramp training' },
    ],
  },
  {
    name: 'Programs for Next Season',
    description: 'Recommended programs for next season',
    skills: [
      { id: 'program-fundamentalz', name: 'FUNdamentalz', description: 'Entry-level freestyle program' },
      { id: 'program-freestylerz', name: 'FreestylerZ', description: 'Intermediate freestyle program' },
      { id: 'program-night', name: 'Night Riders', description: 'Evening training program' },
      { id: 'program-girlstylerz', name: 'GirlstylerZ', description: 'Girls freestyle program' },
      { id: 'program-dev', name: 'DEV Team (Invite Required)', description: 'Development team - invitation only' },
    ],
  },
]
