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
      { id: 'moguls-turns', name: 'Turns', description: 'Quality of turns through moguls' },
      { id: 'moguls-air', name: 'Air', description: 'Air awareness and control' },
      { id: 'moguls-speed', name: 'Speed', description: 'Speed control and maintenance' },
    ],
  },
  {
    name: 'Aerials',
    description: 'Aerial skiing evaluation',
    skills: [
      { id: 'aerials-takeoff', name: 'Take Off', description: 'Quality of jump takeoff' },
      { id: 'aerials-air', name: 'Air', description: 'Air awareness and position' },
      { id: 'aerials-form', name: 'Form', description: 'Body form during trick' },
      { id: 'aerials-landing', name: 'Landing', description: 'Landing stability and control' },
    ],
  },
  {
    name: 'Big Air',
    description: 'Big Air skiing evaluation',
    skills: [
      { id: 'bigair-takeoff', name: 'Take Off', description: 'Quality of jump takeoff' },
      { id: 'bigair-difficulty', name: 'Difficulty of Trick', description: 'Complexity of trick performed' },
      { id: 'bigair-execution', name: 'Execution', description: 'Clean execution of trick' },
      { id: 'bigair-amplitude', name: 'Amplitude', description: 'Height and distance achieved' },
      { id: 'bigair-landing', name: 'Landing', description: 'Landing stability and control' },
    ],
  },
  {
    name: 'Freeskiing',
    description: 'Freeskiing evaluation',
    skills: [
      { id: 'freeski-switch', name: 'Switch Skiing', description: 'Ability to ski switch (backwards)' },
      { id: 'freeski-switch-stops', name: 'Controlled Stops', description: 'Controlled stops while skiing switch' },
      { id: 'freeski-switch-turns', name: 'Connected Turns', description: 'Linked turns while skiing switch' },
      { id: 'freeski-spinning', name: 'Spinning on Snow', description: '360s and spins on flat snow' },
      { id: 'freeski-control', name: 'Skiing with Control', description: 'Overall control and style' },
    ],
  },
  {
    name: 'Jumping',
    description: 'Jumping evaluation',
    skills: [
      { id: 'jump-takeoff', name: 'Take Off', description: 'Quality of jump takeoff' },
      { id: 'jump-spinning', name: 'Spinning', description: 'Spin control and rotation' },
      { id: 'jump-air', name: 'Air', description: 'Air awareness and position' },
      { id: 'jump-landing', name: 'Landing', description: 'Landing stability and control' },
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
]
